// ─── LyricOverlay Tauri App Entry ──────────────────────────────────────────

mod ws_server; // declare our new module

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle().clone();

            // Spawn the WebSocket server as a background task.
            // tauri::async_runtime::spawn uses tokio under the hood.
            // This returns immediately — the server runs concurrently.
            tauri::async_runtime::spawn(async move {
                ws_server::start(app_handle).await;
            });

            println!("[App] 🎵 Lyric Overlay started");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}