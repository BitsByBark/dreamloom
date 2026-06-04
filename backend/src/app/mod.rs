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
            crate::assets::create_assets_folder,
            live_preview::commands::start_dev_server,
            live_preview::commands::stop_dev_server,
            crate::misc::asset_scanner::scan_assets_folder,
            crate::misc::asset_scanner::resolve_asset_url,
            crate::misc::fs::list_directory,
            crate::welcomemodal::check_path_exists,
            crate::auth::github_device_flow_start,
            crate::auth::github_device_flow_poll,
            crate::auth::github_get_session,
            crate::auth::github_clear_session,
            crate::auth::github_get_repo_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
