import { useEffect, useState, useRef, useCallback } from "react";
import { listen }          from "@tauri-apps/api/event";
import { PlaybackState }   from "../types";
import { loadLyrics }      from "../lib/lyricsStore";
import { ParsedLrc }       from "../lib/lrcParser";

const DEFAULT_STATE: PlaybackState = {
  videoId: null, title: null,
  currentTime: 0, duration: 0, paused: true,
};

export type LyricsStatus = "idle" | "loading" | "found" | "not_found";

export function usePlayback() {
  const [playback,     setPlayback]     = useState<PlaybackState>(DEFAULT_STATE);
  const [lyrics,       setLyrics]       = useState<ParsedLrc | null>(null);
  const [lyricsStatus, setLyricsStatus] = useState<LyricsStatus>("idle");
  const [offset,       setOffset]       = useState(0); // manual sync offset in seconds

  const interpolatorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastVideoId     = useRef<string | null>(null);
  const fetchedForId    = useRef<string | null>(null); // track what we already fetched

  // ── Interpolation ───────────────────────────────────────────────────────
  function startInterpolation(baseTime: number, basestamp: number) {
    stopInterpolation();
    interpolatorRef.current = setInterval(() => {
      const elapsed = (Date.now() - basestamp) / 1000;
      setPlayback(prev => ({
        ...prev,
        currentTime: baseTime + elapsed,
      }));
    }, 100);
  }

  function stopInterpolation() {
    if (interpolatorRef.current) {
      clearInterval(interpolatorRef.current);
      interpolatorRef.current = null;
    }
  }

  // ── Lyrics fetch ────────────────────────────────────────────────────────
  const triggerFetch = useCallback(async (videoId: string, title: string) => {
    // Don't re-fetch if already fetched for this video
    if (fetchedForId.current === videoId) return;
    fetchedForId.current = videoId;

    setLyrics(null);
    setLyricsStatus("loading");
    setOffset(0); // reset offset for new song

    console.log(`[Lyrics] Starting fetch for: ${title}`);
    const data = await loadLyrics(videoId, title);

    // Guard: user may have changed video while fetching
    if (fetchedForId.current !== videoId) return;

    if (data && data.lines.length > 0) {
      setLyrics(data);
      setLyricsStatus("found");
      console.log(`[Lyrics] Loaded ${data.lines.length} lines`);
    } else {
      setLyrics(null);
      setLyricsStatus("not_found");
      console.log(`[Lyrics] Not found for: ${title}`);
    }
  }, []);

  // ── Event listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const unlisten = listen<any>("playback-event", (event) => {
      const msg = event.payload;
      const { type, videoId, title, currentTime, duration, paused } = msg;

      // ── Always update playback state ──
      setPlayback(prev => ({
        videoId:     videoId     ?? prev.videoId,
        title:       title       ?? prev.title,
        currentTime: currentTime ?? prev.currentTime,
        duration:    duration    ?? prev.duration,
        paused:      paused      ?? prev.paused,
      }));

      // ── Fetch lyrics as early as possible ──
      // Trigger on ANY event that carries a new videoId+title
      // This way we start fetching on the very first message
      if (videoId && title && videoId !== lastVideoId.current) {
        lastVideoId.current = videoId;
        triggerFetch(videoId, title);
      }

      // ── Interpolation control ──
      switch (type) {
        case "play":
        case "tick":
        case "reconnected":
          if (!paused) {
            startInterpolation(currentTime ?? 0, Date.now());
          }
          break;

        case "pause":
          stopInterpolation();
          break;

        case "seek":
          // On seek: snap currentTime immediately then interpolate
          setPlayback(prev => ({ ...prev, currentTime: currentTime ?? prev.currentTime }));
          if (!paused) startInterpolation(currentTime ?? 0, Date.now());
          break;

        case "videoChanged":
          stopInterpolation();
          lastVideoId.current = videoId ?? null;
          setPlayback({
            videoId:     videoId  ?? null,
            title:       title    ?? null,
            currentTime: 0,
            duration:    duration ?? 0,
            paused:      true,
          });
          if (videoId && title) triggerFetch(videoId, title);
          break;
      }
    });

    return () => {
      unlisten.then(fn => fn());
      stopInterpolation();
    };
  }, [triggerFetch]);

  return { playback, lyrics, lyricsStatus, offset, setOffset };
}