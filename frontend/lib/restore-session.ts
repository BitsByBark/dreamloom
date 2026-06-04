import { exists } from "@tauri-apps/plugin-fs";
import { appState } from "$lib/app-state.svelte";
import { centerTabs, focusCenterTab, openCenterTab } from "$lib/center-tabs.svelte";
import { restoreProjectDirectory } from "$lib/open-directory";
import { defaultSession, loadSession, saveSession } from "$lib/session-storage";
export async function restoreSession(): Promise<void> {
  const session = loadSession();
  const directory = session.openDirectory;

  if (!directory) {
    return;
  }

  if (!(await exists(directory))) {
    saveSession({ ...defaultSession });
    return;
  }

  const needsDirectory =
    appState.openDirectory !== directory || appState.devServerStatus !== "running";

  if (needsDirectory) {
    await restoreProjectDirectory(directory);
  }

  for (const path of session.tabPaths) {
    if (centerTabs.tabs.some((tab) => tab.path === path)) {
      continue;
    }

    if (!(await exists(path))) {
      continue;
    }

    try {
      await openCenterTab(path);
    } catch (error) {
      console.error("Failed to restore tab", path, error);
    }
  }

  if (
    session.activePath &&
    centerTabs.tabs.some((tab) => tab.path === session.activePath) &&
    centerTabs.activePath !== session.activePath
  ) {
    try {
      await focusCenterTab(session.activePath);
    } catch (error) {
      console.error("Failed to restore active tab", session.activePath, error);
    }
  }
}
