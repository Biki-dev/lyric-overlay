import { useState } from "react";
import LyricsDisplay from "../components/LyricsDisplay";
import ProgressBar from "../components/ProgressBar";
import { LyricLine, PlaybackState } from "../types";
import { parseLrc } from "../lib/lrcParser";

// Sample LRC — replace with real fetch in Phase 8
const SAMPLE_LRC = `
[ti:As It Was]
[ar:Harry Styles]
[00:00.00]
[00:13.45]Holding me back
[00:15.82]Gravity's holding me back
[00:19.10]I want you to hold out the palm of your hand
[00:24.54]Why don't we leave it at that?
[00:28.90]Nothing to say
[00:31.20]When everything gets in the way
[00:34.80]Seems you cannot be replaced
[00:38.10]And I'm the one who will stay
[00:42.50]In this world, it's just us
[00:46.10]You know it's not the same as it was
[00:52.40]In this world, it's just us
[00:56.00]You know it's not the same as it was
[01:02.30]As it was
`.trim();

const { lines: MOCK_LYRICS, metadata: MOCK_META } = parseLrc(SAMPLE_LRC);

const MOCK_STATE: PlaybackState = {
  videoId:     "mock123",
  title:       MOCK_META.title ?? "Unknown",
  currentTime: 0,
  duration:    200,
  paused:      false,
};

function Overlay() {

  const [playback, setPlayback] = useState<PlaybackState>(MOCK_STATE);
  const [tick, setTick]         = useState(0);

  useState(() => {
    const interval = setInterval(() => {
      setPlayback(prev => ({
        ...prev,
        currentTime: (prev.currentTime + 1) % prev.duration,
      }));
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  });

  const hasVideo = !!playback.videoId;

  return (
    <div style={containerStyle}>
    
      <div style={cardStyle}>

       
        {hasVideo && (
          <p style={titleStyle}>
            {playback.paused ? "⏸ " : "♪ "}
            {playback.title ?? "Unknown"}
          </p>
        )}

    
        <LyricsDisplay
          lines={MOCK_LYRICS}
          currentTime={playback.currentTime}
        />

      
        {hasVideo && (
          <ProgressBar
            currentTime={playback.currentTime}
            duration={playback.duration}
          />
        )}

      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  width: "100vw",
  height: "100vh",
  background: "transparent",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  paddingBottom: "32px",
  boxSizing: "border-box",
  userSelect: "none",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(0, 0, 0, 0.72)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  borderRadius: "16px",
  padding: "18px 32px 14px",
  width: "580px",
  textAlign: "center",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: "12px",
  fontWeight: 500,
  color: "rgba(255,255,255,0.45)",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

export default Overlay;