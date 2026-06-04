import { writeTextFile } from "@tauri-apps/plugin-fs";
import { appState } from "$lib/app-state.svelte";
import { centerTabs } from "$lib/center-tabs.svelte";

/** Write buffer to disk and sync center tab + editor state. */
export async function saveSvelteSource(path: string, content: string): Promise<void> {
  await writeTextFile(path, content);

  const tab = centerTabs.tabs.find((entry) => entry.path === path);
  if (tab) {
    tab.content = content;
    tab.evicted = false;
  }

  if (centerTabs.activePath === path) {
    appState.openFileContent = content;
  }
}
