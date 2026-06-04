<script lang="ts">
  import { appState } from "$lib/app-state.svelte";
  import { authStore, refreshRepoMetrics } from "$auth/authStore.svelte";
  import { settings } from "$settings/settings.svelte";

  const MAX_DIFF_BLOCKS = 8;

  const metrics = $derived(authStore.repoMetrics);
  const hasProject = $derived(Boolean(appState.openDirectory && metrics));
  const filesChangedLabel = $derived(
    hasProject ? String(metrics!.filesChanged) : "—",
  );
  const branchLabel = $derived(
    hasProject && metrics!.branch.trim() ? metrics!.branch : "—",
  );

  const linesAdded = $derived(hasProject ? metrics!.linesAdded : 0);
  const linesRemoved = $derived(hasProject ? metrics!.linesRemoved : 0);

  const diffBlocks = $derived.by(() => {
    if (!hasProject) {
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

  const showDiffMetrics = $derived(hasProject && settings.topbarShowDiff);
  const showFilesMetrics = $derived(hasProject && settings.topbarShowFilesChanged);
  const showBranch = $derived(hasProject && settings.topbarShowBranch);

  const showTopbar = $derived(
    settings.topbarShowAvatar ||
      settings.topbarShowUsername ||
      showDiffMetrics ||
      showFilesMetrics ||
      showBranch,
  );

  $effect(() => {
    appState.openDirectory;
    if (authStore.status === "authenticated") {
      void refreshRepoMetrics();
    }
  });
</script>

{#if authStore.status === "authenticated" && authStore.user && showTopbar}
  <div class="topbar-user">
    <div class="topbar-user-info">
      {#if showFilesMetrics}
        <span class="topbar-user-metric" title="Files changed since last commit">
          {filesChangedLabel} files
        </span>
      {/if}
      {#if showDiffMetrics}
        <span
          class="topbar-diff"
          title="Diff since last commit: +{linesAdded} / {linesRemoved} removed"
          aria-label="Diff display: {linesAdded} lines added, {linesRemoved} lines removed"
        >
          <span class="topbar-diff-side topbar-diff-added-side">
            <span class="topbar-diff-added">+{linesAdded}</span>
            {#if diffBlocks.added}
              <span class="topbar-diff-blocks topbar-diff-blocks-added" aria-hidden="true"
                >{diffBlocks.added}</span
              >
            {/if}
          </span>
          <span class="topbar-diff-side topbar-diff-removed-side">
            {#if diffBlocks.removed}
              <span class="topbar-diff-blocks topbar-diff-blocks-removed" aria-hidden="true"
                >{diffBlocks.removed}</span
              >
            {/if}
            <span class="topbar-diff-removed">{linesRemoved}-</span>
          </span>
        </span>
      {/if}
      {#if showBranch}
        <span class="topbar-user-metric" title="Current branch">{branchLabel}</span>
      {/if}
      {#if settings.topbarShowUsername}
        <span class="topbar-user-name">{authStore.user.login}</span>
      {/if}
      {#if settings.topbarShowAvatar}
        <img
          class="topbar-user-avatar"
          src={authStore.user.avatarUrl}
          alt=""
          width="24"
          height="24"
        />
      {/if}
    </div>
  </div>
{/if}

<style>
  .topbar-user {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    padding-right: 12px;
    min-width: 0;
  }

  .topbar-user-info {
    display: flex;
    align-items: center;
    gap: 28px;
    min-width: 0;
    font-size: 0.75em;
    padding-left: 8px;
  }

  .topbar-user-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    flex-shrink: 0;
    object-fit: cover;
    border: 1px solid var(--panel-border);
  }

  .topbar-user-name {
    color: var(--text);
    font-weight: 600;
    flex-shrink: 0;
  }

  .topbar-user-metric {
    color: var(--text-muted);
    white-space: nowrap;
  }

  .topbar-diff {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .topbar-diff-side {
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }

  .topbar-diff-added {
    color: #6ee7a0;
    font-weight: 600;
  }

  .topbar-diff-removed {
    color: #f87171;
    font-weight: 600;
  }

  .topbar-diff-blocks {
    font-size: 0.85em;
    line-height: 1;
    letter-spacing: -0.08em;
  }

  .topbar-diff-added-side .topbar-diff-blocks-added,
  .topbar-diff-added-side .topbar-diff-added {
    color: #6ee7a0;
  }

  .topbar-diff-removed-side .topbar-diff-blocks-removed,
  .topbar-diff-removed-side .topbar-diff-removed {
    color: #f87171;
  }
</style>
