<script lang="ts">
  import "./properties-theme.css";
  import { activeFileContent } from "$lib/active-file-content";
  import { appState } from "$lib/app-state.svelte";
  import {
    bridgeSelectDlClass,
    currentBridgeDlClass,
    editorBridge,
    refreshBridgeEditorHighlight,
  } from "$lib/bridge-selection.svelte";
  import {
    addClassToElement,
    getElementClassList,
    listDlClassesInSource,
    normalizeDlClass,
    refreshRangeAfterEdit,
    removeClassFromElement,
  } from "$lib/element-classes";
  import { saveSvelteSource } from "$lib/source-file";
  import { extractCurrentDlClass, loadNamedClassStyles, refreshNamedClasses } from "../src/namedClasses/extractClass";
  import { namedClassStore, selectNamedClass } from "../src/namedClasses/namedClassStore";
  import DlClassCombobox from "./DlClassCombobox.svelte";
  import PropertySection from "./PropertySection.svelte";

  let addClassInput = $state("");
  let savingNamedClass = $state(false);
  let namedClassInput = $state("");

  const activeDlClass = $derived(currentBridgeDlClass());

  const activeFile = $derived(activeFileContent());

  const fileDlClasses = $derived.by(() => {
    if (!activeFile.path?.endsWith(".svelte") || !activeFile.content) {
      return [];
    }
    return listDlClassesInSource(activeFile.content);
  });

  const elementClasses = $derived.by(() => {
    const sel = editorBridge.selection;
    if (!activeFile.content || !sel) {
      return [];
    }
    return getElementClassList(activeFile.content, {
      from: sel.fromLine,
      to: sel.toLine,
    });
  });

  const hasSelection = $derived(editorBridge.selection !== null);

  const comboboxDisabled = $derived(!activeFile.path?.endsWith(".svelte"));

  async function onDlSelect(dlClass: string) {
    selectNamedClass(null);
    await bridgeSelectDlClass(dlClass, 0, {
      focusEditor: false,
      highlightPreview: true,
    });
  }

  async function createDlClass(name: string) {
    const dl = normalizeDlClass(name);
    if (!dl || !hasSelection) {
      return;
    }

    await mutateClasses((source, range) => addClassToElement(source, range, dl));
    await bridgeSelectDlClass(dl, 0, {
      focusEditor: false,
      highlightPreview: true,
    });
  }

  $effect(() => {
    activeFile.path;
    appState.openDirectory;
    void refreshNamedClasses();
  });

  async function confirmNamedClass() {
    const value = namedClassInput;
    namedClassInput = "";
    savingNamedClass = false;
    await extractCurrentDlClass(value);
  }

  function onNamedClassKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      void confirmNamedClass();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      savingNamedClass = false;
      namedClassInput = "";
    }
  }

  async function mutateClasses(mutator: (source: string, range: { from: number; to: number }) => string | null) {
    const sel = editorBridge.selection;
    const { path, content } = activeFileContent();
    if (!sel || !path?.endsWith(".svelte") || content === null) {
      return;
    }

    const range = { from: sel.fromLine, to: sel.toLine };
    const next = mutator(content, range);
    if (!next || next === content) {
      return;
    }

    await saveSvelteSource(path, next);

    if (sel.matchKind === "dl") {
      const refreshed = refreshRangeAfterEdit(next, sel.dlClass, sel.occurrenceIndex, range);
      editorBridge.selection = {
        ...sel,
        fromLine: refreshed.from,
        toLine: refreshed.to,
        generation: (sel.generation ?? 0) + 1,
      };
    } else {
      refreshBridgeEditorHighlight();
    }
  }

  function onAddClassKeydown(event: KeyboardEvent) {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    const value = addClassInput;
    addClassInput = "";
    void mutateClasses((source, range) => addClassToElement(source, range, value));
  }

  function removeClass(className: string) {
    void mutateClasses((source, range) => removeClassFromElement(source, range, className));
  }
</script>

<PropertySection title="Class">
  <div class="prop-stack">
    <label class="prop-field">
      <span class="prop-field-label class-selector-header">
        <span>In file</span>
        <button
          type="button"
          class="save-class-btn"
          disabled={!activeDlClass || !activeFile.path?.endsWith(".svelte")}
          onclick={() => (savingNamedClass = true)}
        >SAVE AS CLASS</button>
      </span>
      <DlClassCombobox
        options={fileDlClasses}
        value={activeDlClass ?? ""}
        disabled={comboboxDisabled}
        canCreate={hasSelection}
        onSelect={onDlSelect}
        onCreate={createDlClass}
      />
    </label>

    {#if savingNamedClass}
      <div class="named-class-save-row">
        <input
          type="text"
          class="prop-input"
          placeholder="btn-primary"
          bind:value={namedClassInput}
          onkeydown={onNamedClassKeydown}
        />
        <button type="button" class="save-class-btn" onclick={confirmNamedClass}>OK</button>
      </div>
    {/if}

    {#if $namedClassStore.classes.length > 0}
      <div class="prop-chips" role="list" aria-label="Named classes">
        {#each $namedClassStore.classes as className (className)}
          <button
            type="button"
            class="prop-chip named-class-chip"
            class:active={$namedClassStore.activeClass === className}
            onclick={() => loadNamedClassStyles(className)}
          >.{className}</button>
        {/each}
      </div>
    {/if}

    <label class="prop-field">
      <span class="prop-field-label">Add class</span>
      <input
        type="text"
        class="prop-input"
        placeholder=".btn-primary"
        bind:value={addClassInput}
        disabled={!hasSelection}
        onkeydown={onAddClassKeydown}
      />
    </label>

    {#if hasSelection && elementClasses.length > 0}
      <div class="prop-chips" role="list">
        {#each elementClasses as className (className)}
          <span class="prop-chip" role="listitem">
            <span class="prop-chip-label">{className}</span>
            <button
              type="button"
              class="prop-chip-remove"
              aria-label="Remove {className}"
              onclick={() => removeClass(className)}
            >
              ×
            </button>
          </span>
        {/each}
      </div>
    {:else if hasSelection}
      <p class="prop-hint">No classes on this element yet.</p>
    {:else}
      <p class="prop-hint">Select an element in the preview to edit classes.</p>
    {/if}
  </div>
</PropertySection>

<style>
  .class-selector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .save-class-btn {
    padding: 2px 6px;
    border: 1px solid var(--panel-border);
    background: #141414;
    color: var(--text-muted);
    cursor: pointer;
    font: inherit;
    font-size: 0.8em;
  }

  .save-class-btn:hover:not(:disabled) {
    color: var(--text);
    background: #1c1c1c;
  }

  .save-class-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .named-class-save-row {
    display: flex;
    gap: 6px;
  }

  .named-class-chip {
    cursor: pointer;
  }

  .named-class-chip.active {
    border-color: var(--accent, #aacc00);
    color: var(--accent, #aacc00);
  }
</style>
