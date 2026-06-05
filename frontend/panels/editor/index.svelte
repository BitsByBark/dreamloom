<script lang="ts">
  import { untrack } from "svelte";
  import { basicSetup } from "codemirror";
  import { html } from "@codemirror/lang-html";
  import { EditorState } from "@codemirror/state";
  import { EditorView } from "@codemirror/view";
  import { activeFileText } from "$lib/active-file-content";
  import { appState } from "$lib/app-state.svelte";
  import { editorBridge } from "$lib/bridge-selection.svelte";
  import { centerTabs } from "$lib/center-tabs.svelte";
  import { findElementLineRange, findIdLineRange } from "$lib/find-element-lines";
  import { amoledTheme } from "$lib/codemirror/amoled-theme";
  import {
    accentHighlightBackground,
    applyElementHighlight,
    elementHighlightExtension,
    setElementHighlight,
  } from "$lib/codemirror/element-highlight";
  import { ACCENT_COLOR } from "$settings/storage";

  let view = $state<EditorView | undefined>();

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
  }

  function syncDocAndBridge() {
    syncEditorDoc();
    applyBridgeSelection();
  }

  /** Mount CodeMirror once per host — avoids $effect + bind:this recreate loops. */
  function editorHost(node: HTMLDivElement) {
    const editorView = new EditorView({
      parent: node,
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
    queueMicrotask(() => untrack(() => syncDocAndBridge()));

    return {
      destroy() {
        editorView.destroy();
        view = undefined;
      },
    };
  }

  // Defer CM writes; untrack inner reads so sync does not widen effect dependencies.
  $effect(() => {
    if (!view) {
      return;
    }

    appState.openFilePath;
    appState.openFileContent;
    centerTabs.activePath;
    editorBridge.selection?.generation;
    editorBridge.selection;

    queueMicrotask(() => {
      untrack(() => syncDocAndBridge());
    });
  });
</script>

<div class="editor">
  {#if !appState.openFilePath}
    <p class="hint">Click a .svelte file in the file tree</p>
  {/if}
  <div class="codemirror-host" use:editorHost></div>
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
