<script lang="ts">
  import "./properties-theme.css";
  import type { SpacingSideValue, SpacingUnit } from "./spacing-fields";
  import SpacingValueInput from "./SpacingValueInput.svelte";

  type Props = {
    top: SpacingSideValue;
    right: SpacingSideValue;
    bottom: SpacingSideValue;
    left: SpacingSideValue;
    units: readonly SpacingUnit[];
    disabled?: boolean;
    prefix: string;
  };

  let {
    top = $bindable(),
    right = $bindable(),
    bottom = $bindable(),
    left = $bindable(),
    units,
    disabled = false,
    prefix,
  }: Props = $props();
</script>

<div class="spacing-cross">
  <div class="spacing-cross-top">
    <SpacingValueInput
      bind:value={top.value}
      bind:unit={top.unit}
      {units}
      {disabled}
      ariaLabel="{prefix} top"
    />
  </div>

  <div class="spacing-cross-left">
    <SpacingValueInput
      bind:value={left.value}
      bind:unit={left.unit}
      {units}
      {disabled}
      ariaLabel="{prefix} left"
    />
  </div>

  <div class="spacing-cross-center" aria-hidden="true"></div>

  <div class="spacing-cross-right">
    <SpacingValueInput
      bind:value={right.value}
      bind:unit={right.unit}
      {units}
      {disabled}
      ariaLabel="{prefix} right"
    />
  </div>

  <div class="spacing-cross-bottom">
    <SpacingValueInput
      bind:value={bottom.value}
      bind:unit={bottom.unit}
      {units}
      {disabled}
      ariaLabel="{prefix} bottom"
    />
  </div>
</div>
