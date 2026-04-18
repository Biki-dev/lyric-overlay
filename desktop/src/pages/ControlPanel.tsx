function ControlPanel() {
  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>🎵 Lyric Overlay</h2>

      <div style={cardStyle}>
        <Row label="Status" value="Running" valueColor="#1db954" />
        <Row label="WebSocket" value="Port 9001" />
        <Row label="Overlay" value="Active ↗" />
      </div>

      <p style={hintStyle}>
        Play a YouTube video with the Chrome extension installed
        to see synced lyrics in the overlay window.
      </p>
    </div>
  );
}

function Row({ label, value, valueColor = "#fff" }: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      fontSize: "13px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <span style={{ color: "#888" }}>{label}</span>
      <span style={{ color: valueColor, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  padding: "1.5rem",
  background: "#111",
  color: "#fff",
  minHeight: "100vh",
  boxSizing: "border-box",
};

const headingStyle: React.CSSProperties = {
  margin: "0 0 1rem",
  fontSize: "16px",
  fontWeight: 600,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const cardStyle: React.CSSProperties = {
  background: "#1a1a1a",
  borderRadius: "10px",
  padding: "4px 14px",
  marginBottom: "1rem",
  border: "1px solid rgba(255,255,255,0.06)",
};

const hintStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#555",
  lineHeight: 1.6,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export default ControlPanel;