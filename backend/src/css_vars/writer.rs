use super::parser::{self, CssVar, ParseError};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VarAction {
    Written,
    Removed,
    Noop,
}

pub fn write_var(content: Option<&str>, name: &str, value: &str) -> Result<(String, Vec<CssVar>, VarAction), ParseError> {
    let content = content.unwrap_or("");
    let mut vars = parser::parse_vars(content)?;
    let action = upsert_var(&mut vars, name, value);
    let next = render_with_vars(content, &vars)?;
    Ok((next, vars, action))
}

pub fn delete_var(content: &str, name: &str) -> Result<(String, Vec<CssVar>, VarAction), ParseError> {
    let mut vars = parser::parse_vars(content)?;
    let before = vars.len();
    vars.retain(|var| var.name != name);
    let action = if vars.len() == before { VarAction::Noop } else { VarAction::Removed };
    let next = render_with_vars(content, &vars)?;
    Ok((next, vars, action))
}

fn upsert_var(vars: &mut Vec<CssVar>, name: &str, value: &str) -> VarAction {
    match vars.iter_mut().find(|var| var.name == name) {
        Some(var) => {
            if var.value == value {
                VarAction::Noop
            } else {
                var.value = value.to_string();
                VarAction::Written
            }
        }
        None => {
            vars.push(CssVar { name: name.to_string(), value: value.to_string() });
            VarAction::Written
        }
    }
}

fn render_vars(vars: &[CssVar], newline: &str) -> String {
    if vars.is_empty() {
        return String::new();
    }

    let mut out = String::new();
    out.push_str(newline);
    for var in vars {
        out.push_str("  ");
        out.push_str(&var.name);
        out.push_str(": ");
        out.push_str(&var.value);
        out.push(';');
        out.push_str(newline);
    }
    out
}

fn render_with_vars(content: &str, vars: &[CssVar]) -> Result<String, ParseError> {
    match parser::locate_root(content)? {
        Some(root) => {
            let replacement = if vars.is_empty() {
                String::new()
            } else {
                render_vars(vars, root.newline)
            };
            let mut out = String::with_capacity(content.len() + replacement.len());
            out.push_str(&content[..root.body.start]);
            out.push_str(&replacement);
            out.push_str(&content[root.body.end..]);
            Ok(out)
        }
        None => {
            let newline = parser::detect_newline(content);
            let mut out = String::from(content);
            if !out.is_empty() && !out.ends_with('\n') {
                out.push_str(newline);
            }
            if !out.is_empty() {
                out.push_str(newline);
            }
            out.push_str(":root {");
            out.push_str(&render_vars(vars, newline));
            out.push('}');
            out.push_str(newline);
            Ok(out)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn creates_root_for_missing_file() {
        let (out, vars, action) = write_var(None, "--accent", "red").unwrap();
        assert_eq!(action, VarAction::Written);
        assert_eq!(vars.len(), 1);
        assert_eq!(out, ":root {\n  --accent: red;\n}\n");
    }

    #[test]
    fn updates_one_var_and_preserves_other_vars() {
        let (out, vars, action) = write_var(Some(":root {\n  --a: 1;\n  --b: 2;\n}\n"), "--a", "9").unwrap();
        assert_eq!(action, VarAction::Written);
        assert_eq!(vars[0].value, "9");
        assert!(out.contains("--a: 9;"));
        assert!(out.contains("--b: 2;"));
    }

    #[test]
    fn appends_root_without_touching_other_css() {
        let css = ".card { color: red; }\n";
        let (out, _, _) = write_var(Some(css), "--accent", "blue").unwrap();
        assert!(out.starts_with(css));
        assert!(out.contains(":root {\n  --accent: blue;\n}"));
    }

    #[test]
    fn deletes_var_without_touching_outside_root() {
        let css = ".x { color: red; }\n:root {\n  --a: 1;\n  --b: 2;\n}\n.y { color: blue; }\n";
        let (out, vars, action) = delete_var(css, "--a").unwrap();
        assert_eq!(action, VarAction::Removed);
        assert_eq!(vars.len(), 1);
        assert!(out.contains(".x { color: red; }"));
        assert!(out.contains(".y { color: blue; }"));
        assert!(!out.contains("--a:"));
        assert!(out.contains("--b: 2;"));
    }

    #[test]
    fn preserves_crlf_when_rewriting_root() {
        let css = ":root {\r\n  --a: 1;\r\n}\r\n";
        let (out, _, _) = write_var(Some(css), "--b", "2").unwrap();
        assert!(out.contains("\r\n  --a: 1;\r\n  --b: 2;\r\n"));
    }
}
