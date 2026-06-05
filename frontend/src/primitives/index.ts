import { listDlClassesInSource } from "$lib/element-classes";
import type { EditorBridgeSelection } from "$lib/bridge-selection.svelte";
import { findElementLineRange, findIdLineRange } from "$lib/find-element-lines";
import { renderPrimitiveTemplate, type PrimitiveTemplateId } from "./templates/svelte";

export type { PrimitiveTemplateId };

export type PrimitiveItem = {
  id: PrimitiveTemplateId;
  label: string;
};

export const PRIMAL_PRIMITIVES: PrimitiveItem[] = [
  { id: "container", label: "Container" },
  { id: "text", label: "Text" },
  { id: "heading", label: "Heading" },
  { id: "button", label: "Button" },
  { id: "image", label: "Image" },
  { id: "link", label: "Link" },
  { id: "input", label: "Input" },
  { id: "span", label: "Span" },
  { id: "section", label: "Section" },
  { id: "list", label: "List" },
];

export const EXTENDED_PRIMITIVES: PrimitiveItem[] = [
  { id: "progress", label: "Progress" },
  { id: "table", label: "Table" },
  { id: "tabs", label: "Tabs" },
  { id: "form", label: "Form" },
  { id: "toggle", label: "Toggle" },
];

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/** Next unused `dl-*` token in this file. */
export function allocateDlClass(source: string): string {
  const used = new Set(listDlClassesInSource(source));
  for (let i = 1; i < 10_000; i++) {
    const name = `dl-el-${i}`;
    if (!used.has(name)) {
      return name;
    }
  }
  return `dl-el-${Date.now()}`;
}

function markupBounds(source: string): { start: number; end: number } {
  const script = source.search(/<script[\s>]/i);
  const style = source.search(/<style[\s>]/i);
  let end = source.length;
  if (script >= 0) {
    end = Math.min(end, script);
  }
  if (style >= 0) {
    end = Math.min(end, style);
  }
  return { start: 0, end };
}

function lineIndent(line: string): string {
  const match = line.match(/^(\s*)/);
  return match?.[1] ?? "";
}

function findOpeningTagAt(lines: string[], fromLine: number): { line: number; tag: string; selfClosing: boolean } | null {
  const limit = Math.max(0, fromLine - 80);
  for (let i = fromLine; i >= limit; i--) {
    const match = lines[i].match(/<([a-zA-Z][\w-]*)\b/);
    if (!match) {
      continue;
    }
    const tag = match[1].toLowerCase();
    const selfClosing = /\/>/.test(lines[i]) || VOID_TAGS.has(tag);
    return { line: i, tag, selfClosing };
  }
  return null;
}

function selectionRange(
  source: string,
  selection: EditorBridgeSelection,
): { from: number; to: number } | null {
  if (selection.matchKind === "dl") {
    return (
      findElementLineRange(source, selection.dlClass, selection.occurrenceIndex) ?? {
        from: selection.fromLine,
        to: selection.toLine,
      }
    );
  }

  if (selection.matchKind === "id") {
    return (
      findIdLineRange(source, selection.id) ?? {
        from: selection.fromLine,
        to: selection.toLine,
      }
    );
  }

  return { from: selection.fromLine, to: selection.toLine };
}

function indentSnippet(snippet: string, baseIndent: string): string {
  const childIndent = `${baseIndent}  `;
  return snippet
    .split("\n")
    .map((line) => (line.trim() ? `${childIndent}${line.trimStart()}` : line))
    .join("\n");
}

function insertLines(lines: string[], index: number, inserted: string[]): string[] {
  return [...lines.slice(0, index), ...inserted, ...lines.slice(index)];
}

function insertAsChild(lines: string[], range: { from: number; to: number }, snippet: string): string[] {
  const opening = findOpeningTagAt(lines, range.from);
  if (!opening) {
    return lines;
  }

  const baseIndent = lineIndent(lines[opening.line]);

  if (opening.selfClosing) {
    const indented = indentSnippet(snippet, baseIndent);
    return insertLines(lines, opening.line + 1, indented.split("\n"));
  }

  const closingLine = range.to;
  const closing = lines[closingLine] ?? "";
  const closeMatch = closing.match(/^(\s*)<\/([a-zA-Z][\w-]*)\s*>/);
  const childIndent = closeMatch ? closeMatch[1] : `${baseIndent}  `;
  const indented = snippet
    .split("\n")
    .map((line) => (line.trim() ? `${childIndent}${line.trimStart()}` : line))
    .join("\n");

  const closeOnly = /^\s*<\/[a-zA-Z][\w-]*\s*>\s*$/.test(closing);
  if (closeOnly) {
    return insertLines(lines, closingLine, indented.split("\n"));
  }

  const inlineClose = closing.match(/^(\s*)(.*)(<\/[a-zA-Z][\w-]*\s*>)\s*$/);
  if (inlineClose) {
    const [, lead, inner, endTag] = inlineClose;
    const next = [
      `${lead}${inner}`,
      ...indented.split("\n"),
      `${lead}${endTag}`,
    ];
    const out = [...lines];
    out.splice(closingLine, 1, ...next);
    return out;
  }

  return insertLines(lines, closingLine, indented.split("\n"));
}

function insertAtMarkupEnd(source: string, snippet: string): string {
  const { end } = markupBounds(source);
  const markup = source.slice(0, end);
  const tail = source.slice(end);
  const lines = markup.split("\n");

  let lastMarkup = lines.length - 1;
  while (lastMarkup > 0 && !lines[lastMarkup].trim()) {
    lastMarkup--;
  }

  const baseIndent = lines[lastMarkup]?.match(/^(\s*)/)?.[1] ?? "";
  const indented = indentSnippet(snippet, baseIndent === "" ? "" : baseIndent);
  const inserted = indented.split("\n");
  const nextMarkup = insertLines(lines, lastMarkup + 1, inserted).join("\n");
  return nextMarkup + tail;
}

function insertWithSelection(source: string, selection: EditorBridgeSelection, snippet: string): string {
  const range = selectionRange(source, selection);
  if (!range) {
    return insertAtMarkupEnd(source, snippet);
  }

  const lines = source.split("\n");
  const next = insertAsChild(lines, range, snippet);
  return next.join("\n");
}

/** Insert a primitive template into a `.svelte` source buffer. */
export function insertPrimitiveIntoSource(
  source: string,
  selection: EditorBridgeSelection | null,
  id: PrimitiveTemplateId,
): string {
  const used = new Set(listDlClassesInSource(source));
  const nextClass = () => {
    const name = allocateDlClass(source + [...used].join(" "));
    used.add(name);
    return name;
  };

  const snippet = renderPrimitiveTemplate(id, nextClass);
  if (selection) {
    return insertWithSelection(source, selection, snippet);
  }
  return insertAtMarkupEnd(source, snippet);
}
