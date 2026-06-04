use std::net::TcpStream;
use std::path::Path;
use std::process::{Child, Command};
use std::time::{Duration, Instant};

use super::project::detect_package_manager;

pub const PREVIEW_HOST: &str = "127.0.0.1";

pub fn kill_child(child: &mut Child) {
    let _ = child.kill();
    let _ = child.wait();
}

pub fn wait_for_port(port: u16, timeout: Duration) -> Result<(), String> {
    let deadline = Instant::now() + timeout;
    let address = format!("{PREVIEW_HOST}:{port}");

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

pub fn spawn_dev_server(project_path: &Path, port: u16) -> Result<Child, String> {
    let package_manager = detect_package_manager(project_path);
    let port_arg = port.to_string();
    let args = [
        "run",
        "dev",
        "--",
        "--host",
        PREVIEW_HOST,
        "--port",
        port_arg.as_str(),
    ];

    Command::new(package_manager)
        .args(args)
        .current_dir(project_path)
        .env("HOST", PREVIEW_HOST)
        .env("PORT", &port_arg)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map_err(|error| format!("failed to spawn {package_manager} run dev: {error}"))
}
