<script lang="ts">
  import "./properties-theme.css";
  import { maybeCommitProperty } from "$injector";
  import { ACCENT_COLOR } from "$settings/storage";

  type ToggleOption = {
    value: string;
    glyph: string;
    label: string;
  };

  type Props = {
    options: readonly ToggleOption[];
    value?: string;
    disabled?: boolean;
    ariaLabel: string;
    cssProperty?: string;
  };

  let { options, value = $bindable(""), disabled = false, ariaLabel, cssProperty }: Props = $props();

  function pick(next: string) {
    const committed = value === next ? "" : next;
    value = committed;
    maybeCommitProperty(cssProperty, committed);
  }
</script>

<div class="prop-toggle-group" role="group" aria-label={ariaLabel}>
  {#each options as option (option.value)}
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
