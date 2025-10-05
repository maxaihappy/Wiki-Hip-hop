import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { GenerationResult, GroundingSource, SongData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateSongFromKeywords(keywords: string): Promise<GenerationResult> {
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
  const sources: GroundingSource[] = groundingChunks
    .map(chunk => chunk.web)
    .filter((web): web is { uri: string; title: string; } => web !== undefined && web.uri !== undefined && web.title !== undefined);


  // Step 2: Generate a story from the search results
  const storyPrompt = `You are a master storyteller. Using the following information, write a short, engaging story that connects all the concepts in a creative and unexpected way. The story should have a clear beginning, middle, and end.\n\nInformation:\n${searchResultsText}`;
  
  const storyResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: storyPrompt,
  });
  const story = storyResponse.text;

  // Step 3: Generate the song (lyrics, title, beat) from the story
  const songPrompt = `Here is the story to turn into a song:\n\n${story}`;
  
  const songResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: songPrompt,
    config: {
      systemInstruction: "You are a legendary hip-hop producer and lyricist known for creating profound, story-driven tracks. Your task is to transform a given story into a complete hip-hop song. You must provide a song title, a detailed description of the beat, and full lyrics. The lyrics should be well-structured with clear sections like [Intro], [Verse 1], [Chorus], [Verse 2], etc. The tone should be thoughtful and rhythmic.",
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

  return {
    song: songData,
    sources: sources,
  };
}


export function createModificationChat(initialSong: SongData, keywords: string): Chat {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `You are a legendary hip-hop producer and lyricist. You have just created a song based on the keywords: "${keywords}". The user will now give you feedback to refine it. Your task is to take their feedback and regenerate the song. You MUST respond with the complete, updated song in the specified JSON format. Your response MUST include a 'comment' field explaining the changes you made. Do not add any conversational text outside of the JSON structure.`,
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