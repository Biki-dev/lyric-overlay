import { useEffect } from "react";
import { usePlayback } from "../hooks/usePlayback";
import { useSettings } from "../hooks/useSettings";
import LyricsDisplay from "../components/LyricsDisplay";
import MinimalLyrics from "../components/MinimalLyrics";
import ProgressBar from "../components/ProgressBar";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getLyricWindow } from "../lib/lyricsEngine";

const appWindow = getCurrentWindow();

function Overlay() {
  const { playback, lyrics, lyricsStatus, offset, setOffset } = usePlayback();
  const { layoutMode } = useSettings();

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

  const lyricWindow = getLyricWindow(lines, adjustedTime);

  function getTitle() {
    if (!hasVideo) return "♪ Play a YouTube video";
    if (lyricsStatus === "loading") return "⏳ Fetching lyrics...";
    if (lyricsStatus === "not_found") return `♪ ${playback.title ?? ""} — no lyrics`;
    return `${playback.paused ? "⏸" : "♪"} ${playback.title ?? ""}`;
  }

  const isMinimal = layoutMode === "minimal";

  return (
    <div style={containerStyle}>
      <div 
        style={{
          ...cardStyle,
          background: isMinimal ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.72)",
          padding: isMinimal ? "12px 24px" : "18px 32px 14px",
          width: isMinimal ? "700px" : "580px",
        }} 
        onMouseDown={async () => {
          await appWindow.startDragging();
        }}
      >

        {/* Song title - hidden in minimal mode */}
        {!isMinimal && (
          <p 
            style={titleStyle} 
            onMouseDown={async () => {
              await appWindow.startDragging();
            }}
          >
            {getTitle()}
          </p>
        )}

        {/* Lyrics */}
        <div 
          style={{ width: "100%", cursor: "grab" }}
          onMouseDown={async () => {
            await appWindow.startDragging();
          }}
        >
          {isMinimal ? (
            <MinimalLyrics 
              line={lyricWindow.current}
              nextLineTime={lyricWindow.next?.time ?? null}
              currentTime={adjustedTime}
            />
          ) : (
            <LyricsDisplay
              lines={lines}
              currentTime={adjustedTime}
            />
          )}
        </div>

        {/* Progress bar - hidden in minimal mode */}
        {!isMinimal && hasVideo && (
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
  display: "flex", alignItems: "flex-start", justifyContent: "center",
  boxSizing: "border-box", userSelect: "none",
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
  color: "rgba(105, 240, 37, 0.63)",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  letterSpacing: "0.05em", textTransform: "uppercase",
  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
};

export default Overlay;
