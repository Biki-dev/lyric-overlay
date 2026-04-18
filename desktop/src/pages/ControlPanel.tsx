function ControlPanel() {
  return (
    <div style={{
      padding: "2rem",
      fontFamily: "sans-serif",
      background: "#1a1a1a",
      color: "#fff",
      minHeight: "100vh",
    }}>
      <h2 style={{ margin: "0 0 1rem", fontSize: "18px" }}>
        🎵 Lyric Overlay
      </h2>
      <p style={{ color: "#aaa", fontSize: "14px" }}>
        Control panel — play a YouTube video to see lyrics in the overlay.
      </p>
      <div style={{
        marginTop: "1rem",
        padding: "0.75rem 1rem",
        background: "#2a2a2a",
        borderRadius: "8px",
        fontSize: "13px",
        color: "#888",
      }}>
        Overlay window is running ↗
      </div>
    </div>
  );
}

export default ControlPanel;