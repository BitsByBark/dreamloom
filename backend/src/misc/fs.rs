use std::path::Path;
use std::process::Command;

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

fn run_git(repo_path: &Path, args: &[&str]) -> Option<String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(repo_path)
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if stdout.is_empty() {
        None
    } else {
        Some(stdout)
    }
}

fn is_github_origin(repo_path: &Path) -> bool {
    let remote = match run_git(repo_path, &["remote", "get-url", "origin"]) {
        Some(url) => url,
        None => return false,
    };

    let trimmed = remote.trim();
    trimmed.contains("github.com")
}

/// Unix timestamp of the newest commit on any `origin/*` remote-tracking branch.
fn last_github_push_unix(repo_path: &Path) -> u64 {
    if !repo_path.join(".git").exists() {
        return 0;
    }

    if !is_github_origin(repo_path) {
        return 0;
    }

    let branches = match run_git(
        repo_path,
        &[
            "for-each-ref",
            "--format=%(refname:short)",
            "refs/remotes/origin",
        ],
    ) {
        Some(b) => b,
        None => return 0,
    };

    let mut newest = 0u64;

    for line in branches.lines() {
        let branch = line.trim();
        if branch.is_empty() || branch == "origin/HEAD" {
            continue;
        }

        let ts_str = match run_git(repo_path, &["log", "-1", "--format=%ct", branch]) {
            Some(t) => t,
            None => continue,
        };

        if let Ok(ts) = ts_str.parse::<u64>() {
            newest = newest.max(ts);
        }
    }

    newest
}

/// Child directories of `parent`, most recent GitHub push first (dot dirs hidden).
#[tauri::command]
pub fn list_child_directories_by_github_push(parent: String) -> Result<Vec<String>, String> {
    let parent_path = Path::new(&parent);
    if !parent_path.is_dir() {
        return Err("parent path is not a directory".into());
    }

    let iter = std::fs::read_dir(parent_path).map_err(|e| e.to_string())?;
    let mut ranked: Vec<(String, u64)> = Vec::new();

    for result in iter {
        let entry = match result {
            Ok(e) => e,
            Err(_) => continue,
        };

        let name = entry.file_name().to_string_lossy().into_owned();
        if name.is_empty() || name.starts_with('.') {
            continue;
        }

        let file_type = match entry.file_type() {
            Ok(ft) => ft,
            Err(_) => continue,
        };

        if !file_type.is_dir() {
            continue;
        }

        let path = entry.path();
        let path_str = path.to_string_lossy().into_owned();
        let pushed_at = last_github_push_unix(&path);
        ranked.push((path_str, pushed_at));
    }

    ranked.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));

    Ok(ranked.into_iter().map(|(path, _)| path).collect())
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
