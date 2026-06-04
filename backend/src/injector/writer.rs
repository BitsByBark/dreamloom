//! Applies a single property delta to a parsed [`Stylesheet`] and serializes the
//! result back into the file. Only the one delta property is ever touched, and
//! only the bytes of the managed region are rewritten — everything outside it
//! (markup, the user's own CSS) is preserved verbatim.

use std::ops::Range;

use super::parser::{Rule, Stylesheet};
use super::{PropertyAction, RuleStatus};

/// Mutate `sheet` to reflect the delta. An empty (whitespace-only) `value`
/// means "remove this property". Returns what happened to the rule and the
/// property for logging / the outcome returned to the frontend.
pub fn apply_delta(
    sheet: &mut Stylesheet,
    selector: &str,
    property: &str,
    value: &str,
) -> (RuleStatus, PropertyAction) {
    let value = value.trim();
    let position = sheet.rules.iter().position(|r| r.selector == selector);

    if value.is_empty() {
        // Removal.
        let Some(idx) = position else {
            return (RuleStatus::Absent, PropertyAction::Noop);
        };
        let rule = &mut sheet.rules[idx];
        let before = rule.declarations.len();
        rule.declarations.retain(|(p, _)| p != property);
        if rule.declarations.len() == before {
            (RuleStatus::Found, PropertyAction::Noop)
        } else if rule.declarations.is_empty() {
            sheet.rules.remove(idx);
            (RuleStatus::Removed, PropertyAction::Removed)
        } else {
            (RuleStatus::Found, PropertyAction::Removed)
        }
    } else {
        // Write.
        match position {
            None => {
                sheet.rules.push(Rule {
                    selector: selector.to_string(),
                    declarations: vec![(property.to_string(), value.to_string())],
                });
                (RuleStatus::Created, PropertyAction::Written)
            }
            Some(idx) => {
                let rule = &mut sheet.rules[idx];
                match rule.declarations.iter_mut().find(|(p, _)| p == property) {
                    Some(decl) => decl.1 = value.to_string(),
                    None => rule.declarations.push((property.to_string(), value.to_string())),
                }
                (RuleStatus::Found, PropertyAction::Written)
            }
        }
    }
}

/// Render rules as CSS. `indent` is one indentation unit; selectors get one
/// unit, declarations two. No trailing newline after the final `}` — callers
/// add the surrounding whitespace.
pub fn serialize(sheet: &Stylesheet, indent: &str, newline: &str) -> String {
    let mut out = String::new();
    for (n, rule) in sheet.rules.iter().enumerate() {
        if n > 0 {
            out.push_str(newline);
        }
        out.push_str(indent);
        out.push_str(&rule.selector);
        out.push_str(" {");
        out.push_str(newline);
        for (property, value) in &rule.declarations {
            out.push_str(indent);
            out.push_str(indent);
            out.push_str(property);
            out.push_str(": ");
            out.push_str(value);
            out.push(';');
            out.push_str(newline);
        }
        out.push_str(indent);
        out.push('}');
    }
    out
}

/// Rewrite the managed region (marker already present). Always produces output
/// since the marker stays even if the region is now empty.
pub fn render_managed(
    content: &str,
    inner: &Range<usize>,
    indent: &str,
    close_indent: &str,
    newline: &str,
    sheet: &Stylesheet,
) -> String {
    let replacement = if sheet.rules.is_empty() {
        format!("{newline}{close_indent}")
    } else {
        let css = serialize(sheet, indent, newline);
        format!("{newline}{css}{newline}{close_indent}")
    };
    let mut out = String::with_capacity(content.len() + replacement.len());
    out.push_str(&content[..inner.start]);
    out.push_str(&replacement);
    out.push_str(&content[inner.end..]);
    out
}

/// Create the marker + rules inside an existing `<style>` (no marker yet).
/// Returns `None` when there's nothing to write, so we never plant an empty
/// marker.
pub fn render_insert_in_style(
    content: &str,
    at: usize,
    indent: &str,
    newline: &str,
    sheet: &Stylesheet,
) -> Option<String> {
    if sheet.rules.is_empty() {
        return None;
    }
    let css = serialize(sheet, indent, newline);
    let block = format!("{newline}{indent}/* DREAMLOOM */{newline}{css}{newline}");
    let mut out = String::with_capacity(content.len() + block.len());
    out.push_str(&content[..at]);
    out.push_str(&block);
    out.push_str(&content[at..]);
    Some(out)
}

/// Append a fresh `<style>` block at end of file (no `<style>` existed).
/// Returns `None` when there's nothing to write.
pub fn render_append_file(content: &str, newline: &str, sheet: &Stylesheet) -> Option<String> {
    if sheet.rules.is_empty() {
        return None;
    }
    let indent = "  ";
    let css = serialize(sheet, indent, newline);
    let mut out = String::from(content);
    if !out.is_empty() && !out.ends_with('\n') {
        out.push_str(newline);
    }
    out.push_str(newline);
    out.push_str("<style>");
    out.push_str(newline);
    out.push_str(indent);
    out.push_str("/* DREAMLOOM */");
    out.push_str(newline);
    out.push_str(&css);
    out.push_str(newline);
    out.push_str("</style>");
    out.push_str(newline);
    Some(out)
}

#[cfg(test)]
mod tests {
    use super::super::parser::{self, BlockSite};
    use super::*;

    /// Drive the same path the command uses: locate → (parse) → apply → render.
    fn inject(content: &str, selector: &str, property: &str, value: &str) -> Option<String> {
        let site = parser::locate(content);
        let mut sheet = match &site {
            BlockSite::Managed { inner, .. } => parser::parse_rules(&content[inner.clone()]).unwrap(),
            _ => Stylesheet::default(),
        };
        apply_delta(&mut sheet, selector, property, value);
        match &site {
            BlockSite::Managed { inner, indent, close_indent, newline } => {
                Some(render_managed(content, inner, indent, close_indent, newline, &sheet))
            }
            BlockSite::InsertInStyle { at, indent, newline } => {
                render_insert_in_style(content, *at, indent, newline, &sheet)
            }
            BlockSite::AppendFile { newline } => render_append_file(content, newline, &sheet),
        }
    }

    #[test]
    fn creates_block_at_eof_when_absent() {
        let file = "<div class=\"dl-a\">hi</div>\n";
        let out = inject(file, ".dl-a", "color", "red").unwrap();
        assert!(out.starts_with(file));
        assert!(out.contains("/* DREAMLOOM */"));
        assert!(out.contains(".dl-a {\n    color: red;\n  }"));
    }

    #[test]
    fn removal_with_no_block_is_noop() {
        let file = "<div class=\"dl-a\">hi</div>\n";
        assert!(inject(file, ".dl-a", "color", "").is_none());
    }

    #[test]
    fn inserts_marker_keeping_hand_written_css() {
        let file = "<style>\n  .header { color: black; }\n</style>\n";
        let out = inject(file, ".dl-a", "color", "red").unwrap();
        assert!(out.contains(".header { color: black; }"));
        assert!(out.contains("/* DREAMLOOM */"));
        assert!(out.contains(".dl-a {"));
        // hand-written CSS comes before the marker
        assert!(out.find(".header").unwrap() < out.find("DREAMLOOM").unwrap());
    }

    #[test]
    fn updates_existing_property_in_place() {
        let file = "<style>\n  /* DREAMLOOM */\n  .dl-a {\n    color: red;\n    font-size: 12px;\n  }\n</style>\n";
        let out = inject(file, ".dl-a", "color", "blue").unwrap();
        assert!(out.contains("color: blue;"));
        assert!(!out.contains("color: red;"));
        assert!(out.contains("font-size: 12px;")); // other props untouched
    }

    #[test]
    fn appends_new_property_to_existing_rule() {
        let file = "<style>\n  /* DREAMLOOM */\n  .dl-a {\n    color: red;\n  }\n</style>\n";
        let out = inject(file, ".dl-a", "font-size", "14px").unwrap();
        assert!(out.contains("color: red;"));
        assert!(out.contains("font-size: 14px;"));
    }

    #[test]
    fn creates_state_rule_with_pseudo_selector() {
        let file = "<style>\n  /* DREAMLOOM */\n  .dl-a {\n    color: red;\n  }\n</style>\n";
        let out = inject(file, ".dl-a:hover", "color", "blue").unwrap();
        assert!(out.contains(".dl-a:hover {"));
    }

    #[test]
    fn removing_last_property_removes_rule() {
        let file = "<style>\n  /* DREAMLOOM */\n  .dl-a {\n    color: red;\n  }\n</style>\n";
        let out = inject(file, ".dl-a", "color", "").unwrap();
        assert!(!out.contains(".dl-a {"));
        assert!(out.contains("/* DREAMLOOM */")); // marker stays
        assert!(out.contains("</style>"));
    }

    #[test]
    fn removing_one_of_many_keeps_rule() {
        let file = "<style>\n  /* DREAMLOOM */\n  .dl-a {\n    color: red;\n    font-size: 12px;\n  }\n</style>\n";
        let out = inject(file, ".dl-a", "color", "").unwrap();
        assert!(!out.contains("color: red;"));
        assert!(out.contains("font-size: 12px;"));
        assert!(out.contains(".dl-a {"));
    }

    #[test]
    fn preserves_markup_and_user_style_outside_block() {
        let file = "<button class=\"dl-a\">x</button>\n\n<style>\n  .header { font-weight: 700; }\n\n  /* DREAMLOOM */\n  .dl-a {\n    color: red;\n  }\n</style>\n";
        let out = inject(file, ".dl-a", "color", "blue").unwrap();
        assert!(out.contains("<button class=\"dl-a\">x</button>"));
        assert!(out.contains(".header { font-weight: 700; }"));
        assert!(out.contains("color: blue;"));
    }

    #[test]
    fn preserves_crlf() {
        let file = "<style>\r\n  /* DREAMLOOM */\r\n  .dl-a {\r\n    color: red;\r\n  }\r\n</style>\r\n";
        let out = inject(file, ".dl-a", "color", "blue").unwrap();
        assert!(out.contains("\r\n"));
        assert!(!out.contains("\n\n  .dl-a")); // no stray LF-only lines introduced
        assert!(out.contains("color: blue;"));
    }
}
