
const WS_URL = "ws://localhost:9001";
const RECONNECT_DELAY_MS = 3000;
const HEARTBEAT_INTERVAL_MS = 20000; // keep service worker alive

let ws = null;
let reconnectTimer = null;
let heartbeatTimer = null;
let isConnected = false;

let currentState = {
  videoId: null,
  title: null,
  currentTime: 0,
  paused: true,
};

function connect() {
  // Don't stack connections
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  console.log("[LyricOverlay] 🔌 Connecting to", WS_URL);

  try {
    ws = new WebSocket(WS_URL);
  } catch (err) {
    console.warn("[LyricOverlay] WebSocket constructor failed:", err);
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    console.log("[LyricOverlay] ✅ WebSocket connected");
    isConnected = true;
    clearTimeout(reconnectTimer);
    startHeartbeat();

    if (currentState.videoId) {
      send({ type: "reconnected", ...currentState });
    }
  };

  ws.onclose = (event) => {
    console.log(`[LyricOverlay] ❌ WebSocket closed (code: ${event.code})`);
    isConnected = false;
    stopHeartbeat();
    scheduleReconnect();
  };

  ws.onerror = (err) => {
    console.warn("[LyricOverlay] WebSocket error:", err.message || err);
  };

  ws.onmessage = (event) => {
    console.log("[LyricOverlay] 📩 Message from server:", event.data);
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  console.log(`[LyricOverlay] ⏳ Reconnecting in ${RECONNECT_DELAY_MS}ms...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, RECONNECT_DELAY_MS);
}

function send(payload) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return;
  }
  ws.send(JSON.stringify(payload));
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    send({ type: "ping", timestamp: Date.now() });
  }, HEARTBEAT_INTERVAL_MS);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // ── Popup state query ──
  if (message.type === "getState") {
    sendResponse({ ...currentState, isConnected });
    return true;
  }

  // ── Playback events from YouTube tab ──
  if (!sender.tab?.url?.includes("youtube.com")) return;

  const { type, videoId, title, currentTime, paused, duration } = message;

  // Update cached state
  currentState = { videoId, title, currentTime, paused, duration };

  if (type === "tick") {
    console.log(`[LyricOverlay] ⏱ ${videoId} @ ${currentTime.toFixed(1)}s | WS: ${isConnected ? "✅" : "❌"}`);
  } else {
    console.log(`[LyricOverlay] 📨 ${type}`, { videoId, title, currentTime });
  }

  // Forward to Tauri over WebSocket
  send(message);

  sendResponse({ ok: true });
  return true;
});

// ── Init ──────────────────────────────────────────────────────────────────
// Start connecting immediately when the service worker starts
connect();