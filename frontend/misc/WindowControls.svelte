<script lang="ts">
  import { getCurrentWindow } from "@tauri-apps/api/window";

  const win = getCurrentWindow();

  let maximized = $state(false);

  $effect(() => {
    let cancelled = false;

    async function syncMaximized() {
      maximized = await win.isMaximized();
    }

    void syncMaximized();
    const unlisten = win.onResized(() => {
      if (!cancelled) {
        void syncMaximized();
      }
    });

    return () => {
      cancelled = true;
      void unlisten.then((fn) => fn());
    };
  });

  function handleMinimize(event: MouseEvent) {
    event.stopPropagation();
    void win.minimize();
  }

  function handleToggleMaximize(event: MouseEvent) {
    event.stopPropagation();
    void win.toggleMaximize();
  }

  function handleClose(event: MouseEvent) {
    event.stopPropagation();
    void win.close();
  }
</script>

<div class="window-controls">
  <button
    type="button"
    class="window-control-btn"
    aria-label="Minimize window"
    onclick={handleMinimize}
  >
    −
  </button>
  <button
    type="button"
    class="window-control-btn"
    aria-label={maximized ? "Restore window" : "Maximize window"}
    onclick={handleToggleMaximize}
  >
    {maximized ? "❐" : "□"}
  </button>
  <button
    type="button"
    class="window-control-btn window-control-close"
    aria-label="Close window"
    onclick={handleClose}
  >
    ×
  </button>
</div>

<style>
  .window-controls {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    padding-right: 12px;
  }

  .window-control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid var(--panel-border);
    background: transparent;
    color: var(--text);
    cursor: pointer;
    font: inherit;
    font-size: 14px;
    line-height: 1;
  }

  .window-control-btn:hover {
    background: #1c1c1c;
  }

  .window-control-close:hover {
    background: rgba(180, 50, 50, 0.25);
    border-color: rgba(180, 50, 50, 0.5);
  }
</style>
