<script lang="ts">
  import "@fontsource/ibm-plex-mono/400.css";
  import "../app.css";
  import { initSessionLogFile } from "$debug/log-file";
  import { appState } from "$lib/app-state.svelte";
  import { centerTabs } from "$lib/center-tabs.svelte";
  import { restoreSession } from "$lib/restore-session";
  import { saveSession } from "$lib/session-storage";
  import { initSettings, settings } from "$settings/settings.svelte";

  let { children } = $props();

  let sessionReady = $state(false);

  $effect(() => {
    void initSettings().then(async () => {
      await initSessionLogFile();
      await restoreSession();
      sessionReady = true;
    });
  });

  $effect(() => {
    if (!sessionReady) {
      return;
    }

    saveSession({
      openDirectory: appState.openDirectory,
      tabPaths: centerTabs.tabs.map((tab) => tab.path),
      activePath: centerTabs.activePath,
    });
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

{@render children()}
