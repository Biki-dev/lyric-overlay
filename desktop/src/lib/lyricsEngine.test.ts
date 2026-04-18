import { describe, it, expect } from "vitest";
import { parseLrc } from "./lrcParser";
import { getActiveIndex, getLyricWindow } from "./lyricsEngine";
import { LyricLine } from "../types";

// ── Parser Tests ──────────────────────────────────────────────────────────

describe("parseLrc", () => {
  const SAMPLE = `
[ti:Test Song]
[ar:Test Artist]
[00:00.00]First line
[00:05.50]Second line
[00:10.00]Third line
[00:15.75]Fourth line
`.trim();

  it("parses metadata correctly", () => {
    const { metadata } = parseLrc(SAMPLE);
    expect(metadata.title).toBe("Test Song");
    expect(metadata.artist).toBe("Test Artist");
  });

  it("parses lyric lines with correct timestamps", () => {
    const { lines } = parseLrc(SAMPLE);
    expect(lines).toHaveLength(4);
    expect(lines[0]).toEqual({ time: 0,     text: "First line" });
    expect(lines[1]).toEqual({ time: 5.5,   text: "Second line" });
    expect(lines[2]).toEqual({ time: 10,    text: "Third line" });
    expect(lines[3]).toEqual({ time: 15.75, text: "Fourth line" });
  });

  it("sorts lines by time", () => {
    const unsorted = `
[00:10.00]Third
[00:00.00]First
[00:05.00]Second
`.trim();
    const { lines } = parseLrc(unsorted);
    expect(lines[0].text).toBe("First");
    expect(lines[1].text).toBe("Second");
    expect(lines[2].text).toBe("Third");
  });

  it("handles multiple timestamps on one line", () => {
    const multi = `[00:05.00][00:30.00]Repeated line`;
    const { lines } = parseLrc(multi);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ time: 5,  text: "Repeated line" });
    expect(lines[1]).toEqual({ time: 30, text: "Repeated line" });
  });

  it("handles empty lyric text (instrumental)", () => {
    const instrumental = `[00:05.00]`;
    const { lines } = parseLrc(instrumental);
    expect(lines).toHaveLength(1);
    expect(lines[0].text).toBe("");
  });

  it("returns empty lines for empty input", () => {
    const { lines, metadata } = parseLrc("");
    expect(lines).toHaveLength(0);
    expect(metadata).toEqual({});
  });
});

// ── Engine Tests ──────────────────────────────────────────────────────────

describe("getActiveIndex", () => {
  const lines: LyricLine[] = [
    { time: 0,  text: "First"  },
    { time: 5,  text: "Second" },
    { time: 10, text: "Third"  },
    { time: 15, text: "Fourth" },
  ];

  it("returns -1 before first line", () => {
    expect(getActiveIndex(lines, -1)).toBe(-1);
  });

  it("returns 0 at exactly the first timestamp", () => {
    expect(getActiveIndex(lines, 0)).toBe(0);
  });

  it("returns correct index mid-song", () => {
    expect(getActiveIndex(lines, 7)).toBe(1);   // between 5s and 10s
    expect(getActiveIndex(lines, 10)).toBe(2);  // exactly at 10s
    expect(getActiveIndex(lines, 12)).toBe(2);  // between 10s and 15s
  });

  it("returns last index past the end", () => {
    expect(getActiveIndex(lines, 999)).toBe(3);
  });

  it("returns -1 for empty lines", () => {
    expect(getActiveIndex([], 5)).toBe(-1);
  });
});

describe("getLyricWindow", () => {
  const lines: LyricLine[] = [
    { time: 0,  text: "First"  },
    { time: 5,  text: "Second" },
    { time: 10, text: "Third"  },
  ];

  it("returns null prev at start", () => {
    const w = getLyricWindow(lines, 0);
    expect(w.prev).toBeNull();
    expect(w.current?.text).toBe("First");
    expect(w.next?.text).toBe("Second");
  });

  it("returns correct window mid-song", () => {
    const w = getLyricWindow(lines, 6);
    expect(w.prev?.text).toBe("First");
    expect(w.current?.text).toBe("Second");
    expect(w.next?.text).toBe("Third");
  });

  it("returns null next at end", () => {
    const w = getLyricWindow(lines, 10);
    expect(w.prev?.text).toBe("Second");
    expect(w.current?.text).toBe("Third");
    expect(w.next).toBeNull();
  });

  it("returns all nulls before song starts", () => {
    const w = getLyricWindow(lines, -1);
    expect(w.current).toBeNull();
    expect(w.prev).toBeNull();
  });
});