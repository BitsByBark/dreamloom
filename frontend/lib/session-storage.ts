export const SESSION_STORAGE_KEY = "dreamloom-session";

export type PersistedSession = {
  openDirectory: string | null;
  tabPaths: string[];
  activePath: string | null;
};

export const defaultSession: PersistedSession = {
  openDirectory: null,
  tabPaths: [],
  activePath: null,
};

export function loadSession(): PersistedSession {
  if (typeof localStorage === "undefined") {
    return { ...defaultSession };
  }

  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return { ...defaultSession };
    }

    const parsed = JSON.parse(raw) as Partial<PersistedSession>;
    return {
      openDirectory:
        typeof parsed.openDirectory === "string" ? parsed.openDirectory : null,
      tabPaths: Array.isArray(parsed.tabPaths)
        ? parsed.tabPaths.filter((path): path is string => typeof path === "string")
        : [],
      activePath: typeof parsed.activePath === "string" ? parsed.activePath : null,
    };
  } catch {
    return { ...defaultSession };
  }
}

export function saveSession(session: PersistedSession): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}
