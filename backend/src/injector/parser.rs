//! Locates the DreamLoom-managed CSS region inside a `.svelte` file and parses
//! its rules into a structured [`Stylesheet`]. The parser only ever looks at the
//! region after the `/* DREAMLOOM */` marker inside the component's single
//! `<style>` element — never the markup and never the user's hand-written CSS.

use std::ops::Range;

/// A single CSS rule: a selector and its declarations, in source order.
/// Declarations are a `Vec` (not a map) so round-tripping preserves order.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Rule {
    pub selector: String,
    pub declarations: Vec<(String, String)>,
}

/// The parsed contents of the DreamLoom-managed region.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Stylesheet {
    pub rules: Vec<Rule>,
}

/// Error from [`parse_rules`] when the managed region contains CSS we can't
/// safely round-trip (unclosed brace, declaration without `:`, etc.).
#[derive(Debug)]
pub struct ParseError {
    pub message: String,
}

/// Where DreamLoom-managed CSS lives — or should be created — in the file.
#[derive(Debug)]
pub enum BlockSite {
    /// The `/* DREAMLOOM */` marker exists. `inner` is the byte range of CSS
    /// between the marker and `</style>`. `indent` is the marker line's leading
    /// whitespace (used to indent rules); `close_indent` is the `</style>`
    /// line's leading whitespace (preserved on rewrite).
    Managed {
        inner: Range<usize>,
        indent: String,
        close_indent: String,
        newline: &'static str,
    },
    /// A `<style>` element exists but has no marker. Insert the marker + rules
    /// at `at` (the byte offset of `</style>`), leaving hand-written CSS above
    /// it untouched.
    InsertInStyle {
        at: usize,
        indent: String,
        newline: &'static str,
    },
    /// No `<style>` element at all; append a fresh block at end of file.
    AppendFile { newline: &'static str },
}

const MARKER_TOKEN: &str = "DREAMLOOM";

/// Detect the file's dominant line ending so writes don't flip CRLF↔LF.
pub fn detect_newline(content: &str) -> &'static str {
    if content.contains("\r\n") {
        "\r\n"
    } else {
        "\n"
    }
}

/// Decide where the managed region is (or should be created).
pub fn locate(content: &str) -> BlockSite {
    let newline = detect_newline(content);

    let Some((open_end, close_start)) = find_style_element(content) else {
        return BlockSite::AppendFile { newline };
    };

    let style_inner = &content[open_end..close_start];
    match find_marker(style_inner) {
        Some(marker) => {
            let marker_start = open_end + marker.start;
            let inner = (open_end + marker.end)..close_start;
            BlockSite::Managed {
                inner,
                indent: line_indent_before(content, marker_start),
                close_indent: line_indent_before(content, close_start),
                newline,
            }
        }
        None => BlockSite::InsertInStyle {
            at: close_start,
            indent: "  ".to_string(),
            newline,
        },
    }
}

/// Parse the simple `selector { prop: value; … }` grammar DreamLoom emits.
/// Tolerates stray comments and whitespace; errors (rather than corrupting the
/// file) on structurally broken CSS.
pub fn parse_rules(input: &str) -> Result<Stylesheet, ParseError> {
    let bytes = input.as_bytes();
    let len = bytes.len();
    let mut i = 0;
    let mut rules = Vec::new();

    while i < len {
        i = skip_ws_and_comments(input, i);
        if i >= len {
            break;
        }

        // Selector runs up to the opening brace.
        let sel_start = i;
        while i < len && bytes[i] != b'{' {
            i += 1;
        }
        if i >= len {
            let trailing = input[sel_start..].trim();
            if trailing.is_empty() {
                break;
            }
            return Err(ParseError {
                message: format!("selector with no block: {trailing:?}"),
            });
        }
        let selector = input[sel_start..i].trim().to_string();
        i += 1; // consume '{'

        let mut declarations = Vec::new();
        loop {
            i = skip_ws_and_comments(input, i);
            if i >= len {
                return Err(ParseError {
                    message: format!("unclosed rule for selector {selector:?}"),
                });
            }
            if bytes[i] == b'}' {
                i += 1;
                break;
            }

            // One declaration runs up to ';' or the closing '}'.
            let decl_start = i;
            while i < len && bytes[i] != b';' && bytes[i] != b'}' {
                i += 1;
            }
            let decl = input[decl_start..i].trim();
            if bytes.get(i) == Some(&b';') {
                i += 1;
            }
            if decl.is_empty() {
                continue;
            }

            let colon = decl.find(':').ok_or_else(|| ParseError {
                message: format!("declaration without ':' in {selector:?}: {decl:?}"),
            })?;
            let property = decl[..colon].trim().to_string();
            let value = decl[colon + 1..].trim().to_string();
            if property.is_empty() {
                return Err(ParseError {
                    message: format!("empty property name in {selector:?}"),
                });
            }
            declarations.push((property, value));
        }

        rules.push(Rule {
            selector,
            declarations,
        });
    }

    Ok(Stylesheet { rules })
}

/// Find the first `<style …> … </style>`; returns `(byte after '>', byte at '<' of </style>)`.
fn find_style_element(content: &str) -> Option<(usize, usize)> {
    let open = content.find("<style")?;
    let gt = content[open..].find('>')?;
    let open_end = open + gt + 1;
    let close = content[open_end..].find("</style>")?;
    Some((open_end, open_end + close))
}

/// Find the `/* … DREAMLOOM … */` marker inside `s`, returning its full byte range.
fn find_marker(s: &str) -> Option<Range<usize>> {
    let token = s.find(MARKER_TOKEN)?;
    let open = s[..token].rfind("/*")?;
    // The token must live inside that comment (no intervening close).
    if s[open..token].contains("*/") {
        return None;
    }
    let after = token + MARKER_TOKEN.len();
    let close = s[after..].find("*/")?;
    Some(open..(after + close + 2))
}

/// Leading whitespace of the line containing `pos` (used for indentation).
fn line_indent_before(content: &str, pos: usize) -> String {
    let bytes = content.as_bytes();
    let mut start = pos;
    while start > 0 && bytes[start - 1] != b'\n' {
        start -= 1;
    }
    let mut end = start;
    while end < pos && (bytes[end] == b' ' || bytes[end] == b'\t') {
        end += 1;
    }
    content[start..end].to_string()
}

/// Skip ASCII whitespace and `/* … */` comments starting at `i`.
fn skip_ws_and_comments(s: &str, mut i: usize) -> usize {
    let b = s.as_bytes();
    loop {
        while i < b.len() && b[i].is_ascii_whitespace() {
            i += 1;
        }
        if i + 1 < b.len() && b[i] == b'/' && b[i + 1] == b'*' {
            i += 2;
            while i + 1 < b.len() && !(b[i] == b'*' && b[i + 1] == b'/') {
                i += 1;
            }
            i = (i + 2).min(b.len());
        } else {
            break;
        }
    }
    i
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_rules_in_order() {
        let css = "  .dl-a { color: red; font-size: 12px; }\n  .dl-a:hover { color: blue; }";
        let sheet = parse_rules(css).unwrap();
        assert_eq!(sheet.rules.len(), 2);
        assert_eq!(sheet.rules[0].selector, ".dl-a");
        assert_eq!(
            sheet.rules[0].declarations,
            vec![
                ("color".to_string(), "red".to_string()),
                ("font-size".to_string(), "12px".to_string()),
            ]
        );
        assert_eq!(sheet.rules[1].selector, ".dl-a:hover");
    }

    #[test]
    fn empty_region_parses_to_no_rules() {
        assert!(parse_rules("   \n  ").unwrap().rules.is_empty());
    }

    #[test]
    fn missing_value_is_allowed_empty() {
        // A declaration may legitimately have an empty value mid-edit; we keep it.
        let sheet = parse_rules(".dl-a { color: ; }").unwrap();
        assert_eq!(sheet.rules[0].declarations, vec![("color".to_string(), String::new())]);
    }

    #[test]
    fn unclosed_brace_errors() {
        assert!(parse_rules(".dl-a { color: red;").is_err());
    }

    #[test]
    fn declaration_without_colon_errors() {
        assert!(parse_rules(".dl-a { color red; }").is_err());
    }

    #[test]
    fn locates_marker_region() {
        let file = "<div class=\"dl-a\"></div>\n\n<style>\n  /* DREAMLOOM */\n  .dl-a { color: red; }\n</style>\n";
        match locate(file) {
            BlockSite::Managed { inner, indent, close_indent, newline } => {
                assert_eq!(newline, "\n");
                assert_eq!(indent, "  ");
                assert_eq!(close_indent, "");
                assert!(file[inner].contains(".dl-a"));
            }
            other => panic!("expected Managed, got {other:?}"),
        }
    }

    #[test]
    fn style_without_marker_is_insert() {
        let file = "<style>\n  .header { color: black; }\n</style>\n";
        assert!(matches!(locate(file), BlockSite::InsertInStyle { .. }));
    }

    #[test]
    fn no_style_is_append() {
        let file = "<div class=\"dl-a\">hi</div>\n";
        assert!(matches!(locate(file), BlockSite::AppendFile { .. }));
    }

    #[test]
    fn detects_crlf() {
        assert_eq!(detect_newline("a\r\nb"), "\r\n");
        assert_eq!(detect_newline("a\nb"), "\n");
    }
}
