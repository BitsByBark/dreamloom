import { invoke } from "@tauri-apps/api/core";
import { activeFileContent } from "$lib/active-file-content";
import { appState } from "$lib/app-state.svelte";
import {
  clearComponentTree,
  componentTree,
  nearestDlAlongPath,
  nearestIdAlongPath,
  nodeAtPath,
  setComponentTree,
} from "$lib/component-tree.svelte";
import { centerTabs, focusCenterTab, openCenterTab } from "$lib/center-tabs.svelte";
import { generateDlClass, listDlClassesInSource } from "$lib/element-classes";
import { findElementLineRange } from "$lib/find-element-lines";
import {
  resolveDlClassSource,
  resolveIdSource,
  type ResolvedComponentSource,
} from "$lib/resolve-component-source";
import { postToPreview } from "$lib/preview-messaging";
import type {
  DreamloomPreviewChainUpdateMessage,
  DreamloomPreviewClearMessage,
  DreamloomPreviewSelectByIdMessage,
  DreamloomPreviewSelectElementMessage,
  DreamloomPreviewSelectMessage,
} from "$panels/center/preview-bridge";
import { clearElementStyles, loadElementStyles } from "$properties/element-styles.svelte";
import { selectNamedClass } from "../src/namedClasses/namedClassStore";
import { settings } from "$settings/settings.svelte";

export type EditorBridgeSelection =
  | {
      matchKind: "dl";
      dlClass: string;
      occurrenceIndex: number;
      fromLine: number;
      toLine: number;
      generation: number;
    }
  | {
      matchKind: "id";
      id: string;
      fromLine: number;
      toLine: number;
      generation: number;
    }
  | {
      // A bare element (no dl-*/id) with a generated dl-* class not yet written
      // to source. Materialized into a "dl" selection on the first edit.
      matchKind: "element";
      tagName: string;
      classes: string[];
      occurrence: number;
      filePath: string;
      pendingDlClass: string;
      injected: boolean;
      fromLine: number;
      toLine: number;
      generation: number;
    };

export const editorBridge = $state({
  selection: null as EditorBridgeSelection | null,
});

export function clearEditorBridgeSelection(): void {
  editorBridge.selection = null;
  clearComponentTree();
  clearElementStyles();
}

export function handlePreviewClear(_message?: DreamloomPreviewClearMessage): void {
  editorBridge.selection = null;
  clearComponentTree();
}

function bumpGeneration(): number {
  return (editorBridge.selection?.generation ?? 0) + 1;
}

async function ensureTabForBridge(path: string): Promise<void> {
  const existing = centerTabs.tabs.find((entry) => entry.path === path);
  const options = { preserveBridge: true as const };

  if (existing) {
    await focusCenterTab(path, options);
    return;
  }

  await openCenterTab(path, options);
}

type ApplyBridgeOptions = {
  focusEditor?: boolean;
  highlightPreview?: boolean;
};

async function applyResolvedSource(
  resolved: ResolvedComponentSource,
  selection: EditorBridgeSelection,
  options: ApplyBridgeOptions = {},
): Promise<void> {
  const { focusEditor = true, highlightPreview = false } = options;

  if (focusEditor) {
    appState.rightTab = "editor";
  }

  if (centerTabs.activePath !== resolved.path) {
    await ensureTabForBridge(resolved.path);
  }

  editorBridge.selection = {
    ...selection,
    fromLine: resolved.range.from,
    toLine: resolved.range.to,
    generation: bumpGeneration(),
  };

  if (selection.matchKind === "dl") {
    selectNamedClass(null);
    await loadElementStyles(resolved.path, selection.dlClass);
  } else {
    clearElementStyles();
  }

  if (highlightPreview && selection.matchKind === "dl") {
    postToPreview({
      type: "dreamloom:highlightDl",
      dlClass: selection.dlClass,
      occurrenceIndex: selection.occurrenceIndex,
    });
  }
}

/** dl-* for the current bridge selection (editor or tree leaf). */
export function currentBridgeDlClass(): string | null {
  const sel = editorBridge.selection;
  if (sel?.matchKind === "dl") {
    return sel.dlClass;
  }

  // A bare element carries a generated, not-yet-written dl class.
  if (sel?.matchKind === "element") {
    return sel.pendingDlClass;
  }

  if (componentTree.tree) {
    const node = nodeAtPath(componentTree.tree, componentTree.selectedPath);
    if (node?.dlClass) {
      return node.dlClass;
    }
    const ancestor = nearestDlAlongPath(componentTree.tree, componentTree.selectedPath);
    if (ancestor) {
      return ancestor.dlClass;
    }
  }

  return null;
}

export async function bridgeSelectDlClass(
  dlClass: string,
  occurrence = 0,
  options: ApplyBridgeOptions = { focusEditor: false, highlightPreview: true },
): Promise<void> {
  const resolved = await resolveDlClassSource(dlClass, occurrence);
  if (!resolved) {
    return;
  }

  await applyResolvedSource(
    resolved,
    {
      matchKind: "dl",
      dlClass,
      occurrenceIndex: occurrence,
      fromLine: resolved.range.from,
      toLine: resolved.range.to,
      generation: 0,
    },
    options,
  );
}

export function refreshBridgeEditorHighlight(): void {
  const sel = editorBridge.selection;
  if (!sel) {
    return;
  }
  editorBridge.selection = { ...sel, generation: bumpGeneration() };
}

export async function handlePreviewSelect(message: DreamloomPreviewSelectMessage): Promise<void> {
  if (message.tree) {
    setComponentTree(message.tree, message.selectedPath ?? []);
  }

  const occurrence = message.occurrenceIndex ?? 0;
  const resolved = await resolveDlClassSource(message.dlClass, occurrence);

  if (!resolved) {
    editorBridge.selection = null;
    clearElementStyles();
    if (settings.debugMode) {
      console.debug(
        "[dreamloom] dl class not found in project:",
        message.dlClass,
        "occurrence",
        occurrence,
      );
    }
    return;
  }

  await applyResolvedSource(resolved, {
    matchKind: "dl",
    dlClass: message.dlClass,
    occurrenceIndex: occurrence,
    fromLine: resolved.range.from,
    toLine: resolved.range.to,
    generation: 0,
  });
}

export async function handlePreviewSelectById(
  message: DreamloomPreviewSelectByIdMessage,
): Promise<void> {
  if (message.tree) {
    setComponentTree(message.tree, message.selectedPath ?? []);
  }

  const resolved = await resolveIdSource(message.id);

  if (!resolved) {
    editorBridge.selection = null;
    clearElementStyles();
    if (settings.debugMode) {
      console.debug("[dreamloom] id not found in project:", message.id);
    }
    return;
  }

  await applyResolvedSource(resolved, {
    matchKind: "id",
    id: message.id,
    fromLine: resolved.range.from,
    toLine: resolved.range.to,
    generation: 0,
  });
}

export async function handlePreviewChainUpdate(
  message: DreamloomPreviewChainUpdateMessage,
): Promise<void> {
  if (!message.tree) {
    return;
  }

  const selectedPath = message.selectedPath ?? [];
  setComponentTree(message.tree, selectedPath);

  const dl = nearestDlAlongPath(message.tree, selectedPath);
  if (dl) {
    const resolved = await resolveDlClassSource(dl.dlClass, 0);
    if (resolved) {
      await applyResolvedSource(resolved, {
        matchKind: "dl",
        dlClass: dl.dlClass,
        occurrenceIndex: 0,
        fromLine: resolved.range.from,
        toLine: resolved.range.to,
        generation: 0,
      });
      return;
    }
  }

  const idNode = nearestIdAlongPath(message.tree, selectedPath);
  if (idNode) {
    const resolved = await resolveIdSource(idNode.id);
    if (resolved) {
      await applyResolvedSource(resolved, {
        matchKind: "id",
        id: idNode.id,
        fromLine: resolved.range.from,
        toLine: resolved.range.to,
        generation: 0,
      });
    }
  }
}

export function handlePreviewSelectElement(
  message: DreamloomPreviewSelectElementMessage,
): void {
  if (message.tree) {
    setComponentTree(message.tree, message.selectedPath ?? []);
  }

  const active = activeFileContent();
  if (!active.path || !active.path.endsWith(".svelte")) {
    console.warn("[dl-inject] no active .svelte file to inject into");
    editorBridge.selection = null;
    clearElementStyles();
    return;
  }

  const existing = new Set(listDlClassesInSource(active.content ?? ""));
  const pendingDlClass = generateDlClass(existing);
  console.log(
    "[dl-inject] generated pending class",
    pendingDlClass,
    `for <${message.tagName}>`,
    { classes: message.classes, occurrence: message.occurrence, file: active.path },
  );

  editorBridge.selection = {
    matchKind: "element",
    tagName: message.tagName,
    classes: message.classes ?? [],
    occurrence: message.occurrence ?? 0,
    filePath: active.path,
    pendingDlClass,
    injected: false,
    fromLine: 0,
    toLine: 0,
    generation: bumpGeneration(),
  };
  clearElementStyles();
}

/**
 * Write the pending dl-* class into source (via the Rust `inject_dl_class`
 * command), then promote the bare `element` selection to a normal `dl`
 * selection. Returns false — writing nothing — when injection fails, so the
 * caller can abort the edit (fail closed).
 */
export async function materializePendingDlClass(): Promise<boolean> {
  const sel = editorBridge.selection;
  if (!sel || sel.matchKind !== "element" || sel.injected) {
    return true;
  }

  console.log("[dl-inject] materializing", sel.pendingDlClass, "into", sel.filePath);
  try {
    const outcome = await invoke("inject_dl_class", {
      filePath: sel.filePath,
      identifier: {
        tagName: sel.tagName,
        classes: sel.classes,
        occurrence: sel.occurrence,
      },
      dlClass: sel.pendingDlClass,
    });
    console.log("[dl-inject] outcome", outcome);
  } catch (error) {
    console.error("[dl-inject] inject_dl_class failed; aborting edit", error);
    return false;
  }

  // Re-read the now-updated file, refresh the open buffer, recompute the range.
  let content: string;
  try {
    content = await invoke<string>("read_text_file", { path: sel.filePath });
  } catch (error) {
    console.error("[dl-inject] could not re-read file after injection", error);
    return false;
  }
  syncTabBuffer(sel.filePath, content);

  const range = findElementLineRange(content, sel.pendingDlClass, 0) ?? {
    from: sel.fromLine,
    to: sel.toLine,
  };

  // Reflect the new class on the selected tree node so its label updates.
  if (componentTree.tree) {
    const node = nodeAtPath(componentTree.tree, componentTree.selectedPath);
    if (node) {
      node.dlClass = sel.pendingDlClass;
    }
  }

  editorBridge.selection = {
    matchKind: "dl",
    dlClass: sel.pendingDlClass,
    occurrenceIndex: 0,
    fromLine: range.from,
    toLine: range.to,
    generation: bumpGeneration(),
  };

  await loadElementStyles(sel.filePath, sel.pendingDlClass);
  console.log("[dl-inject] selection promoted to dl", sel.pendingDlClass, range);
  return true;
}

function syncTabBuffer(path: string, content: string): void {
  const tab = centerTabs.tabs.find((entry) => entry.path === path);
  if (tab) {
    tab.content = content;
    tab.evicted = false;
  }
  if (centerTabs.activePath === path) {
    appState.openFileContent = content;
  }
}

export function selectComponentTreeNode(path: number[]): void {
  postToPreview({ type: "dreamloom:pick", path });
}
