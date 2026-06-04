//! Git operations for the commit modal — runs `git` via tauri-plugin-shell.

use std::path::Path;

use serde::Serialize;
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitChangedFileDto {
    pub path: String,
    /// modified | added | deleted | untracked | renamed
    pub status: String,
    pub staged: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitStatusDto {
    pub branch: String,
    pub remote_url: Option<String>,
    pub owner: Option<String>,
    pub repo: Option<String>,
    pub files: Vec<GitChangedFileDto>,
}

fn is_git_repo(project_path: &Path) -> bool {
    project_path.join(".git").exists()
}

fn parse_github_remote(url: &str) -> Option<(String, String)> {
    let trimmed = url.trim();
    if trimmed.is_empty() {
        return None;
    }

    if let Some(rest) = trimmed.strip_prefix("git@github.com:") {
        let path = rest.trim_end_matches(".git");
        let (owner, repo) = path.split_once('/')?;
        return Some((owner.to_string(), repo.to_string()));
    }

    if let Some(rest) = trimmed
        .strip_prefix("https://github.com/")
        .or_else(|| trimmed.strip_prefix("http://github.com/"))
    {
        let path = rest.trim_end_matches(".git");
        let (owner, repo) = path.split_once('/')?;
        return Some((owner.to_string(), repo.to_string()));
    }

    None
}

async fn run_git(app: &AppHandle, project_path: &Path, args: &[&str]) -> Result<String, String> {
    let args_display: Vec<String> = args.iter().map(|s| (*s).to_string()).collect();
    println!(
        "[git] run in {:?}: git {}",
        project_path,
        args_display.join(" ")
    );

    let output = app
        .shell()
        .command("git")
        .args(args)
        .current_dir(project_path)
        .output()
        .await
        .map_err(|e| {
            let msg = format!("git spawn failed: {e}");
            eprintln!("[git] {msg}");
            msg
        })?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !stderr.trim().is_empty() {
        eprintln!("[git] stderr: {}", stderr.trim());
    }
    if !stdout.trim().is_empty() {
        println!("[git] stdout: {}", stdout.trim());
    }

    if !output.status.success() {
        let code = output.status.code().unwrap_or(-1);
        let msg = if stderr.trim().is_empty() {
            format!("git exited with code {code}")
        } else {
            stderr.trim().to_string()
        };
        eprintln!("[git] failed (code {code}): {msg}");
        return Err(msg);
    }

    Ok(stdout.trim().to_string())
}

fn file_status_from_porcelain(index: char, worktree: char) -> String {
    if index == '?' && worktree == '?' {
        return "untracked".into();
    }
    if index == 'D' || worktree == 'D' {
        return "deleted".into();
    }
    if index == 'A' || worktree == 'A' {
        return "added".into();
    }
    if index == 'R' || worktree == 'R' {
        return "renamed".into();
    }
    "modified".into()
}

fn parse_porcelain_line(line: &str) -> Option<GitChangedFileDto> {
    let line = line.trim_end();
    if line.len() < 4 {
        return None;
    }

    let bytes = line.as_bytes();
    let index = bytes[0] as char;
    let worktree = bytes[1] as char;
    if bytes[2] != b' ' {
        return None;
    }

    let mut path = line[3..].trim().to_string();
    if let Some((_, new)) = path.split_once(" -> ") {
        path = new.trim().to_string();
    }

    if path.is_empty() {
        return None;
    }

    let staged = index != ' ' && index != '?';
    let status = file_status_from_porcelain(index, worktree);

    Some(GitChangedFileDto {
        path,
        status,
        staged,
    })
}

fn ensure_repo(project_path: &str) -> Result<std::path::PathBuf, String> {
    let path = Path::new(project_path);
    if !path.is_dir() {
        return Err("project path is not a directory".into());
    }
    if !is_git_repo(path) {
        return Err("not a git repository".into());
    }
    Ok(path.to_path_buf())
}

#[tauri::command]
pub async fn git_status(app: AppHandle, project_path: String) -> Result<GitStatusDto, String> {
    let path = ensure_repo(&project_path)?;

    let branch = run_git(&app, &path, &["rev-parse", "--abbrev-ref", "HEAD"])
        .await
        .unwrap_or_default();

    let porcelain = run_git(&app, &path, &["status", "--porcelain"]).await?;
    let mut files = Vec::new();
    for line in porcelain.lines() {
        if let Some(file) = parse_porcelain_line(line) {
            files.push(file);
        }
    }

    let remote_url = run_git(&app, &path, &["remote", "get-url", "origin"]).await.ok();
    let (owner, repo) = remote_url
        .as_deref()
        .and_then(parse_github_remote)
        .map(|(o, r)| (Some(o), Some(r)))
        .unwrap_or((None, None));

    Ok(GitStatusDto {
        branch,
        remote_url,
        owner,
        repo,
        files,
    })
}

#[tauri::command]
pub async fn git_stage(app: AppHandle, project_path: String, files: Vec<String>) -> Result<(), String> {
    let path = ensure_repo(&project_path)?;
    if files.is_empty() {
        return Ok(());
    }

    let mut args = vec!["add", "--"];
    for file in &files {
        args.push(file.as_str());
    }
    run_git(&app, &path, &args).await?;
    Ok(())
}

#[tauri::command]
pub async fn git_unstage(app: AppHandle, project_path: String, files: Vec<String>) -> Result<(), String> {
    let path = ensure_repo(&project_path)?;
    if files.is_empty() {
        return Ok(());
    }

    let mut args = vec!["restore", "--staged", "--"];
    for file in &files {
        args.push(file.as_str());
    }
    run_git(&app, &path, &args).await?;
    Ok(())
}

#[tauri::command]
pub async fn git_commit(app: AppHandle, project_path: String, message: String) -> Result<(), String> {
    let path = ensure_repo(&project_path)?;
    let trimmed = message.trim();
    if trimmed.is_empty() {
        return Err("commit message is empty".into());
    }

    let msg_path = path.join(".git").join("DREAMLOOM_COMMIT_MSG");
    std::fs::write(&msg_path, message.as_bytes()).map_err(|e| format!("failed to write commit message: {e}"))?;

    let result = run_git(
        &app,
        &path,
        &["commit", "-F", msg_path.to_str().unwrap_or(".git/DREAMLOOM_COMMIT_MSG")],
    )
    .await;

    let _ = std::fs::remove_file(&msg_path);
    result?;
    Ok(())
}

#[tauri::command]
pub async fn git_push(app: AppHandle, project_path: String) -> Result<(), String> {
    let path = ensure_repo(&project_path)?;
    let branch = run_git(&app, &path, &["rev-parse", "--abbrev-ref", "HEAD"]).await?;
    run_git(&app, &path, &["push", "origin", branch.as_str()]).await?;
    Ok(())
}
