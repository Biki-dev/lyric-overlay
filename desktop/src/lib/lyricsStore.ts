import { parseLrc, ParsedLrc } from "./lrcParser";
import { fetchLyrics }          from "./lyricsFetcher";

// Manual overrides — add songs here if auto-fetch gets wrong lyrics
// Key: YouTube video ID, Value: raw LRC string
const MANUAL_LRC: Record<string, string> = {
  // Example override:
  // "H5v3kku4y6Q": `[ti:As It Was]\n[ar:Harry Styles]\n...`,
};

const cache = new Map<string, ParsedLrc | null>();

// Synchronous check — returns cached result only
export function getCachedLyrics(videoId: string): ParsedLrc | null {
  if (videoId in MANUAL_LRC) {
    if (!cache.has(videoId)) {
      cache.set(videoId, parseLrc(MANUAL_LRC[videoId]));
    }
    return cache.get(videoId)!;
  }
  return cache.get(videoId) ?? null;
}

// Async fetch — tries manual map first, then lrclib.net
export async function loadLyrics(
  videoId:    string,
  videoTitle: string,
  force:      boolean = false
): Promise<ParsedLrc | null> {
  // 1. Manual override takes priority
  if (videoId in MANUAL_LRC) {
    const parsed = parseLrc(MANUAL_LRC[videoId]);
    cache.set(videoId, parsed);
    return parsed;
  }

  // 2. Already cached from a previous fetch (unless forced)
  if (!force && cache.has(videoId)) {
    return cache.get(videoId)!;
  }

  // 3. Fetch from lrclib.net
  const result = await fetchLyrics(videoId, videoTitle, force);
  cache.set(videoId, result.data);
  return result.data;
}

export function hasLyrics(videoId: string): boolean {
  const cached = cache.get(videoId);
  return cached !== null && cached !== undefined && cached.lines.length > 0;
}