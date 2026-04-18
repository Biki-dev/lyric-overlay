// Standalone WS server — no Tauri window needed
// Run with: cargo run --bin ws_test
// from inside desktop/src-tauri/

use futures_util::{SinkExt, StreamExt};
use tokio::net::TcpListener;
use tokio_tungstenite::{accept_async, tungstenite::Message};

#[tokio::main]
async fn main() {
    let addr = "127.0.0.1:9001";
    let listener = TcpListener::bind(addr).await.unwrap();
    println!("[WsTest] 🚀 Listening on ws://{}", addr);

    loop {
        let (stream, peer) = listener.accept().await.unwrap();
        println!("[WsTest] ✅ Client connected: {}", peer);

        tokio::spawn(async move {
            let ws = match accept_async(stream).await {
                Ok(ws) => ws,
                Err(e) => { eprintln!("Handshake failed: {}", e); return; }
            };

            let (mut tx, mut rx) = ws.split();

            while let Some(Ok(msg)) = rx.next().await {
                match msg {
                    Message::Text(text) => {
                        println!("[WsTest] 📨 {}", text);
                        let ack = format!(r#"{{"type":"ack"}}"#);
                        let _ = tx.send(Message::Text(ack.into())).await;
                    }
                    Message::Close(_) => {
                        println!("[WsTest] 👋 Disconnected"); break;
                    }
                    _ => {}
                }
            }
        });
    }
}