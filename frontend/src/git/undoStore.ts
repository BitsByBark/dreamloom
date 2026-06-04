const MAX_UNDO_LINES = 50;

const lines: string[] = [];

export function appendUndo(line: string): void {
  const trimmed = line.trim();
  if (!trimmed) {
    return;
  }
  lines.push(trimmed);
  if (lines.length > MAX_UNDO_LINES) {
    lines.splice(0, lines.length - MAX_UNDO_LINES);
  }
}

export function clearUndoLog(): void {
  lines.length = 0;
}

export function formatUndoFooter(): string {
  if (lines.length === 0) {
    return "";
  }
  return lines.map((line) => `- ${line}`).join("\n");
}
