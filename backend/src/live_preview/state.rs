use std::path::PathBuf;
use std::process::Child;
use std::sync::Mutex;
use std::time::Duration;

use super::port::find_free_port;
use super::process::{kill_child, spawn_dev_server, wait_for_port};
use super::project::has_dev_script;

pub struct DevServer {
    child: Mutex<Option<Child>>,
}

impl Default for DevServer {
    fn default() -> Self {
        Self {
            child: Mutex::new(None),
        }
    }
}

impl DevServer {
    pub fn stop(&self) -> Result<(), String> {
        let mut lock = self.child.lock().map_err(|error| error.to_string())?;
        if let Some(mut child) = lock.take() {
            kill_child(&mut child);
        }
        Ok(())
    }

    pub fn start(&self, project_path: &str) -> Result<u16, String> {
        self.stop()?;

        let path = PathBuf::from(project_path);
        if !path.is_dir() {
            return Err(format!("not a directory: {project_path}"));
        }

        if !has_dev_script(path.as_path())? {
            return Err("package.json has no dev script".to_string());
        }

        let port = find_free_port();
        let child = spawn_dev_server(path.as_path(), port)?;

        *self
            .child
            .lock()
            .map_err(|error| error.to_string())? = Some(child);

        wait_for_port(port, Duration::from_secs(60))?;

        Ok(port)
    }
}

impl Drop for DevServer {
    fn drop(&mut self) {
        let _ = self.stop();
    }
}
