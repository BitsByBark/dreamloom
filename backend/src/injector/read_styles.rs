//! Read all DreamLoom-managed rules for a `dl-*` class, grouped by pseudo state.

use std::collections::HashMap;

use serde::Serialize;

use super::parser::{self, BlockSite, Stylesheet};

const PSEUDO_STATES: &[&str] = &["default", "hover", "focus", "active", "visited"];

#[derive(Debug, Clone, Serialize, Default)]
pub struct ElementStylesByState {
    pub default: HashMap<String, String>,
    pub hover: HashMap<String, String>,
    pub focus: HashMap<String, String>,
    pub active: HashMap<String, String>,
    pub visited: HashMap<String, String>,
}

fn empty_by_state() -> ElementStylesByState {
    ElementStylesByState::default()
}

fn normalized_class(dl_class: &str) -> String {
    let trimmed = dl_class.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    if trimmed.starts_with('.') {
        trimmed.to_string()
    } else {
        format!(".{trimmed}")
    }
}

/// Map a rule selector to a pseudo state key if it targets `base` exactly.
fn selector_state(selector: &str, base: &str) -> Option<&'static str> {
    let sel = selector.split(',').next()?.trim();
    if sel == base {
        return Some("default");
    }
    for state in &PSEUDO_STATES[1..] {
        if sel == format!("{base}:{state}") {
            return Some(state);
        }
    }
    None
}

fn merge_rule(target: &mut HashMap<String, String>, declarations: &[(String, String)]) {
    for (property, value) in declarations {
        target.insert(property.clone(), value.clone());
    }
}

fn styles_for_class(sheet: &Stylesheet, dl_class: &str) -> ElementStylesByState {
    let base = normalized_class(dl_class);
    if base.is_empty() {
        return empty_by_state();
    }

    let mut out = empty_by_state();
    for rule in &sheet.rules {
        let Some(state) = selector_state(&rule.selector, &base) else {
            continue;
        };
        let map = match state {
            "default" => &mut out.default,
            "hover" => &mut out.hover,
            "focus" => &mut out.focus,
            "active" => &mut out.active,
            "visited" => &mut out.visited,
            _ => continue,
        };
        merge_rule(map, &rule.declarations);
    }
    out
}

/// Parse the DREAMLOOM region and return rules for `dl_class` grouped by pseudo state.
pub fn read_element_styles_from_file(file_path: &str, dl_class: &str) -> Result<ElementStylesByState, String> {
    if file_path.trim().is_empty() {
        return Err("file_path is empty".into());
    }
    if dl_class.trim().is_empty() {
        return Err("dl_class is empty".into());
    }

    let content = std::fs::read_to_string(file_path)
        .map_err(|e| format!("read failed: {e}"))?;

    let site = parser::locate(&content);
    let BlockSite::Managed { inner, .. } = site else {
        return Ok(empty_by_state());
    };

    let sheet = parser::parse_rules(&content[inner.clone()])
        .map_err(|e| format!("could not parse DREAMLOOM block: {}", e.message))?;

    Ok(styles_for_class(&sheet, dl_class))
}

#[tauri::command]
pub fn read_element_styles(file_path: String, dl_class: String) -> Result<ElementStylesByState, String> {
    read_element_styles_from_file(&file_path, &dl_class)
}

#[cfg(test)]
mod tests {
    use super::*;
    use parser::parse_rules;

    #[test]
    fn groups_default_and_hover() {
        let css = ".dl-a { color: red; font-size: 12px; }\n.dl-a:hover { color: blue; }";
        let sheet = parse_rules(css).unwrap();
        let out = styles_for_class(&sheet, "dl-a");
        assert_eq!(out.default.get("color").map(String::as_str), Some("red"));
        assert_eq!(out.default.get("font-size").map(String::as_str), Some("12px"));
        assert_eq!(out.hover.get("color").map(String::as_str), Some("blue"));
        assert!(out.focus.is_empty());
    }
}
