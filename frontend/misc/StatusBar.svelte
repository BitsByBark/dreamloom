<script lang="ts">
  import { appState } from "$lib/app-state.svelte";
  import { fetchBuildInfo } from "$lib/build-info";
  import VersionInfoModal from "$misc/VersionInfoModal.svelte";
  import { authStore, refreshRepoMetrics } from "$auth/authStore.svelte";
  import { openGitModal } from "$git/gitStore.svelte";
  import { settings } from "$settings/settings.svelte";

  const MAX_DIFF_BLOCKS = 8;

  const metrics = $derived(authStore.repoMetrics);
  const hasProject = $derived(Boolean(appState.openDirectory));
  const hasMetrics = $derived(Boolean(hasProject && metrics));

  const filesChangedLabel = $derived(
    hasMetrics ? String(metrics!.filesChanged) : "—",
  );
  const branchLabel = $derived(
    hasMetrics && metrics!.branch.trim() ? metrics!.branch : "—",
  );

  const linesAdded = $derived(hasMetrics ? metrics!.linesAdded : 0);
  const linesRemoved = $derived(hasMetrics ? metrics!.linesRemoved : 0);

  const diffBlocks = $derived.by(() => {
    if (!hasMetrics) {
      return { added: "", removed: "" };
    }
    const peak = Math.max(linesAdded, linesRemoved, 1);
    const addedLen =
      linesAdded === 0 ? 0 : Math.max(1, Math.round((linesAdded / peak) * MAX_DIFF_BLOCKS));
    const removedLen =
      linesRemoved === 0 ? 0 : Math.max(1, Math.round((linesRemoved / peak) * MAX_DIFF_BLOCKS));
    return {
      added: "█".repeat(addedLen),
      removed: "█".repeat(removedLen),
    };
  });

  const showDiffMetrics = $derived(settings.topbarShowDiff);
  const showFilesMetrics = $derived(settings.topbarShowFilesChanged);
  const showBranch = $derived(settings.topbarShowBranch);

  const showGitMetrics = $derived(showFilesMetrics || showDiffMetrics || showBranch);
  const canOpenGit = $derived(Boolean(appState.openDirectory));

  let versionLabel = $state("");
  let versionModalOpen = $state(false);

  $effect(() => {
    void fetchBuildInfo()
      .then((info) => {
        versionLabel = info.appVersion;
      })
      .catch(() => {
        versionLabel = "";
      });
  });

  $effect(() => {
    appState.openDirectory;
    void refreshRepoMetrics();
  });

  function openVersionModal() {
    versionModalOpen = true;
  }

  function closeVersionModal() {
    versionModalOpen = false;
  }
</script>

<footer class="status-bar ui-chrome" aria-label="Status">
  <button
    type="button"
    class="status-bar-version"
    title="About Dreamloom"
    onclick={openVersionModal}
  >
    {versionLabel || "…"}
  </button>

  <div class="status-bar-spacer" aria-hidden="true"></div>

  {#if showGitMetrics}
    <button
      type="button"
      class="status-bar-git"
      title="Open git panel"
      disabled={!canOpenGit}
      onclick={() => openGitModal()}
    >
      {#if showFilesMetrics}
        <span class="status-bar-metric" title="Files changed since last commit">
          {filesChangedLabel} files
        </span>
      {/if}
      {#if showDiffMetrics}
        <span
          class="status-bar-diff"
          title={hasMetrics
            ? `Diff since last commit: +${linesAdded} / ${linesRemoved} removed`
            : "No project open"}
          aria-label="Diff display: {linesAdded} lines added, {linesRemoved} lines removed"
        >
          <span class="status-bar-diff-side status-bar-diff-added-side">
            <span class="status-bar-diff-added">+{linesAdded}</span>
            {#if diffBlocks.added}
              <span class="status-bar-diff-blocks status-bar-diff-blocks-added" aria-hidden="true"
                >{diffBlocks.added}</span
              >
            {/if}
          </span>
          <span class="status-bar-diff-side status-bar-diff-removed-side">
            {#if diffBlocks.removed}
              <span class="status-bar-diff-blocks status-bar-diff-blocks-removed" aria-hidden="true"
                >{diffBlocks.removed}</span
              >
            {/if}
            <span class="status-bar-diff-removed">{linesRemoved}-</span>
          </span>
        </span>
      {/if}
      {#if showBranch}
        <span class="status-bar-metric" title="Current branch">{branchLabel}</span>
      {/if}
    </button>
  {/if}
</footer>

<VersionInfoModal open={versionModalOpen} onclose={closeVersionModal} />

<style>
  .status-bar {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    min-height: 32px;
    padding: 0 12px;
    gap: 12px;
    background: #0a0a0a;
    border-top: 1px solid var(--panel-border);
    font-size: 0.75em;
  }

  .status-bar-spacer {
    flex: 1;
    min-width: 8px;
  }

  .status-bar-version {
    padding: 4px 0;
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    font: inherit;
    font-size: inherit;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .status-bar-version:hover {
    color: var(--text);
  }

  .status-bar-git {
    display: inline-flex;
    align-items: center;
    gap: 28px;
    padding: 4px 0;
    border: none;
    background: transparent;
    font: inherit;
    cursor: pointer;
    color: inherit;
    margin-left: auto;
  }

  .status-bar-git:hover:not(:disabled) {
    opacity: 0.85;
  }

  .status-bar-git:disabled {
    cursor: default;
    opacity: 0.5;
  }

  .status-bar-metric {
    color: var(--text-muted);
    white-space: nowrap;
  }

  .status-bar-diff {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .status-bar-diff-side {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }

  .status-bar-diff-added {
    color: #6ee7a0;
    font-weight: 600;
  }

  .status-bar-diff-removed {
    color: #f87171;
    font-weight: 600;
  }

  .status-bar-diff-blocks {
    font-size: 0.85em;
    line-height: 1;
    letter-spacing: -0.08em;
  }

  .status-bar-diff-added-side .status-bar-diff-blocks-added,
  .status-bar-diff-added-side .status-bar-diff-added {
    color: #6ee7a0;
  }

  .status-bar-diff-removed-side .status-bar-diff-blocks-removed,
  .status-bar-diff-removed-side .status-bar-diff-removed {
    color: #f87171;
  }
</style>
