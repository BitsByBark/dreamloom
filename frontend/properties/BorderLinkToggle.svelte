<script lang="ts">
  import "./properties-theme.css";
  import { ACCENT_COLOR } from "$settings/storage";

  type Props = {
    linked?: boolean;
    label?: string;
    /** Button label (e.g. STYLE, WIDTH, RADIUS). */
    toggleLabel?: string;
  };

  let {
    linked = $bindable(false),
    label = "Link sides",
    toggleLabel = "LINK",
  }: Props = $props();
</script>

<button
  type="button"
  class="prop-link-toggle"
  class:active={linked}
  style:--toggle-accent={ACCENT_COLOR}
  aria-pressed={linked}
  title={label}
  onclick={() => (linked = !linked)}
>
  <span class="prop-link-toggle-label">{toggleLabel}</span>
</button>
