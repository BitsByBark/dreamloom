import { openCenterTab } from "$lib/center-tabs.svelte";
import { logFileOpenFailed } from "$debug/logging.svelte";

export async function openSvelteFile(path: string): Promise<void> {
  try {
    await openCenterTab(path);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    logFileOpenFailed(path, message);
    console.error("Failed to open file", path, error);
  }
}
