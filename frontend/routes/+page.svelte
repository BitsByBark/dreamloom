<script lang="ts">
  import { onMount } from "svelte";
  import Menubar from "$misc/Menubar.svelte";
  import LeftTabs from "$misc/LeftTabs.svelte";
  import Center from "$panels/center/index.svelte";
  import RightTabs from "$misc/RightTabs.svelte";
  import { logPanelToggled } from "$debug/logging.svelte";
  import { layout } from "$lib/layout.svelte";
  import { mountPreviewMessageListener } from "$lib/preview-listener";
  import {
    saveLayout,
    RAIL_WIDTH,
    MIN_PANEL_WIDTH,
  } from "$lib/layout-storage";

  $effect(() => {
    saveLayout(layout);
  });

  onMount(() => mountPreviewMessageListener());

  type ResizeSide = "left" | "right";

  let resizeSide = $state<ResizeSide | null>(null);
  let resizeStartX = 0;
  let resizeStartLeft = 0;
  let resizeStartRight = 0;
  let activeHandle: HTMLElement | null = null;

  function toggleLeft() {
    layout.leftCollapsed = !layout.leftCollapsed;
    logPanelToggled("left", layout.leftCollapsed);
  }

  function toggleRight() {
    layout.rightCollapsed = !layout.rightCollapsed;
    logPanelToggled("right", layout.rightCollapsed);
  }

  function startResize(side: ResizeSide, event: PointerEvent) {
    if (side === "left" && layout.leftCollapsed) return;
    if (side === "right" && layout.rightCollapsed) return;

    resizeSide = side;
    resizeStartX = event.clientX;
    resizeStartLeft = layout.leftWidth;
    resizeStartRight = layout.rightWidth;
    activeHandle = event.currentTarget as HTMLElement;
    activeHandle.setPointerCapture(event.pointerId);
  }

  function onResizeMove(event: PointerEvent) {
    if (!resizeSide) return;

    const delta = event.clientX - resizeStartX;

    if (resizeSide === "left") {
      layout.leftWidth = Math.max(MIN_PANEL_WIDTH, resizeStartLeft + delta);
    } else {
      layout.rightWidth = Math.max(MIN_PANEL_WIDTH, resizeStartRight - delta);
    }
  }

  function endResize(event: PointerEvent) {
    if (!resizeSide) return;

    activeHandle?.releasePointerCapture(event.pointerId);
    activeHandle = null;
    resizeSide = null;
  }

  const leftWidth = $derived(layout.leftCollapsed ? RAIL_WIDTH : layout.leftWidth);
  const rightWidth = $derived(layout.rightCollapsed ? RAIL_WIDTH : layout.rightWidth);
</script>

<svelte:window
  onpointermove={onResizeMove}
  onpointerup={endResize}
  onpointercancel={endResize}
/>

<div class="app">
  <Menubar />

  <div class="shell">
  <aside
    class="panel left"
    class:collapsed={layout.leftCollapsed}
    style:width="{leftWidth}px"
  >
    {#if layout.leftCollapsed}
      <button
        type="button"
        class="panel-toggle ui-chrome"
        aria-label="Expand left panel"
        onclick={toggleLeft}
      >
        <span class="rail-icon" aria-hidden="true">☰</span>
      </button>
    {:else}
      <LeftTabs />
    {/if}
  </aside>

  {#if !layout.leftCollapsed}
    <div
      class="resize-handle"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize left panel"
      onpointerdown={(event) => startResize("left", event)}
    ></div>
  {/if}

  <main class="panel center">
    <Center />
  </main>

  {#if !layout.rightCollapsed}
    <div
      class="resize-handle"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize right panel"
      onpointerdown={(event) => startResize("right", event)}
    ></div>
  {/if}

  <aside
    class="panel right"
    class:collapsed={layout.rightCollapsed}
    style:width="{rightWidth}px"
  >
    {#if layout.rightCollapsed}
      <button
        type="button"
        class="panel-toggle ui-chrome"
        aria-label="Expand right panel"
        onclick={toggleRight}
      >
        <span class="rail-icon" aria-hidden="true">☰</span>
      </button>
    {:else}
      <RightTabs />
    {/if}
  </aside>
  </div>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }

  .shell {
    display: flex;
    flex: 1;
    min-height: 0;
    width: 100%;
    background: var(--bg);
    overflow: hidden;
  }

  .panel {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    background: var(--panel);
    border: 1px solid var(--panel-border);
    overflow: hidden;
  }

  .panel.left:not(.collapsed) {
    flex-direction: row;
  }

  .panel.left:not(.collapsed) :global(.tabs) {
    flex: 1;
    min-width: 0;
    min-height: 0;
  }

  .panel.right:not(.collapsed) {
    flex-direction: row;
    border-right: none;
  }

  .panel.right:not(.collapsed) :global(.tabs) {
    flex: 1;
    min-width: 0;
    min-height: 0;
    height: 100%;
    align-self: stretch;
  }

  .panel.center {
    flex: 1;
    min-width: 0;
    border-left: none;
    border-right: none;
  }

  .panel.collapsed {
    align-items: center;
  }

  .panel-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    min-height: 40px;
    padding: 0 12px;
    border: none;
    border-bottom: 1px solid var(--panel-border);
    background: transparent;
    color: var(--text);
    cursor: pointer;
    flex-shrink: 0;
  }

  .panel.collapsed .panel-toggle {
    justify-content: center;
    padding: 0;
    border-bottom: none;
  }

  .panel-toggle:hover {
    background: #1c1c1c;
  }

  .rail-icon {
    color: var(--text-muted);
    font-size: 16px;
    line-height: 1;
  }

  .resize-handle {
    flex-shrink: 0;
    width: 4px;
    cursor: col-resize;
    background: var(--handle);
    transition: background 0.15s;
  }

  .resize-handle:hover,
  .resize-handle:active {
    background: var(--handle-hover);
  }
</style>
