<script lang="ts">
  import "./properties-theme.css";
  import { maybeCommitProperty } from "$injector";
  import PropUnitSelect from "./PropUnitSelect.svelte";
  import {
    composeBorderDimension,
    parseBorderDimension,
  } from "./border-fields";

  type Props = {
    value?: string;
    units: readonly string[];
    defaultUnit: string;
    listboxId: string;
    cssProperty?: string;
    onValueChange?: (value: string) => void;
  };

  let { value = $bindable(""), units, defaultUnit, listboxId, cssProperty, onValueChange }: Props =
    $props();

  let amount = $state("");
  let unit = $state(defaultUnit);

  $effect(() => {
    const parsed = parseBorderDimension(value, units, defaultUnit);
    amount = parsed.amount;
    unit = parsed.unit;
  });

  function commit() {
    const next = composeBorderDimension(amount, unit);
    value = next;
    onValueChange?.(next);
    maybeCommitProperty(cssProperty, next);
  }

  function onUnitChange() {
    commit();
  }
</script>

<div class="prop-size-row">
  <input
    type="text"
    class="prop-input prop-size-amount"
    inputmode="decimal"
    placeholder="—"
    bind:value={amount}
    oninput={commit}
  />
  <PropUnitSelect
    options={units}
    bind:value={unit}
    {listboxId}
    onchange={onUnitChange}
  />
</div>
