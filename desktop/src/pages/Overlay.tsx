import { usePlayback }  from "../hooks/usePlayback";
import LyricsDisplay    from "../components/LyricsDisplay";
import ProgressBar      from "../components/ProgressBar";

function Overlay() {
  const { playback, lyrics, lyricsStatus, offset, setOffset } = usePlayback();

  const lines    = lyrics?.lines ?? [];
  const hasVideo = !!playback.videoId;

  // Apply offset to currentTime before passing to lyrics engine
  const adjustedTime = playback.currentTime + offset;

  function getTitle() {
    if (!hasVideo)                      return "♪ Play a YouTube video";
    if (lyricsStatus === "loading")     return "⏳ Fetching lyrics...";
    if (lyricsStatus === "not_found")   return `♪ ${playback.title ?? ""} — no lyrics`;
    return `${playback.paused ? "⏸" : "♪"} ${playback.title ?? ""}`;
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>

        {/* Song title */}
        <p style={titleStyle}>{getTitle()}</p>

        {/* Lyrics */}
        <LyricsDisplay
          lines={lines}
          currentTime={adjustedTime}   // ← offset applied here
        />

        {/* Progress bar */}
        {hasVideo && (
          <ProgressBar
            currentTime={playback.currentTime}
            duration={playback.duration}
          />
        )}

        {/* Sync offset controls — only show when lyrics are loaded */}
        {lyricsStatus === "found" && (
          <div style={syncRowStyle}>
            <button
              style={syncBtnStyle}
              onClick={() => setOffset(o => o - 0.5)}
              title="Shift lyrics 0.5s earlier"
            >
              ◀ 0.5s
            </button>

            <span style={syncLabelStyle}>
              {offset === 0 ? "sync" : `${offset > 0 ? "+" : ""}${offset.toFixed(1)}s`}
            </span>

            <button
              style={syncBtnStyle}
              onClick={() => setOffset(o => o + 0.5)}
              title="Shift lyrics 0.5s later"
            >
              0.5s ▶
            </button>

            {offset !== 0 && (
              <button
                style={{ ...syncBtnStyle, color: "rgba(255,100,100,0.7)" }}
                onClick={() => setOffset(0)}
                title="Reset offset"
              >
                ✕
              </button>
            )}
          </div>
        )}

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
};

const cardStyle: React.CSSProperties = {
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
  gap: "8px", marginTop: "10px",
};

const syncBtnStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "6px", padding: "3px 10px",
  color: "rgba(255,255,255,0.6)", fontSize: "11px",
  cursor: "pointer", fontFamily: "sans-serif",
  userSelect: "none",
};

const syncLabelStyle: React.CSSProperties = {
  fontSize: "11px", color: "rgba(255,255,255,0.35)",
  fontFamily: "monospace", minWidth: "40px", textAlign: "center",
};

export default Overlay;