use std::ops::Range;

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CssVar {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RootBlock {
    pub body: Range<usize>,
    pub close: Range<usize>,
    pub newline: &'static str,
    pub vars: Vec<CssVar>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParseError {
    pub message: String,
}

pub fn detect_newline(content: &str) -> &'static str {
    if content.contains("\r\n") {
        "\r\n"
    } else {
        "\n"
    }
}

pub fn parse_vars(content: &str) -> Result<Vec<CssVar>, ParseError> {
    Ok(locate_root(content)?.map(|root| root.vars).unwrap_or_default())
}

pub fn locate_root(content: &str) -> Result<Option<RootBlock>, ParseError> {
    let Some(selector_start) = find_root_selector(content) else {
        return Ok(None);
    };

    let open = content[selector_start..]
        .find('{')
        .map(|idx| selector_start + idx)
        .ok_or_else(|| ParseError {
            message: ":root selector has no block".into(),
        })?;

    let close = find_matching_close(content, open).ok_or_else(|| ParseError {
        message: ":root block is not closed".into(),
    })?;

    let body = (open + 1)..close;
    let vars = parse_declarations(&content[body.clone()])?;
    Ok(Some(RootBlock {
        body,
        close: close..(close + 1),
        newline: detect_newline(content),
        vars,
    }))
}

fn find_root_selector(content: &str) -> Option<usize> {
    let bytes = content.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        i = skip_ws_and_comments(content, i);
        if i >= bytes.len() {
            return None;
        }

        let selector_start = i;
        while i < bytes.len() && bytes[i] != b'{' && bytes[i] != b'}' {
            i += 1;
        }

        if i < bytes.len() && bytes[i] == b'{' {
            let selector = content[selector_start..i].trim();
            if selector == ":root" {
                return Some(selector_start);
            }
            i = find_matching_close(content, i).map_or(bytes.len(), |close| close + 1);
        } else {
            i += 1;
        }
    }
    None
}

fn find_matching_close(content: &str, open: usize) -> Option<usize> {
    let bytes = content.as_bytes();
    let mut i = open + 1;
    while i < bytes.len() {
        if i + 1 < bytes.len() && bytes[i] == b'/' && bytes[i + 1] == b'*' {
            i += 2;
            while i + 1 < bytes.len() && !(bytes[i] == b'*' && bytes[i + 1] == b'/') {
                i += 1;
            }
            i = (i + 2).min(bytes.len());
            continue;
        }
        if bytes[i] == b'}' {
            return Some(i);
        }
        if bytes[i] == b'{' {
            return None;
        }
        i += 1;
    }
    None
}

fn parse_declarations(input: &str) -> Result<Vec<CssVar>, ParseError> {
    let bytes = input.as_bytes();
    let mut i = 0;
    let mut vars = Vec::new();

    while i < bytes.len() {
        i = skip_ws_and_comments(input, i);
        if i >= bytes.len() {
            break;
        }

        let start = i;
        while i < bytes.len() && bytes[i] != b';' {
            if bytes[i] == b'{' || bytes[i] == b'}' {
                return Err(ParseError {
                    message: "nested block inside :root is not supported".into(),
                });
            }
            i += 1;
        }

        let declaration = input[start..i].trim();
        if i < bytes.len() && bytes[i] == b';' {
            i += 1;
        }
        if declaration.is_empty() {
            continue;
        }

        let colon = declaration.find(':').ok_or_else(|| ParseError {
            message: format!("declaration without ':' in :root: {declaration:?}"),
        })?;
        let name = declaration[..colon].trim();
        let value = declaration[colon + 1..].trim();
        if name.starts_with("--") {
            vars.push(CssVar {
                name: name.to_string(),
                value: value.to_string(),
            });
        }
    }

    Ok(vars)
}

fn skip_ws_and_comments(s: &str, mut i: usize) -> usize {
    let bytes = s.as_bytes();
    loop {
        while i < bytes.len() && bytes[i].is_ascii_whitespace() {
            i += 1;
        }
        if i + 1 < bytes.len() && bytes[i] == b'/' && bytes[i + 1] == b'*' {
            i += 2;
            while i + 1 < bytes.len() && !(bytes[i] == b'*' && bytes[i + 1] == b'/') {
                i += 1;
            }
            i = (i + 2).min(bytes.len());
            continue;
        }
        return i;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_vars_from_root() {
        let vars = parse_vars(":root {\n  --accent: red;\n  color: black;\n  --gap: 8px;\n}").unwrap();
        assert_eq!(
            vars,
            vec![
                CssVar { name: "--accent".into(), value: "red".into() },
                CssVar { name: "--gap".into(), value: "8px".into() },
            ]
        );
    }

    #[test]
    fn no_root_means_empty_vars() {
        assert!(parse_vars(".x { color: red; }").unwrap().is_empty());
    }

    #[test]
    fn errors_on_unclosed_root() {
        assert!(parse_vars(":root { --x: red;").is_err());
    }
}
