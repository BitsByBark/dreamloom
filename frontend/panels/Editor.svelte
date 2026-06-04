<script lang="ts">
  import { onMount } from "svelte";
  import { basicSetup } from "codemirror";
  import { html } from "@codemirror/lang-html";
  import { EditorState } from "@codemirror/state";
  import { EditorView } from "@codemirror/view";
  import { appState } from "$lib/app-state.svelte";
  import { amoledTheme } from "$lib/codemirror/amoled-theme";

  let container: HTMLDivElement | undefined = $state();
  let view: EditorView | undefined = $state();

  onMount(() => {
    if (!container) return;

    view = new EditorView({
      parent: container,
      state: EditorState.create({
        doc: appState.openFileContent ?? "",
        extensions: [
          basicSetup,
          html(),
          amoledTheme,
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
        ],
      }),
    });

    return () => {
      view?.destroy();
      view = undefined;
    };
  });

  $effect(() => {
    const content = appState.openFileContent ?? "";
    if (!view) return;

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
    });
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
