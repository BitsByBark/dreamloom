import type { GithubProfile } from "./github";

const STORAGE_KEY = "dreamloom-github-profile";

export function loadCachedGithubProfile(): GithubProfile | null {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { login?: string; avatarUrl?: string };
    if (
      typeof parsed.login !== "string" ||
      !parsed.login.trim() ||
      typeof parsed.avatarUrl !== "string" ||
      !parsed.avatarUrl.trim()
    ) {
      return null;
    }

    return { login: parsed.login, avatarUrl: parsed.avatarUrl };
  } catch {
    return null;
  }
}

export function saveCachedGithubProfile(profile: GithubProfile): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // quota / private mode — ignore
  }
}

export function clearCachedGithubProfile(): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
