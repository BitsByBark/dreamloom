use tauri::path::BaseDirectory;
use tauri::Manager;
use tauri_plugin_fs::FsExt;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let logs_dir = app
                .path()
                .resolve("dreamloom/logs", BaseDirectory::Config)
                .map_err(|error| error.to_string())?;

            std::fs::create_dir_all(&logs_dir).map_err(|error| error.to_string())?;
            app.fs_scope()
                .allow_directory(&logs_dir, true)
                .map_err(|error| error.to_string())?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
