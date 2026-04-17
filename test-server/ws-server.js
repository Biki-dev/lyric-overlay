// Temporary Phase 2 test server.
// Simulates what the Tauri Rust backend will do in Phase 3.
// Run with: node ws-server.js

const { WebSocketServer } = require("ws");

const PORT = 9001;
const wss = new WebSocketServer({ port: PORT });

console.log(`[TestServer] 🚀 WebSocket server listening on ws://localhost:${PORT}`);

wss.on("connection", (ws, req) => {
  console.log("[TestServer] ✅ Client connected from:", req.socket.remoteAddress);

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === "ping") {
        // Respond to heartbeat
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        return;
      }

      // Pretty-print all other events
      console.log(`\n[TestServer] 📨 ${msg.type.toUpperCase()}`);
      console.log(`  Video ID : ${msg.videoId}`);
      console.log(`  Title    : ${msg.title}`);
      console.log(`  Time     : ${msg.currentTime?.toFixed(2)}s`);
      console.log(`  Paused   : ${msg.paused}`);

      // Echo back an ack
      ws.send(JSON.stringify({ type: "ack", receivedType: msg.type }));
    } catch (err) {
      console.error("[TestServer] Failed to parse message:", err);
    }
  });

  ws.on("close", () => {
    console.log("[TestServer] ❌ Client disconnected");
  });

  ws.on("error", (err) => {
    console.error("[TestServer] Socket error:", err.message);
  });
});