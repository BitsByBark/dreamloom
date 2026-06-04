use std::path::Path;
use std::process::Command;

pub struct RepoGitStatus {
    pub branch: String,
    pub files_changed: u32,
    pub lines_added: u32,
    pub lines_removed: u32,
    pub github_owner: Option<String>,
    pub github_repo: Option<String>,
}

fn run_git(project_path: &Path, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .args(args)
        .current_dir(project_path)
        .output()
        .map_err(|e| format!("git command failed: {e}"))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn is_git_repo(project_path: &Path) -> bool {
    project_path.join(".git").exists()
}

fn parse_github_remote(url: &str) -> Option<(String, String)> {
    let trimmed = url.trim();
    if trimmed.is_empty() {
        return None;
    }

    // git@github.com:owner/repo.git
    if let Some(rest) = trimmed.strip_prefix("git@github.com:") {
        let path = rest.trim_end_matches(".git");
        let (owner, repo) = path.split_once('/')?;
        return Some((owner.to_string(), repo.to_string()));
    }

    // https://github.com/owner/repo.git
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

fn diff_stats(project_path: &Path) -> Result<(u32, u32, u32), String> {
    let numstat = run_git(project_path, &["diff", "--numstat", "HEAD"])?;
    let mut files_changed = 0u32;
    let mut lines_added = 0u32;
    let mut lines_removed = 0u32;

    for line in numstat.lines() {
        if line.trim().is_empty() {
            continue;
        }
        let mut parts = line.split_whitespace();
        let add = parts.next().unwrap_or("-");
        let del = parts.next().unwrap_or("-");
        if add == "-" && del == "-" {
            continue;
        }
        files_changed += 1;
        if let Ok(a) = add.parse::<u32>() {
            lines_added += a;
        }
        if let Ok(d) = del.parse::<u32>() {
            lines_removed += d;
        }
    }

    Ok((files_changed, lines_added, lines_removed))
}

pub fn repo_git_status(project_path: &str) -> Result<RepoGitStatus, String> {
    let path = Path::new(project_path);
    if !path.is_dir() {
        return Err("project path is not a directory".into());
    }

    if !is_git_repo(path) {
        return Ok(RepoGitStatus {
            branch: String::new(),
            files_changed: 0,
            lines_added: 0,
            lines_removed: 0,
            github_owner: None,
            github_repo: None,
        });
    }

    let branch = run_git(path, &["rev-parse", "--abbrev-ref", "HEAD"]).unwrap_or_default();
    let (files_changed, lines_added, lines_removed) = diff_stats(path).unwrap_or((0, 0, 0));

    let remote = run_git(path, &["remote", "get-url", "origin"]).ok();
    let (github_owner, github_repo) = remote
        .as_deref()
        .and_then(parse_github_remote)
        .map(|(o, r)| (Some(o), Some(r)))
        .unwrap_or((None, None));

    Ok(RepoGitStatus {
        branch,
        files_changed,
        lines_added,
        lines_removed,
        github_owner,
        github_repo,
    })
}
