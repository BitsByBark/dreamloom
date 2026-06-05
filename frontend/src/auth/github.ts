import { invoke } from "@tauri-apps/api/core";

export type GithubProfile = {
  login: string;
  avatarUrl: string;
};

export type DeviceFlowStart = {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
};

export type DeviceFlowPollResult = {
  status: "pending" | "slow_down" | "authorized" | "expired" | "error";
  profile?: GithubProfile;
  message?: string;
};

export type GithubSession = {
  authenticated: boolean;
  login?: string;
  avatarUrl?: string;
};

export type RepoGitStatus = {
  branch: string;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  githubOwner?: string;
  githubRepo?: string;
};

export type GithubRepo = {
  fullName: string;
  htmlUrl: string;
  private: boolean;
};

export async function deviceFlowStart(): Promise<DeviceFlowStart> {
  return invoke<DeviceFlowStart>("github_device_flow_start");
}

export async function deviceFlowPoll(deviceCode: string): Promise<DeviceFlowPollResult> {
  const result = await invoke<DeviceFlowPollResult>("github_device_flow_poll", { deviceCode });
  return {
    ...result,
    status: result.status as DeviceFlowPollResult["status"],
  };
}

export async function getSession(): Promise<GithubSession> {
  return invoke<GithubSession>("github_get_session");
}

export async function clearSession(): Promise<void> {
  await invoke("github_clear_session");
}

export async function listGithubRepos(): Promise<GithubRepo[]> {
  return invoke<GithubRepo[]>("github_list_repos");
}

export async function getRepoStatus(projectPath: string): Promise<RepoGitStatus> {
  return invoke<RepoGitStatus>("github_get_repo_status", { projectPath });
}
