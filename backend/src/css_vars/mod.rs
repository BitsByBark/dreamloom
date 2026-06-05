mod parser;
mod writer;

use std::path::Path;

pub use parser::CssVar;
use writer::VarAction;

fn normalize_name(name: &str) -> Result<String, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("css var name is empty".into());
    }

    let normalized = if trimmed.starts_with("--") {
        trimmed.to_string()
    } else {
        format!("--{trimmed}")
    };

    if normalized.len() <= 2
        || normalized
            .chars()
            .any(|ch| ch.is_whitespace() || matches!(ch, ':' | ';' | '{' | '}'))
    {
        return Err(format!("invalid css var name: {name:?}"));
    }

    Ok(normalized)
}

fn read_optional(path: &Path) -> Result<Option<String>, String> {
    match std::fs::read_to_string(path) {
        Ok(content) => Ok(Some(content)),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(format!("read failed: {error}")),
    }
}

fn write_file(path: &Path, content: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|error| format!("create parent dir failed: {error}"))?;
    }
    std::fs::write(path, content).map_err(|error| format!("write failed: {error}"))
}

fn log_error(command: &str, file_path: &str, message: &str) -> String {
    eprintln!("[css-vars] ERROR {command} file={file_path:?}: {message}");
    message.to_string()
}

#[tauri::command]
pub fn read_css_vars(file_path: String) -> Result<Vec<CssVar>, String> {
    println!("[css-vars] read_css_vars file={file_path:?}");
    if file_path.trim().is_empty() {
        return Err(log_error("read_css_vars", &file_path, "file_path is empty"));
    }

    let path = Path::new(&file_path);
    let Some(content) = read_optional(path).map_err(|msg| log_error("read_css_vars", &file_path, &msg))? else {
        println!("[css-vars] read_css_vars missing file, returning empty list");
        return Ok(Vec::new());
    };

    let vars = parser::parse_vars(&content)
        .map_err(|error| log_error("read_css_vars", &file_path, &error.message))?;
    println!("[css-vars] read_css_vars found {} vars", vars.len());
    Ok(vars)
}

#[tauri::command]
pub fn write_css_var(file_path: String, name: String, value: String) -> Result<Vec<CssVar>, String> {
    println!("[css-vars] write_css_var file={file_path:?} name={name:?} value={value:?}");
    if file_path.trim().is_empty() {
        return Err(log_error("write_css_var", &file_path, "file_path is empty"));
    }

    let normalized = normalize_name(&name).map_err(|msg| log_error("write_css_var", &file_path, &msg))?;
    let path = Path::new(&file_path);
    let content = read_optional(path).map_err(|msg| log_error("write_css_var", &file_path, &msg))?;
    let (next, vars, action) = writer::write_var(content.as_deref(), &normalized, value.trim())
        .map_err(|error| log_error("write_css_var", &file_path, &error.message))?;

    if content.as_deref() != Some(next.as_str()) {
        write_file(path, &next).map_err(|msg| log_error("write_css_var", &file_path, &msg))?;
    }

    println!("[css-vars] write_css_var action={action:?} vars={}", vars.len());
    Ok(vars)
}

#[tauri::command]
pub fn delete_css_var(file_path: String, name: String) -> Result<Vec<CssVar>, String> {
    println!("[css-vars] delete_css_var file={file_path:?} name={name:?}");
    if file_path.trim().is_empty() {
        return Err(log_error("delete_css_var", &file_path, "file_path is empty"));
    }

    let normalized = normalize_name(&name).map_err(|msg| log_error("delete_css_var", &file_path, &msg))?;
    let path = Path::new(&file_path);
    let Some(content) = read_optional(path).map_err(|msg| log_error("delete_css_var", &file_path, &msg))? else {
        println!("[css-vars] delete_css_var missing file, nothing to delete");
        return Ok(Vec::new());
    };

    let (next, vars, action) = writer::delete_var(&content, &normalized)
        .map_err(|error| log_error("delete_css_var", &file_path, &error.message))?;
    if action != VarAction::Noop && next != content {
        write_file(path, &next).map_err(|msg| log_error("delete_css_var", &file_path, &msg))?;
    }

    println!("[css-vars] delete_css_var action={action:?} vars={}", vars.len());
    Ok(vars)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_names() {
        assert_eq!(normalize_name("accent").unwrap(), "--accent");
        assert_eq!(normalize_name("--accent").unwrap(), "--accent");
        assert!(normalize_name("bad name").is_err());
    }
}
