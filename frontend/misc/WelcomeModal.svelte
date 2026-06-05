<script lang="ts">
  import { getVersion } from "@tauri-apps/api/app";
  import { invoke } from "@tauri-apps/api/core";
  import { appState } from "$lib/app-state.svelte";
  import { openDirectory, openProjectDirectory } from "$lib/open-directory";
  import { chooseDirectory } from "$lib/choose-directory";
  import { readProjectVersion } from "$lib/project-version";
  import { listWorkingFolderRepos } from "$lib/working-folder-repos";
  import { getRepoStatus } from "$auth/github";
  import { setWorkingFolder, settings } from "$settings/settings.svelte";
  import wordmarkUrl from "$assets/images/Wordmark.png";
  import taglines from "../src/taglines.json";

  const tagline = taglines[Math.floor(Math.random() * taglines.length)] ?? "";

  let appVersion = $state("");
  let repoPaths = $state<string[]>([]);
  let pathExists = $state<Record<string, boolean>>({});
  let hasGithubRemote = $state<Record<string, boolean>>({});
  let repoVersions = $state<Record<string, string>>({});
  let opening = $state(false);

  const workingFolder = $derived(settings.workingFolder);
  const showSetParentRepo = $derived(repoPaths.length === 0);

  $effect(() => {
    void getVersion()
      .then((version) => {
        appVersion = version;
      })
      .catch(() => {
        appVersion = "";
      });
  });

  function folderName(path: string): string {
    const normalized = path.replace(/\\/g, "/");
    const slash = normalized.lastIndexOf("/");
    return slash >= 0 ? normalized.slice(slash + 1) : normalized;
  }

  $effect(() => {
    const root = workingFolder;
    let cancelled = false;

    void (async () => {
      const paths = await listWorkingFolderRepos(root);
      if (cancelled) {
        return;
      }

      repoPaths = paths;
      hasGithubRemote = {};
      repoVersions = {};

      const existsNext: Record<string, boolean> = {};
      const githubNext: Record<string, boolean> = {};
      const versionNext: Record<string, string> = {};

      for (const path of paths) {
        try {
          existsNext[path] = await invoke<boolean>("check_path_exists", { path });
        } catch {
          existsNext[path] = false;
        }

        if (!existsNext[path]) {
          githubNext[path] = false;
          continue;
        }

        const version = await readProjectVersion(path);
        if (version) {
          versionNext[path] = version.toUpperCase();
        }

        try {
          const status = await getRepoStatus(path);
          githubNext[path] = Boolean(status.githubOwner && status.githubRepo);
        } catch {
          githubNext[path] = false;
        }
      }

      if (!cancelled) {
        pathExists = existsNext;
        hasGithubRemote = githubNext;
        repoVersions = versionNext;
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  async function openRepo(path: string) {
    if (opening || pathExists[path] === false) {
      return;
    }

    opening = true;
    try {
      await openProjectDirectory(path);
    } finally {
      opening = false;
    }
  }

  async function onOpenRepository() {
    if (opening) {
      return;
    }

    opening = true;
    try {
      await openDirectory();
    } finally {
      opening = false;
    }
  }

  async function onSetParentRepo() {
    if (opening) {
      return;
    }

    const picked = await chooseDirectory();
    if (!picked) {
      return;
    }

    opening = true;
    try {
      await setWorkingFolder(picked);
    } finally {
      opening = false;
    }
  }
</script>

<div class="welcome-overlay" role="presentation">
  <div
    class="welcome-dialog ui-chrome text-zoom"
    role="dialog"
    aria-modal="true"
    aria-labelledby="welcome-title"
  >
    <div class="welcome-content">
      <div class="welcome-brand">
        <img
          id="welcome-title"
          class="welcome-wordmark"
          src={wordmarkUrl}
          alt="Dreamloom"
        />
        {#if appVersion}
          <p class="welcome-version">{appVersion}</p>
        {/if}
        {#if tagline}
          <p class="welcome-tagline">{tagline}</p>
        {/if}
      </div>

      {#if showSetParentRepo}
        <p class="welcome-empty">
          {#if workingFolder.trim()}
            No repositories in this parent folder.
          {:else}
            Choose the folder that contains your project repositories.
          {/if}
        </p>
        <button
          type="button"
          class="welcome-set-parent-btn"
          disabled={opening}
          onclick={() => void onSetParentRepo()}
        >
          SET PARENT REPO
        </button>
      {:else}
        <ul class="welcome-list" aria-label="Repositories">
          {#each repoPaths as path (path)}
            {@const exists = pathExists[path] === true}
            {@const missing = pathExists[path] === false}
            <li>
              {#if missing}
                <div class="welcome-repo welcome-repo-missing" aria-disabled="true">
                  <div class="welcome-repo-main">
                    <span class="welcome-repo-name">
                      {folderName(path)}
                      <span class="welcome-repo-badge">— not found</span>
                    </span>
                    <span class="welcome-repo-path">{path}</span>
                  </div>
                </div>
              {:else}
                <button
                  type="button"
                  class="welcome-repo"
                  disabled={opening || !exists}
                  onclick={() => void openRepo(path)}
                >
                  <div class="welcome-repo-main">
                    <div class="welcome-repo-title">
                      <span class="welcome-repo-name">{folderName(path)}</span>
                      {#if repoVersions[path]}
                        <span class="welcome-repo-version">{repoVersions[path]}</span>
                      {/if}
                    </div>
                    <span class="welcome-repo-path">{path}</span>
                  </div>
                  {#if hasGithubRemote[path]}
                    <svg class="welcome-repo-gh-icon" viewBox="0 0 16 16" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.88.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
                      />
                    </svg>
                  {/if}
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}

      <button
        type="button"
        class="welcome-open-btn"
        disabled={opening}
        onclick={() => void onOpenRepository()}
      >
        OPEN REPOSITORY
      </button>
    </div>
  </div>
</div>

<style>
  .welcome-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    /* keep shell faintly visible — full black overlay looked like a crash */
    background: rgba(0, 0, 0, 0.65);
  }

  .welcome-dialog {
    width: min(750px, calc(100vw - 32px));
    max-height: calc(100vh - 48px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 28px 32px 24px;
    border: 1px solid #444444;
    background: #141414;
    color: var(--text);
    font: inherit;
    box-shadow:
      0 0 0 1px #2a2a2a,
      0 16px 48px rgba(0, 0, 0, 0.75);
  }

  .welcome-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    gap: 20px;
    min-height: 0;
    overflow-y: auto;
  }

  .welcome-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin: 0;
    padding-top: 25px;
    flex-shrink: 0;
  }

  .welcome-wordmark {
    display: block;
    width: min(100%, 22.857em);
    height: auto;
  }

  .welcome-version {
    margin: 0;
    font: inherit;
    font-size: 0.75rem;
    font-weight: 300;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .welcome-tagline {
    max-width: 34rem;
    margin: -2px 0 0;
    color: var(--text-muted);
    font: inherit;
    font-size: 0.8rem;
    letter-spacing: 0.02em;
    text-align: center;
  }

  .welcome-empty {
    margin: 0;
    font: inherit;
    font-size: 0.9rem;
    color: var(--text-muted);
    text-align: center;
  }

  .welcome-list {
    margin: 0;
    padding: 0;
    flex-shrink: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .welcome-repo {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    background: #141414;
    color: var(--text);
    cursor: pointer;
    font: inherit;
    text-align: left;
  }

  .welcome-repo-main {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    min-width: 0;
  }

  .welcome-repo-gh-icon {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    color: var(--text-muted);
  }

  .welcome-repo:hover:not(:disabled) {
    background: #1c1c1c;
    border-color: #444444;
  }

  .welcome-repo:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .welcome-repo-missing {
    opacity: 0.45;
    cursor: default;
  }

  .welcome-repo-title {
    display: flex;
    align-items: baseline;
    gap: 1.25rem;
    max-width: 100%;
  }

  .welcome-repo-name {
    font: inherit;
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--text);
    flex-shrink: 0;
  }

  .welcome-repo-version {
    flex-shrink: 0;
    font: inherit;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    white-space: nowrap;
  }

  .welcome-repo-missing .welcome-repo-name {
    font-weight: 600;
    color: var(--text-muted);
  }

  .welcome-repo-badge {
    margin-left: 8px;
    font-weight: 400;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .welcome-repo-path {
    font: inherit;
    font-size: 0.75rem;
    color: var(--text-muted);
    word-break: break-all;
    line-height: 1.4;
  }

  .welcome-set-parent-btn,
  .welcome-open-btn {
    display: block;
    width: 100%;
    flex-shrink: 0;
    padding: 12px 16px;
    border: 1px solid var(--panel-border);
    background: #141414;
    color: var(--text);
    cursor: pointer;
    font: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.08em;
  }

  .welcome-set-parent-btn:hover:not(:disabled),
  .welcome-open-btn:hover:not(:disabled) {
    background: #1c1c1c;
    border-color: #555555;
  }

  .welcome-set-parent-btn:disabled,
  .welcome-open-btn:disabled {
    opacity: 0.5;
    cursor: wait;
  }
</style>
