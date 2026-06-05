import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";

/** `package.json` version field for a project directory, if present. */
export async function readProjectVersion(repoPath: string): Promise<string | null> {
  try {
    const raw = await invoke<string>("read_text_file", {
      path: await join(repoPath, "package.json"),
    });
    const json = JSON.parse(raw) as { version?: unknown };
    if (typeof json.version !== "string") {
      return null;
    }

    const trimmed = json.version.trim();
    return trimmed === "" ? null : trimmed;
  } catch {
    return null;
  }
}
