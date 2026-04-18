import { LyricLine } from "../types";

// ── LRC Tag Regexes ───────────────────────────────────────────────────────

// Matches timestamp tags: [00:13.45] or [00:13] or [00:13.456]
const TIMESTAMP_RE = /\[(\d{2}):(\d{2})\.?(\d{2,3})?\]/g;

// Matches metadata tags: [ti:Title] [ar:Artist] [al:Album]
const METADATA_RE = /^\[([a-zA-Z]+\w*):(.+)\]$/;

export interface LrcMetadata {
  title?:  string;
  artist?: string;
  album?:  string;
}

export interface ParsedLrc {
  metadata: LrcMetadata;
  lines:    LyricLine[];
}

// ── Parser ────────────────────────────────────────────────────────────────

export function parseLrc(raw: string): ParsedLrc {
  const metadata: LrcMetadata = {};
  const lines: LyricLine[]    = [];

  // Normalize line endings (Windows \r\n → \n)
  const rows = raw.replace(/\r\n/g, "\n").split("\n");

  for (const row of rows) {
    const trimmed = row.trim();
    if (!trimmed) continue;

    // ── Metadata line: [ti:Title] ─────────────────────────────────────
    const metaMatch = trimmed.match(METADATA_RE);
    if (metaMatch) {
      const [, key, value] = metaMatch;
      switch (key.toLowerCase()) {
        case "ti": metadata.title  = value.trim(); break;
        case "ar": metadata.artist = value.trim(); break;
        case "al": metadata.album  = value.trim(); break;
        // Ignore offset, length, etc. for now
      }
      continue;
    }

    // ── Lyric line: [MM:SS.xx]text ────────────────────────────────────
    // A single line can have MULTIPLE timestamps (same lyric, repeated)
    // e.g. [00:13.45][00:45.12]We don't talk about Bruno
    // ── Lyric line: [MM:SS.xx]text ────────────────────────────────────────
const timestamps: number[] = [];
let lastIndex = 0;

// Reset regex state before each row — critical for global regex
TIMESTAMP_RE.lastIndex = 0;

let match: RegExpExecArray | null;
while ((match = TIMESTAMP_RE.exec(trimmed)) !== null) {
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const centis  = match[3] ? parseInt(match[3].padEnd(3, "0"), 10) : 0;

  const time = minutes * 60 + seconds + centis / 1000;
  timestamps.push(time);
  lastIndex = TIMESTAMP_RE.lastIndex;
}

if (timestamps.length === 0) continue;

// text can legitimately be empty string (instrumental break)
const text = trimmed.slice(lastIndex).trim();

// Push regardless of whether text is empty
for (const time of timestamps) {
  lines.push({ time, text });
}
  }

  // Sort by time — LRC files are usually ordered but not guaranteed
  lines.sort((a, b) => a.time - b.time);

  return { metadata, lines };
}