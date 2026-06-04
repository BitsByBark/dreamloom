use std::fs;
use std::path::{Path, PathBuf};

/// Category dirs under `assets/` — keep in sync with `frontend/lib/assets-folder.ts`.
pub const CATEGORY_FOLDERS: &[&str] = &[
    "images",
    "fonts",
    "video",
    "audio",
    "documents",
    "data",
    "code",
];

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetFile {
    pub name: String,
    pub relative_path: String,
    pub extension: String,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetCategory {
    pub name: String,
    pub files: Vec<AssetFile>,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetScanResult {
    pub has_assets_folder: bool,
    pub categories: Vec<AssetCategory>,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssetUrlResult {
    /// CSS `background-image` value, e.g. `url("/assets/images/logo.png")`.
    pub url: String,
}

fn is_safe_relative_path(relative_path: &str) -> bool {
    let normalized = relative_path.replace('\\', "/");
    !normalized.is_empty()
        && !normalized.starts_with('/')
        && !normalized.split('/').any(|part| part == "..")
}

pub fn resolve_asset_css_url(
    project_root: &Path,
    category: &str,
    relative_path: &str,
) -> Result<String, String> {
    if !CATEGORY_FOLDERS.contains(&category) {
        return Err(format!("unknown asset category: {category}"));
    }
    if !is_safe_relative_path(relative_path) {
        return Err("invalid asset path".into());
    }

    let file_path = project_root
        .join("assets")
        .join(category)
        .join(relative_path);

    if !file_path.is_file() {
        return Err(format!("asset not found: assets/{category}/{relative_path}"));
    }

    let rel = relative_path.replace('\\', "/");
    Ok(format!("url(\"/assets/{category}/{rel}\")"))
}

fn collect_files(base: &Path, root: &Path, out: &mut Vec<AssetFile>) -> Result<(), String> {
    let entries = fs::read_dir(base).map_err(|error| error.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();

        if path.is_dir() {
            collect_files(&path, root, out)?;
            continue;
        }

        let rel = path.strip_prefix(root).map_err(|error| error.to_string())?;
        let ext = path
            .extension()
            .and_then(|x| x.to_str())
            .unwrap_or("")
            .to_lowercase();

        out.push(AssetFile {
            name: entry.file_name().to_string_lossy().to_string(),
            relative_path: rel.to_string_lossy().replace('\\', "/"),
            extension: ext,
        });
    }

    Ok(())
}

pub fn scan(project_root: &Path) -> Result<AssetScanResult, String> {
    let assets_root = project_root.join("assets");
    let has_assets_folder = assets_root.is_dir();

    let mut categories = Vec::new();

    if has_assets_folder {
        for name in CATEGORY_FOLDERS {
            let category_path = assets_root.join(name);
            if !category_path.is_dir() {
                continue;
            }

            let mut files = Vec::new();
            collect_files(&category_path, &category_path, &mut files)?;
            files.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));

            categories.push(AssetCategory {
                name: (*name).to_string(),
                files,
            });
        }
    }

    Ok(AssetScanResult {
        has_assets_folder,
        categories,
    })
}

#[tauri::command]
pub fn scan_assets_folder(project_path: String) -> Result<AssetScanResult, String> {
    let root = PathBuf::from(project_path.trim());
    if root.as_os_str().is_empty() {
        return Err("project path is empty".into());
    }
    if !root.is_dir() {
        return Err(format!("not a directory: {}", root.display()));
    }

    scan(&root)
}

#[tauri::command]
pub fn resolve_asset_url(
    project_path: String,
    category: String,
    relative_path: String,
) -> Result<AssetUrlResult, String> {
    let root = PathBuf::from(project_path.trim());
    if root.as_os_str().is_empty() {
        return Err("project path is empty".into());
    }
    if !root.is_dir() {
        return Err(format!("not a directory: {}", root.display()));
    }

    let url = resolve_asset_css_url(&root, category.trim(), relative_path.trim())?;
    Ok(AssetUrlResult { url })
}
