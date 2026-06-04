use tauri_plugin_fs::FsExt;

#[tauri::command]
fn project_root() -> Result<String, String> {
    std::env::current_dir()
        .map_err(|error| error.to_string())?
        .canonicalize()
        .map_err(|error| error.to_string())
        .map(|path| path.to_string_lossy().into_owned())
}

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
            let logs_dir = std::env::current_dir()
                .map_err(|error| error.to_string())?
                .join("runtime")
                .join("logs");

            std::fs::create_dir_all(&logs_dir).map_err(|error| error.to_string())?;
            app.fs_scope()
                .allow_directory(&logs_dir, true)
                .map_err(|error| error.to_string())?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, project_root])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
