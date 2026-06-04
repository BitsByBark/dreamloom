use std::path::Path;

pub fn detect_package_manager(project_path: &Path) -> &'static str {
    if project_path.join("pnpm-lock.yaml").exists() {
        "pnpm"
    } else {
        "npm"
    }
}

pub fn has_dev_script(project_path: &Path) -> Result<bool, String> {
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
