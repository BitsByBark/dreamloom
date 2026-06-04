<script lang="ts">
  import { basicSetup } from "codemirror";
  import { html } from "@codemirror/lang-html";
  import { EditorState } from "@codemirror/state";
  import { EditorView } from "@codemirror/view";
  import { activeFileText } from "$lib/active-file-content";
  import { appState } from "$lib/app-state.svelte";
  import { editorBridge } from "$lib/bridge-selection.svelte";
  import { centerTabs } from "$lib/center-tabs.svelte";
  import { findElementLineRange, findIdLineRange } from "$lib/find-element-lines";
  import { logDebugTrace } from "$debug/logging.svelte";
  import { amoledTheme } from "$lib/codemirror/amoled-theme";
  import {
    accentHighlightBackground,
    applyElementHighlight,
    elementHighlightExtension,
    setElementHighlight,
  } from "$lib/codemirror/element-highlight";
  import { ACCENT_COLOR } from "$settings/storage";

  let container: HTMLDivElement | undefined = $state();
  let view: EditorView | undefined;

  function syncEditorDoc() {
    if (!view) {
      return;
    }

    const content = activeFileText();
    if (view.state.doc.toString() === content) {
      return;
    }

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
    });
  }

  function applyBridgeSelection() {
    logDebugTrace("editor/index.svelte:applyBridgeSelection", "enter", {
      hasView: !!view,
      hasSel: !!editorBridge.selection,
      docLines: view?.state.doc.lines,
      docLen: view?.state.doc.length,
    });
    if (!view) {
      return;
    }

    const sel = editorBridge.selection;
    if (!sel) {
      applyElementHighlight(view, null);
      return;
    }

    // recompute from the live buffer — stored lines can be stale (computed while doc was still empty).
    // if recompute fails (class not in current buffer text yet), fall back to stored lines, never clear.
    const text = view.state.doc.toString();
    const recomputed =
      sel.matchKind === "dl"
        ? findElementLineRange(text, sel.dlClass, sel.occurrenceIndex)
        : sel.matchKind === "id"
          ? findIdLineRange(text, sel.id)
          : null;
    const range = recomputed ?? { from: sel.fromLine, to: sel.toLine };

    const bg = accentHighlightBackground(ACCENT_COLOR);
    const doc = view.state.doc;
    const line = Math.min(range.from + 1, doc.lines);
    const lineObj = doc.line(line);

    view.dispatch({
      effects: setElementHighlight.of({
        fromLine: range.from,
        toLine: range.to,
        backgroundColor: bg,
      }),
      selection: { anchor: lineObj.from },
      scrollIntoView: true,
    });
    logDebugTrace("editor/index.svelte:applyBridgeSelection", "dispatched highlight", {
      matchKind: sel.matchKind,
      stored: { from: sel.fromLine, to: sel.toLine },
      recomputed,
      used: range,
      bg,
      docLines: doc.lines,
      textLen: text.length,
    });
  }

  function syncDocAndBridge() {
    syncEditorDoc();
    applyBridgeSelection();
  }

  $effect(() => {
    if (!container) {
      return;
    }

    const editorView = new EditorView({
      parent: container,
      state: EditorState.create({
        doc: "",
        extensions: [
          basicSetup,
          html(),
          amoledTheme,
          elementHighlightExtension(),
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
        ],
      }),
    });

    view = editorView;
    queueMicrotask(() => syncDocAndBridge());

    return () => {
      editorView.destroy();
      view = undefined;
    };
  });

  $effect(() => {
    if (!container) {
      return;
    }

    appState.openFilePath;
    appState.openFileContent;
    centerTabs.activePath;

    syncDocAndBridge();
  });

  $effect(() => {
    if (!container) {
      return;
    }

    editorBridge.selection?.generation;
    editorBridge.selection;

    queueMicrotask(() => applyBridgeSelection());
  });
</script>

<div class="editor">
  {#if !appState.openFilePath}
    <p class="hint">Click a .svelte file in the file tree</p>
  {/if}
  <div class="codemirror-host" bind:this={container}></div>
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .hint {
    margin: 0;
    padding: 8px 12px;
    color: var(--text-muted);
    font-size: 12px;
    flex-shrink: 0;
  }

  .codemirror-host {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .codemirror-host :global(.cm-editor) {
    height: 100%;
  }
</style>
