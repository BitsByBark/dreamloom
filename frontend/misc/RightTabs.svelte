<script lang="ts">
  import "./tab-rail.css";
  import { logRightTab } from "$debug/logging.svelte";
  import { clearEditorBridgeSelection } from "$lib/bridge-selection.svelte";
  import { appState, type RightTab } from "$lib/app-state.svelte";
  import Editor from "$panels/editor/index.svelte";
  import Properties from "$panels/properties/index.svelte";
  import CssVars from "$panels/css-vars/index.svelte";

  type Props = {
    onCollapse: () => void;
  };

  let { onCollapse }: Props = $props();

  const tabs: { id: RightTab; label: string }[] = [
    { id: "editor", label: "Editor" },
    { id: "properties", label: "Properties" },
    { id: "cssVars", label: "CSS Vars" },
  ];

  function selectTab(tab: RightTab) {
    if (appState.rightTab === tab) {
      return;
    }

    // editor and properties are mutually exclusive — picking one clears the other’s bridge state
    if (tab === "properties") {
      clearEditorBridgeSelection();
    }

    appState.rightTab = tab;
    logRightTab(tab);
  }
</script>

<div class="tabs tabs-right">
  <div class="right-panel">
    <button
      type="button"
      class="panel-toggle ui-chrome"
      aria-label="Collapse right panel"
      onclick={onCollapse}
    >
      <span class="collapse-hint" aria-hidden="true">▸</span>
      <span class="panel-label">Right</span>
    </button>

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
