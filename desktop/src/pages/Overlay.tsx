import { useState, useEffect } from "react";


let dragStart = { x: 0, y: 0 };

function Overlay() {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition]     = useState({ x: 0, y: 0 });


 
  function onMouseDown(e: React.MouseEvent) {
    setIsDragging(true);
    dragStart = { x: e.clientX - position.x, y: e.clientY - position.y };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }

  function onMouseUp() {
    setIsDragging(false);
  }

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{
        // Full viewport — transparent background
        width: "100vw",
        height: "100vh",
        background: "transparent",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        paddingBottom: "40px",
        boxSizing: "border-box",
        cursor: isDragging ? "grabbing" : "default",
        userSelect: "none",
      }}
    >
      {/* ── Lyrics Card ─────────────────────────────────────────────── */}
      <div style={{
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: "16px",
        padding: "16px 28px",
        maxWidth: "600px",
        textAlign: "center",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        cursor: "grab",
      }}>
        {/* Current lyric line — placeholder for now */}
        <p style={{
          margin: 0,
          fontSize: "22px",
          fontWeight: 600,
          color: "#ffffff",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          lineHeight: 1.4,
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          letterSpacing: "0.01em",
        }}>
          ♪ Waiting for lyrics...
        </p>

        {/* Song title — placeholder */}
        <p style={{
          margin: "8px 0 0",
          fontSize: "13px",
          color: "rgba(255,255,255,0.5)",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}>
          Play a YouTube video
        </p>
      </div>
    </div>
  );
}

export default Overlay;