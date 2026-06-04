<script lang="ts">
  import "./properties-theme.css";
  import LayoutField from "./LayoutField.svelte";
  import PropUnitSelect from "./PropUnitSelect.svelte";
  import {
    ASPECT_RATIO_UNITS,
    aspectAmountDisabled,
    composeAspectSlot,
    parseAspectSlot,
    type AspectRatioUnit,
  } from "./size-fields";

  type Props = {
    label: string;
    value?: string;
    disabled?: boolean;
  };

  let { label, value = $bindable(""), disabled = false }: Props = $props();

  let amount = $state("");
  let unit = $state<AspectRatioUnit>("—");

  $effect(() => {
    const parsed = parseAspectSlot(value);
    amount = parsed.amount;
    unit = parsed.unit;
  });

  function commit() {
    value = composeAspectSlot(amount, unit);
  }

  function onUnitChange() {
    if (aspectAmountDisabled(unit)) {
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
      disabled={disabled || aspectAmountDisabled(unit)}
      oninput={commit}
    />
    <PropUnitSelect
      options={ASPECT_RATIO_UNITS}
      bind:value={unit}
      {disabled}
      listboxId={`aspect-unit-${label}`}
      onchange={onUnitChange}
    />
  </div>
</LayoutField>
