import { useState } from "react";
import LyricsDisplay from "../components/LyricsDisplay";
import ProgressBar from "../components/ProgressBar";
import { LyricLine, PlaybackState } from "../types";

const MOCK_LYRICS: LyricLine[] = [
  { time: 0,  text: "We don't talk about Bruno" },
  { time: 4,  text: "No, no, no" },
  { time: 6,  text: "We don't talk about Bruno" },
  { time: 10, text: "But it was my wedding day" },
  { time: 14, text: "It was our wedding day" },
  { time: 18, text: "We were getting ready" },
  { time: 22, text: "And there wasn't a cloud in the sky" },
  { time: 26, text: "No clouds allowed in the sky" },
];

const MOCK_STATE: PlaybackState = {
  videoId:     "mock123",
  title:       "We Don't Talk About Bruno",
  currentTime: 0,
  duration:    180,
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