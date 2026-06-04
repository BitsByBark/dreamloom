<script lang="ts">
  import "./properties-theme.css";
  import { activeFileContent } from "$lib/active-file-content";
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
  import DlClassCombobox from "./DlClassCombobox.svelte";
  import PropertySection from "./PropertySection.svelte";

  let addClassInput = $state("");

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
      <span class="prop-field-label">In file</span>
      <DlClassCombobox
        options={fileDlClasses}
        value={activeDlClass ?? ""}
        disabled={comboboxDisabled}
        canCreate={hasSelection}
        onSelect={onDlSelect}
        onCreate={createDlClass}
      />
    </label>

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
