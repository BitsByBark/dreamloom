import { activeFileContent } from "$lib/active-file-content";
import { appState } from "$lib/app-state.svelte";
import { findElementLineRange } from "$lib/find-element-lines";
import type {
  DreamloomPreviewClearMessage,
  DreamloomPreviewSelectMessage,
} from "$panels/center/preview-bridge";
import { settings } from "$settings/settings.svelte";

export type EditorBridgeSelection = {
  dlClass: string;
  occurrenceIndex: number;
  fromLine: number;
  toLine: number;
  /** Bumps on each preview click so editor re-applies highlight. */
  generation: number;
};

export const editorBridge = $state({
  selection: null as EditorBridgeSelection | null,
});

export function clearEditorBridgeSelection(): void {
  editorBridge.selection = null;
}

export function handlePreviewClear(_message?: DreamloomPreviewClearMessage): void {
  editorBridge.selection = null;
}

export function handlePreviewSelect(message: DreamloomPreviewSelectMessage): void {
  appState.rightTab = "editor";

  const { path, content } = activeFileContent();
  if (!path || !path.endsWith(".svelte") || content === null) {
    editorBridge.selection = null;
    return;
  }

  const occurrence = message.occurrenceIndex ?? 0;
  const range = findElementLineRange(content, message.dlClass, occurrence);
  // #region agent log
  fetch('http://127.0.0.1:7790/ingest/b88598fb-327a-4542-ba31-cc39203b33a7',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a9a834'},body:JSON.stringify({sessionId:'a9a834',hypothesisId:'A/B',location:'bridge-selection.svelte.ts:handlePreviewSelect',message:'preview select resolve',data:{dlClass:message.dlClass,occurrence,range,contentLen:content.length,path},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (!range) {
    editorBridge.selection = null;
    if (settings.debugMode) {
      console.debug(
        "[dreamloom] dl class not found in open file:",
        message.dlClass,
        "occurrence",
        occurrence,
        path,
      );
    }
    return;
  }

  const prevGen = editorBridge.selection?.generation ?? 0;
  editorBridge.selection = {
    dlClass: message.dlClass,
    occurrenceIndex: occurrence,
    fromLine: range.from,
    toLine: range.to,
    generation: prevGen + 1,
  };
}
