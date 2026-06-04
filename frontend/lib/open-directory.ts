import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { exists } from "@tauri-apps/plugin-fs";
import { logDirectoryOpened } from "$debug/logging.svelte";
import { appState } from "$lib/app-state.svelte";

export async function openProjectDirectory(projectPath: string): Promise<void> {
  appState.openDirectory = projectPath;
  logDirectoryOpened(projectPath);

  appState.devServerPort = null;
  appState.devServerError = null;
  appState.devServerStatus = "starting";

  try {
    const port = await invoke<number>("start_dev_server", { projectPath });
    appState.devServerPort = port;
    appState.devServerStatus = "running";
  } catch (error) {
    appState.devServerStatus = "error";
    appState.devServerError = error instanceof Error ? error.message : String(error);
  }
}

export async function openDirectory(): Promise<void> {
  const selected = await open({
    directory: true,
    multiple: false,
    recursive: true,
  });

  if (typeof selected !== "string") {
    return;
  }

  await openProjectDirectory(selected);
}

export async function restoreProjectDirectory(projectPath: string): Promise<boolean> {
  if (!(await exists(projectPath))) {
    return false;
  }

  await openProjectDirectory(projectPath);
  return true;
}
