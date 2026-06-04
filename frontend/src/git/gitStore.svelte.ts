import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { appState } from "$lib/app-state.svelte";
import { refreshRepoMetrics } from "$auth/authStore.svelte";
import {
  commitGit,
  fetchGitStatus,
  pushGit,
  stageGitFiles,
  unstageGitFiles,
  type GitChangedFile,
} from "./gitApi";
import { clearUndoLog, formatUndoFooter } from "./undoStore";

export type GitModalTab = "commit" | "gitignore";

export const gitStore = $state({
  open: false,
  tab: "commit" as GitModalTab,
  loading: false,
  error: null as string | null,
  branch: "",
  repoLabel: "",
  remoteUrl: null as string | null,
  files: [] as GitChangedFile[],
  commitMessage: "",
  gitignorePatterns: [] as string[],
  newGitignorePattern: "",
});

function repoLabelFromPath(projectPath: string, owner?: string, repo?: string): string {
  if (owner && repo) {
    return `${owner}/${repo}`;
  }
  const normalized = projectPath.replace(/\\/g, "/");
  const slash = normalized.lastIndexOf("/");
  return slash >= 0 ? normalized.slice(slash + 1) : normalized;
}

function parseGitignore(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function serializeGitignore(patterns: string[]): string {
  if (patterns.length === 0) {
    return "";
  }
  return `${patterns.join("\n")}\n`;
}

export function openGitModal(): void {
  const path = appState.openDirectory;
  if (!path) {
    return;
  }
  gitStore.open = true;
  gitStore.error = null;
  void refreshGitModal();
}

export function closeGitModal(): void {
  gitStore.open = false;
  gitStore.error = null;
}

export function setGitModalTab(tab: GitModalTab): void {
  gitStore.tab = tab;
  if (tab === "gitignore") {
    void loadGitignore();
  }
}

export async function refreshGitModal(): Promise<void> {
  const path = appState.openDirectory;
  if (!path) {
    return;
  }

  gitStore.loading = true;
  gitStore.error = null;

  try {
    const status = await fetchGitStatus(path);
    gitStore.branch = status.branch;
    gitStore.remoteUrl = status.remoteUrl ?? null;
    gitStore.repoLabel = repoLabelFromPath(path, status.owner, status.repo);
    gitStore.files = status.files;
  } catch (err) {
    gitStore.error = err instanceof Error ? err.message : String(err);
    gitStore.files = [];
  } finally {
    gitStore.loading = false;
  }
}

export async function loadGitignore(): Promise<void> {
  const path = appState.openDirectory;
  if (!path) {
    return;
  }

  gitStore.loading = true;
  gitStore.error = null;

  try {
    const filePath = await join(path, ".gitignore");
    const content = await invoke<string>("read_text_file", { path: filePath });
    gitStore.gitignorePatterns = parseGitignore(content);
  } catch {
    gitStore.gitignorePatterns = [];
  } finally {
    gitStore.loading = false;
  }
}

async function saveGitignore(): Promise<void> {
  const path = appState.openDirectory;
  if (!path) {
    return;
  }

  const filePath = await join(path, ".gitignore");
  await invoke("write_text_file", {
    path: filePath,
    content: serializeGitignore(gitStore.gitignorePatterns),
  });
}

export async function toggleFileStaged(file: GitChangedFile): Promise<void> {
  const path = appState.openDirectory;
  if (!path) {
    return;
  }

  gitStore.loading = true;
  gitStore.error = null;

  try {
    if (file.staged) {
      await unstageGitFiles(path, [file.path]);
    } else {
      await stageGitFiles(path, [file.path]);
    }
    await refreshGitModal();
  } catch (err) {
    gitStore.error = err instanceof Error ? err.message : String(err);
  } finally {
    gitStore.loading = false;
  }
}

export async function stageAllFiles(): Promise<void> {
  const path = appState.openDirectory;
  if (!path) {
    return;
  }

  const toStage = gitStore.files.filter((f) => !f.staged).map((f) => f.path);
  if (toStage.length === 0) {
    return;
  }

  gitStore.loading = true;
  gitStore.error = null;

  try {
    await stageGitFiles(path, toStage);
    await refreshGitModal();
  } catch (err) {
    gitStore.error = err instanceof Error ? err.message : String(err);
  } finally {
    gitStore.loading = false;
  }
}

export async function unstageAllFiles(): Promise<void> {
  const path = appState.openDirectory;
  if (!path) {
    return;
  }

  const toUnstage = gitStore.files.filter((f) => f.staged).map((f) => f.path);
  if (toUnstage.length === 0) {
    return;
  }

  gitStore.loading = true;
  gitStore.error = null;

  try {
    await unstageGitFiles(path, toUnstage);
    await refreshGitModal();
  } catch (err) {
    gitStore.error = err instanceof Error ? err.message : String(err);
  } finally {
    gitStore.loading = false;
  }
}

function buildCommitMessage(): string {
  const user = gitStore.commitMessage.trim();
  const footer = formatUndoFooter();
  if (!footer) {
    return user;
  }
  if (!user) {
    return `---\nDreamloom session:\n${footer}`;
  }
  return `${user}\n\n---\nDreamloom session:\n${footer}`;
}

export async function commitOnly(): Promise<void> {
  const path = appState.openDirectory;
  if (!path) {
    return;
  }

  const message = buildCommitMessage();
  if (!message.trim()) {
    gitStore.error = "commit message is empty";
    return;
  }

  gitStore.loading = true;
  gitStore.error = null;

  try {
    await commitGit(path, message);
    clearUndoLog();
    gitStore.commitMessage = "";
    await refreshGitModal();
    await refreshRepoMetrics();
  } catch (err) {
    gitStore.error = err instanceof Error ? err.message : String(err);
  } finally {
    gitStore.loading = false;
  }
}

export async function commitAndPush(): Promise<void> {
  const path = appState.openDirectory;
  if (!path) {
    return;
  }

  const message = buildCommitMessage();
  if (!message.trim()) {
    gitStore.error = "commit message is empty";
    return;
  }

  gitStore.loading = true;
  gitStore.error = null;

  try {
    await commitGit(path, message);
    await pushGit(path);
    clearUndoLog();
    gitStore.commitMessage = "";
    await refreshGitModal();
    await refreshRepoMetrics();
  } catch (err) {
    gitStore.error = err instanceof Error ? err.message : String(err);
  } finally {
    gitStore.loading = false;
  }
}

export async function addGitignorePattern(): Promise<void> {
  const pattern = gitStore.newGitignorePattern.trim();
  if (!pattern) {
    return;
  }
  if (gitStore.gitignorePatterns.includes(pattern)) {
    gitStore.newGitignorePattern = "";
    return;
  }

  gitStore.gitignorePatterns = [...gitStore.gitignorePatterns, pattern];
  gitStore.newGitignorePattern = "";
  gitStore.loading = true;
  gitStore.error = null;

  try {
    await saveGitignore();
  } catch (err) {
    gitStore.error = err instanceof Error ? err.message : String(err);
  } finally {
    gitStore.loading = false;
  }
}

export async function removeGitignorePattern(pattern: string): Promise<void> {
  gitStore.gitignorePatterns = gitStore.gitignorePatterns.filter((p) => p !== pattern);
  gitStore.loading = true;
  gitStore.error = null;

  try {
    await saveGitignore();
  } catch (err) {
    gitStore.error = err instanceof Error ? err.message : String(err);
  } finally {
    gitStore.loading = false;
  }
}
