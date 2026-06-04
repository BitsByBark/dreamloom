<script lang="ts">
  import "./properties-theme.css";
  import { maybeCommitProperty } from "$injector";
  import { ACCENT_COLOR } from "$settings/storage";
  import { TEXT_ALIGN_TOGGLES } from "./typography-fields";

  type Props = {
    value?: string;
    disabled?: boolean;
    cssProperty?: string;
  };

  let { value = $bindable(""), disabled = false, cssProperty }: Props = $props();

  function pick(next: (typeof TEXT_ALIGN_TOGGLES)[number]["value"]) {
    const committed = value === next ? "" : next;
    value = committed;
    maybeCommitProperty(cssProperty, committed);
  }
</script>

<div class="prop-toggle-group" role="group" aria-label="Text align">
  {#each TEXT_ALIGN_TOGGLES as option (option.value)}
    <button
      type="button"
      class="prop-toggle-btn"
      class:active={value === option.value}
      style:--toggle-accent={ACCENT_COLOR}
      aria-pressed={value === option.value}
      aria-label={option.label}
      title={option.label}
      {disabled}
      onclick={() => pick(option.value)}
    >
      <span class="prop-toggle-glyph" aria-hidden="true">{option.glyph}</span>
    </button>
  {/each}
</div>
