import { open } from "@tauri-apps/plugin-dialog";

/** Native folder picker; returns normalized path or null if cancelled. */
export async function chooseDirectory(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    recursive: true,
  });

  if (typeof selected !== "string" || selected.trim() === "") {
    return null;
  }

  return selected.trim().replace(/\\/g, "/");
}
