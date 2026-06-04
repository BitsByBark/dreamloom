use std::env;
use std::path::PathBuf;
use std::sync::OnceLock;

static ENV_LOADED: OnceLock<()> = OnceLock::new();

fn load_dotenv() {
    ENV_LOADED.get_or_init(|| {
        let path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src/misc/.env");
        let _ = dotenvy::from_path(path);
    });
}

pub struct GithubOAuthConfig {
    pub client_id: String,
    pub client_secret: Option<String>,
}

pub fn github_oauth_config() -> Result<GithubOAuthConfig, String> {
    load_dotenv();

    let client_id = env::var("GITHUB_CLIENT_ID")
        .map_err(|_| "GITHUB_CLIENT_ID is not set (see backend/src/misc/.env.example)".to_string())?;

    if client_id.trim().is_empty() {
        return Err("GITHUB_CLIENT_ID is empty".into());
    }

    let client_secret = env::var("GITHUB_CLIENT_SECRET")
        .ok()
        .filter(|s| !s.trim().is_empty());

    Ok(GithubOAuthConfig {
        client_id,
        client_secret,
    })
}
