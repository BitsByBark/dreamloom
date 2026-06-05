mod app;
mod assets;
mod auth;
mod css_vars;
mod git;
mod injector;
mod live_preview;
mod misc;
mod welcomemodal;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    app::run();
}
