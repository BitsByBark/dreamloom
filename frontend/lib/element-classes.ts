import { findElementLineRange } from "$lib/find-element-lines";

const MAX_TAG_SCAN_LINES = 80;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Unique dl-* tokens in source (sorted). */
export function listDlClassesInSource(source: string): string[] {
  const found = new Set<string>();
  const re = /\b(dl-[a-zA-Z][\w-]*)\b/g;

  for (const match of source.matchAll(re)) {
    found.add(match[1]);
  }

  return [...found].sort();
}

function findOpeningTagBlock(
  lines: string[],
  fromLine: number,
): { startLine: number; endLine: number; text: string } | null {
  const start = Math.max(0, fromLine - MAX_TAG_SCAN_LINES);

  for (let i = fromLine; i >= start; i--) {
    if (!/<[a-zA-Z]/.test(lines[i])) {
      continue;
    }

    let text = "";
    const end = Math.min(lines.length - 1, i + MAX_TAG_SCAN_LINES);

    for (let j = i; j <= end; j++) {
      text += (j > i ? "\n" : "") + lines[j];
      if (/>/.test(lines[j])) {
        return { startLine: i, endLine: j, text };
      }
    }
  }

  return null;
}

function parseClassTokens(classValue: string): string[] {
  return classValue.split(/\s+/).filter(Boolean);
}

function extractClassAttr(tagText: string): { raw: string; value: string; quote: '"' | "'" } | null {
  const double = tagText.match(/class\s*=\s*"([^"]*)"/);
  if (double) {
    return { raw: double[0], value: double[1], quote: '"' };
  }

  const single = tagText.match(/class\s*=\s*'([^']*)'/);
  if (single) {
    return { raw: single[0], value: single[1], quote: "'" };
  }

  const braced = tagText.match(/class\s*=\s*\{["'`]([^"'`]*)["'`]\}/);
  if (braced) {
    return { raw: braced[0], value: braced[1], quote: '"' };
  }

  return null;
}

/** Class list on the element block for a bridge line range. */
export function getElementClassList(
  source: string,
  range: { from: number; to: number },
): string[] {
  const lines = source.split("\n");
  const block = findOpeningTagBlock(lines, range.from);
  if (!block) {
    return [];
  }

  const attr = extractClassAttr(block.text);
  if (!attr) {
    return [];
  }

  return parseClassTokens(attr.value);
}

const DL_CLASS_RE = /^dl-[a-zA-Z][\w-]*$/;

/** Normalize user input to a valid dl-* token, or null. */
export function normalizeDlClass(input: string): string | null {
  let trimmed = input.trim().replace(/^\./, "");
  if (!trimmed || /\s/.test(trimmed)) {
    return null;
  }

  if (!trimmed.startsWith("dl-")) {
    trimmed = `dl-${trimmed}`;
  }

  if (!DL_CLASS_RE.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function normalizeUserClass(input: string): string | null {
  const trimmed = input.trim().replace(/^\./, "");
  if (!trimmed || /\s/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function patchClassOnTag(
  tagText: string,
  mutate: (classes: string[]) => string[],
): { text: string; changed: boolean } | null {
  const attr = extractClassAttr(tagText);
  const quote = attr?.quote ?? '"';

  if (attr) {
    const next = mutate(parseClassTokens(attr.value));
    const replacement = `class=${quote}${next.join(" ")}${quote}`;
    const text = tagText.replace(attr.raw, replacement);
    return { text, changed: text !== tagText };
  }

  const next = mutate([]);
  if (next.length === 0) {
    return null;
  }

  const insert = ` class=${quote}${next.join(" ")}${quote}`;
  const text = tagText.replace(/(\/?>)\s*$/, `${insert}$1`);
  return { text, changed: true };
}

function replaceOpeningTagInSource(
  source: string,
  range: { from: number; to: number },
  mutate: (classes: string[]) => string[],
): string | null {
  const lines = source.split("\n");
  const block = findOpeningTagBlock(lines, range.from);
  if (!block) {
    return null;
  }

  const patched = patchClassOnTag(block.text, mutate);
  if (!patched?.changed) {
    return null;
  }

  const newLines = [...lines];
  const replacementLines = patched.text.split("\n");
  newLines.splice(block.startLine, block.endLine - block.startLine + 1, ...replacementLines);
  return newLines.join("\n");
}

export function addClassToElement(
  source: string,
  range: { from: number; to: number },
  className: string,
): string | null {
  const normalized = normalizeUserClass(className);
  if (!normalized) {
    return null;
  }

  return replaceOpeningTagInSource(source, range, (classes) => {
    if (classes.includes(normalized)) {
      return classes;
    }
    return [...classes, normalized];
  });
}

export function removeClassFromElement(
  source: string,
  range: { from: number; to: number },
  className: string,
): string | null {
  return replaceOpeningTagInSource(source, range, (classes) =>
    classes.filter((token) => token !== className),
  );
}

/** Recompute line range after class edits (same dl occurrence when possible). */
export function refreshRangeAfterEdit(
  source: string,
  dlClass: string,
  occurrenceIndex: number,
  fallback: { from: number; to: number },
): { from: number; to: number } {
  return findElementLineRange(source, dlClass, occurrenceIndex) ?? fallback;
}
