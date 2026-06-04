use super::config::github_oauth_config;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct GithubUser {
    login: String,
    #[serde(rename = "avatar_url")]
    avatar_url: String,
}

pub struct GithubProfile {
    pub login: String,
    pub avatar_url: String,
}

fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent("dreamloom")
        .build()
        .map_err(|e| format!("http client failed: {e}"))
}

pub async fn fetch_profile(token: &str) -> Result<GithubProfile, String> {
    let _ = github_oauth_config()?;
    let client = http_client()?;

    let response = client
        .get("https://api.github.com/user")
        .header("Authorization", format!("Bearer {token}"))
        .header("Accept", "application/vnd.github+json")
        .send()
        .await
        .map_err(|e| format!("GitHub profile request failed: {e}"))?;

    if !response.status().is_success() {
        return Err(format!(
            "GitHub profile request returned {}",
            response.status()
        ));
    }

    let user: GithubUser = response
        .json()
        .await
        .map_err(|e| format!("GitHub profile parse failed: {e}"))?;

    Ok(GithubProfile {
        login: user.login,
        avatar_url: user.avatar_url,
    })
}
