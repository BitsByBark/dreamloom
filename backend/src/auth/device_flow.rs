use super::config::github_oauth_config;
use super::github_api::{fetch_profile, GithubProfile};
use super::storage::save_token;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct DeviceCodeResponse {
    device_code: String,
    user_code: String,
    verification_uri: String,
    expires_in: u64,
    interval: u64,
}

#[derive(Debug, Deserialize)]
struct TokenResponse {
    access_token: Option<String>,
    error: Option<String>,
    error_description: Option<String>,
}

pub struct DeviceFlowStart {
    pub device_code: String,
    pub user_code: String,
    pub verification_uri: String,
    pub expires_in: u64,
    pub interval: u64,
}

pub enum DeviceFlowPollStatus {
    Pending,
    SlowDown,
    Expired,
    Authorized(GithubProfile),
    Error(String),
}

fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent("dreamloom")
        .build()
        .map_err(|e| format!("http client failed: {e}"))
}

pub async fn start_device_flow() -> Result<DeviceFlowStart, String> {
    let config = github_oauth_config()?;
    let client = http_client()?;

    let form = [
        ("client_id", config.client_id.as_str()),
        ("scope", "read:user repo"),
    ];

    let response = client
        .post("https://github.com/login/device/code")
        .header("Accept", "application/json")
        .form(&form)
        .send()
        .await
        .map_err(|e| format!("device flow start failed: {e}"))?;

    let status = response.status();
    if !status.is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(format!("device flow start returned {status}: {body}"));
    }

    let body: DeviceCodeResponse = response
        .json()
        .await
        .map_err(|e| format!("device flow start parse failed: {e}"))?;

    Ok(DeviceFlowStart {
        device_code: body.device_code,
        user_code: body.user_code,
        verification_uri: body.verification_uri,
        expires_in: body.expires_in,
        interval: body.interval,
    })
}

pub async fn poll_device_flow(device_code: &str) -> Result<DeviceFlowPollStatus, String> {
    let config = github_oauth_config()?;
    let client = http_client()?;

    let mut form = vec![
        ("client_id", config.client_id.as_str()),
        ("device_code", device_code),
        (
            "grant_type",
            "urn:ietf:params:oauth:grant-type:device_code",
        ),
    ];
    if let Some(ref secret) = config.client_secret {
        form.push(("client_secret", secret.as_str()));
    }

    let response = client
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .form(&form)
        .send()
        .await
        .map_err(|e| format!("device flow poll failed: {e}"))?;

    let body: TokenResponse = response
        .json()
        .await
        .map_err(|e| format!("device flow poll parse failed: {e}"))?;

    if let Some(token) = body.access_token.filter(|t| !t.is_empty()) {
        save_token(&token)?;
        let profile = fetch_profile(&token).await?;
        return Ok(DeviceFlowPollStatus::Authorized(profile));
    }

    match body.error.as_deref() {
        Some("authorization_pending") => Ok(DeviceFlowPollStatus::Pending),
        Some("slow_down") => Ok(DeviceFlowPollStatus::SlowDown),
        Some("expired_token") | Some("access_denied") => Ok(DeviceFlowPollStatus::Expired),
        Some(other) => {
            let detail = body
                .error_description
                .unwrap_or_else(|| other.to_string());
            Ok(DeviceFlowPollStatus::Error(detail))
        }
        None => Ok(DeviceFlowPollStatus::Error(
            "unexpected device flow response".into(),
        )),
    }
}
