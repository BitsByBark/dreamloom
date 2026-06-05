<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { appState } from "$lib/app-state.svelte";
  import { openDirectory, openProjectDirectory } from "$lib/open-directory";
  import { addRecentRepo, getRecentRepos } from "$lib/recent-repos";
  import wordmarkUrl from "$assets/images/Wordmark.png";

  const appVersion = "INDEV";
  const recentRepos = $derived(getRecentRepos());

  let pathExists = $state<Record<string, boolean>>({});
  let opening = $state(false);

  function folderName(path: string): string {
    const normalized = path.replace(/\\/g, "/");
    const slash = normalized.lastIndexOf("/");
    return slash >= 0 ? normalized.slice(slash + 1) : normalized;
  }

  $effect(() => {
    const paths = recentRepos;
    let cancelled = false;

    void (async () => {
      const next: Record<string, boolean> = {};
      for (const path of paths) {
        try {
          next[path] = await invoke<boolean>("check_path_exists", { path });
        } catch {
          next[path] = false;
        }
      }
      if (!cancelled) {
        pathExists = next;
      }
    })();

    return () => {
      cancelled = true;
    };
  });

  async function openRecent(path: string) {
    if (opening || pathExists[path] === false) {
      return;
    }

    opening = true;
    try {
      await openProjectDirectory(path);
      addRecentRepo(path);
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
      const before = appState.openDirectory;
      await openDirectory();
      if (appState.openDirectory && appState.openDirectory !== before) {
        addRecentRepo(appState.openDirectory);
      }
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
    <div class="welcome-brand">
      <img
        id="welcome-title"
        class="welcome-wordmark"
        src={wordmarkUrl}
        alt="Dreamloom"
      />
      <p class="welcome-version">{appVersion}</p>
    </div>

    {#if recentRepos.length === 0}
      <p class="welcome-empty">No recent projects.</p>
    {:else}
      <ul class="welcome-list" aria-label="Recent projects">
        {#each recentRepos as path (path)}
          {@const exists = pathExists[path] === true}
          {@const missing = pathExists[path] === false}
          <li>
            {#if missing}
              <div class="welcome-repo welcome-repo-missing" aria-disabled="true">
                <span class="welcome-repo-name">
                  {folderName(path)}
                  <span class="welcome-repo-badge">— not found</span>
                </span>
                <span class="welcome-repo-path">{path}</span>
              </div>
            {:else}
              <button
                type="button"
                class="welcome-repo"
                disabled={opening || !exists}
                onclick={() => void openRecent(path)}
              >
                <span class="welcome-repo-name">{folderName(path)}</span>
                <span class="welcome-repo-path">{path}</span>
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

<style>
  .welcome-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.85);
  }

  .welcome-dialog {
    /* 4:5 width scale vs original 600px → 750px */
    width: min(750px, calc(100vw - 32px));
    max-height: calc(100vh - 48px);
    overflow: auto;
    padding: 28px 32px 24px;
    border: 1px solid var(--panel-border);
    background: #0a0a0a;
    color: var(--text);
    font: inherit;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  }

  .welcome-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin: 0 0 20px;
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

  .welcome-empty {
    margin: 0 0 20px;
    font: inherit;
    font-size: 0.9rem;
    color: var(--text-muted);
    text-align: center;
  }

  .welcome-list {
    margin: 0 0 20px;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .welcome-repo {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--panel-border);
    background: #141414;
    color: var(--text);
    cursor: pointer;
    font: inherit;
    text-align: left;
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

  .welcome-repo-name {
    font: inherit;
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--text);
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

  .welcome-open-btn {
    display: block;
    width: 100%;
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

  .welcome-open-btn:hover:not(:disabled) {
    background: #1c1c1c;
    border-color: #555555;
  }

  .welcome-open-btn:disabled {
    opacity: 0.5;
    cursor: wait;
  }
</style>
