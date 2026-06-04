<script lang="ts">
  import "./properties-theme.css";

  type Props = {
    options: readonly string[];
    value?: string;
    disabled?: boolean;
    listboxId?: string;
    onchange?: () => void;
    /** Display label for option value (e.g. "—" → "—"). */
    formatOption?: (value: string) => string;
  };

  let {
    options,
    value = $bindable(""),
    disabled = false,
    listboxId = "prop-unit-listbox",
    onchange,
    formatOption = (v) => v,
  }: Props = $props();

  let open = $state(false);
  let highlightIndex = $state(-1);
  let rootEl: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (target && rootEl?.contains(target)) {
        return;
      }
      closeList();
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  });

  function closeList() {
    open = false;
    highlightIndex = -1;
  }

  function toggleList() {
    if (disabled) {
      return;
    }
    open = !open;
    highlightIndex = options.length > 0 ? Math.max(0, options.indexOf(value)) : 0;
  }

  function pickOption(next: string) {
    value = next;
    closeList();
    onchange?.();
  }

  function onTriggerKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeList();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        toggleList();
        return;
      }
      const opt = options[highlightIndex];
      if (opt) {
        pickOption(opt);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        open = true;
      }
      highlightIndex = (highlightIndex + 1) % options.length;
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        open = true;
      }
      highlightIndex = (highlightIndex - 1 + options.length) % options.length;
    }
  }
</script>

<div class="prop-unit-select-wrap" bind:this={rootEl}>
  <button
    type="button"
    class="prop-unit-select"
    {disabled}
    aria-expanded={open}
    aria-haspopup="listbox"
    aria-controls={listboxId}
    onclick={toggleList}
    onkeydown={onTriggerKeydown}
  >
    <span class="prop-unit-select-label">{formatOption(value)}</span>
    <span class="prop-unit-select-chevron" aria-hidden="true">▾</span>
  </button>

  {#if open}
    <ul id={listboxId} class="prop-combobox-list prop-unit-select-list" role="listbox">
      {#each options as option, index (option)}
        <li>
          <button
            type="button"
            class="prop-combobox-option"
            class:active={highlightIndex === index}
            role="option"
            aria-selected={value === option}
            onclick={() => pickOption(option)}
          >
            {formatOption(option)}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
