use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractNamedClassOutcome {
    pub class_name: String,
    pub properties_copied: usize,
}

#[derive(Debug, Clone)]
struct CssRule {
    selector: String,
    declarations: Vec<(String, String)>,
}

fn log_error(message: impl Into<String>) -> String {
    let message = message.into();
    eprintln!("[named-classes] ERROR {message}");
    message
}

fn normalize_class_name(input: &str) -> Result<String, String> {
    let name = input.trim().trim_start_matches('.');
    if name.is_empty() || name.starts_with("dl-") || name.chars().any(|ch| ch.is_whitespace() || matches!(ch, '.' | ':' | ';' | '{' | '}')) {
        return Err(log_error(format!("invalid class name: {input:?}")));
    }
    Ok(name.to_string())
}

fn detect_newline(content: &str) -> &'static str {
    if content.contains("\r\n") { "\r\n" } else { "\n" }
}

fn find_style_block(content: &str) -> Result<(usize, usize), String> {
    let open = content.find("<style").ok_or_else(|| log_error("no <style> block in svelte file"))?;
    let open_end = content[open..]
        .find('>')
        .map(|idx| open + idx + 1)
        .ok_or_else(|| log_error("malformed <style> tag"))?;
    let close = content[open_end..]
        .find("</style>")
        .map(|idx| open_end + idx)
        .ok_or_else(|| log_error("no </style> close tag"))?;
    Ok((open_end, close))
}

fn find_dreamloom_region(content: &str) -> Result<(usize, usize), String> {
    let (style_start, style_end) = find_style_block(content)?;
    let style = &content[style_start..style_end];
    let token = style.find("DREAMLOOM").ok_or_else(|| log_error("no DREAMLOOM block found"))?;
    style[..token].rfind("/*").ok_or_else(|| log_error("DREAMLOOM marker is malformed"))?;
    let after_token = token + "DREAMLOOM".len();
    let marker_end = style[after_token..]
        .find("*/")
        .map(|idx| after_token + idx + 2)
        .ok_or_else(|| log_error("DREAMLOOM marker is not closed"))?;
    Ok((style_start + marker_end, style_end))
}

fn parse_rules(input: &str) -> Result<Vec<CssRule>, String> {
    let bytes = input.as_bytes();
    let mut i = 0;
    let mut rules = Vec::new();
    while i < bytes.len() {
        while i < bytes.len() && bytes[i].is_ascii_whitespace() { i += 1; }
        if i + 1 < bytes.len() && bytes[i] == b'/' && bytes[i + 1] == b'*' {
            i += 2;
            while i + 1 < bytes.len() && !(bytes[i] == b'*' && bytes[i + 1] == b'/') { i += 1; }
            i = (i + 2).min(bytes.len());
            continue;
        }
        if i >= bytes.len() { break; }

        let selector_start = i;
        while i < bytes.len() && bytes[i] != b'{' { i += 1; }
        if i >= bytes.len() { break; }
        let selector = input[selector_start..i].trim().to_string();
        i += 1;

        let mut declarations = Vec::new();
        loop {
            while i < bytes.len() && bytes[i].is_ascii_whitespace() { i += 1; }
            if i >= bytes.len() { return Err(log_error(format!("unclosed css rule: {selector}"))); }
            if bytes[i] == b'}' { i += 1; break; }
            let decl_start = i;
            while i < bytes.len() && bytes[i] != b';' && bytes[i] != b'}' { i += 1; }
            let decl = input[decl_start..i].trim();
            if bytes.get(i) == Some(&b';') { i += 1; }
            if decl.is_empty() { continue; }
            let colon = decl.find(':').ok_or_else(|| log_error(format!("css declaration missing colon: {decl}")))?;
            declarations.push((decl[..colon].trim().to_string(), decl[colon + 1..].trim().to_string()));
        }
        if !selector.is_empty() { rules.push(CssRule { selector, declarations }); }
    }
    Ok(rules)
}

fn render_rules(rules: &[CssRule], newline: &str) -> String {
    let mut out = String::new();
    for (idx, rule) in rules.iter().enumerate() {
        if idx > 0 { out.push_str(newline); }
        out.push_str("  ");
        out.push_str(&rule.selector);
        out.push_str(" {");
        out.push_str(newline);
        for (property, value) in &rule.declarations {
            out.push_str("    ");
            out.push_str(property);
            out.push_str(": ");
            out.push_str(value);
            out.push(';');
            out.push_str(newline);
        }
        out.push_str("  }");
        out.push_str(newline);
    }
    out
}

fn merge_css_rules(css: Option<&str>, new_rules: &[CssRule]) -> Result<String, String> {
    let content = css.unwrap_or("");
    let newline = detect_newline(content);
    let mut rules = parse_rules(content)?;
    for new_rule in new_rules {
        match rules.iter_mut().find(|rule| rule.selector == new_rule.selector) {
            Some(rule) => {
                for (property, value) in &new_rule.declarations {
                    match rule.declarations.iter_mut().find(|(existing, _)| existing == property) {
                        Some((_, existing_value)) => *existing_value = value.clone(),
                        None => rule.declarations.push((property.clone(), value.clone())),
                    }
                }
            }
            None => rules.push(new_rule.clone()),
        }
    }
    Ok(render_rules(&rules, newline))
}

fn replace_dl_rules_with_comment(content: &str, dl_class: &str, class_name: &str) -> Result<(String, Vec<CssRule>), String> {
    let (marker_end, region_end) = find_dreamloom_region(content)?;
    let region = &content[marker_end..region_end];
    let rules = parse_rules(region)?;
    let selector = format!(".{dl_class}");
    let mut kept = Vec::new();
    let mut copied = Vec::new();
    for rule in rules {
        if rule.selector == selector || rule.selector.starts_with(&format!("{selector}:")) {
            let suffix = rule.selector.strip_prefix(&selector).unwrap_or("");
            copied.push(CssRule {
                selector: format!(".{class_name}{suffix}"),
                declarations: rule.declarations,
            });
        } else {
            kept.push(rule);
        }
    }
    if copied.is_empty() {
        return Err(log_error(format!("no styles found for .{dl_class}")));
    }

    let newline = detect_newline(content);
    let mut replacement = String::new();
    replacement.push_str(newline);
    replacement.push_str("  /* extracted to .");
    replacement.push_str(class_name);
    replacement.push_str(" */");
    replacement.push_str(newline);
    replacement.push_str(&render_rules(&kept, newline));

    let mut out = String::with_capacity(content.len());
    out.push_str(&content[..marker_end]);
    out.push_str(&replacement);
    out.push_str(&content[region_end..]);
    Ok((out, copied))
}

fn add_class_to_markup(content: &str, dl_class: &str, class_name: &str) -> Result<String, String> {
    let needle = dl_class;
    let pos = content.find(needle).ok_or_else(|| log_error(format!(".{dl_class} not found in markup")))?;
    let tag_start = content[..pos].rfind('<').ok_or_else(|| log_error("class token not inside a tag"))?;
    let tag_end = content[pos..].find('>').map(|idx| pos + idx).ok_or_else(|| log_error("tag is not closed"))?;
    let tag = &content[tag_start..=tag_end];
    let Some(class_pos) = tag.find("class=") else {
        return Err(log_error("target tag has no class attr"));
    };
    let quote_start = class_pos + "class=".len();
    let quote = tag.as_bytes().get(quote_start).copied().ok_or_else(|| log_error("class attr has no quote"))? as char;
    if quote != '"' && quote != '\'' {
        return Err(log_error("class attr quote unsupported"));
    }
    let value_start = quote_start + 1;
    let value_end = tag[value_start..].find(quote).map(|idx| value_start + idx).ok_or_else(|| log_error("class attr is not closed"))?;
    let value = &tag[value_start..value_end];
    if value.split_whitespace().any(|token| token == class_name) {
        return Ok(content.to_string());
    }
    let next_value = format!("{value} {class_name}");
    let abs_start = tag_start + value_start;
    let abs_end = tag_start + value_end;
    let mut out = String::with_capacity(content.len() + class_name.len() + 1);
    out.push_str(&content[..abs_start]);
    out.push_str(&next_value);
    out.push_str(&content[abs_end..]);
    Ok(out)
}

#[tauri::command]
pub fn extract_named_class(
    svelte_path: String,
    css_path: String,
    dl_class: String,
    new_class_name: String,
) -> Result<ExtractNamedClassOutcome, String> {
    println!("[named-classes] extract_named_class svelte={svelte_path:?} css={css_path:?} dl={dl_class:?} new={new_class_name:?}");
    let class_name = normalize_class_name(&new_class_name)?;
    let dl_class = dl_class.trim().trim_start_matches('.').to_string();
    if !dl_class.starts_with("dl-") {
        return Err(log_error(format!("invalid dl class: {dl_class:?}")));
    }

    let svelte = std::fs::read_to_string(&svelte_path).map_err(|error| log_error(format!("read svelte failed: {error}")))?;
    let (without_dl_rules, declarations) = replace_dl_rules_with_comment(&svelte, &dl_class, &class_name)?;
    let next_svelte = add_class_to_markup(&without_dl_rules, &dl_class, &class_name)?;

    let css = match std::fs::read_to_string(&css_path) {
        Ok(content) => Some(content),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => None,
        Err(error) => return Err(log_error(format!("read css failed: {error}"))),
    };
    let next_css = merge_css_rules(css.as_deref(), &declarations)?;

    if let Some(parent) = std::path::Path::new(&css_path).parent() {
        std::fs::create_dir_all(parent).map_err(|error| log_error(format!("create css dir failed: {error}")))?;
    }
    std::fs::write(&svelte_path, next_svelte).map_err(|error| log_error(format!("write svelte failed: {error}")))?;
    std::fs::write(&css_path, next_css).map_err(|error| log_error(format!("write css failed: {error}")))?;

    let properties_copied = declarations.iter().map(|rule| rule.declarations.len()).sum();
    println!("[named-classes] extracted .{dl_class} to .{class_name}, copied {properties_copied} props");
    Ok(ExtractNamedClassOutcome { class_name, properties_copied })
}
