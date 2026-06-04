<script lang="ts">
  import "./tab-rail.css";
  import { logRightTab } from "$debug/logging.svelte";
  import { appState, type RightTab } from "$lib/app-state.svelte";
  import Editor from "$panels/editor/index.svelte";
  import Properties from "$panels/properties/index.svelte";
  import CssVars from "$panels/css-vars/index.svelte";

  const tabs: { id: RightTab; label: string }[] = [
    { id: "properties", label: "Properties" },
    { id: "editor", label: "Editor" },
    { id: "cssVars", label: "CSS Vars" },
  ];

  function selectTab(tab: RightTab) {
    if (appState.rightTab === tab) {
      return;
    }

    appState.rightTab = tab;
    logRightTab(tab);
  }
</script>

<div class="tabs tabs-right">
  <div class="right-panel">
    <div class="tab-content text-zoom">
      {#if appState.rightTab === "editor"}
        <Editor />
      {:else if appState.rightTab === "properties"}
        <Properties />
      {:else}
        <CssVars />
      {/if}
    </div>
  </div>

  <nav class="tab-rail tab-rail-end ui-chrome" aria-label="Right panel tabs">
    {#each tabs as tab}
      <button
        type="button"
        class="tab-btn"
        class:active={appState.rightTab === tab.id}
        aria-current={appState.rightTab === tab.id ? "page" : undefined}
        onclick={() => selectTab(tab.id)}
      >
        <span class="tab-label">{tab.label}</span>
      </button>
    {/each}
  </nav>
</div>
