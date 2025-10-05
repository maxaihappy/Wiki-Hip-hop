import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { GroundingSource, SongData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface SearchResult {
  searchResultsText: string;
  sources: GroundingSource[];
}

export async function searchForSources(keywords: string): Promise<SearchResult> {
  if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set the API_KEY environment variable.");
  }
  
  // Step 1: Search for information on the keywords using Google Search grounding
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
  const allSources: GroundingSource[] = groundingChunks
    .map(chunk => chunk.web)
    .filter((web): web is { uri: string; title: string; } => web !== undefined && web.uri !== undefined && web.title !== undefined);

  // De-duplicate sources based on a normalized URL
  const uniqueSources: GroundingSource[] = [];
  const seenUrls = new Set<string>();

  for (const source of allSources) {
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

  return { searchResultsText, sources: uniqueSources };
}

export async function generateSongFromSearchResults(searchResultsText: string, trackLengthInMinutes: number): Promise<SongData> {
   if (!process.env.API_KEY) {
    throw new Error("API key is missing. Please set the API_KEY environment variable.");
  }
  
  // Estimate target word count based on an average rap speed (approx. 160 WPM)
  const targetWordCount = Math.round(trackLengthInMinutes * 160);
  
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
  const songPrompt = `Here is the story to turn into a song. The total lyrics should be approximately ${targetWordCount} words to create a song that is about ${trackLengthInMinutes} minute(s) long.\n\n${story}`;
  
  const songResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: songPrompt,
    config: {
      systemInstruction: "You are a legendary hip-hop producer and lyricist known for creating profound, story-driven tracks. Your task is to transform a given story into a complete hip-hop song. You must provide a song title, a detailed description of the beat, and full lyrics. The lyrics should be well-structured with clear sections like [Intro], [Verse 1], [Chorus], [Verse 2], etc. The tone should be thoughtful and rhythmic. Adhere strictly to the requested word count for the lyrics.",
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


export function createModificationChat(initialSong: SongData, keywords: string): Chat {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are a legendary hip-hop producer and lyricist. You have just created a song based on the keywords: "${keywords}". The user will now give you feedback to refine it. Your task is to take their feedback and regenerate the song based ONLY on the previous version and the user's request. Do NOT use external information or search for new data. Your goal is a quick, creative edit. You MUST respond with the complete, updated song in the specified JSON format. Your response MUST include a 'comment' field explaining the changes you made. Do not add any conversational text outside of the JSON structure.`,
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