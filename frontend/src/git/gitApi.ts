import { invoke } from "@tauri-apps/api/core";

export type GitChangedFile = {
  path: string;
  status: string;
  staged: boolean;
};

export type GitStatus = {
  branch: string;
  remoteUrl?: string;
  owner?: string;
  repo?: string;
  files: GitChangedFile[];
};

export async function fetchGitStatus(projectPath: string): Promise<GitStatus> {
  return invoke<GitStatus>("git_status", { projectPath });
}

export async function stageGitFiles(projectPath: string, files: string[]): Promise<void> {
  await invoke("git_stage", { projectPath, files });
}

export async function unstageGitFiles(projectPath: string, files: string[]): Promise<void> {
  await invoke("git_unstage", { projectPath, files });
}

export async function commitGit(projectPath: string, message: string): Promise<void> {
  await invoke("git_commit", { projectPath, message });
}

export async function pushGit(projectPath: string): Promise<void> {
  await invoke("git_push", { projectPath });
}
