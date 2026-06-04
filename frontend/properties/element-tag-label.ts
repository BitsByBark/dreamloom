const SECTION_TAGS = new Set([
  "section",
  "article",
  "header",
  "footer",
  "main",
]);

const MAX_BLOCK_LINES = 500;

export function elementTypeLabel(tag: string): string {
  const t = tag.toLowerCase();

  switch (t) {
    case "div":
      return "CONTAINER";
    case "button":
      return "BUTTON";
    case "p":
      return "TEXT";
    case "span":
      return "INLINE";
    case "img":
      return "IMAGE";
    case "a":
      return "LINK";
    case "input":
      return "INPUT";
    default:
      if (/^h[1-6]$/.test(t)) {
        return "HEADING";
      }
      if (SECTION_TAGS.has(t)) {
        return "SECTION";
      }
      return "ELEMENT";
  }
}

/** Opening tag name at or above this line in svelte/html source. */
export function tagFromSourceLine(source: string, line: number): string | null {
  const lines = source.split("\n");
  const limit = Math.max(0, line - MAX_BLOCK_LINES);

  for (let i = line; i >= limit; i--) {
    const match = lines[i]?.match(/<([a-zA-Z][\w-]*)\b/);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  return null;
}
