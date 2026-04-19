import React, { useMemo } from "react";
import { LyricLine } from "../types";

interface Props {
  line: LyricLine | null;
  nextLineTime: number | null;
  currentTime: number;
}

const MinimalLyrics: React.FC<Props> = ({ line, nextLineTime, currentTime }) => {
  const duration = useMemo(() => {
    if (!line || !nextLineTime) return 5; // Default 5s if unknown
    return Math.max(0.1, nextLineTime - line.time);
  }, [line, nextLineTime]);

  if (!line) return null;

  // Calculate how many characters should be visible based on time progress
  const elapsed = Math.max(0, currentTime - line.time);
  const progress = Math.min(1, elapsed / duration);
  
  
  const charCount = line.text.length;
  const visibleChars = Math.floor(charCount * progress);

  return (
    <div style={containerStyle}>
      <div style={lyricsWrapper}>
        {line.text.split("").map((char, index) => (
          <span
            key={index}
            style={{
              ...charStyle,
              opacity: index < visibleChars ? 1 : 0.15,
              transform: index < visibleChars ? "translateY(0)" : "translateY(4px)",
              filter: index < visibleChars ? "blur(0)" : "blur(1px)",
              transition: "opacity 0.2s ease, transform 0.2s ease, filter 0.2s ease",
            }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "10px 0",
};

const lyricsWrapper: React.CSSProperties = {
  fontSize: "28px",
  fontWeight: 700,
  textAlign: "center",
  color: "#fff",
  fontFamily: "system-ui, -apple-system, sans-serif",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  maxWidth: "90%",
  lineHeight: 1.2,
  maxHeight: "2.4em", 
  overflow: "hidden",
  textShadow: "0 2px 10px rgba(0,0,0,0.5)",
};

const charStyle: React.CSSProperties = {
  display: "inline-block",
  whiteSpace: "pre",
};

export default MinimalLyrics;
