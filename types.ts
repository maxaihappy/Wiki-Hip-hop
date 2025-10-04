
export interface SongData {
  title: string;
  beatDescription: string;
  lyrics: string;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface GenerationResult {
  song: SongData;
  sources: GroundingSource[];
}

export enum LoadingStep {
  IDLE = "IDLE",
  SEARCHING = "Researching your vibe...",
  STORYTELLING = "Weaving the narrative...",
  GENERATING = "Dropping the beat...",
  DONE = "DONE",
}
