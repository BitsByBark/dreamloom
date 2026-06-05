<script lang="ts">
  import { isColorValue, type CssVariable } from "../../cssVars/cssVarsStore";

  type Props = {
    entry: CssVariable;
    disabled?: boolean;
    onSave: (previousName: string, name: string, value: string) => void | Promise<void>;
    onDelete: (name: string) => void | Promise<void>;
  };

  let { entry, disabled = false, onSave, onDelete }: Props = $props();

  let editing = $state(false);
  let draftName = $state("");
  let draftValue = $state("");

  const showSwatch = $derived(editing ? isColorValue(draftValue) : isColorValue(entry.value));
  const swatchColor = $derived(editing ? draftValue.trim() : entry.value.trim());

  function startEdit() {
    if (disabled) {
      return;
    }
    editing = true;
    draftName = entry.name;
    draftValue = entry.value;
  }

  async function commit() {
    if (!editing) {
      return;
    }
    editing = false;
    await onSave(entry.name, draftName, draftValue);
  }

  function cancel() {
    editing = false;
    draftName = entry.name;
    draftValue = entry.value;
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      void commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  }
</script>

<div class="var-row" class:editing>
  {#if showSwatch}
    <span
      class="swatch"
      style:background={swatchColor}
      aria-hidden="true"
      title={swatchColor}
    ></span>
  {:else}
    <span class="swatch swatch-empty" aria-hidden="true"></span>
  {/if}

  {#if editing}
    <input
      type="text"
      class="field name"
      bind:value={draftName}
      spellcheck={false}
      aria-label="CSS variable name"
      onkeydown={onKeydown}
      onblur={() => void commit()}
    />
    <input
      type="text"
      class="field value"
      bind:value={draftValue}
      spellcheck={false}
      aria-label="CSS variable value"
      onkeydown={onKeydown}
      onblur={() => void commit()}
    />
  {:else}
    <button type="button" class="display" {disabled} onclick={startEdit}>
      <span class="name">{entry.name}</span>
      <span class="value">{entry.value || "—"}</span>
    </button>
  {/if}

  <button
    type="button"
    class="delete-btn"
    title="Delete variable"
    {disabled}
    onclick={() => void onDelete(entry.name)}
  >
    ×
  </button>
</div>

<style>
  .var-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-bottom: 1px solid var(--panel-border);
    background: #0a0a0a;
  }

  .var-row:hover {
    background: #141414;
  }

  .var-row.editing {
    background: #161616;
  }

  .swatch {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    border: 1px solid #444444;
    border-radius: 2px;
  }

  .swatch-empty {
    background: #1a1a1a;
  }

  .display {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 0;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .display:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .name {
    font-size: 0.85em;
    font-weight: 600;
    color: #a8a8a8;
    word-break: break-all;
  }

  .value {
    font-size: 0.8em;
    color: var(--text-muted);
    word-break: break-all;
  }

  .field {
    flex: 1;
    min-width: 0;
    padding: 4px 6px;
    border: 1px solid #333333;
    border-radius: 2px;
    background: #000000;
    color: var(--text);
    font: inherit;
    font-size: 0.85em;
  }

  .field.name {
    flex: 0 1 42%;
  }

  .field:focus {
    outline: none;
    border-color: #555555;
  }

  .delete-btn {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid #333333;
    border-radius: 2px;
    background: #141414;
    color: #888888;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
  }

  .delete-btn:hover:not(:disabled) {
    border-color: #555555;
    color: #c8c8c8;
    background: #1e1e1e;
  }

  .delete-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
