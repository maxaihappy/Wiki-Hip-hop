import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { GroundingSource, SongData, Language } from "../types";

function getWikipediaHost(language: Language): string {
  return language === 'zh' ? 'zh.wikipedia.org' : 'en.wikipedia.org';
}

function getLanguageLabel(language: Language): string {
  return language === 'zh' ? 'Chinese (中文)' : 'English';
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface SearchResult {
  searchResultsText: string;
  sources: GroundingSource[];
}

function cleanAndProcessUrl(source: GroundingSource, keywords: string): GroundingSource {
    try {
      const url = new URL(source.uri);
      // Handle standard google redirects
      if (url.hostname.includes('google.com') && url.pathname === '/url') {
        const actualUrl = url.searchParams.get('q');
        if (actualUrl) {
          return { ...source, uri: actualUrl };
        }
      }
      // Handle Vertex AI grounding redirects by reconstructing the Wikipedia URL from the title
      if (url.hostname.includes('vertexaisearch.cloud.google.com')) {
        const lowerTitle = source.title?.toLowerCase() || '';
        if (lowerTitle.includes('wikipedia')) {
          // Attempt to extract the core page name by cleaning common affixes
          let pageTitle = source.title
            .replace(/ - Wikipedia$/i, '')
            .replace(/^Wikipedia: /i, '');
          
          const cleanedPageTitleLower = pageTitle.trim().toLowerCase();
          // If cleaning results in a generic term, it's a generic link.
          // In this case, we construct the URL from the user's primary keyword.
          if (cleanedPageTitleLower === 'wikipedia' || cleanedPageTitleLower === 'wikipedia.org') {
              const primaryKeyword = keywords.split(',')[0].trim();
              if (primaryKeyword) { // Avoid using an empty keyword
                  pageTitle = primaryKeyword;
              }
          }
          
          const processedPageTitle = pageTitle.trim().replace(/\s/g, '_');
          const wikiUrl = `https://en.wikipedia.org/wiki/${processedPageTitle}`;
          return { ...source, uri: wikiUrl };
        }
      }
    } catch (e) {
      console.warn(`Could not parse source URL for cleaning: ${source.uri}`, e);
    }
    return source;
}

function deDuplicateSources(sources: GroundingSource[]): GroundingSource[] {
    const uniqueSources: GroundingSource[] = [];
    const seenUrls = new Set<string>();

    for (const source of sources) {
        try {
            const url = new URL(source.uri);
            // Normalize by removing 'www.' and trailing slashes from the pathname
            const normalizedHostname = url.hostname.startsWith('www.') ? url.hostname.substring(4) : url.hostname;
            const normalizedPathname = url.pathname.length > 1 && url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
            const normalized = `${normalizedHostname}${normalizedPathname}`;
            
            if (!seenUrls.has(normalized)) {
                seenUrls.add(normalized);
                uniqueSources.push(source);
            }
        } catch (e) {
            // Fallback for invalid URLs: use the raw URI for de-duplication
            if (!seenUrls.has(source.uri)) {
                seenUrls.add(source.uri);
                uniqueSources.push(source);
            }
            console.warn(`Could not parse source URL for normalization: ${source.uri}`, e);
        }
    }
    return uniqueSources;
}

function sortSources(sources: GroundingSource[], keywords: string): GroundingSource[] {
    const sorted = [...sources];
    sorted.sort((a, b) => {
        const aIsWiki = a.uri.includes('wikipedia.org');
        const bIsWiki = b.uri.includes('wikipedia.org');

        if (aIsWiki && !bIsWiki) return -1;
        if (!aIsWiki && bIsWiki) return 1;
        
        if (aIsWiki && bIsWiki) {
            const aTitle = a.title.toLowerCase();
            const bTitle = b.title.toLowerCase();
            // Use the first keyword as the primary term for relevance
            const mainKeyword = keywords.split(',')[0].trim().toLowerCase();
            
            // A simple heuristic: prefer titles that start with the main keyword
            const aIsPrimary = aTitle.startsWith(mainKeyword);
            const bIsPrimary = bTitle.startsWith(mainKeyword);

            if (aIsPrimary && !bIsPrimary) return -1;
            if (!aIsPrimary && bIsPrimary) return 1;
        }

        // Keep original order if no other criteria match
        return 0;
    });
    return sorted;
}


export async function searchForSources(
  keywords: string,
  onPreviewSourceFound: (source: GroundingSource) => void,
  language: Language = 'en'
): Promise<SearchResult> {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set the API_KEY environment variable.");
  }

  const primaryKeyword = keywords.split(',')[0].trim();
  const wikiHost = getWikipediaHost(language);

  if (primaryKeyword) {
    try {
      // Use Wikipedia API to find a relevant article
      const searchUrl = `https://${wikiHost}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(primaryKeyword)}&limit=1&format=json&origin=*`;
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) throw new Error(`Wikipedia search API failed with status ${searchResponse.status}`);
      
      const searchData = await searchResponse.json();

      if (searchData.query?.search?.length > 0) {
        const pageTitle = searchData.query.search[0].title;
        const encodedTitle = encodeURIComponent(pageTitle.replace(/ /g, '_'));
        
        // Fetch the summary and canonical URL
        const summaryUrl = `https://${wikiHost}/api/rest_v1/page/summary/${encodedTitle}`;
        const summaryResponse = await fetch(summaryUrl);
        if (!summaryResponse.ok) throw new Error(`Wikipedia summary API failed with status ${summaryResponse.status}`);
        
        const summaryData = await summaryResponse.json();

        if (summaryData.extract && summaryData.content_urls?.desktop?.page) {
          const source: GroundingSource = {
            uri: summaryData.content_urls.desktop.page,
            title: summaryData.title,
          };

          onPreviewSourceFound(source);

          return {
            searchResultsText: summaryData.extract,
            sources: [source],
          };
        }
      }
    } catch (error) {
      console.warn("Wikipedia search failed, falling back to Gemini search.", error);
      // Fall through to the Gemini search logic below
    }
  }

  // Fallback to Gemini search if Wikipedia fails or there's no primary keyword
  console.log("No definitive Wikipedia article found. Falling back to Gemini search for broader context.");
  
  const searchPrompt = `Based on Google Search results, provide a comprehensive summary and definitions for the following keywords: ${keywords}. Focus on information that can be woven into a creative narrative.`;
  
  const searchResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: searchPrompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const searchResultsText = searchResponse.text;
  const groundingChunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  if (groundingChunks.length > 0) {
    // Quick pass to find and dispatch a preview source for immediate UI update
    const primaryKeyword = keywords.split(',')[0].trim().toLowerCase();
    let bestCandidate: { source: GroundingSource, score: number } | null = null;

    for (const chunk of groundingChunks) {
        const webSource = chunk.web;
        if (webSource?.title && webSource.uri) {
            const lowerTitle = webSource.title.toLowerCase();
            if (lowerTitle.includes('wikipedia')) {
                let score = 1; // Base score for being wikipedia
                if (lowerTitle.startsWith(primaryKeyword)) score = 3; // Best: title starts with keyword
                else if (lowerTitle.includes(primaryKeyword)) score = 2; // Good: title contains keyword

                if (!bestCandidate || score > bestCandidate.score) {
                    bestCandidate = { source: webSource as GroundingSource, score };
                }
            }
        }
    }

    if (bestCandidate) {
        const cleanedPreviewSource = cleanAndProcessUrl(bestCandidate.source, keywords);
        onPreviewSourceFound(cleanedPreviewSource);
    }
  }

  // Full processing for all sources
  const allSources: GroundingSource[] = groundingChunks
    .map(chunk => chunk.web)
    .filter((web): web is GroundingSource => !!web?.uri && !!web?.title);
  
  const cleanedSources = allSources.map(source => cleanAndProcessUrl(source, keywords));
  const uniqueSources = deDuplicateSources(cleanedSources);
  const sortedSources = sortSources(uniqueSources, keywords);

  return { searchResultsText, sources: sortedSources };
}

export async function generateSongFromSearchResults(
  searchResultsText: string,
  trackLengthInMinutes: number,
  language: Language = 'en'
): Promise<SongData> {
   if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set the API_KEY environment variable.");
  }
  
  const languageLabel = getLanguageLabel(language);
  const languageInstruction = language === 'zh'
    ? 'All output (title, beat description, and lyrics) MUST be written in Chinese (中文). Section labels like [Intro], [Verse 1], and [Chorus] may remain in English.'
    : 'All output (title, beat description, and lyrics) MUST be written in English.';
  // Estimate target word count based on an average rap speed (approx. 160 WPM for English, ~120 for Chinese)
  const wordsPerMinute = language === 'zh' ? 120 : 160;
  const targetWordCount = Math.round(trackLengthInMinutes * wordsPerMinute);
  
  // Step 2: Summarize the search results to a specific word count
  // We'll aim for a summary that's about a third of the total length to give the story and lyrics room to expand.
  const summaryWordCount = Math.round(targetWordCount / 3);
  const summarizationPrompt = `Summarize the following text to be used as source material for a story. The summary MUST be approximately ${summaryWordCount} words long. Do not exceed this limit. \n\nText:\n${searchResultsText}`;
  
  const summaryResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: summarizationPrompt,
  });
  const limitedSummary = summaryResponse.text;

  // Step 3: Generate a story from the limited summary
  const storyPrompt = `You are a master storyteller. Using the following summary, write a short, engaging story that connects all the concepts in a creative and unexpected way. The story should have a clear beginning, middle, and end.\n\nSummary:\n${limitedSummary}`;
  
  const storyResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: storyPrompt,
  });
  const story = storyResponse.text;

  // Step 4: Generate the song (lyrics, title, beat) from the story, constrained by length
  const songPrompt = `Here is the story to turn into a song. The total lyrics should be approximately ${targetWordCount} words to create a song that is about ${trackLengthInMinutes} minute(s) long. Write everything in ${languageLabel}.\n\n${story}`;
  
  const songResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: songPrompt,
    config: {
      systemInstruction: `You are a legendary hip-hop producer and lyricist known for creating profound, story-driven tracks. Your task is to transform a given story into a complete hip-hop song. You must provide a song title, a detailed description of the beat, and full lyrics. The lyrics should be well-structured with clear sections like [Intro], [Verse 1], [Chorus], [Verse 2], etc. The tone should be thoughtful and rhythmic. Adhere strictly to the requested word count for the lyrics. ${languageInstruction}`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "The title of the hip-hop song." },
          beatDescription: { type: Type.STRING, description: "A detailed description of the beat, including tempo, instruments, and mood." },
          lyrics: { type: Type.STRING, description: "The full lyrics of the song, formatted with sections like [Chorus] and [Verse]." }
        },
        required: ["title", "beatDescription", "lyrics"]
      },
    },
  });

  const songData = JSON.parse(songResponse.text) as SongData;

  return songData;
}


export function createModificationChat(initialSong: SongData, keywords: string, language: Language = 'en'): Chat {
  const languageInstruction = language === 'zh'
    ? 'Keep all song output in Chinese (中文).'
    : 'Keep all song output in English.';

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are a legendary hip-hop producer and lyricist. You have just created a song based on the keywords: "${keywords}". The user will now give you feedback to refine it. Your task is to take their feedback and regenerate the song based ONLY on the previous version and the user's request. Do NOT use external information or search for new data. Your goal is a quick, creative edit. ${languageInstruction} You MUST respond with the complete, updated song in the specified JSON format. Your response MUST include a 'comment' field explaining the changes you made. Do not add any conversational text outside of the JSON structure.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "The title of the hip-hop song." },
          beatDescription: { type: Type.STRING, description: "A detailed description of the beat, including tempo, instruments, and mood." },
          lyrics: { type: Type.STRING, description: "The full lyrics of the song, formatted with sections like [Chorus] and [Verse]." },
          comment: { type: Type.STRING, description: "A brief, conversational comment about the changes made to the song." }
        },
        required: ["title", "beatDescription", "lyrics", "comment"]
      },
    },
    history: [
      {
        role: "user",
        parts: [{ text: `Here are the keywords to work with: ${keywords}` }],
      },
      {
        role: "model",
        parts: [{ text: JSON.stringify(initialSong) }]
      }
    ]
  });
  return chat;
}