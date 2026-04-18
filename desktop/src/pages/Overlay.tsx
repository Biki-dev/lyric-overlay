import { usePlayback }  from "../hooks/usePlayback";
import LyricsDisplay    from "../components/LyricsDisplay";
import ProgressBar      from "../components/ProgressBar";

function Overlay() {
  const { playback, lyrics, lyricsState } = usePlayback();

  const lines    = lyrics?.lines ?? [];
  const hasVideo = !!playback.videoId;

  function getTitle() {
    if (!hasVideo)                  return "♪ Play a YouTube video";
    if (lyricsState === "loading")  return "⏳ Fetching lyrics...";
    if (lyricsState === "not_found") return `♪ ${playback.title ?? ""} — no lyrics found`;
    return `${playback.paused ? "⏸" : "♪"} ${playback.title ?? ""}`;
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <p style={titleStyle}>{getTitle()}</p>

        <LyricsDisplay
          lines={lines}
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

export default Overlay;