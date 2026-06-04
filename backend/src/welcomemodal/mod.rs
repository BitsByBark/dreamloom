/// Startup welcome modal — path checks before opening a saved repo.
#[tauri::command]
pub fn check_path_exists(path: String) -> bool {
    std::path::Path::new(path.trim()).exists()
}
