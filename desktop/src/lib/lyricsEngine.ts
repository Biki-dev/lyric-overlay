import { LyricLine } from "../types";

// ── Active Line Finder ────────────────────────────────────────────────────

export function getActiveIndex(lines: LyricLine[], currentTime: number): number {
  if (lines.length === 0) return -1;

  // Before the first line
  if (currentTime < lines[0].time) return -1;

  let lo = 0;
  let hi = lines.length - 1;

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (lines[mid].time <= currentTime) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return lo;
}


// Returns the three lines we display: prev, current, next.
// Any can be null if at the start/end.

export interface LyricWindow {
  prev:    LyricLine | null;
  current: LyricLine | null;
  next:    LyricLine | null;
  index:   number;
}

export function getLyricWindow(
  lines: LyricLine[],
  currentTime: number
): LyricWindow {
  const index = getActiveIndex(lines, currentTime);

  return {
    index,
    prev:    index > 0                  ? lines[index - 1] : null,
    current: index >= 0                 ? lines[index]     : null,
    next:    index < lines.length - 1   ? lines[index + 1] : null,
  };
}


// When user seeks, we need to find the right line quickly.
// This is the same as getActiveIndex but exported with a clearer name.

export function findLineAtTime(
  lines: LyricLine[],
  seekTime: number
): number {
  return getActiveIndex(lines, seekTime);
}