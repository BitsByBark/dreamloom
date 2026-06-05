import { settings } from "$settings/settings.svelte";

/** One reversible property write recorded at commit time. */
export type UndoEntry = {
  filePath: string;
  dlClass: string;
  state: string;
  property: string;
  previousValue: string;
  newValue: string;
  timestamp: number;
};

const stack: UndoEntry[] = [];

/**
 * Set while a restore is in flight so the `commitPropertyChange` triggered by
 * the undo doesn't push its own entry (which would make Ctrl+Z toggle forever).
 */
let restoring = false;

function stackLimit(): number {
  const depth = settings.undoStackDepth;
  return Number.isFinite(depth) && depth >= 10 ? Math.floor(depth) : 100;
}

export function pushUndoEntry(entry: UndoEntry): void {
  if (restoring) {
    return;
  }
  stack.push(entry);
  const limit = stackLimit();
  if (stack.length > limit) {
    stack.splice(0, stack.length - limit);
  }
  console.log(
    `[history] push ${entry.property} (${entry.previousValue || "(empty)"} -> ${entry.newValue || "(cleared)"}) depth=${stack.length}`,
  );
}

export function clearUndoHistory(): void {
  if (stack.length === 0) {
    return;
  }
  console.log(`[history] clear (dropped ${stack.length})`);
  stack.length = 0;
}

export function undoDepth(): number {
  return stack.length;
}

/** Pop the most recent entry and re-apply its previous value. */
export async function performUndo(): Promise<void> {
  const entry = stack.pop();
  if (!entry) {
    console.log("[history] pop: stack empty");
    return;
  }
  console.log(
    `[history] pop ${entry.property} -> restoring ${entry.previousValue || "(cleared)"} depth=${stack.length}`,
  );

  restoring = true;
  try {
    const { commitPropertyChange } = await import("$injector");
    await commitPropertyChange(entry.property, entry.previousValue);
  } finally {
    restoring = false;
  }
}
