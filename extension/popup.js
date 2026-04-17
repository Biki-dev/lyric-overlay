
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

chrome.runtime.sendMessage({ type: "getState" }, (state) => {
  const dot        = document.getElementById("dot");
  const statusText = document.getElementById("status-text");
  const titleRow   = document.getElementById("title-row");
  const titleText  = document.getElementById("title-text");
  const timeRow    = document.getElementById("time-row");
  const timeText   = document.getElementById("time-text");
  const wsStatus   = document.getElementById("ws-status");

  // ── WebSocket status ──
  if (state?.isConnected) {
    wsStatus.textContent = "🟢 Desktop app connected";
    wsStatus.style.color = "#1db954";
  } else {
    wsStatus.textContent = "🔴 Desktop app not connected";
    wsStatus.style.color = "#e74c3c";
  }

  if (!state || !state.videoId) {
    statusText.textContent = "No video detected";
    return;
  }

  // Status
  const playing = !state.paused;
  dot.className = "status-dot " + (playing ? "playing" : "paused");
  statusText.textContent = playing ? "Playing" : "Paused";

   // Title
  titleRow.style.display = "block";
  titleText.textContent = state.title || state.videoId;

    // Time
  timeRow.style.display = "block";
  timeText.textContent = formatTime(state.currentTime);
});