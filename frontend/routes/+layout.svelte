<script lang="ts">
  import "@fontsource/ibm-plex-mono/400.css";
  import "../app.css";
  import { initSessionLogFile } from "$debug/log-file";
  import { initSettings, settings } from "$settings/settings.svelte";

  let { children } = $props();

  $effect(() => {
    void initSettings().then(() => initSessionLogFile());
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
