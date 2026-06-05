<script lang="ts">
  import "./tab-rail.css";
  import { logRightTab } from "$debug/logging.svelte";
  import { appState, type RightTab } from "$lib/app-state.svelte";
  import Editor from "$panels/editor/index.svelte";
  import Properties from "$panels/properties/index.svelte";

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
      {:else if appState.rightTab === "cssVars"}
        {#await import("../src/panels/CssVarsPanel.svelte") then { default: CssVarsPanel }}
          <CssVarsPanel />
        {:catch error}
          <p class="css-vars-load-error">
            CSS Vars failed to load: {error instanceof Error ? error.message : String(error)}
          </p>
        {/await}
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

<style>
  .css-vars-load-error {
    margin: 0;
    padding: 10px 12px;
    color: #e57373;
    font-size: 12px;
  }
</style>
