//! Project `dreamloom.css` custom properties — stubs until full read/write parser lands.

#[tauri::command]
pub fn read_css_vars(_file_path: String) -> Result<Vec<(String, String)>, String> {
    Err("read_css_vars not implemented yet".into())
}

#[tauri::command]
pub fn write_css_var(_file_path: String, _name: String, _value: String) -> Result<(), String> {
    Err("write_css_var not implemented yet".into())
}

#[tauri::command]
pub fn delete_css_var(_file_path: String, _name: String) -> Result<(), String> {
    Err("delete_css_var not implemented yet".into())
}
