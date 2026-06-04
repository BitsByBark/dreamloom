use std::fs;
use std::path::PathBuf;

use crate::misc::asset_scanner::CATEGORY_FOLDERS;

#[tauri::command]
pub fn create_assets_folder(project_path: String) -> Result<(), String> {
    let root = PathBuf::from(project_path.trim());
    if root.as_os_str().is_empty() {
        return Err("project path is empty".into());
    }
    if !root.is_dir() {
        return Err(format!("not a directory: {}", root.display()));
    }

    let assets_root = root.join("assets");
    fs::create_dir_all(&assets_root).map_err(|error| error.to_string())?;

    for name in CATEGORY_FOLDERS {
        fs::create_dir_all(assets_root.join(name)).map_err(|error| error.to_string())?;
    }

    Ok(())
}
