use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct DirEntry {
    pub name: String,
    #[serde(rename = "isDirectory")]
    pub is_directory: bool,
}

/// List a directory using std::fs instead of GLib-backed Tauri plugin-fs.
/// Individual unreadable entries are silently skipped so one bad file
/// (socket, broken symlink, unstateable node_modules entry, etc.) does
/// not abort the entire listing.
#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<DirEntry>, String> {
    let iter = std::fs::read_dir(&path).map_err(|e| e.to_string())?;
    let mut entries = Vec::new();

    for result in iter {
        let entry = match result {
            Ok(e) => e,
            Err(_) => continue,
        };

        let name = entry.file_name().to_string_lossy().into_owned();
        if name.is_empty() {
            continue;
        }

        let is_directory = entry.file_type().map(|ft| ft.is_dir()).unwrap_or(false);
        entries.push(DirEntry { name, is_directory });
    }

    Ok(entries)
}

/// Read a UTF-8 text file using std::fs instead of the scope-restricted
/// plugin-fs, so component-source resolution can read any opened project file
/// (consistent with `list_directory`).
#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// Write a UTF-8 text file using std::fs instead of the scope-restricted
/// plugin-fs, so any opened project file can be saved regardless of capability
/// scope (consistent with `read_text_file`).
#[tauri::command]
pub fn write_text_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}
