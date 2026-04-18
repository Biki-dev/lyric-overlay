import { useEffect } from "react";
import { usePlayback } from "../hooks/usePlayback";
import LyricsDisplay from "../components/LyricsDisplay";
import ProgressBar from "../components/ProgressBar";
import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

function Overlay() {
  const { playback, lyrics, lyricsStatus, offset, setOffset } = usePlayback();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setOffset(o => o - 0.1);
      } else if (e.key === "ArrowRight") {
        setOffset(o => o + 0.1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [setOffset]);

  const lines = lyrics?.lines ?? [];
  const hasVideo = !!playback.videoId;

  // Apply offset to currentTime before passing to lyrics engine
  const adjustedTime = playback.currentTime + offset;

  function getTitle() {
    if (!hasVideo) return "♪ Play a YouTube video";
    if (lyricsStatus === "loading") return "⏳ Fetching lyrics...";
    if (lyricsStatus === "not_found") return `♪ ${playback.title ?? ""} — no lyrics`;
    return `${playback.paused ? "⏸" : "♪"} ${playback.title ?? ""}`;
  }

  return (
    <div style={containerStyle}>
      <div 
        style={cardStyle} 
        onMouseDown={async () => {
          await appWindow.startDragging();
        }}
      >

        {/* Song title */}
        <p 
          style={titleStyle} 
          onMouseDown={async () => {
            console.log("Dragging from title...");
            await appWindow.startDragging();
          }}
        >
          {getTitle()}
        </p>

        {/* Lyrics */}
        <div 
          style={{ width: "100%", cursor: "grab" }}
          onMouseDown={async () => {
            console.log("Dragging from lyrics...");
            await appWindow.startDragging();
          }}
        >
          <LyricsDisplay
            lines={lines}
            currentTime={adjustedTime}   // ← offset applied here
          />
        </div>

        {/* Progress bar */}
        {hasVideo && (
          <ProgressBar
            currentTime={playback.currentTime}
            duration={playback.duration}
          />
        )}

        {/* Sync offset controls — only show when lyrics are loaded 
        {lyricsStatus === "found" && (
          <div style={syncRowStyle}>
            <div style={sliderWrapperStyle}>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.1"
                value={offset}
                onChange={(e) => setOffset(parseFloat(e.target.value))}
                onMouseDown={(e) => e.stopPropagation()}
                style={sliderStyle}
                className="sync-slider"
              />
              <span style={syncLabelStyle}>
                {offset === 0 ? "sync" : `${offset > 0 ? "+" : ""}${offset.toFixed(1)}s`}
              </span>
            </div>

            {offset !== 0 && (
              <button
                style={{ ...syncBtnStyle, color: "#ff5a5a" }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setOffset(0)}
                title="Reset offset"
              >
                ✕
              </button>
            )}
          </div>
        )}
*/}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  width: "100vw", height: "100vh",
  background: "transparent",
  display: "flex", alignItems: "flex-end", justifyContent: "center",
  paddingBottom: "32px", boxSizing: "border-box", userSelect: "none",
  pointerEvents: "none", // Allow clicking through the transparent area
};

const cardStyle: React.CSSProperties = {
  pointerEvents: "auto", // Re-enable interaction for the card itself
  cursor: "grab",       // Visual hint that it's draggable
  background: "rgba(0,0,0,0.72)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  borderRadius: "16px",
  padding: "18px 32px 14px",
  width: "580px", textAlign: "center",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 10px", fontSize: "12px", fontWeight: 500,
  color: "rgba(255,255,255,0.45)",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  letterSpacing: "0.05em", textTransform: "uppercase",
  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
};

const syncRowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  gap: "12px", marginTop: "12px",
  position: "relative", paddingBottom: "14px", // Leave room for absolute label
};

const syncBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "6px", padding: "4px 8px",
  color: "rgba(255,255,255,0.5)", fontSize: "10px",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  userSelect: "none",
};

const syncLabelStyle: React.CSSProperties = {
  position: "absolute", bottom: "-4px", left: "50%", transform: "translateX(-50%)",
  fontSize: "10px", color: "rgba(255,255,255,0.5)",
  fontFamily: "monospace", fontWeight: 600,
  whiteSpace: "nowrap",
};

const sliderWrapperStyle: React.CSSProperties = {
  position: "relative", width: "160px",
  display: "flex", alignItems: "center",
};

const sliderStyle: React.CSSProperties = {
  width: "100%",
  cursor: "pointer",
  accentColor: "rgba(255,255,255,0.8)",
  margin: 0,
};

export default Overlay;
