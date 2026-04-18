import { useMemo } from "react";
import { LyricLine } from "../types";

interface Props {
  lines:       LyricLine[];
  currentTime: number;
}

// Find the index of the currently active lyric line.
// A line is "active" when currentTime >= line.time
// and currentTime < next line's time.
function getActiveIndex(lines: LyricLine[], currentTime: number): number {
  if (lines.length === 0) return -1;

  let active = -1;
  for (let i = 0; i < lines.length; i++) {
    if (currentTime >= lines[i].time) {
      active = i;
    } else {
      break;
    }
  }
  return active;
}

function LyricsDisplay({ lines, currentTime }: Props) {
  const activeIndex = useMemo(
    () => getActiveIndex(lines, currentTime),
    [lines, currentTime]
  );

  // We show: prev line, current line, next line
  const prevLine    = activeIndex > 0 ? lines[activeIndex - 1] : null;
  const currentLine = activeIndex >= 0 ? lines[activeIndex] : null;
  const nextLine    = activeIndex < lines.length - 1 ? lines[activeIndex + 1] : null;

  if (lines.length === 0) {
    return (
      <p style={styles.waiting}>♪ Waiting for lyrics...</p>
    );
  }

  if (activeIndex === -1) {
    return (
      <p style={styles.waiting}>♪ Get ready...</p>
    );
  }

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      {/* Previous line — dimmed */}
      <p style={{ ...styles.line, ...styles.dimLine, marginBottom: "6px" }}>
        {prevLine?.text ?? ""}
      </p>

      {/* Current line — bright and large */}
      <p
        key={activeIndex}        // key forces re-mount → triggers CSS animation
        style={{ ...styles.line, ...styles.activeLine }}
      >
        {currentLine?.text ?? ""}
      </p>

      {/* Next line — dimmed */}
      <p style={{ ...styles.line, ...styles.dimLine, marginTop: "6px" }}>
        {nextLine?.text ?? ""}
      </p>
    </div>
  );
}


const baseFont: React.CSSProperties = {
  margin: 0,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  lineHeight: 1.4,
  transition: "opacity 0.3s ease",
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