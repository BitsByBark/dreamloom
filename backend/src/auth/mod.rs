mod config;
mod device_flow;
mod git_status;
mod github_api;
mod storage;

use device_flow::{poll_device_flow, start_device_flow, DeviceFlowPollStatus};
use git_status::repo_git_status;
use github_api::{fetch_profile, fetch_repos};
use serde::Serialize;
use storage::{delete_token, get_token};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GithubProfileDto {
    pub login: String,
    pub avatar_url: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceFlowStartDto {
    pub device_code: String,
    pub user_code: String,
    pub verification_uri: String,
    pub expires_in: u64,
    pub interval: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceFlowPollDto {
    pub status: String,
    pub profile: Option<GithubProfileDto>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GithubSessionDto {
    pub authenticated: bool,
    pub login: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RepoStatusDto {
    pub branch: String,
    pub files_changed: u32,
    pub lines_added: u32,
    pub lines_removed: u32,
    pub github_owner: Option<String>,
    pub github_repo: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GithubRepoDto {
    pub full_name: String,
    pub html_url: String,
    pub private: bool,
}

fn profile_dto(login: String, avatar_url: String) -> GithubProfileDto {
    GithubProfileDto { login, avatar_url }
}

#[tauri::command]
pub async fn github_device_flow_start() -> Result<DeviceFlowStartDto, String> {
    let start = start_device_flow().await?;
    Ok(DeviceFlowStartDto {
        device_code: start.device_code,
        user_code: start.user_code,
        verification_uri: start.verification_uri,
        expires_in: start.expires_in,
        interval: start.interval,
    })
}

#[tauri::command]
pub async fn github_device_flow_poll(device_code: String) -> Result<DeviceFlowPollDto, String> {
    match poll_device_flow(&device_code).await? {
        DeviceFlowPollStatus::Pending => Ok(DeviceFlowPollDto {
            status: "pending".into(),
            profile: None,
            message: None,
        }),
        DeviceFlowPollStatus::SlowDown => Ok(DeviceFlowPollDto {
            status: "slow_down".into(),
            profile: None,
            message: None,
        }),
        DeviceFlowPollStatus::Expired => Ok(DeviceFlowPollDto {
            status: "expired".into(),
            profile: None,
            message: Some("authorization expired".into()),
        }),
        DeviceFlowPollStatus::Authorized(profile) => Ok(DeviceFlowPollDto {
            status: "authorized".into(),
            profile: Some(profile_dto(profile.login, profile.avatar_url)),
            message: None,
        }),
        DeviceFlowPollStatus::Error(message) => Ok(DeviceFlowPollDto {
            status: "error".into(),
            profile: None,
            message: Some(message),
        }),
    }
}

#[tauri::command]
pub async fn github_get_session() -> Result<GithubSessionDto, String> {
    let token = get_token()?;
    let Some(token) = token else {
        return Ok(GithubSessionDto {
            authenticated: false,
            login: None,
            avatar_url: None,
        });
    };

    match fetch_profile(&token).await {
        Ok(profile) => Ok(GithubSessionDto {
            authenticated: true,
            login: Some(profile.login),
            avatar_url: Some(profile.avatar_url),
        }),
        Err(_) => Ok(GithubSessionDto {
            authenticated: true,
            login: None,
            avatar_url: None,
        }),
    }
}

#[tauri::command]
pub async fn github_list_repos() -> Result<Vec<GithubRepoDto>, String> {
    let token = get_token()?.ok_or_else(|| "not authenticated with GitHub".to_string())?;
    let repos = fetch_repos(&token).await?;
    Ok(repos
        .into_iter()
        .map(|repo| GithubRepoDto {
            full_name: repo.full_name,
            html_url: repo.html_url,
            private: repo.private,
        })
        .collect())
}

#[tauri::command]
pub fn github_clear_session() -> Result<(), String> {
    delete_token()
}

#[tauri::command]
pub fn github_get_repo_status(project_path: String) -> Result<RepoStatusDto, String> {
    let status = repo_git_status(&project_path)?;
    Ok(RepoStatusDto {
        branch: status.branch,
        files_changed: status.files_changed,
        lines_added: status.lines_added,
        lines_removed: status.lines_removed,
        github_owner: status.github_owner,
        github_repo: status.github_repo,
    })
}
