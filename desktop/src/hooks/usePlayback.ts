import { useEffect, useState, useRef } from "react";
import { listen }                       from "@tauri-apps/api/event";
import { PlaybackState }                from "../types";
import { loadLyrics }                   from "../lib/lyricsStore";
import { ParsedLrc }                    from "../lib/lrcParser";

const DEFAULT_STATE: PlaybackState = {
  videoId:     null,
  title:       null,
  currentTime: 0,
  duration:    0,
  paused:      true,
};

export function usePlayback() {
  const [playback,   setPlayback]   = useState<PlaybackState>(DEFAULT_STATE);
  const [lyrics,     setLyrics]     = useState<ParsedLrc | null>(null);
  const [lyricsState, setLyricsState] = useState<"idle"|"loading"|"found"|"not_found">("idle");

  const interpolatorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastVideoId     = useRef<string | null>(null);

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

  // Fetch lyrics whenever video changes
  async function handleVideoChange(videoId: string, title: string) {
    if (videoId === lastVideoId.current) return;
    lastVideoId.current = videoId;

    setLyrics(null);
    setLyricsState("loading");

    const data = await loadLyrics(videoId, title);

    // Check we're still on the same video (user might have switched)
    if (lastVideoId.current !== videoId) return;

    if (data && data.lines.length > 0) {
      setLyrics(data);
      setLyricsState("found");
    } else {
      setLyrics(null);
      setLyricsState("not_found");
    }
  }

  useEffect(() => {
    const unlisten = listen<any>("playback-event", (event) => {
      const msg = event.payload;

      setPlayback(prev => ({
        videoId:     msg.videoId     ?? prev.videoId,
        title:       msg.title       ?? prev.title,
        currentTime: msg.currentTime ?? prev.currentTime,
        duration:    msg.duration    ?? prev.duration,
        paused:      msg.paused      ?? prev.paused,
      }));

      // Trigger lyrics fetch on new video
      if (msg.videoId && msg.title) {
        handleVideoChange(msg.videoId, msg.title);
      }

      switch (msg.type) {
        case "play":
        case "tick":
          startInterpolation(msg.currentTime ?? 0, Date.now());
          break;
        case "pause":
          stopInterpolation();
          break;
        case "seek":
          startInterpolation(msg.currentTime ?? 0, Date.now());
          break;
        case "videoChanged":
          stopInterpolation();
          setPlayback({
            videoId:     msg.videoId ?? null,
            title:       msg.title   ?? null,
            currentTime: 0,
            duration:    msg.duration ?? 0,
            paused:      true,
          });
          break;
      }
    });

    return () => {
      unlisten.then(fn => fn());
      stopInterpolation();
    };
  }, []);

  return { playback, lyrics, lyricsState };
}