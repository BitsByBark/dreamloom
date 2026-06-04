import { open } from "@tauri-apps/plugin-dialog";
import { logDirectoryOpened } from "$debug/logging.svelte";
import { appState } from "$lib/app-state.svelte";

export async function openDirectory(): Promise<void> {
  const selected = await open({
    directory: true,
    multiple: false,
    recursive: true,
  });

  if (typeof selected === "string") {
    appState.openDirectory = selected;
    logDirectoryOpened(selected);
  }
}
