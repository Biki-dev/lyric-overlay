(function () {
  "use strict";

  let video = null;
  let pollInterval = null;
  let lastVideoId = null;

 
  function getVideoId() {
    // YouTube video IDs live in the `v` query param
    // e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ
    const params = new URLSearchParams(window.location.search);
    return params.get("v");
  }

  function getVideoTitle() {
    // Primary selector — works on standard watch pages
    const el =
      document.querySelector("h1.ytd-video-primary-info-renderer yt-formatted-string") ||
      document.querySelector("h1.style-scope.ytd-video-primary-info-renderer") ||
      document.querySelector("#title h1 yt-formatted-string") ||
      document.querySelector("title"); // last resort: browser tab title

    if (!el) return "Unknown Title";

    // The browser <title> includes " - YouTube" suffix — strip it
    if (el.tagName === "TITLE") {
      return el.textContent.replace(/\s*[-–]\s*YouTube\s*$/, "").trim();
    }

    return el.textContent.trim();
  }

  function buildPayload(eventType) {
    return {
      type: eventType,           // "play" | "pause" | "seek" | "tick" | "videoChanged"
      videoId: getVideoId(),
      title: getVideoTitle(),
      currentTime: video ? video.currentTime : 0,
      duration: video ? video.duration : 0,
      paused: video ? video.paused : true,
      timestamp: Date.now(),
    };
  }

  function sendToBackground(payload) {
   
    if (!payload.videoId) return;

    chrome.runtime.sendMessage(payload).catch(() => {
      // Background worker may not be ready — ignore silently
      // This is expected during initial page load
    });
  }

  function onPlay() {
    console.log("[LyricOverlay] ▶ Play", getVideoId());
    sendToBackground(buildPayload("play"));
    startPolling();
  }

  function onPause() {
    console.log("[LyricOverlay] ⏸ Pause");
    sendToBackground(buildPayload("pause"));
    stopPolling();
  }

  function onSeeked() {
    console.log("[LyricOverlay] ⏩ Seeked to", video?.currentTime?.toFixed(2));
    sendToBackground(buildPayload("seek"));
  }

  function onEnded() {
    console.log("[LyricOverlay] ⏹ Ended");
    sendToBackground(buildPayload("pause"));
    stopPolling();
  }

  function startPolling() {
    if (pollInterval) return; // already running
    pollInterval = setInterval(() => {
      if (!video || video.paused) return;
      sendToBackground(buildPayload("tick"));
    }, 1000);
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }


  function attachToVideo(videoEl) {
    if (video === videoEl) return; // already attached

    // Detach from previous video if switching
    if (video) detachFromVideo();

    video = videoEl;
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("ended", onEnded);

    console.log("[LyricOverlay] ✅ Attached to video element");

    // If the video is already playing when we attach (e.g. page reload mid-video)
    if (!video.paused) {
      onPlay();
    }
  }

  function detachFromVideo() {
    if (!video) return;
    video.removeEventListener("play", onPlay);
    video.removeEventListener("pause", onPause);
    video.removeEventListener("seeked", onSeeked);
    video.removeEventListener("ended", onEnded);
    video = null;
    stopPolling();
  }

  function findAndAttach() {
    const videoEl = document.querySelector("video");
    if (videoEl) {
      attachToVideo(videoEl);
      return true;
    }
    return false;
  }



  function handleNavigation() {
    const newVideoId = getVideoId();

    if (newVideoId && newVideoId !== lastVideoId) {
      console.log("[LyricOverlay] 🔄 Video changed:", newVideoId);
      lastVideoId = newVideoId;
      detachFromVideo();

      // Give YouTube's SPA a moment to render the new video element
      setTimeout(() => {
        findAndAttach();
        sendToBackground(buildPayload("videoChanged"));
      }, 1500);
    }
  }

  // Intercept YouTube's pushState calls
  const _pushState = history.pushState.bind(history);
  history.pushState = function (...args) {
    _pushState(...args);
    handleNavigation();
  };

  window.addEventListener("popstate", handleNavigation);

  const observer = new MutationObserver(() => {
    if (!video && findAndAttach()) {
      // Found it — no need to keep observing the whole document,
      // but keep alive for SPA navigation re-renders
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Try immediately in case the video is already in the DOM
  findAndAttach();
  lastVideoId = getVideoId();

  console.log("[LyricOverlay] 🎬 Content script initialized");
})();