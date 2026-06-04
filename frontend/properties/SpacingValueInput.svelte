<script lang="ts">
  import "./properties-theme.css";
  import PropUnitSelect from "./PropUnitSelect.svelte";
  import type { SpacingUnit } from "./spacing-fields";

  type Props = {
    value?: string;
    unit?: SpacingUnit;
    units: readonly SpacingUnit[];
    disabled?: boolean;
    ariaLabel?: string;
  };

  let {
    value = $bindable(""),
    unit = $bindable("px" as SpacingUnit),
    units,
    disabled = false,
    ariaLabel = "Spacing value",
  }: Props = $props();

  const isAuto = $derived(unit === "auto");
</script>

<div class="spacing-value-input">
  <input
    type="text"
    class="prop-input spacing-value-amount"
    disabled={disabled || isAuto}
    bind:value
    placeholder="—"
    aria-label={ariaLabel}
    inputmode="decimal"
  />
  <PropUnitSelect options={units} bind:value={unit} {disabled} listboxId={`${ariaLabel}-unit`} />
</div>
