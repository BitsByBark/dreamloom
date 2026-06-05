import { invoke } from "@tauri-apps/api/core";

/** Child repo folders under the working directory, sorted by latest GitHub push (newest first). */
export async function listWorkingFolderRepos(workingFolder: string): Promise<string[]> {
  const root = workingFolder.trim().replace(/\\/g, "/");
  if (root === "") {
    return [];
  }

  try {
    return await invoke<string[]>("list_child_directories_by_github_push", { parent: root });
  } catch {
    return [];
  }
}
