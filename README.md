# 🎵 Lyric Overlay: The Ultimate Desktop Companion

Lyric Overlay is a two-part system designed to bring beautiful, synchronized lyrics directly to your desktop while you enjoy music on YouTube.

<img src="banner.jpg">


## 🚀 How it Works

The system consists of two simple parts working together:
1.  **The Browser Extension**: Sits in your browser and "listens" to the music you play on YouTube.
2.  **The Desktop App**: A beautiful, floating window that displays the lyrics on your screen.

---

## 📥 Installation & Setup

### 1. The Desktop App
1. download the exe file

### 2. Install the Browser Extension
To add the listener to your browser:
1. Open Chrome/Edge and go to `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the `extension` folder from this project.

---

## 🏗️ Core Architecture

A lightweight, event-driven system connects your browser to your desktop with minimal latency.

### 🔄 Data Flow

```mermaid
flowchart TD
    subgraph B["🌐 Browser Layer (YouTube Tab)"]
        EXT["Chrome Extension\n• Detects playback\n• Extracts metadata"]
    end

    subgraph R["🦀 Desktop Backend (Tauri / Rust)"]
        WS["WebSocket Server (:9001)\n• Receives JSON state"]
        EVT["Tauri Event System\n• Dispatches events"]
    end

    subgraph F["⚛️ Desktop UI (React)"]
        HOOK["usePlayback Hook\n• Subscribes to events"]
        STORE["Lyrics Store\n• Fetch + cache LRC"]
        UI["Overlay Window\n• Renders synced lyrics"]
    end

    EXT -->|"Playback State (JSON)"| WS
    WS -->|"Emit Event"| EVT
    EVT -->|"Playback Update"| HOOK
    HOOK -->|"Request Lyrics"| STORE
    STORE -->|"Return LRC Data"| HOOK
    HOOK -->|"Update UI State"| UI
```

## 💡 How to Use

1.  **Start the Desktop App**.
2.  **Go to YouTube** and play any song.
3.  **Watch the Magic**: The lyrics will automatically appear in the floating panel on your desktop.

---

## ✨ Features You'll Love

- **Fully Draggable**: Don't like where the lyrics are? Just click and hold anywhere on the panel to move it to your favorite spot.
- **Click-Through Transparency**: The space around the lyrics is "invisible" to your mouse, so you can keep working or gaming without the app getting in your way.
- **Glassmorphic Design**: A modern, blurred background that looks stunning on any wallpaper.
- **Custom Sync**: Use your keyboard to perfectly align lyrics if they ever get slightly out of time.

---

*Made with ❤️ for music lovers everywhere.*
