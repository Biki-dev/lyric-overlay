import { parseLrc, ParsedLrc } from "./lrcParser";

const BASE_URL = "https://lrclib.net/api";

// Cache so we don't re-fetch the same song
const cache = new Map<string, ParsedLrc | null>();

export interface FetchResult {
  found:  boolean;
  data:   ParsedLrc | null;
  source: string;
}

// ── Main fetch function ───────────────────────────────────────────────────
export async function fetchLyrics(
  videoId:    string,
  videoTitle: string,
  force:      boolean = false
): Promise<FetchResult> {
  if (!force && cache.has(videoId)) {
    const cached = cache.get(videoId)!;
    return { found: !!cached, data: cached, source: "cache" };
  }

  const { artist, track } = parseYouTubeTitle(videoTitle);
  console.log(`[Lyrics] artist="${artist}" track="${track}"`);

  // Strategy 1: artist + track
  let lrc = artist ? await trySearch(artist, track) : null;

  // Strategy 2: track only (no artist)
  if (!lrc) lrc = await trySearch("", track);

  // Strategy 3: swap artist/track (some titles are "Song - Artist")
  if (!lrc && artist) lrc = await trySearch(track, artist);

  // Strategy 4: use raw title as track name
  if (!lrc) lrc = await trySearch("", videoTitle.slice(0, 60));

  if (!lrc) {
    console.log(`[Lyrics] All strategies failed for: ${videoTitle}`);
    cache.set(videoId, null);
    return { found: false, data: null, source: "lrclib" };
  }

  const parsed = parseLrc(lrc);
  cache.set(videoId, parsed);
  console.log(`[Lyrics] ✅ Found ${parsed.lines.length} lines`);
  return { found: true, data: parsed, source: "lrclib" };
}

// ── lrclib.net API call ───────────────────────────────────────────────────
async function trySearch(
  artist: string,
  track:  string
): Promise<string | null> {
  const params = new URLSearchParams({ track_name: track });
  if (artist) params.set("artist_name", artist);

  const url = `${BASE_URL}/search?${params}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000) // 5s timeout
    });
    if (!res.ok) return null;

    const results = await res.json();
    if (!Array.isArray(results) || results.length === 0) return null;

    // Prefer synced lyrics
    const withLrc = results.find((r: any) => r.syncedLyrics);
    if (withLrc) return withLrc.syncedLyrics;

    // Fall back to plain
    const withPlain = results.find((r: any) => r.plainLyrics);
    if (withPlain) return convertPlainToLrc(withPlain.plainLyrics);

    return null;
  } catch {
    return null;
  }
}

// ── YouTube title parser ──────────────────────────────────────────────────
// YouTube titles follow many patterns. We handle the most common ones:
// "Artist - Song Title"
// "Song Title - Artist"
// "Artist - Song Title (Official Video)"
// "Song Title (feat. Artist)"

export function parseYouTubeTitle(title: string): {
  artist: string;
  track:  string;
} {
  let cleaned = title
    // Remove feat./ft. blocks
    .replace(/\s*[\(\[](feat|ft)\.?[^\)\]]*[\)\]]/gi, "")
    // Remove common YouTube suffixes in brackets/parens
    .replace(/\s*[\(\[]\s*(official\s*)?(music\s*)?(video|audio|mv|lyric[s]?|hd|4k|visualizer|live|performance|prod\.?[^)\]]*)\s*[\)\]]/gi, "")
    // Remove standalone year in parens like (2023)
    .replace(/\s*\(\d{4}\)/g, "")
    // Remove remaining empty brackets
    .replace(/\s*[\(\[\]\)]+\s*/g, " ")
    // Japanese/Korean title brackets
    .replace(/[「」『』【】]/g, " ")
    .trim();

  // Split on " - " (with surrounding spaces)
  const dashParts = cleaned.split(/\s+-\s+/);

  if (dashParts.length >= 2) {
    const artist = dashParts[0].trim();
    const track  = dashParts.slice(1).join(" ").trim();
    return { artist, track };
  }

  // Try " | " separator (less common)
  const pipeParts = cleaned.split(/\s+\|\s+/);
  if (pipeParts.length >= 2) {
    return { artist: pipeParts[0].trim(), track: pipeParts[1].trim() };
  }

  // No separator — use full title as track name
  return { artist: "", track: cleaned };
}

// ── Plain lyrics → fake LRC converter ────────────────────────────────────
// If only plain (unsynced) lyrics exist, we display them statically
// by spreading lines 3 seconds apart. Not ideal but better than nothing.

function convertPlainToLrc(plain: string): string {
  const lines = plain.split("\n").filter(l => l.trim());
  return lines
    .map((line, i) => {
      const totalSecs = i * 3;
      const mm = Math.floor(totalSecs / 60).toString().padStart(2, "0");
      const ss = (totalSecs % 60).toString().padStart(2, "0");
      return `[${mm}:${ss}.00]${line}`;
    })
    .join("\n");
}