<script lang="ts">
  import "./properties-theme.css";
  import LayoutField from "./LayoutField.svelte";
  import PropUnitSelect from "./PropUnitSelect.svelte";
  import {
    composeSizeValue,
    parseSizeValue,
    sizeAmountDisabled,
    SIZE_DIMENSION_UNITS,
    type SizeDimensionUnit,
  } from "./size-fields";

  type Props = {
    label: string;
    value?: string;
    disabled?: boolean;
  };

  let { label, value = $bindable(""), disabled = false }: Props = $props();

  let amount = $state("");
  let unit = $state<SizeDimensionUnit>("px");

  $effect(() => {
    const parsed = parseSizeValue(value);
    amount = parsed.amount;
    unit = parsed.unit;
  });

  function commit() {
    value = composeSizeValue(amount, unit);
  }

  function onUnitChange() {
    if (sizeAmountDisabled(unit)) {
      amount = "";
    }
    commit();
  }
</script>

<LayoutField {label}>
  <div class="prop-size-row">
    <input
      type="text"
      class="prop-input prop-size-amount"
      inputmode="decimal"
      placeholder="—"
      bind:value={amount}
      disabled={disabled || sizeAmountDisabled(unit)}
      oninput={commit}
    />
    <PropUnitSelect
      options={SIZE_DIMENSION_UNITS}
      bind:value={unit}
      {disabled}
      listboxId={`size-unit-${label}`}
      onchange={onUnitChange}
    />
  </div>
</LayoutField>
