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
  const lastTitle       = useRef<string | null>(null);
  const fetchedFor      = useRef<{ id: string, title: string } | null>(null); 

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
    // Check if we already fetched for this exact ID and Title
    if (fetchedFor.current?.id === videoId && fetchedFor.current?.title === title) return;

    // If ID is same but Title is different, we force a re-fetch because the previous 
    // fetch might have happened with stale metadata (common on YouTube SPA navigation).
    const isRetryWithNewTitle = fetchedFor.current?.id === videoId && fetchedFor.current?.title !== title;

    fetchedFor.current = { id: videoId, title };

    setLyrics(null);
    setLyricsStatus("loading");
    setOffset(0); // reset offset for new song

    console.log(`[Lyrics] Starting fetch for: ${title}${isRetryWithNewTitle ? " (Updated Title)" : ""}`);
    const data = await loadLyrics(videoId, title, isRetryWithNewTitle);

    // Guard: ensure we only update if this is STILL the active request
    // (prevents stale/slow fetches from overwriting newer ones for the same ID)
    if (fetchedFor.current?.id !== videoId || fetchedFor.current?.title !== title) return;

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
      // Trigger if ID changes OR if Title changes (handles stale metadata)
      if (videoId && title && (videoId !== lastVideoId.current || title !== lastTitle.current)) {
        lastVideoId.current = videoId;
        lastTitle.current   = title;
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
          lastTitle.current   = title   ?? null;
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