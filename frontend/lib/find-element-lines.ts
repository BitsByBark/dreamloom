const MAX_BLOCK_LINES = 500;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lineLooksLikeMarkup(line: string): boolean {
  return /<|class\s*[:=]/.test(line);
}

/** Strict: dlClass used in an actual class attribute / directive. */
function strictMatch(line: string, dlClass: string): boolean {
  const escaped = escapeRegExp(dlClass);
  const patterns = [
    new RegExp(`class\\s*=\\s*["'\`][^"'\`]*\\b${escaped}\\b`),
    new RegExp(`class\\s*=\\s*\\{['"\`][^'"\`]*\\b${escaped}\\b`),
    new RegExp(`class\\s*=\\s*\\{\`[^\`]*\\b${escaped}\\b`),
    new RegExp(`class:${escaped}\\b`),
  ];
  return patterns.some((pattern) => pattern.test(line));
}

/** Loose: bare word on a markup-ish line. Only used when no strict match exists anywhere. */
function looseMatch(line: string, dlClass: string): boolean {
  return new RegExp(`\\b${escapeRegExp(dlClass)}\\b`).test(line) && lineLooksLikeMarkup(line);
}

/**
 * All line indices (0-based) where dlClass appears.
 * Prefers strict class-attribute matches; only falls back to the loose bare-word
 * match when nothing strict was found (so a real class= never gets hijacked to line 0).
 */
export function findClassLineIndices(source: string, dlClass: string): number[] {
  const lines = source.split("\n");
  const strict: number[] = [];
  const loose: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (strictMatch(lines[i], dlClass)) {
      strict.push(i);
    } else if (looseMatch(lines[i], dlClass)) {
      loose.push(i);
    }
  }

  // #region agent log
  fetch('http://127.0.0.1:7790/ingest/b88598fb-327a-4542-ba31-cc39203b33a7',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a9a834'},body:JSON.stringify({sessionId:'a9a834',hypothesisId:'A/B',location:'find-element-lines.ts:findClassLineIndices',message:'class line indices',data:{dlClass,strict,loose,sample:lines[(strict[0]??loose[0])??0]?.slice(0,120)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return strict.length > 0 ? strict : loose;
}

/** Nth occurrence (0-based) of dlClass in source, or null. */
export function findClassLineIndex(
  source: string,
  dlClass: string,
  occurrence = 0,
): number | null {
  const matches = findClassLineIndices(source, dlClass);
  return matches[occurrence] ?? null;
}

/** Walk backward from the class line to the element's opening tag (handles multi-line attrs). */
function findOpeningTag(
  lines: string[],
  classLine: number,
): { line: number; tag: string; selfClosing: boolean } | null {
  const limit = Math.max(0, classLine - MAX_BLOCK_LINES);
  for (let i = classLine; i >= limit; i--) {
    const match = lines[i].match(/<([a-zA-Z][\w-]*)\b/);
    if (match) {
      return { line: i, tag: match[1].toLowerCase(), selfClosing: /\/>/.test(lines[i]) };
    }
  }
  return null;
}

function countTagEvents(line: string, tag: string): { opens: number; closes: number } {
  // allow the opening tag to sit at end-of-line so multi-line tags still count as an open
  const openRe = new RegExp(`<${tag}(?=[\\s>/]|$)`, "gi");
  const closeRe = new RegExp(`</${tag}\\s*>`, "gi");
  const selfCloseRe = new RegExp(`<${tag}\\b[^>]*/\\s*>`, "gi");

  let opens = 0;
  let closes = 0;

  for (const _ of line.matchAll(openRe)) {
    opens++;
  }
  for (const _ of line.matchAll(selfCloseRe)) {
    opens--;
  }
  for (const _ of line.matchAll(closeRe)) {
    closes++;
  }

  return { opens, closes };
}

/** Line range (0-based inclusive) for the nth element block containing dlClass. */
export function findElementLineRange(
  source: string,
  dlClass: string,
  occurrence = 0,
): { from: number; to: number } | null {
  const startLine = findClassLineIndex(source, dlClass, occurrence);
  if (startLine === null) {
    return null;
  }

  const lines = source.split("\n");
  const opening = findOpeningTag(lines, startLine);
  if (!opening) {
    return { from: startLine, to: startLine };
  }

  const openLine = opening.line;

  if (opening.selfClosing) {
    return { from: openLine, to: Math.max(openLine, startLine) };
  }

  const tag = opening.tag;
  let depth = 1;
  const end = Math.min(lines.length - 1, openLine + MAX_BLOCK_LINES);

  for (let i = openLine + 1; i <= end; i++) {
    const { opens, closes } = countTagEvents(lines[i], tag);
    depth += opens - closes;
    if (depth <= 0) {
      return { from: openLine, to: i };
    }
  }

  // never found the close — at least cover down to the class line
  return { from: openLine, to: Math.max(openLine, startLine) };
}

function idMatch(line: string, id: string): boolean {
  const escaped = escapeRegExp(id);
  const patterns = [
    new RegExp(`\\bid\\s*=\\s*["']${escaped}["']`),
    new RegExp(`\\bid\\s*=\\s*\\{['"\`]${escaped}['"\`]\\}`),
    new RegExp(`\\bid\\s*=\\s*\\{\`${escaped}\`\\}`),
  ];
  return patterns.some((pattern) => pattern.test(line));
}

/** Line where id= appears on a markup line, or null. */
export function findIdLineIndex(source: string, id: string): number | null {
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (idMatch(lines[i], id) && lineLooksLikeMarkup(lines[i])) {
      return i;
    }
  }

  return null;
}

/** Line range (0-based inclusive) for the element block with this id. */
export function findIdLineRange(source: string, id: string): { from: number; to: number } | null {
  const startLine = findIdLineIndex(source, id);
  if (startLine === null) {
    return null;
  }

  const lines = source.split("\n");
  const opening = findOpeningTag(lines, startLine);
  if (!opening) {
    return { from: startLine, to: startLine };
  }

  const openLine = opening.line;

  if (opening.selfClosing) {
    return { from: openLine, to: Math.max(openLine, startLine) };
  }

  const tag = opening.tag;
  let depth = 1;
  const end = Math.min(lines.length - 1, openLine + MAX_BLOCK_LINES);

  for (let i = openLine + 1; i <= end; i++) {
    const { opens, closes } = countTagEvents(lines[i], tag);
    depth += opens - closes;
    if (depth <= 0) {
      return { from: openLine, to: i };
    }
  }

  return { from: openLine, to: Math.max(openLine, startLine) };
}
