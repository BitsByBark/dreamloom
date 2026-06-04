<script lang="ts">
  import "./properties-theme.css";
  import { maybeCommitProperty } from "$injector";

  type Props = {
    options: readonly string[];
    value?: string;
    disabled?: boolean;
    allowEmpty?: boolean;
    emptyLabel?: string;
    cssProperty?: string;
    onValueChange?: (value: string) => void;
  };

  let {
    options,
    value = $bindable(""),
    disabled = false,
    allowEmpty = true,
    emptyLabel = "—",
    cssProperty,
    onValueChange,
  }: Props = $props();

  function handleChange(event: Event) {
    const next = (event.currentTarget as HTMLSelectElement).value;
    value = next;
    onValueChange?.(next);
    maybeCommitProperty(cssProperty, next);
  }
</script>

<div class="prop-select-wrap">
  <select class="prop-select" {value} {disabled} onchange={handleChange}>
    {#if allowEmpty}
      <option value="">{emptyLabel}</option>
    {/if}
    {#each options as option (option)}
      <option value={option}>{option}</option>
    {/each}
  </select>
  <span class="prop-select-chevron" aria-hidden="true">▾</span>
</div>
