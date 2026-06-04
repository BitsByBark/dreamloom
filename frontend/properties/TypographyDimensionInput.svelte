<script lang="ts">
  import { untrack } from "svelte";
  import "./properties-theme.css";
  import { maybeCommitProperty } from "$injector";
  import LayoutField from "./LayoutField.svelte";
  import PropUnitSelect from "./PropUnitSelect.svelte";
  import {
    composeTypographyDimension,
    parseTypographyDimension,
    typographyAmountDisabled,
  } from "./typography-fields";

  type Props = {
    label: string;
    value?: string;
    disabled?: boolean;
    units: readonly string[];
    keywordUnits?: Set<string>;
    defaultUnit: string;
    cssProperty?: string;
  };

  let {
    label,
    value = $bindable(""),
    disabled = false,
    units,
    keywordUnits = new Set<string>(),
    defaultUnit,
    cssProperty,
  }: Props = $props();

  let amount = $state("");
  let unit = $state(untrack(() => defaultUnit));

  $effect(() => {
    const parsed = parseTypographyDimension(value, units, keywordUnits, defaultUnit);
    amount = parsed.amount;
    unit = parsed.unit;
  });

  function commit() {
    const next = composeTypographyDimension(amount, unit, keywordUnits);
    value = next;
    maybeCommitProperty(cssProperty, next);
  }

  function onUnitChange() {
    if (typographyAmountDisabled(unit, keywordUnits)) {
      amount = "";
    }
    commit();
  }
</script>

<LayoutField {label}>
  <div class="prop-size-row">
    <input
      type="number"
      class="prop-input prop-size-amount"
      placeholder="—"
      bind:value={amount}
      disabled={disabled || typographyAmountDisabled(unit, keywordUnits)}
      oninput={commit}
    />
    <PropUnitSelect
      options={units}
      bind:value={unit}
      {disabled}
      listboxId={`typography-unit-${label}`}
      onchange={onUnitChange}
    />
  </div>
</LayoutField>
