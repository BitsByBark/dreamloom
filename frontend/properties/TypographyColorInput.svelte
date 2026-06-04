<script lang="ts">
  import "./properties-theme.css";
  import { maybeCommitProperty } from "$injector";

  type Props = {
    value?: string;
    disabled?: boolean;
    cssProperty?: string;
    onValueChange?: (value: string) => void;
  };

  let { value = $bindable(""), disabled = false, cssProperty, onValueChange }: Props = $props();

  function notify() {
    onValueChange?.(value);
    maybeCommitProperty(cssProperty, value);
  }

  const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

  const pickerValue = $derived(HEX_RE.test(value.trim()) ? value.trim() : "#808080");

  const swatchColor = $derived(HEX_RE.test(value.trim()) ? value.trim() : "transparent");

  function onPickerInput(event: Event) {
    const el = event.currentTarget as HTMLInputElement;
    value = el.value.toUpperCase();
    notify();
  }

  function onHexBlur(event: Event) {
    const el = event.currentTarget as HTMLInputElement;
    const trimmed = el.value.trim();
    if (trimmed === "") {
      value = "";
      notify();
      return;
    }
    if (HEX_RE.test(trimmed)) {
      value = trimmed.toUpperCase();
      notify();
      return;
    }
    const bare = trimmed.match(/^([0-9A-Fa-f]{6})$/);
    if (bare) {
      value = `#${bare[1].toUpperCase()}`;
      notify();
    }
  }
</script>

<div class="prop-color-row">
  <label class="prop-color-swatch-wrap">
    <span
      class="prop-color-swatch"
      class:empty={swatchColor === "transparent"}
      style:background-color={swatchColor === "transparent" ? undefined : swatchColor}
      aria-hidden="true"
    ></span>
    <input
      type="color"
      class="prop-color-picker-hit"
      value={pickerValue}
      {disabled}
      aria-label="Pick color"
      oninput={onPickerInput}
    />
  </label>

  <input
    type="text"
    class="prop-input prop-color-hex"
    placeholder="#000000"
    bind:value
    spellcheck="false"
    maxlength="7"
    {disabled}
    onblur={onHexBlur}
  />
</div>
