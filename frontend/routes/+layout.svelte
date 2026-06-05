<script lang="ts">
  import "@fontsource/ibm-plex-mono/400.css";
  import "../app.css";
  import { initSessionLogFile } from "$debug/log-file";
  import { appState } from "$lib/app-state.svelte";
  import GitModal from "$git/GitModal.svelte";
  import GitHubDeviceModal from "$misc/GitHubDeviceModal.svelte";
  import WelcomeModal from "$misc/WelcomeModal.svelte";
  import { hydrateAuth } from "$auth/authStore.svelte";
  import { applyWindowDecorations } from "$lib/window-decorations";
  import { initSettings, settings } from "$settings/settings.svelte";
  import { performUndo } from "$history/undoStore";

  let { children } = $props();

  function handleGlobalKeydown(event: KeyboardEvent) {
    // Ctrl/Cmd+Z (not Shift) — undo the last property change.
    if (!(event.ctrlKey || event.metaKey) || event.shiftKey || event.key.toLowerCase() !== "z") {
      return;
    }
    // CodeMirror owns undo when focus is inside the editor.
    const target = event.target;
    if (target instanceof Element && target.closest(".cm-editor")) {
      return;
    }
    event.preventDefault();
    void performUndo();
  }

  let ready = $state(false);

  $effect(() => {
    void initSettings().then(async () => {
      await initSessionLogFile();
      ready = true;
      void hydrateAuth();
    });
  });

  $effect(() => {
    if (!ready) {
      return;
    }
    void applyWindowDecorations(settings.windowDecorations);
  });

  $effect(() => {
    document.documentElement.style.setProperty("--ui-zoom", String(settings.uiZoom));
    document.documentElement.style.setProperty("--text-zoom", String(settings.textZoom));
    document.documentElement.style.setProperty(
      "--log-font-size",
      `${settings.logFontSize}px`,
    );
  });
</script>

{#if ready && !appState.openDirectory}
  <WelcomeModal />
{/if}

<svelte:window onkeydown={handleGlobalKeydown} />

<GitHubDeviceModal />
<GitModal />

{@render children()}
