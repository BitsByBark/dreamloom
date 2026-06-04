//! DreamLoom style injector — writes single CSS property deltas into the
//! `/* DREAMLOOM */`-marked region of a `.svelte` file's `<style>` element.
//!
//! See [`parser`] for locating/parsing the region and [`writer`] for applying a
//! delta and serializing it back. Everything outside the managed region (markup,
//! the user's own CSS) is preserved byte-for-byte.

pub mod inject_class;
mod parser;
pub mod read_styles;
mod writer;

use serde::{Deserialize, Serialize};

use parser::{BlockSite, Stylesheet};

/// The change to apply, sent from the frontend (`StyleDelta` in TS). `class` is
/// already normalized without a leading `.`; `state` is `default` or a pseudo
/// (`hover`, `focus`, …); `property` is kebab-case CSS; an empty `value` means
/// "remove this property".
#[derive(Debug, Clone, Deserialize)]
pub struct StyleDelta {
    pub class: String,
    pub state: String,
    pub property: String,
    pub value: String,
}

/// Whether the DreamLoom block already existed or was created this call.
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum BlockStatus {
    Found,
    Created,
}

/// What happened to the target rule.
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RuleStatus {
    /// Rule already existed and was kept.
    Found,
    /// Rule did not exist and was created.
    Created,
    /// Rule was removed (its last property was deleted).
    Removed,
    /// Rule did not exist on a removal — nothing to do.
    Absent,
}

/// What happened to the target property.
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PropertyAction {
    Written,
    Removed,
    Noop,
}

/// Returned to the frontend on success. The frontend currently ignores it; it
/// exists for debugging and future surfacing.
#[derive(Debug, Serialize)]
pub struct InjectOutcome {
    pub block: BlockStatus,
    pub rule: RuleStatus,
    pub action: PropertyAction,
    pub selector: String,
    pub property: String,
}

/// Structured error returned to the frontend with enough context to debug.
#[derive(Debug, Serialize)]
pub struct InjectError {
    pub kind: &'static str,
    pub message: String,
    #[serde(rename = "filePath")]
    pub file_path: String,
    pub context: String,
}

/// Error categories the frontend can branch on.
#[derive(Debug, Clone, Copy)]
enum InjectKind {
    InvalidDelta,
    FileNotFound,
    Permission,
    Io,
    MalformedCss,
    WriteFailed,
}

impl InjectKind {
    fn as_str(self) -> &'static str {
        match self {
            InjectKind::InvalidDelta => "invalid_delta",
            InjectKind::FileNotFound => "file_not_found",
            InjectKind::Permission => "permission",
            InjectKind::Io => "io",
            InjectKind::MalformedCss => "malformed_css",
            InjectKind::WriteFailed => "write_failed",
        }
    }
}

/// Build the CSS selector for a class + state. `default`/empty → `.dl-x`,
/// otherwise `.dl-x:state`. Tolerates a leading `.` on the class.
fn selector_for(class: &str, state: &str) -> String {
    let class = class.trim().trim_start_matches('.');
    let state = state.trim();
    if state.is_empty() || state == "default" {
        format!(".{class}")
    } else {
        format!(".{class}:{state}")
    }
}

/// Log full context and build a structured error — never fail silently.
fn fail(kind: InjectKind, message: impl Into<String>, file_path: &str, delta: &StyleDelta) -> InjectError {
    let message = message.into();
    let context = format!("{delta:?}");
    eprintln!(
        "[injector] ERROR kind={} file={file_path:?} {context} :: {message}",
        kind.as_str()
    );
    InjectError {
        kind: kind.as_str(),
        message,
        file_path: file_path.to_string(),
        context,
    }
}

/// Write a single CSS property delta into the DreamLoom block of `file_path`.
#[tauri::command]
pub fn inject_style(file_path: String, delta: StyleDelta) -> Result<InjectOutcome, InjectError> {
    println!("[injector] inject_style file={file_path:?} delta={delta:?}");

    if file_path.trim().is_empty() {
        return Err(fail(InjectKind::InvalidDelta, "file_path is empty", &file_path, &delta));
    }
    if delta.class.trim().is_empty() {
        return Err(fail(InjectKind::InvalidDelta, "delta.class is empty", &file_path, &delta));
    }
    if delta.property.trim().is_empty() {
        return Err(fail(InjectKind::InvalidDelta, "delta.property is empty", &file_path, &delta));
    }

    let content = match std::fs::read_to_string(&file_path) {
        Ok(content) => content,
        Err(error) => {
            let kind = match error.kind() {
                std::io::ErrorKind::NotFound => InjectKind::FileNotFound,
                std::io::ErrorKind::PermissionDenied => InjectKind::Permission,
                _ => InjectKind::Io,
            };
            return Err(fail(kind, format!("read failed: {error}"), &file_path, &delta));
        }
    };

    let selector = selector_for(&delta.class, &delta.state);
    let property = delta.property.trim();
    let site = parser::locate(&content);

    let block = match &site {
        BlockSite::Managed { .. } => {
            println!("[injector] DREAMLOOM block found");
            BlockStatus::Found
        }
        BlockSite::InsertInStyle { .. } => {
            println!("[injector] no marker in <style>; creating DREAMLOOM block inside it");
            BlockStatus::Created
        }
        BlockSite::AppendFile { .. } => {
            println!("[injector] no <style> element; appending DREAMLOOM block at end of file");
            BlockStatus::Created
        }
    };

    let mut sheet = match &site {
        BlockSite::Managed { inner, .. } => match parser::parse_rules(&content[inner.clone()]) {
            Ok(sheet) => sheet,
            Err(error) => {
                return Err(fail(
                    InjectKind::MalformedCss,
                    format!("could not parse DREAMLOOM block: {}", error.message),
                    &file_path,
                    &delta,
                ));
            }
        },
        _ => Stylesheet::default(),
    };

    let (rule, action) = writer::apply_delta(&mut sheet, &selector, property, &delta.value);
    println!(
        "[injector] selector={selector:?} rule={rule:?} action={action:?} property={property:?} value={:?}",
        delta.value
    );

    let new_content = match &site {
        BlockSite::Managed { inner, indent, close_indent, newline } => {
            Some(writer::render_managed(&content, inner, indent, close_indent, newline, &sheet))
        }
        BlockSite::InsertInStyle { at, indent, newline } => {
            writer::render_insert_in_style(&content, *at, indent, newline, &sheet)
        }
        BlockSite::AppendFile { newline } => writer::render_append_file(&content, newline, &sheet),
    };

    let outcome = InjectOutcome {
        block,
        rule,
        action,
        selector: selector.clone(),
        property: delta.property.clone(),
    };

    let Some(new_content) = new_content else {
        println!("[injector] no-op: nothing to write, leaving {file_path:?} unchanged");
        return Ok(outcome);
    };
    if new_content == content {
        println!("[injector] no change: file content identical, skipping write");
        return Ok(outcome);
    }

    if let Err(error) = std::fs::write(&file_path, &new_content) {
        let kind = match error.kind() {
            std::io::ErrorKind::PermissionDenied => InjectKind::Permission,
            _ => InjectKind::WriteFailed,
        };
        return Err(fail(kind, format!("write failed: {error}"), &file_path, &delta));
    }

    println!("[injector] success: wrote {property:?} to {selector:?} in {file_path:?}");
    Ok(outcome)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_state_has_no_pseudo() {
        assert_eq!(selector_for("dl-a", "default"), ".dl-a");
        assert_eq!(selector_for("dl-a", ""), ".dl-a");
    }

    #[test]
    fn pseudo_state_appended() {
        assert_eq!(selector_for("dl-a", "hover"), ".dl-a:hover");
    }

    #[test]
    fn leading_dot_is_normalized() {
        assert_eq!(selector_for(".dl-a", "focus"), ".dl-a:focus");
    }
}
