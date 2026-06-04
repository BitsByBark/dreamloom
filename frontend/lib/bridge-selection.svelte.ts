import { appState } from "$lib/app-state.svelte";
import {
  clearComponentTree,
  nearestDlAlongPath,
  nearestIdAlongPath,
  setComponentTree,
} from "$lib/component-tree.svelte";
import { centerTabs, focusCenterTab, openCenterTab } from "$lib/center-tabs.svelte";
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
  DreamloomPreviewSelectMessage,
} from "$panels/center/preview-bridge";
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
    };

export const editorBridge = $state({
  selection: null as EditorBridgeSelection | null,
});

export function clearEditorBridgeSelection(): void {
  editorBridge.selection = null;
  clearComponentTree();
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

async function applyResolvedSource(
  resolved: ResolvedComponentSource,
  selection: EditorBridgeSelection,
): Promise<void> {
  appState.rightTab = "editor";

  if (centerTabs.activePath !== resolved.path) {
    await ensureTabForBridge(resolved.path);
  }

  editorBridge.selection = {
    ...selection,
    fromLine: resolved.range.from,
    toLine: resolved.range.to,
    generation: bumpGeneration(),
  };
}

export async function handlePreviewSelect(message: DreamloomPreviewSelectMessage): Promise<void> {
  if (message.tree) {
    setComponentTree(message.tree, message.selectedPath ?? []);
  }

  const occurrence = message.occurrenceIndex ?? 0;
  const resolved = await resolveDlClassSource(message.dlClass, occurrence);

  if (!resolved) {
    editorBridge.selection = null;
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

export function selectComponentTreeNode(path: number[]): void {
  postToPreview({ type: "dreamloom:pick", path });
}
