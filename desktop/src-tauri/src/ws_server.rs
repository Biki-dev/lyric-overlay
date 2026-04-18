// ─── LyricOverlay WebSocket Server ─────────────────────────────────────────
// Listens on localhost:9001 for connections from the Chrome extension.
// Parses incoming JSON messages and emits them to the Tauri frontend
// via Tauri's app event system.

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::Emitter; // needed for app_handle.emit()
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::{accept_async, tungstenite::Message};

pub const WS_PORT: u16 = 9001;

// ── Message Types ─────────────────────────────────────────────────────────
// Mirror what the Chrome extension sends (see extension/background.js)

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlaybackEvent {
    #[serde(rename = "type")]
    pub event_type: String,

    #[serde(default)]
    pub video_id: Option<String>,

    #[serde(default)]
    pub title: Option<String>,

    #[serde(default)]
    pub current_time: Option<f64>,

    #[serde(default)]
    pub duration: Option<f64>,

    #[serde(default)]
    pub paused: Option<bool>,

    #[serde(default)]
    pub timestamp: Option<u64>,
}

// ── Server Entry Point ────────────────────────────────────────────────────

/// Starts the WebSocket server. Call this once from lib.rs at app startup.
/// Runs in a detached tokio task — never blocks the main thread.
pub async fn start(app_handle: AppHandle) {
    let addr = format!("127.0.0.1:{}", WS_PORT);

    let listener = match TcpListener::bind(&addr).await {
        Ok(l) => {
            println!("[WsServer] 🚀 Listening on ws://{}", addr);
            l
        }
        Err(e) => {
            // Port already in use — another instance may be running
            eprintln!("[WsServer] ❌ Failed to bind {}: {}", addr, e);
            return;
        }
    };

    // Accept connections in a loop
    // Each connection gets its own async task — fully concurrent
    loop {
        match listener.accept().await {
            Ok((stream, addr)) => {
                println!("[WsServer] ✅ Client connected: {}", addr);
                let handle = app_handle.clone();
                tokio::spawn(handle_connection(stream, handle));
            }
            Err(e) => {
                eprintln!("[WsServer] Accept error: {}", e);
            }
        }
    }
}

// ── Per-Connection Handler ────────────────────────────────────────────────

async fn handle_connection(stream: TcpStream, app_handle: AppHandle) {
    // Upgrade raw TCP stream to WebSocket
    let ws_stream = match accept_async(stream).await {
        Ok(ws) => ws,
        Err(e) => {
            eprintln!("[WsServer] WebSocket handshake failed: {}", e);
            return;
        }
    };

    println!("[WsServer] 🤝 WebSocket handshake complete");

    let (mut ws_sender, mut ws_receiver) = ws_stream.split();

    // Read messages from the extension
    while let Some(msg) = ws_receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                handle_text_message(&text, &mut ws_sender, &app_handle).await;
            }
            Ok(Message::Ping(data)) => {
                // Respond to WebSocket-level pings (distinct from our app-level pings)
                let _ = ws_sender.send(Message::Pong(data)).await;
            }
            Ok(Message::Close(_)) => {
                println!("[WsServer] 👋 Client disconnected cleanly");
                break;
            }
            Err(e) => {
                eprintln!("[WsServer] Message error: {}", e);
                break;
            }
            _ => {} // Binary, Pong, Frame — ignore
        }
    }

    println!("[WsServer] 🔌 Connection closed");
}

// ── Message Parser & Emitter ─────────────────────────────────────────────

async fn handle_text_message(
    text: &str,
    ws_sender: &mut futures_util::stream::SplitSink<
        tokio_tungstenite::WebSocketStream<TcpStream>,
        Message,
    >,
    app_handle: &AppHandle,
) {
    // Parse JSON from the extension
    let event: PlaybackEvent = match serde_json::from_str(text) {
        Ok(e) => e,
        Err(err) => {
            eprintln!("[WsServer] Failed to parse message: {}\n  Raw: {}", err, text);
            return;
        }
    };

    match event.event_type.as_str() {
        // ── Heartbeat ──
        "ping" => {
            let pong = serde_json::json!({ "type": "pong", "timestamp": event.timestamp });
            let _ = ws_sender
                .send(Message::Text(pong.to_string().into()))
                .await;
            return; // Don't emit ping events to the frontend
        }

        // ── Playback events ──
        "play" => {
            println!(
                "[WsServer] ▶ PLAY  | {} | {}",
                event.video_id.as_deref().unwrap_or("?"),
                event.title.as_deref().unwrap_or("Unknown")
            );
        }
        "pause" => {
            println!(
                "[WsServer] ⏸ PAUSE | {} @ {:.1}s",
                event.video_id.as_deref().unwrap_or("?"),
                event.current_time.unwrap_or(0.0)
            );
        }
        "seek" => {
            println!(
                "[WsServer] ⏩ SEEK  | {} → {:.1}s",
                event.video_id.as_deref().unwrap_or("?"),
                event.current_time.unwrap_or(0.0)
            );
        }
        "tick" => {
            // Frequent — only log every ~5 seconds to avoid spam
            // We still emit every tick to the frontend for smooth sync
            let time = event.current_time.unwrap_or(0.0);
            if (time as u64) % 5 == 0 {
                println!(
                    "[WsServer] ⏱ TICK  | {} @ {:.1}s",
                    event.video_id.as_deref().unwrap_or("?"),
                    time
                );
            }
        }
        "videoChanged" => {
            println!(
                "[WsServer] 🔄 CHANGE | {} | {}",
                event.video_id.as_deref().unwrap_or("?"),
                event.title.as_deref().unwrap_or("Unknown")
            );
        }
        "reconnected" => {
            println!("[WsServer] 🔄 Extension reconnected, restoring state");
        }
        other => {
            println!("[WsServer] ❓ Unknown event type: {}", other);
        }
    }

    // ── Emit to Tauri frontend ────────────────────────────────────────────
    // The React frontend will subscribe to "playback-event" in Phase 7.
    // For now this is a no-op on the frontend — but it's already wired.
    if let Err(e) = app_handle.emit("playback-event", &event) {
        eprintln!("[WsServer] Failed to emit event to frontend: {}", e);
    }

    // Send ack back to extension
    let ack = serde_json::json!({ "type": "ack", "receivedType": event.event_type });
    let _ = ws_sender
        .send(Message::Text(ack.to_string().into()))
        .await;
}