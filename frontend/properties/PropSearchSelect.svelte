<script lang="ts">
  import "./properties-theme.css";
  import { maybeCommitProperty } from "$injector";

  type ListRow = { kind: "option"; value: string } | { kind: "hint"; message: string } | { kind: "empty" };

  type Props = {
    options: readonly string[];
    value?: string;
    disabled?: boolean;
    placeholder?: string;
    allowEmpty?: boolean;
    listboxId?: string;
    cssProperty?: string;
  };

  let {
    options,
    value = $bindable(""),
    disabled = false,
    placeholder = "Search…",
    allowEmpty = true,
    listboxId = "prop-search-listbox",
    cssProperty,
  }: Props = $props();

  let query = $state("");
  let open = $state(false);
  let highlightIndex = $state(-1);
  let rootEl: HTMLDivElement | undefined = $state();

  const allOptions = $derived(allowEmpty ? ["", ...options] : [...options]);

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return allOptions;
    }
    return allOptions.filter((opt) => opt.toLowerCase().includes(q));
  });

  const rows = $derived.by((): ListRow[] => {
    const items: ListRow[] = filtered.map((opt) => ({ kind: "option", value: opt }));

    if (items.length === 0) {
      if (!query.trim() && allOptions.length === 0) {
        return [{ kind: "empty" }];
      }
      const message = query.trim() ? "No matches" : "Type to search…";
      return [{ kind: "hint", message }];
    }

    return items;
  });

  const selectableRows = $derived(rows.filter((r) => r.kind === "option"));

  $effect(() => {
    value;
    if (!open) {
      query = value ?? "";
    }
  });

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

  function optionLabel(opt: string): string {
    return opt === "" ? "—" : opt;
  }

  function openList() {
    if (disabled) {
      return;
    }
    open = true;
    highlightIndex = selectableRows.length > 0 ? 0 : -1;
  }

  function closeList() {
    open = false;
    highlightIndex = -1;
  }

  function pickOption(next: string) {
    query = next;
    value = next;
    closeList();
    maybeCommitProperty(cssProperty, next);
  }

  function activateHighlighted() {
    const row = selectableRows[highlightIndex];
    if (!row || row.kind !== "option") {
      return;
    }
    pickOption(row.value);
  }

  function onInputFocus() {
    openList();
  }

  function onInputInput() {
    openList();
    highlightIndex = selectableRows.length > 0 ? 0 : -1;
  }

  function onInputKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeList();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      if (selectableRows.length === 0) {
        return;
      }
      highlightIndex = (highlightIndex + 1) % selectableRows.length;
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open || selectableRows.length === 0) {
        return;
      }
      highlightIndex = (highlightIndex - 1 + selectableRows.length) % selectableRows.length;
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      activateHighlighted();
    }
  }

  function isHighlighted(rowIndex: number): boolean {
    let si = 0;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.kind !== "option") {
        continue;
      }
      if (i === rowIndex) {
        return si === highlightIndex;
      }
      si++;
    }
    return false;
  }
</script>

<div class="prop-combobox prop-root" bind:this={rootEl}>
  <input
    type="text"
    class="prop-input"
    {placeholder}
    bind:value={query}
    {disabled}
    role="combobox"
    aria-autocomplete="list"
    aria-expanded={open}
    aria-controls={listboxId}
    onfocus={onInputFocus}
    oninput={onInputInput}
    onkeydown={onInputKeydown}
  />

  {#if open}
    <ul id={listboxId} class="prop-combobox-list" role="listbox">
      {#each rows as row, index (row.kind === "option" ? `opt-${row.value}` : row.kind)}
        {#if row.kind === "option"}
          <li>
            <button
              type="button"
              class="prop-combobox-option"
              class:active={isHighlighted(index)}
              role="option"
              aria-selected={isHighlighted(index)}
              onclick={() => pickOption(row.value)}
            >
              {optionLabel(row.value)}
            </button>
          </li>
        {:else if row.kind === "hint"}
          <li class="prop-combobox-empty">{row.message}</li>
        {:else}
          <li class="prop-combobox-empty">No options</li>
        {/if}
      {/each}
    </ul>
  {/if}
</div>
