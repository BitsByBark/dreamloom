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
