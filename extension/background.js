
let currentState = {
  videoId: null,
  title: null,
  currentTime: 0,
  paused: true,
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
 
  if (!sender.tab?.url?.includes("youtube.com")) return;

  const { type, videoId, title, currentTime, paused } = message;

  // Update our cached state
  currentState = { videoId, title, currentTime, paused };

  if (type === "tick") {
    console.log(`[LyricOverlay] ⏱ ${videoId} @ ${currentTime.toFixed(1)}s`);
  } else {
    console.log(`[LyricOverlay] 📨 Event: ${type}`, { videoId, title, currentTime });
  }

  sendResponse({ ok: true });
  return true; 
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getState") {
    sendResponse(currentState);
    return true;
  }
});