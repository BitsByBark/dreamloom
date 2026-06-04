<script lang="ts">
  import "./tab-rail.css";
  import { logLeftTab } from "$debug/logging.svelte";
  import { appState, type LeftTab } from "$lib/app-state.svelte";
  import { settings } from "$settings/settings.svelte";
  import Git from "$panels/git/index.svelte";
  import Log from "$panels/log/index.svelte";
  import Repo from "$panels/repo/index.svelte";
  import Tree from "$panels/tree/index.svelte";

  type Props = {
    onCollapse: () => void;
  };

  let { onCollapse }: Props = $props();

  const tabs = $derived.by(() => {
    const items: { id: LeftTab; label: string }[] = [
      { id: "repo", label: "Repo" },
      { id: "tree", label: "Component Tree" },
      { id: "git", label: "Git" },
    ];

    if (settings.debugMode) {
      items.push({ id: "log", label: "Log" });
    }

    return items;
  });

  $effect(() => {
    if (!settings.debugMode && appState.leftTab === "log") {
      appState.leftTab = "repo";
    }
  });

  function selectTab(tab: LeftTab) {
    if (appState.leftTab === tab) {
      return;
    }

    appState.leftTab = tab;
    logLeftTab(tab);
  }
</script>

<div class="tabs">
  <nav class="tab-rail ui-chrome" aria-label="Left panel tabs">
    {#each tabs as tab}
      <button
        type="button"
        class="tab-btn"
        class:active={appState.leftTab === tab.id}
        aria-current={appState.leftTab === tab.id ? "page" : undefined}
        onclick={() => selectTab(tab.id)}
      >
        <span class="tab-label">{tab.label}</span>
      </button>
    {/each}
  </nav>

  <div class="left-panel">
    <button
      type="button"
      class="panel-toggle ui-chrome"
      aria-label="Collapse left panel"
      onclick={onCollapse}
    >
      <span class="panel-label">Left</span>
      <span class="collapse-hint" aria-hidden="true">◂</span>
    </button>

    <div class="tab-content" class:text-zoom={appState.leftTab !== "log"}>
      {#if appState.leftTab === "repo"}
        <Repo />
      {:else if appState.leftTab === "tree"}
        <Tree />
      {:else if appState.leftTab === "git"}
        <Git />
      {:else}
        <Log />
      {/if}
    </div>
  </div>
</div>
