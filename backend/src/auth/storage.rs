use keyring::Entry;

const SERVICE: &str = "com.bark.dreamloom";
const TOKEN_USER: &str = "github_oauth_token";

fn entry() -> Result<Entry, String> {
    Entry::new(SERVICE, TOKEN_USER).map_err(|e| format!("keyring entry failed: {e}"))
}

pub fn save_token(token: &str) -> Result<(), String> {
    entry()?.set_password(token).map_err(|e| format!("failed to store token: {e}"))
}

pub fn get_token() -> Result<Option<String>, String> {
    match entry()?.get_password() {
        Ok(token) if !token.is_empty() => Ok(Some(token)),
        Ok(_) => Ok(None),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("failed to read token: {e}")),
    }
}

pub fn delete_token() -> Result<(), String> {
    match entry()?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(format!("failed to delete token: {e}")),
    }
}
