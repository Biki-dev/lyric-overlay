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
  videoTitle: string
): Promise<FetchResult> {

  if (cache.has(videoId)) {
    const cached = cache.get(videoId)!;
    return { found: !!cached, data: cached, source: "cache" };
  }

  // Parse "Artist - Song Title" from YouTube title
  const { artist, track } = parseYouTubeTitle(videoTitle);
  console.log(`[Lyrics] Fetching: artist="${artist}" track="${track}"`);

  try {
    // Try exact search first
    let lrc = await trySearch(artist, track);

    // If not found, try with just the track name (no artist)
    if (!lrc && artist) {
      lrc = await trySearch("", track);
    }

    if (!lrc) {
      console.log(`[Lyrics] Not found for: ${videoTitle}`);
      cache.set(videoId, null);
      return { found: false, data: null, source: "lrclib" };
    }

    const parsed = parseLrc(lrc);
    cache.set(videoId, parsed);
    console.log(`[Lyrics] Found ${parsed.lines.length} lines`);
    return { found: true, data: parsed, source: "lrclib" };

  } catch (err) {
    console.error("[Lyrics] Fetch error:", err);
    cache.set(videoId, null);
    return { found: false, data: null, source: "error" };
  }
}

// ── lrclib.net API call ───────────────────────────────────────────────────

async function trySearch(
  artist: string,
  track:  string
): Promise<string | null> {
  const params = new URLSearchParams({ track_name: track });
  if (artist) params.set("artist_name", artist);

  const url = `${BASE_URL}/search?${params}`;
  const res  = await fetch(url);

  if (!res.ok) return null;

  const results = await res.json();
  if (!Array.isArray(results) || results.length === 0) return null;

  // Pick the first result that has synced lyrics
  const withLrc = results.find((r: any) => r.syncedLyrics);
  if (!withLrc) {
    // Fall back to plain lyrics if no synced version
    const withPlain = results.find((r: any) => r.plainLyrics);
    if (withPlain) return convertPlainToLrc(withPlain.plainLyrics);
    return null;
  }

  return withLrc.syncedLyrics;
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
  // Strip common YouTube suffixes first
  const cleaned = title
    .replace(/\s*[\(\[].*(official|video|audio|lyrics|hd|mv|music video|prod\.?)[^\)\]]*[\)\]]/gi, "")
    .replace(/\s*[\(\[].*[\)\]]/g, "")   // remove all remaining parentheses/brackets
    .trim();

  // Split on " - " separator
  const parts = cleaned.split(/\s+-\s+/);

  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      track:  parts.slice(1).join(" - ").trim(),
    };
  }

  // No separator found — treat whole title as track name
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