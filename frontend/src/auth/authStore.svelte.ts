import { appState } from "$lib/app-state.svelte";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  clearSession,
  deviceFlowPoll,
  deviceFlowStart,
  getRepoStatus,
  getSession,
  type GithubProfile,
  type RepoGitStatus,
} from "./github";
import {
  clearCachedGithubProfile,
  loadCachedGithubProfile,
  saveCachedGithubProfile,
} from "./profile-storage";

export type AuthStatus = "idle" | "loading" | "anonymous" | "authenticated";

export type DeviceFlowState = {
  active: boolean;
  userCode: string;
  verificationUri: string;
  deviceCode: string;
  polling: boolean;
  error: string | null;
};

export const authStore = $state({
  status: "idle" as AuthStatus,
  user: null as GithubProfile | null,
  repoMetrics: null as RepoGitStatus | null,
  deviceFlow: {
    active: false,
    userCode: "",
    verificationUri: "",
    deviceCode: "",
    polling: false,
    error: null,
  } as DeviceFlowState,
});

let pollTimer: ReturnType<typeof setTimeout> | null = null;

function applyCachedProfile(): boolean {
  const cached = loadCachedGithubProfile();
  if (!cached) {
    return false;
  }
  authStore.user = cached;
  authStore.status = "authenticated";
  return true;
}

function persistProfile(profile: GithubProfile): void {
  authStore.user = profile;
  saveCachedGithubProfile(profile);
}

function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}

function resetDeviceFlow() {
  stopPolling();
  authStore.deviceFlow = {
    active: false,
    userCode: "",
    verificationUri: "",
    deviceCode: "",
    polling: false,
    error: null,
  };
}

export async function hydrateAuth(): Promise<void> {
  const hadCache = applyCachedProfile();
  if (!hadCache) {
    authStore.status = "loading";
  }

  try {
    const session = await getSession();
    if (session.authenticated && session.login && session.avatarUrl) {
      persistProfile({ login: session.login, avatarUrl: session.avatarUrl });
      authStore.status = "authenticated";
      await refreshRepoMetrics();
      return;
    }
    if (session.authenticated) {
      const cached = loadCachedGithubProfile();
      if (cached) {
        authStore.user = cached;
      }
      authStore.status = "authenticated";
      await refreshRepoMetrics();
      return;
    }

    // token missing / expired — keep cached profile for topbar until user disconnects
    if (applyCachedProfile()) {
      return;
    }
    authStore.user = null;
    authStore.status = "anonymous";
  } catch {
    if (applyCachedProfile()) {
      return;
    }
    authStore.user = null;
    authStore.status = "anonymous";
  }
}

export async function refreshRepoMetrics(): Promise<void> {
  const path = appState.openDirectory;
  if (!path) {
    authStore.repoMetrics = null;
    return;
  }

  try {
    authStore.repoMetrics = await getRepoStatus(path);
  } catch {
    authStore.repoMetrics = {
      branch: "",
      filesChanged: 0,
      linesAdded: 0,
      linesRemoved: 0,
    };
  }
}

async function pollOnce(intervalSeconds: number) {
  const { deviceCode } = authStore.deviceFlow;
  if (!deviceCode) return;

  try {
    const result = await deviceFlowPoll(deviceCode);

    if (result.status === "pending") {
      pollTimer = setTimeout(() => pollOnce(intervalSeconds), intervalSeconds * 1000);
      return;
    }

    if (result.status === "slow_down") {
      const nextInterval = intervalSeconds + 5;
      pollTimer = setTimeout(() => pollOnce(nextInterval), nextInterval * 1000);
      return;
    }

    authStore.deviceFlow.polling = false;

    if (result.status === "authorized" && result.profile) {
      persistProfile(result.profile);
      authStore.status = "authenticated";
      resetDeviceFlow();
      await refreshRepoMetrics();
      return;
    }

    if (result.status === "expired") {
      authStore.deviceFlow.error = result.message ?? "Authorization expired";
      return;
    }

    authStore.deviceFlow.error = result.message ?? "Authorization failed";
  } catch (err) {
    authStore.deviceFlow.polling = false;
    authStore.deviceFlow.error =
      err instanceof Error ? err.message : "Failed to check authorization";
  }
}

export async function connectGithub(): Promise<void> {
  stopPolling();
  resetDeviceFlow();
  authStore.status = "loading";

  try {
    const start = await deviceFlowStart();
    authStore.deviceFlow = {
      active: true,
      userCode: start.userCode,
      verificationUri: start.verificationUri,
      deviceCode: start.deviceCode,
      polling: true,
      error: null,
    };
    authStore.status = "anonymous";

    await openUrl(start.verificationUri);

    const intervalSeconds = Math.max(start.interval, 5);
    pollTimer = setTimeout(() => pollOnce(intervalSeconds), intervalSeconds * 1000);
  } catch (err) {
    authStore.status = "anonymous";
    authStore.deviceFlow = {
      active: true,
      userCode: "",
      verificationUri: "",
      deviceCode: "",
      polling: false,
      error: err instanceof Error ? err.message : "Failed to start GitHub login",
    };
  }
}

export function cancelGithubConnect(): void {
  resetDeviceFlow();
  if (authStore.user) {
    authStore.status = "authenticated";
  } else {
    authStore.status = "anonymous";
  }
}

export async function disconnectGithub(): Promise<void> {
  stopPolling();
  resetDeviceFlow();
  try {
    await clearSession();
  } catch {
    // still clear local state
  }
  clearCachedGithubProfile();
  authStore.user = null;
  authStore.repoMetrics = null;
  authStore.status = "anonymous";
}
