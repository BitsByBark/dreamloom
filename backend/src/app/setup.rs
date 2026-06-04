use tauri::path::BaseDirectory;
use tauri::{App, Manager};
use tauri_plugin_fs::FsExt;

pub fn configure(app: &mut App) -> Result<(), String> {
    let logs_dir = app
        .path()
        .resolve("dreamloom/logs", BaseDirectory::Config)
        .map_err(|error| error.to_string())?;

    std::fs::create_dir_all(&logs_dir).map_err(|error| error.to_string())?;
    app.fs_scope()
        .allow_directory(&logs_dir, true)
        .map_err(|error| error.to_string())?;

    Ok(())
}
