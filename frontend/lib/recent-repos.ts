const STORAGE_KEY = "dreamloom-recent-repos";
const MAX_RECENT = 5;

function readRaw(): string[] {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((entry): entry is string => typeof entry === "string" && entry.trim() !== "");
  } catch {
    return [];
  }
}

function writeRaw(paths: string[]): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(paths));
}

/** Last opened project directories, newest first (max 5). */
export function getRecentRepos(): string[] {
  return readRaw().slice(0, MAX_RECENT);
}

/** Record a project path at the top of the recent list. */
export function addRecentRepo(path: string): void {
  const trimmed = path.trim();
  if (trimmed === "") {
    return;
  }

  const normalized = trimmed.replace(/\\/g, "/");
  const deduped = readRaw().filter((entry) => entry.replace(/\\/g, "/") !== normalized);
  writeRaw([normalized, ...deduped].slice(0, MAX_RECENT));
}
