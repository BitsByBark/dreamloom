//! Adds a generated `dl-*` class to an element's opening tag in `.svelte`
//! markup, so a freshly-selected element (one with no `dl-*` class yet) can be
//! styled. The element is located by tag name + authored class set + occurrence;
//! this fails closed (no file write) when it can't be uniquely resolved.

use std::collections::BTreeSet;

use serde::{Deserialize, Serialize};

use super::InjectError;

/// How the frontend identifies the element to tag. Mirrors the preview bridge's
/// tree node: `tagName`, the authored classes (the bridge already filters out
/// `svelte-*` scope hashes and `dl-*`), and the element's index among DOM
/// elements sharing that same (tag, class-set) signature.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ElementIdentifier {
    pub tag_name: String,
    #[serde(default)]
    pub classes: Vec<String>,
    #[serde(default)]
    pub occurrence: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InjectClassOutcome {
    pub found: bool,
    pub created_class_attr: bool,
    pub line: usize,
    pub dl_class: String,
}

fn err(kind: &'static str, message: impl Into<String>, file_path: &str, ctx: &str) -> InjectError {
    let message = message.into();
    eprintln!("[dl-inject] ERROR kind={kind} file={file_path:?} {ctx} :: {message}");
    InjectError {
        kind,
        message,
        file_path: file_path.to_string(),
        context: ctx.to_string(),
    }
}

/// Add `dl_class` to the opening tag of the element identified by `identifier`.
#[tauri::command]
pub fn inject_dl_class(
    file_path: String,
    identifier: ElementIdentifier,
    dl_class: String,
) -> Result<InjectClassOutcome, InjectError> {
    let ctx = format!("{identifier:?} dl_class={dl_class:?}");
    println!("[dl-inject] inject_dl_class file={file_path:?} {ctx}");

    if file_path.trim().is_empty() {
        return Err(err("invalid_delta", "file_path is empty", &file_path, &ctx));
    }
    let dl_class = dl_class.trim().to_string();
    if dl_class.is_empty() {
        return Err(err("invalid_delta", "dl_class is empty", &file_path, &ctx));
    }
    let tag = identifier.tag_name.trim().to_ascii_lowercase();
    if tag.is_empty() {
        return Err(err("invalid_delta", "tag_name is empty", &file_path, &ctx));
    }

    let content = std::fs::read_to_string(&file_path).map_err(|e| {
        let kind = match e.kind() {
            std::io::ErrorKind::NotFound => "file_not_found",
            std::io::ErrorKind::PermissionDenied => "permission",
            _ => "io",
        };
        err(kind, format!("read failed: {e}"), &file_path, &ctx)
    })?;

    let want: BTreeSet<String> = identifier
        .classes
        .iter()
        .map(|c| c.trim().to_string())
        .filter(|c| !c.is_empty())
        .collect();

    let tags = find_opening_tags(&content, &tag);
    let matches: Vec<(usize, usize)> = tags
        .iter()
        .copied()
        .filter(|&(s, e)| authored_classes(&content[s..e]) == want)
        .collect();

    println!(
        "[dl-inject] candidates: {} <{tag}> tags, {} match class-set {:?}",
        tags.len(),
        matches.len(),
        want
    );

    // Fail closed: the requested occurrence must resolve to exactly one tag.
    let Some(&(start, end)) = matches.get(identifier.occurrence) else {
        return Err(err(
            "not_found",
            format!(
                "no <{tag}> with classes {:?} at occurrence {} ({} candidate(s))",
                want,
                identifier.occurrence,
                matches.len()
            ),
            &file_path,
            &ctx,
        ));
    };

    let line = content[..start].bytes().filter(|&b| b == b'\n').count() + 1;
    let tag_text = &content[start..end];

    // Idempotent: don't touch an element that already has the class.
    if authored_classes_raw(tag_text).contains(&dl_class) {
        println!("[dl-inject] <{tag}> at line {line} already has {dl_class:?}; no change");
        return Ok(InjectClassOutcome {
            found: true,
            created_class_attr: false,
            line,
            dl_class,
        });
    }

    let (new_tag, created) = add_class_to_tag(tag_text, &dl_class);
    println!("[dl-inject] element found: <{tag}> at line {line}; injecting {dl_class:?} (created class attr: {created})");

    let mut new_content = String::with_capacity(content.len() + dl_class.len() + 12);
    new_content.push_str(&content[..start]);
    new_content.push_str(&new_tag);
    new_content.push_str(&content[end..]);

    std::fs::write(&file_path, &new_content).map_err(|e| {
        let kind = if e.kind() == std::io::ErrorKind::PermissionDenied {
            "permission"
        } else {
            "write_failed"
        };
        err(kind, format!("write failed: {e}"), &file_path, &ctx)
    })?;

    println!("[dl-inject] file written: {file_path:?} (added {dl_class:?} to <{tag}> at line {line})");
    Ok(InjectClassOutcome {
        found: true,
        created_class_attr: created,
        line,
        dl_class,
    })
}

/// Case-insensitive ASCII match of `name` at byte `i` in `bytes`.
fn name_at(bytes: &[u8], i: usize, name: &[u8]) -> bool {
    if i + name.len() > bytes.len() {
        return false;
    }
    for (k, &n) in name.iter().enumerate() {
        if bytes[i + k].to_ascii_lowercase() != n {
            return false;
        }
    }
    true
}

fn is_attr_boundary(b: Option<&u8>) -> bool {
    matches!(b, Some(b' ') | Some(b'\t') | Some(b'\n') | Some(b'\r') | Some(b'<') | Some(b'/'))
}

/// Byte spans of every opening `<tag …>` (skips `</tag>`), quote-aware so a `>`
/// inside an attribute value doesn't end the tag early. `tag` is lowercase ASCII.
fn find_opening_tags(content: &str, tag: &str) -> Vec<(usize, usize)> {
    let bytes = content.as_bytes();
    let tagb = tag.as_bytes();
    let mut out = Vec::new();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'<'
            && name_at(bytes, i + 1, tagb)
            && matches!(
                bytes.get(i + 1 + tagb.len()),
                Some(b' ') | Some(b'\t') | Some(b'\n') | Some(b'\r') | Some(b'>') | Some(b'/')
            )
        {
            if let Some(end) = tag_end(bytes, i) {
                out.push((i, end));
                i = end;
                continue;
            }
        }
        i += 1;
    }
    out
}

/// Byte index just past the `>` that closes the tag starting at `start`.
fn tag_end(bytes: &[u8], start: usize) -> Option<usize> {
    let mut i = start + 1;
    let mut quote: Option<u8> = None;
    while i < bytes.len() {
        let c = bytes[i];
        match quote {
            Some(q) => {
                if c == q {
                    quote = None;
                }
            }
            None => {
                if c == b'"' || c == b'\'' {
                    quote = Some(c);
                } else if c == b'>' {
                    return Some(i + 1);
                }
            }
        }
        i += 1;
    }
    None
}

/// Static `class="…"`/`'…'` value of `tag_text`, or `None` for dynamic/missing.
fn attr_value(tag_text: &str, name: &str) -> Option<String> {
    let b = tag_text.as_bytes();
    let nb = name.as_bytes();
    let mut i = 0;
    while i < b.len() {
        if name_at(b, i, nb) && (i == 0 || is_attr_boundary(b.get(i - 1))) {
            let mut j = i + nb.len();
            while j < b.len() && (b[j] == b' ' || b[j] == b'\t') {
                j += 1;
            }
            if j < b.len() && b[j] == b'=' {
                j += 1;
                while j < b.len() && (b[j] == b' ' || b[j] == b'\t') {
                    j += 1;
                }
                if j < b.len() && (b[j] == b'"' || b[j] == b'\'') {
                    let q = b[j];
                    let vstart = j + 1;
                    let mut k = vstart;
                    while k < b.len() && b[k] != q {
                        k += 1;
                    }
                    return Some(tag_text[vstart..k].to_string());
                }
                return None; // class={…} or unquoted — no static value
            }
        }
        i += 1;
    }
    None
}

/// `class:NAME` directive names on the tag.
fn class_directives(tag_text: &str) -> Vec<String> {
    let b = tag_text.as_bytes();
    let pat = b"class:";
    let mut out = Vec::new();
    let mut i = 0;
    while i < b.len() {
        if name_at(b, i, pat) && (i == 0 || is_attr_boundary(b.get(i - 1))) {
            let s = i + pat.len();
            let mut j = s;
            while j < b.len() && (b[j].is_ascii_alphanumeric() || b[j] == b'-' || b[j] == b'_') {
                j += 1;
            }
            if j > s {
                out.push(tag_text[s..j].to_string());
            }
            i = j;
            continue;
        }
        i += 1;
    }
    out
}

/// All class tokens authored on the tag (static attr + `class:` directives),
/// before filtering. Used for the idempotency check.
fn authored_classes_raw(tag_text: &str) -> BTreeSet<String> {
    let mut set = BTreeSet::new();
    if let Some(value) = attr_value(tag_text, "class") {
        for token in value.split_whitespace() {
            set.insert(token.to_string());
        }
    }
    for name in class_directives(tag_text) {
        set.insert(name);
    }
    set
}

/// Authored classes with `svelte-*` and `dl-*` removed — the signature that
/// matches what the bridge sends.
fn authored_classes(tag_text: &str) -> BTreeSet<String> {
    authored_classes_raw(tag_text)
        .into_iter()
        .filter(|c| !c.starts_with("svelte-") && !c.starts_with("dl-"))
        .collect()
}

/// Add `dl` to the tag's static `class` attribute, or create one. Returns the
/// rewritten tag and whether a new `class` attribute was created.
fn add_class_to_tag(tag_text: &str, dl: &str) -> (String, bool) {
    let b = tag_text.as_bytes();
    let nb = b"class";
    let mut i = 0;
    while i < b.len() {
        if name_at(b, i, nb) && (i == 0 || is_attr_boundary(b.get(i - 1))) {
            let mut j = i + nb.len();
            while j < b.len() && (b[j] == b' ' || b[j] == b'\t') {
                j += 1;
            }
            // Only a static `class="…"`/`'…'` attribute; skip `class:` directives.
            if j < b.len() && b[j] == b'=' {
                j += 1;
                while j < b.len() && (b[j] == b' ' || b[j] == b'\t') {
                    j += 1;
                }
                if j < b.len() && (b[j] == b'"' || b[j] == b'\'') {
                    let q = b[j];
                    let vstart = j + 1;
                    let mut k = vstart;
                    while k < b.len() && b[k] != q {
                        k += 1;
                    }
                    let mut out = String::with_capacity(tag_text.len() + dl.len() + 1);
                    out.push_str(&tag_text[..k]);
                    if k > vstart {
                        out.push(' ');
                    }
                    out.push_str(dl);
                    out.push_str(&tag_text[k..]);
                    return (out, false);
                }
            }
        }
        i += 1;
    }

    // No static class attribute — insert one before the closing `>` / `/>`.
    let gt = tag_text.rfind('>').unwrap_or(tag_text.len());
    let head = tag_text[..gt].trim_end();
    let insert_at = if head.ends_with('/') {
        tag_text[..gt].rfind('/').unwrap()
    } else {
        gt
    };
    let mut out = String::with_capacity(tag_text.len() + dl.len() + 10);
    out.push_str(tag_text[..insert_at].trim_end());
    out.push_str(&format!(" class=\"{dl}\""));
    out.push_str(&tag_text[insert_at..]);
    (out, true)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn set(items: &[&str]) -> BTreeSet<String> {
        items.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn finds_opening_tags_quote_aware() {
        let src = "<div class=\"a > b\"><span></span></div>";
        let tags = find_opening_tags(src, "div");
        assert_eq!(tags.len(), 1);
        let (s, e) = tags[0];
        assert_eq!(&src[s..e], "<div class=\"a > b\">");
    }

    #[test]
    fn ignores_closing_tags_and_other_tags() {
        let src = "<button>x</button><button>y</button>";
        assert_eq!(find_opening_tags(src, "button").len(), 2);
        assert_eq!(find_opening_tags(src, "div").len(), 0);
    }

    #[test]
    fn authored_classes_filters_svelte_and_dl() {
        let got = authored_classes("<div class=\"card svelte-9ab dl-x active\">");
        assert_eq!(got, set(&["card", "active"]));
    }

    #[test]
    fn authored_classes_includes_directives() {
        let got = authored_classes("<div class=\"card\" class:open={o}>");
        assert_eq!(got, set(&["card", "open"]));
    }

    #[test]
    fn appends_to_existing_class() {
        let (out, created) = add_class_to_tag("<div class=\"a b\">", "dl-z9z9");
        assert_eq!(out, "<div class=\"a b dl-z9z9\">");
        assert!(!created);
    }

    #[test]
    fn appends_to_empty_class() {
        let (out, created) = add_class_to_tag("<div class=\"\">", "dl-z9z9");
        assert_eq!(out, "<div class=\"dl-z9z9\">");
        assert!(!created);
    }

    #[test]
    fn creates_class_attr_when_missing() {
        let (out, created) = add_class_to_tag("<div id=\"x\">", "dl-z9z9");
        assert_eq!(out, "<div id=\"x\" class=\"dl-z9z9\">");
        assert!(created);
    }

    #[test]
    fn creates_class_attr_self_closing() {
        let (out, created) = add_class_to_tag("<img src=\"a.png\" />", "dl-z9z9");
        assert_eq!(out, "<img src=\"a.png\" class=\"dl-z9z9\"/>");
        assert!(created);
    }

    #[test]
    fn full_inject_appends_and_writes() {
        let dir = std::env::temp_dir();
        let path = dir.join(format!("dl_inject_test_{}.svelte", std::process::id()));
        std::fs::write(&path, "<main>\n  <button class=\"btn\">Go</button>\n</main>\n").unwrap();

        let outcome = inject_dl_class(
            path.to_string_lossy().into_owned(),
            ElementIdentifier {
                tag_name: "button".into(),
                classes: vec!["btn".into()],
                occurrence: 0,
            },
            "dl-a1b2".into(),
        )
        .unwrap();

        assert!(outcome.found);
        assert_eq!(outcome.line, 2);
        let written = std::fs::read_to_string(&path).unwrap();
        assert!(written.contains("class=\"btn dl-a1b2\""));
        std::fs::remove_file(&path).ok();
    }

    #[test]
    fn occurrence_disambiguates() {
        let dir = std::env::temp_dir();
        let path = dir.join(format!("dl_inject_occ_{}.svelte", std::process::id()));
        std::fs::write(&path, "<button>a</button>\n<button>b</button>\n").unwrap();

        inject_dl_class(
            path.to_string_lossy().into_owned(),
            ElementIdentifier { tag_name: "button".into(), classes: vec![], occurrence: 1 },
            "dl-second".into(),
        )
        .unwrap();

        let written = std::fs::read_to_string(&path).unwrap();
        assert_eq!(written, "<button>a</button>\n<button class=\"dl-second\">b</button>\n");
        std::fs::remove_file(&path).ok();
    }

    #[test]
    fn fails_closed_when_not_found() {
        let dir = std::env::temp_dir();
        let path = dir.join(format!("dl_inject_nf_{}.svelte", std::process::id()));
        std::fs::write(&path, "<div></div>\n").unwrap();

        let before = std::fs::read_to_string(&path).unwrap();
        let result = inject_dl_class(
            path.to_string_lossy().into_owned(),
            ElementIdentifier { tag_name: "span".into(), classes: vec![], occurrence: 0 },
            "dl-x".into(),
        );
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().kind, "not_found");
        assert_eq!(std::fs::read_to_string(&path).unwrap(), before); // no write
        std::fs::remove_file(&path).ok();
    }
}
