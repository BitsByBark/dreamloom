import { getCurrentWindow } from "@tauri-apps/api/window";
import type { WindowDecorationsMode } from "$settings/storage";

export async function applyWindowDecorations(mode: WindowDecorationsMode): Promise<void> {
  const win = getCurrentWindow();
  await win.setDecorations(mode === "native");
}
