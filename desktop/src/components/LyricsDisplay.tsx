import { useMemo } from "react";
import { LyricLine } from "../types";
import { getLyricWindow } from "../lib/lyricsEngine";

interface Props {
  lines:       LyricLine[];
  currentTime: number;
}

function LyricsDisplay({ lines, currentTime }: Props) {
  const window = useMemo(
    () => getLyricWindow(lines, currentTime),
    [lines, currentTime]
  );

  if (lines.length === 0) {
    return <p style={styles.waiting}>♪ Waiting for lyrics...</p>;
  }

  if (window.current === null) {
    return <p style={styles.waiting}>♪ Get ready...</p>;
  }

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <p
        key={window.index}
        style={{ ...styles.line, ...styles.activeLine }}
      >
        {window.current.text || "♩"}  {/* blank = instrumental break */}
      </p>

      <p style={{ ...styles.line, ...styles.dimLine, marginTop: "10px" }}>
        {window.next?.text ?? ""}
      </p>
    </div>
  );
}

const baseFont: React.CSSProperties = {
  margin: 0,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  lineHeight: 1.4,
};

const styles: Record<string, React.CSSProperties> = {
  waiting: {
    ...baseFont,
    fontSize: "20px",
    color: "rgba(255,255,255,0.4)",
    fontStyle: "italic",
  },
  line: {
    ...baseFont,
    letterSpacing: "0.01em",
  },
  activeLine: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#ffffff",
    textShadow: "0 2px 12px rgba(0,0,0,0.9)",
    animation: "fadeIn 0.3s ease",
  },
  dimLine: {
    fontSize: "15px",
    fontWeight: 400,
    color: "rgba(255,255,255,0.35)",
    textShadow: "0 1px 4px rgba(0,0,0,0.6)",
  },
};

export default LyricsDisplay;