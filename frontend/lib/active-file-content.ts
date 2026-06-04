import { appState } from "$lib/app-state.svelte";
import { centerTabs } from "$lib/center-tabs.svelte";

export type ActiveFile = {
  path: string | null;
  content: string | null;
};

/** Resolves the active center-tab file path and buffer text for editor + bridge. */
export function activeFileContent(): ActiveFile {
  const path = appState.openFilePath ?? centerTabs.activePath;
  if (!path) {
    return { path: null, content: null };
  }

  if (appState.openFileContent !== null) {
    return { path, content: appState.openFileContent };
  }

  const tab = centerTabs.tabs.find((entry) => entry.path === path);
  return { path, content: tab?.content ?? null };
}

/** Editor/sync helpers: always a string (empty when no buffer). */
export function activeFileText(): string {
  return activeFileContent().content ?? "";
}
