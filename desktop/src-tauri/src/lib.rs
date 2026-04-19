mod ws_server;

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
fn set_overlay_click_through(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("overlay") {
        window.set_ignore_cursor_events(enabled).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_handle = app.handle().clone();

            // This is a second window — separate from the main window.
          
            let _overlay = WebviewWindowBuilder::new(
                app,
                "overlay",                          
                WebviewUrl::App("/overlay".into()),  
            )
            .title("Lyric Overlay")
            .inner_size(600.0, 200.0)           
            .position(                          
                (1920.0 / 2.0) - 300.0,        
                1080.0 - 200.0,                 
            )
            .always_on_top(true)                 
            .decorations(false)                 
            .transparent(true)                 
            .skip_taskbar(true)                  
            .resizable(false)
            .shadow(false)                 
            .build()?;

            println!("[App] 🪟 Overlay window created");

          
            tauri::async_runtime::spawn(async move {
                ws_server::start(app_handle).await;
            });

            println!("[App] 🎵 Lyric Overlay started");
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if window.label() == "main" {
                    if let Some(overlay_window) = window.get_webview_window("overlay") {
                        let _ = overlay_window.close();
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![set_overlay_click_through])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}