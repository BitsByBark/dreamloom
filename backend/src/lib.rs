use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use tauri::path::BaseDirectory;
use tauri::Manager;
use tauri_plugin_fs::FsExt;

struct DevServer {
    child: Mutex<Option<Child>>,
}

fn find_free_port() -> u16 {
    TcpListener::bind("127.0.0.1:0")
        .and_then(|listener| listener.local_addr())
        .map(|addr| addr.port())
        .unwrap_or(5173)
}

fn kill_child(child: &mut Child) {
    let _ = child.kill();
    let _ = child.wait();
}

impl DevServer {
    fn stop(&self) -> Result<(), String> {
        let mut lock = self.child.lock().map_err(|error| error.to_string())?;
        if let Some(mut child) = lock.take() {
            kill_child(&mut child);
        }
        Ok(())
    }
}

impl Drop for DevServer {
    fn drop(&mut self) {
        let _ = self.stop();
    }
}

fn detect_package_manager(project_path: &Path) -> &'static str {
    if project_path.join("pnpm-lock.yaml").exists() {
        "pnpm"
    } else {
        "npm"
    }
}

fn has_dev_script(project_path: &Path) -> Result<bool, String> {
    let package_json = project_path.join("package.json");
    if !package_json.is_file() {
        return Ok(false);
    }

    let content = std::fs::read_to_string(&package_json).map_err(|error| error.to_string())?;
    let json: serde_json::Value =
        serde_json::from_str(&content).map_err(|error| error.to_string())?;

    Ok(json
        .get("scripts")
        .and_then(|scripts| scripts.get("dev"))
        .and_then(|value| value.as_str())
        .is_some())
}

fn wait_for_port(port: u16, timeout: Duration) -> Result<(), String> {
    let deadline = Instant::now() + timeout;
    let address = format!("127.0.0.1:{port}");

    while Instant::now() < deadline {
        if TcpStream::connect(&address).is_ok() {
            return Ok(());
        }

        std::thread::sleep(Duration::from_millis(200));
    }

    Err(format!(
        "dev server did not respond on http://{address} within {}s",
        timeout.as_secs()
    ))
}

fn spawn_dev_server(project_path: &Path, port: u16) -> Result<Child, String> {
    let package_manager = detect_package_manager(project_path);
    let port_arg = port.to_string();
    let host = "127.0.0.1";
    let args = [
        "run",
        "dev",
        "--",
        "--host",
        host,
        "--port",
        port_arg.as_str(),
    ];

    let mut command = Command::new(package_manager);
    command
        .args(args)
        .current_dir(project_path)
        .env("HOST", host)
        .env("PORT", &port_arg)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null());

    command
        .spawn()
        .map_err(|error| format!("failed to spawn {package_manager} run dev: {error}"))
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn start_dev_server(state: tauri::State<DevServer>, project_path: String) -> Result<u16, String> {
    state.stop()?;

    let path = PathBuf::from(&project_path);
    if !path.is_dir() {
        return Err(format!("not a directory: {project_path}"));
    }

    if !has_dev_script(&path)? {
        return Err("package.json has no dev script".to_string());
    }

    let port = find_free_port();
    let child = spawn_dev_server(&path, port)?;

    *state
        .child
        .lock()
        .map_err(|error| error.to_string())? = Some(child);

    wait_for_port(port, Duration::from_secs(60))?;

    Ok(port)
}

#[tauri::command]
fn stop_dev_server(state: tauri::State<DevServer>) -> Result<(), String> {
    state.stop()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(DevServer {
            child: Mutex::new(None),
        })
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
        .invoke_handler(tauri::generate_handler![greet, start_dev_server, stop_dev_server])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
