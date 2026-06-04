import { invoke } from "@tauri-apps/api/core";
import type { StyleDelta } from "../delta";

export async function injectSvelteStyle(filePath: string, delta: StyleDelta): Promise<void> {
  console.log("[injector:svelte] inject_style", { filePath, delta });
  try {
    await invoke("inject_style", { filePath, delta });
  } catch (err) {
    console.log("[injector:svelte] inject_style failed (command not implemented yet)", err);
  }
}
