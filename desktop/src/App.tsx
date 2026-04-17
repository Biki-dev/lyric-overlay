import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>🎵 Lyric Overlay</h1>
      <p>Desktop app is running. Waiting for lyrics...</p>
    </div>
  );
}

export default App;
