<script lang="ts">
  import "./properties-theme.css";
  import { normalizeDlClass } from "$lib/element-classes";

  type ListRow =
    | { kind: "option"; value: string }
    | { kind: "create"; value: string }
    | { kind: "hint"; message: string }
    | { kind: "empty" };

  type Props = {
    options: string[];
    value?: string;
    disabled?: boolean;
    canCreate?: boolean;
    onSelect: (dlClass: string) => void;
    onCreate: (dlClass: string) => void;
  };

  let {
    options,
    value = "",
    disabled = false,
    canCreate = false,
    onSelect,
    onCreate,
  }: Props = $props();

  let query = $state("");
  let open = $state(false);
  let highlightIndex = $state(-1);
  let rootEl: HTMLDivElement | undefined = $state();

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return options;
    }
    return options.filter((dl) => dl.toLowerCase().includes(q));
  });

  const createCandidate = $derived.by(() => {
    const dl = normalizeDlClass(query);
    if (!dl) {
      return null;
    }
    const exists = options.some((opt) => opt.toLowerCase() === dl.toLowerCase());
    return exists ? null : dl;
  });

  const rows = $derived.by((): ListRow[] => {
    const items: ListRow[] = filtered.map((dl) => ({ kind: "option", value: dl }));

    if (createCandidate && canCreate) {
      items.push({ kind: "create", value: createCandidate });
    }

    if (items.length === 0) {
      if (!query.trim() && options.length === 0) {
        return [{ kind: "empty" }];
      }
      const message = query.trim() ? "No matching classes" : "Type to search…";
      return [{ kind: "hint", message }];
    }

    return items;
  });

  const selectableRows = $derived(rows.filter((r) => r.kind === "option" || r.kind === "create"));

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

  function pickOption(dlClass: string) {
    query = dlClass;
    closeList();
    onSelect(dlClass);
  }

  function pickCreate(dlClass: string) {
    query = dlClass;
    closeList();
    onCreate(dlClass);
  }

  function activateHighlighted() {
    const row = selectableRows[highlightIndex];
    if (!row) {
      return;
    }
    if (row.kind === "option") {
      pickOption(row.value);
    } else {
      pickCreate(row.value);
    }
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
      if (r.kind !== "option" && r.kind !== "create") {
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
    placeholder="Search dl-* classes…"
    bind:value={query}
    {disabled}
    role="combobox"
    aria-autocomplete="list"
    aria-expanded={open}
    aria-controls="dl-class-listbox"
    onfocus={onInputFocus}
    oninput={onInputInput}
    onkeydown={onInputKeydown}
  />

  {#if open}
    <ul id="dl-class-listbox" class="prop-combobox-list" role="listbox">
      {#each rows as row, index (row.kind === "option" || row.kind === "create" ? `${row.kind}-${row.value}` : row.kind)}
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
              {row.value}
            </button>
          </li>
        {:else if row.kind === "create"}
          <li>
            <button
              type="button"
              class="prop-combobox-option prop-combobox-create"
              class:active={isHighlighted(index)}
              role="option"
              aria-selected={isHighlighted(index)}
              disabled={!canCreate}
              onclick={() => pickCreate(row.value)}
            >
              Create "{row.value}"
            </button>
          </li>
        {:else if row.kind === "hint"}
          <li class="prop-combobox-empty">{row.message}</li>
        {:else}
          <li class="prop-combobox-empty">No dl-* classes in file</li>
        {/if}
      {/each}
    </ul>
  {/if}
</div>
