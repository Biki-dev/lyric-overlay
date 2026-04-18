mod ws_server;

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

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
            .inner_size(600.0, 160.0)           
            .position(                          
                (1920.0 / 2.0) - 300.0,        
                1080.0 - 200.0,                 
            )
            .always_on_top(true)                 
            .decorations(false)                 
            .transparent(true)                 
            .skip_taskbar(true)                  
            .resizable(false)                 
            .build()?;

            println!("[App] 🪟 Overlay window created");

          
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