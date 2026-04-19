import { usePlayback } from "../hooks/usePlayback";
import { useSettings } from "../hooks/useSettings";

function ControlPanel() {
  const { playback, lyricsStatus } = usePlayback();
  const { layoutMode, changeLayoutMode } = useSettings();
  const connected = !!playback.videoId;

  const lyricsValue =
    lyricsStatus === "loading"   ? "⏳ Fetching..." :
    lyricsStatus === "found"     ? "✅ Found"        :
    lyricsStatus === "not_found" ? "❌ Not found"    : "—";

  const lyricsColor =
    lyricsStatus === "found"     ? "#1db954" :
    lyricsStatus === "not_found" ? "#e74c3c" : "#888";

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>🎵 Lyric Overlay</h2>
      <div style={cardStyle}>
        <Row label="Status"      value={connected ? "Connected" : "Waiting..."} valueColor={connected ? "#1db954" : "#888"} />
        <Row label="Now Playing" value={playback.title ?? "—"} />
        <Row label="Video ID"    value={playback.videoId ?? "—"} />
        <Row label="Lyrics"      value={lyricsValue} valueColor={lyricsColor} />
        <Row label="Playback"    value={!connected ? "—" : playback.paused ? "⏸ Paused" : "▶ Playing"} />
        <Row label="Time"        value={connected ? formatTime(playback.currentTime) : "—"} />
        
        <div style={layoutRowStyle}>
          <span style={labelStyle}>Layout</span>
          <div style={btnGroupStyle}>
            <button 
              onClick={() => changeLayoutMode("classic")}
              style={{ ...btnStyle, background: layoutMode === "classic" ? "#1db954" : "#333" }}
            >
              Classic
            </button>
            <button 
              onClick={() => changeLayoutMode("minimal")}
              style={{ ...btnStyle, background: layoutMode === "minimal" ? "#1db954" : "#333" }}
            >
              Minimal
            </button>
          </div>
        </div>
      </div>
      <p style={hintStyle}>
        {lyricsStatus === "not_found"
          ? "Lyrics not found. Try a more popular song, or add LRC manually to lyricsStore.ts."
          : lyricsStatus === "found"
          ? "Lyrics synced — check the overlay window."
          : "Play a YouTube video to get started."}
      </p>
    </div>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function Row({ label, value, valueColor = "#fff" }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "13px", fontFamily: "sans-serif", gap: "12px" }}>
      <span style={{ color: "#888", flexShrink: 0 }}>{label}</span>
      <span style={{ color: valueColor, fontWeight: 500, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

const containerStyle: React.CSSProperties = { padding: "1.5rem", background: "#111", color: "#fff", minHeight: "100vh", boxSizing: "border-box" };
const headingStyle:   React.CSSProperties = { margin: "0 0 1rem", fontSize: "16px", fontWeight: 600, fontFamily: "sans-serif" };
const cardStyle:      React.CSSProperties = { background: "#1a1a1a", borderRadius: "10px", padding: "4px 14px", marginBottom: "1rem", border: "1px solid rgba(255,255,255,0.06)" };
const hintStyle:      React.CSSProperties = { fontSize: "12px", color: "#555", lineHeight: 1.6, fontFamily: "sans-serif" };

const layoutRowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0 8px" };
const labelStyle:     React.CSSProperties = { color: "#888", fontSize: "13px", fontFamily: "sans-serif" };
const btnGroupStyle:  React.CSSProperties = { display: "flex", gap: "6px" };
const btnStyle:       React.CSSProperties = { 
  border: "none", borderRadius: "6px", padding: "6px 12px", color: "#fff", fontSize: "12px", 
  fontWeight: 600, cursor: "pointer", transition: "background 0.2s ease" 
};

export default ControlPanel;