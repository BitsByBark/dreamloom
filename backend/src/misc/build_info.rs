use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BuildInfo {
    pub app_version: String,
    pub os_label: String,
    pub arch: String,
    pub target_os: String,
    pub target_family: String,
    pub cpu: Option<String>,
    pub memory: Option<String>,
}

fn linux_pretty_name() -> Option<String> {
    let content = std::fs::read_to_string("/etc/os-release").ok()?;
    for line in content.lines() {
        if let Some(name) = line.strip_prefix("PRETTY_NAME=") {
            return Some(name.trim_matches('"').to_string());
        }
    }
    None
}

fn os_label() -> String {
    #[cfg(target_os = "linux")]
    {
        if let Some(name) = linux_pretty_name() {
            return name;
        }
        return format!("Linux ({})", std::env::consts::ARCH);
    }

    #[cfg(target_os = "macos")]
    {
        return "macOS".to_string();
    }

    #[cfg(target_os = "windows")]
    {
        return "Windows".to_string();
    }

    #[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
    format!("{} ({})", std::env::consts::OS, std::env::consts::FAMILY)
}

#[cfg(target_os = "linux")]
fn linux_cpu_model() -> Option<String> {
    let content = std::fs::read_to_string("/proc/cpuinfo").ok()?;
    for line in content.lines() {
        if let Some(model) = line.strip_prefix("model name") {
            let model = model.trim_start_matches(':').trim();
            if !model.is_empty() {
                return Some(model.to_string());
            }
        }
    }
    None
}

#[cfg(target_os = "linux")]
fn linux_total_memory() -> Option<String> {
    let content = std::fs::read_to_string("/proc/meminfo").ok()?;
    for line in content.lines() {
        if let Some(rest) = line.strip_prefix("MemTotal:") {
            let kb: u64 = rest.trim().trim_end_matches(" kB").parse().ok()?;
            let gib = kb as f64 / 1024.0 / 1024.0;
            return Some(format!("{gib:.1} GB RAM"));
        }
    }
    None
}

#[cfg(target_os = "macos")]
fn mac_cpu_model() -> Option<String> {
    let output = std::process::Command::new("sysctl")
        .args(["-n", "machdep.cpu.brand_string"])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let model = String::from_utf8(output.stdout).ok()?;
    let model = model.trim();
    if model.is_empty() {
        None
    } else {
        Some(model.to_string())
    }
}

#[cfg(target_os = "macos")]
fn mac_total_memory() -> Option<String> {
    let output = std::process::Command::new("sysctl")
        .args(["-n", "hw.memsize"])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let bytes: u64 = String::from_utf8(output.stdout).ok()?.trim().parse().ok()?;
    let gib = bytes as f64 / 1024.0 / 1024.0 / 1024.0;
    Some(format!("{gib:.1} GB RAM"))
}

fn cpu_model() -> Option<String> {
    #[cfg(target_os = "linux")]
    {
        return linux_cpu_model();
    }
    #[cfg(target_os = "macos")]
    {
        return mac_cpu_model();
    }
    #[cfg(not(any(target_os = "linux", target_os = "macos")))]
    None
}

fn total_memory() -> Option<String> {
    #[cfg(target_os = "linux")]
    {
        return linux_total_memory();
    }
    #[cfg(target_os = "macos")]
    {
        return mac_total_memory();
    }
    #[cfg(not(any(target_os = "linux", target_os = "macos")))]
    None
}

#[tauri::command]
pub fn get_build_info(app: tauri::AppHandle) -> BuildInfo {
    BuildInfo {
        app_version: app.package_info().version.to_string(),
        os_label: os_label(),
        arch: std::env::consts::ARCH.to_string(),
        target_os: std::env::consts::OS.to_string(),
        target_family: std::env::consts::FAMILY.to_string(),
        cpu: cpu_model(),
        memory: total_memory(),
    }
}
