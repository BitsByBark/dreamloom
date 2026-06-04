mod setup;

use crate::live_preview::{self, DevServer};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(DevServer::default())
        .setup(|app| setup::configure(app).map_err(Into::into))
        .invoke_handler(tauri::generate_handler![
            live_preview::commands::start_dev_server,
            live_preview::commands::stop_dev_server,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
