use tauri::State;

use super::state::DevServer;

#[tauri::command]
pub fn start_dev_server(state: State<DevServer>, project_path: String) -> Result<u16, String> {
    state.start(&project_path)
}

#[tauri::command]
pub fn stop_dev_server(state: State<DevServer>) -> Result<(), String> {
    state.stop()
}
