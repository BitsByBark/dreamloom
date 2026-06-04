import {
  RangeSetBuilder,
  StateEffect,
  StateField,
  type EditorState,
  type Extension,
} from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";

export type ElementHighlightRange = {
  fromLine: number;
  toLine: number;
  backgroundColor: string;
} | null;

export const setElementHighlight = StateEffect.define<ElementHighlightRange>();

let lastHighlight: ElementHighlightRange = null;

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return `rgba(59, 130, 246, ${alpha})`;
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function accentHighlightBackground(hex: string): string {
  return hexToRgba(hex, 0.5);
}

function buildDecorations(state: EditorState, range: ElementHighlightRange) {
  if (!range) {
    return Decoration.none;
  }

  const builder = new RangeSetBuilder<Decoration>();
  const doc = state.doc;

  for (let line = range.fromLine; line <= range.toLine; line++) {
    if (line < 0 || line >= doc.lines) {
      continue;
    }
    const lineObj = doc.line(line + 1);
    builder.add(
      lineObj.from,
      lineObj.from,
      Decoration.line({ attributes: { style: `background-color: ${range.backgroundColor}` } }),
    );
  }

  return builder.finish();
}

const elementHighlightField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setElementHighlight)) {
        lastHighlight = effect.value;
        const decos = buildDecorations(tr.state, effect.value);
        // #region agent log
        fetch('http://127.0.0.1:7790/ingest/b88598fb-327a-4542-ba31-cc39203b33a7',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a9a834'},body:JSON.stringify({sessionId:'a9a834',hypothesisId:'E',location:'element-highlight.ts:field.update',message:'effect applied',data:{value:effect.value,decoSize:decos.size,docLines:tr.state.doc.lines},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        return decos;
      }
    }
    if (tr.docChanged && lastHighlight) {
      return buildDecorations(tr.state, lastHighlight);
    }
    return decorations.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

export function elementHighlightExtension(): Extension {
  return elementHighlightField;
}

export function applyElementHighlight(view: EditorView, range: ElementHighlightRange): void {
  if (range === null) {
    lastHighlight = null;
  }
  view.dispatch({ effects: setElementHighlight.of(range) });
}
