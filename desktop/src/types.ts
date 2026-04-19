// Shared types used across the frontend

export interface LyricLine {
  time: number; 
  text: string;   
}

export interface PlaybackState {
  videoId:     string | null;
  title:       string | null;
  currentTime: number;
  duration:    number;
  paused:      boolean;
}

export interface LyricsData {
  videoId: string;
  title:   string;
  lines:   LyricLine[];
}

export type LayoutMode = "classic" | "minimal";