<script lang="ts">
  import {
    addGitignorePattern,
    closeGitModal,
    commitAndPush,
    commitOnly,
    gitStore,
    removeGitignorePattern,
    selectGithubRepo,
    setGitModalTab,
    stageAllFiles,
    toggleFileStaged,
    unstageAllFiles,
  } from "./gitStore.svelte";
</script>

{#if gitStore.open}
  <div class="git-modal-backdrop" role="presentation" onclick={closeGitModal}></div>
  <div
    class="git-modal ui-chrome"
    role="dialog"
    aria-labelledby="git-modal-title"
    onclick={(e) => e.stopPropagation()}
  >
    <header class="git-modal-header">
      <svg class="git-modal-gh-icon" viewBox="0 0 16 16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.88.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
        />
      </svg>
      <div class="git-modal-header-text">
        <label id="git-modal-title" class="git-modal-repo-select-label" for="git-modal-repo-select"
          >Repository</label
        >
        <select
          id="git-modal-repo-select"
          class="git-modal-repo-select"
          value={gitStore.selectedRepo || gitStore.repoLabel}
          onchange={(event) => selectGithubRepo(event.currentTarget.value)}
        >
          {#if gitStore.githubRepos.length === 0}
            <option value={gitStore.repoLabel || "Repository"}>{gitStore.repoLabel || "Repository"}</option>
          {:else}
            {#each gitStore.githubRepos as repo (repo.fullName)}
              <option value={repo.fullName}>{repo.fullName}{repo.private ? "  private" : ""}</option>
            {/each}
          {/if}
        </select>
        {#if gitStore.branch}
          <span class="git-modal-branch">{gitStore.branch}</span>
        {/if}
      </div>
      <button type="button" class="git-modal-close" aria-label="Close" onclick={closeGitModal}>×</button>
    </header>

    <div class="git-modal-tabs" role="tablist">
      <button
        type="button"
        class="git-modal-tab"
        class:active={gitStore.tab === "commit"}
        role="tab"
        aria-selected={gitStore.tab === "commit"}
        onclick={() => setGitModalTab("commit")}
      >
        COMMIT
      </button>
      <button
        type="button"
        class="git-modal-tab"
        class:active={gitStore.tab === "gitignore"}
        role="tab"
        aria-selected={gitStore.tab === "gitignore"}
        onclick={() => setGitModalTab("gitignore")}
      >
        .GITIGNORE
      </button>
    </div>

    {#if gitStore.error}
      <p class="git-modal-error">{gitStore.error}</p>
    {/if}

    {#if gitStore.tab === "commit"}
      <div class="git-modal-body">
        <div class="git-modal-toolbar">
          <button type="button" class="git-modal-btn" disabled={gitStore.loading} onclick={stageAllFiles}>
            STAGE ALL
          </button>
          <button type="button" class="git-modal-btn" disabled={gitStore.loading} onclick={unstageAllFiles}>
            UNSTAGE ALL
          </button>
        </div>

        <ul class="git-file-list">
          {#if gitStore.files.length === 0}
            <li class="git-file-empty">No changes</li>
          {:else}
            {#each gitStore.files as file (file.path)}
              <li class="git-file-row">
                <label class="git-file-label">
                  <input
                    type="checkbox"
                    checked={file.staged}
                    disabled={gitStore.loading}
                    onchange={() => toggleFileStaged(file)}
                  />
                  <span class="git-file-status">{file.status}</span>
                  <span class="git-file-path">{file.path}</span>
                </label>
              </li>
            {/each}
          {/if}
        </ul>

        <label class="git-commit-label">
          Commit message
          <textarea
            class="git-commit-input"
            rows="4"
            bind:value={gitStore.commitMessage}
            placeholder="Describe your changes…"
            disabled={gitStore.loading}
          ></textarea>
        </label>

        <div class="git-modal-actions">
          <button
            type="button"
            class="git-modal-btn primary"
            disabled={gitStore.loading}
            onclick={commitOnly}
          >
            COMMIT
          </button>
          <button
            type="button"
            class="git-modal-btn primary"
            disabled={gitStore.loading}
            onclick={commitAndPush}
          >
            PUSH &amp; COMMIT
          </button>
        </div>
      </div>
    {:else}
      <div class="git-modal-body">
        <ul class="gitignore-list">
          {#if gitStore.gitignorePatterns.length === 0}
            <li class="git-file-empty">No patterns in .gitignore</li>
          {:else}
            {#each gitStore.gitignorePatterns as pattern (pattern)}
              <li class="gitignore-row">
                <code class="gitignore-pattern">{pattern}</code>
                <button
                  type="button"
                  class="git-modal-btn ghost"
                  disabled={gitStore.loading}
                  onclick={() => removeGitignorePattern(pattern)}
                >
                  Remove
                </button>
              </li>
            {/each}
          {/if}
        </ul>

        <div class="gitignore-add">
          <input
            type="text"
            class="gitignore-input"
            placeholder="New pattern…"
            bind:value={gitStore.newGitignorePattern}
            disabled={gitStore.loading}
            onkeydown={(e) => e.key === "Enter" && addGitignorePattern()}
          />
          <button
            type="button"
            class="git-modal-btn"
            disabled={gitStore.loading}
            onclick={addGitignorePattern}
          >
            Add
          </button>
        </div>
      </div>
    {/if}

    {#if gitStore.loading}
      <p class="git-modal-wait">Working…</p>
    {/if}
  </div>
{/if}

<style>
  .git-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0, 0, 0, 0.65);
  }

  .git-modal {
    position: fixed;
    z-index: 201;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(500px, calc(100vw - 32px), calc(80vh - 38px));
    aspect-ratio: 4 / 5;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #0a0a0a;
    border: 1px solid var(--panel-border);
    border-radius: 4px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
    font: inherit;
    color: var(--text);
  }

  .git-modal-header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--panel-border);
  }

  .git-modal-gh-icon {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    color: var(--text);
    margin-top: 2px;
  }

  .git-modal-header-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .git-modal-repo-select-label {
    display: block;
    color: var(--text-muted);
    font-size: 0.62em;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .git-modal-repo-select {
    width: 100%;
    min-width: 0;
    height: 28px;
    padding: 0 28px 0 8px;
    border: 1px solid #2f2f2f;
    border-radius: 3px;
    appearance: none;
    background:
      linear-gradient(45deg, transparent 50%, var(--text-muted) 50%) calc(100% - 13px) 12px / 5px 5px no-repeat,
      linear-gradient(135deg, var(--text-muted) 50%, transparent 50%) calc(100% - 8px) 12px / 5px 5px no-repeat,
      #111111;
    color: var(--text);
    font: inherit;
    font-size: 0.82em;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }

  .git-modal-repo-select:focus {
    border-color: #555555;
    outline: none;
  }

  .git-modal-repo-select option {
    background: #111111;
    color: var(--text);
  }

  .git-modal-branch {
    display: inline-block;
    margin-top: 4px;
    padding: 2px 8px;
    border: 1px solid #333333;
    border-radius: 2px;
    font-size: 0.72em;
    color: var(--text-muted);
  }

  .git-modal-close {
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 1.25em;
    line-height: 1;
    cursor: pointer;
    padding: 0 4px;
  }

  .git-modal-close:hover {
    color: var(--text);
  }

  .git-modal-tabs {
    display: flex;
    border-bottom: 1px solid var(--panel-border);
  }

  .git-modal-tab {
    flex: 1;
    padding: 8px 12px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font: inherit;
    font-size: 0.72em;
    font-weight: 600;
    letter-spacing: 0.06em;
    cursor: pointer;
  }

  .git-modal-tab.active {
    color: var(--text);
    background: #161616;
    box-shadow: inset 0 -2px 0 var(--accent, #aacc00);
  }

  .git-modal-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 14px 14px;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }

  .git-modal-toolbar {
    display: flex;
    gap: 8px;
  }

  .git-file-list,
  .gitignore-list {
    list-style: none;
    margin: 0;
    padding: 0;
    flex: 1;
    min-height: 0;
    overflow: auto;
    border: 1px solid #2a2a2a;
    background: #111111;
  }

  .git-file-row,
  .gitignore-row {
    border-bottom: 1px solid #222222;
  }

  .git-file-row:last-child,
  .gitignore-row:last-child {
    border-bottom: none;
  }

  .git-file-label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 0.78em;
  }

  .git-file-status {
    flex-shrink: 0;
    min-width: 4.5em;
    color: var(--text-muted);
    text-transform: lowercase;
  }

  .git-file-path {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .git-file-empty {
    padding: 10px 8px;
    color: var(--text-muted);
    font-size: 0.78em;
  }

  .git-commit-label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.72em;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .git-commit-input {
    font: inherit;
    font-size: 1rem;
    text-transform: none;
    letter-spacing: normal;
    color: var(--text);
    background: #111111;
    border: 1px solid #333333;
    border-radius: 2px;
    padding: 8px;
    resize: vertical;
    min-height: 72px;
  }

  .git-commit-input:focus {
    outline: 1px solid #555555;
    border-color: #555555;
  }

  .gitignore-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 8px;
  }

  .gitignore-pattern {
    font-size: 0.78em;
    color: var(--text);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .gitignore-add {
    display: flex;
    gap: 8px;
  }

  .gitignore-input {
    flex: 1;
    min-width: 0;
    font: inherit;
    font-size: 0.85em;
    color: var(--text);
    background: #111111;
    border: 1px solid #333333;
    border-radius: 2px;
    padding: 6px 8px;
  }

  .git-modal-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .git-modal-btn {
    padding: 6px 12px;
    border: 1px solid #333333;
    border-radius: 2px;
    background: #161616;
    color: var(--text);
    font: inherit;
    font-size: 0.72em;
    font-weight: 600;
    letter-spacing: 0.04em;
    cursor: pointer;
  }

  .git-modal-btn.primary {
    background: #222222;
    border-color: #444444;
  }

  .git-modal-btn.ghost {
    background: transparent;
    padding: 4px 8px;
  }

  .git-modal-btn:hover:not(:disabled) {
    background: #222222;
  }

  .git-modal-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .git-modal-error {
    margin: 0;
    padding: 8px 14px 0;
    color: #f87171;
    font-size: 0.78em;
  }

  .git-modal-wait {
    margin: 0;
    padding: 0 14px 10px;
    color: var(--text-muted);
    font-size: 0.72em;
  }
</style>
