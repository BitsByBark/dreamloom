import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { FONT_FAMILY } from "$lib/fonts";

const amoledEditorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#000000",
      color: "#c8c8c8",
      height: "100%",
    },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily: FONT_FAMILY,
      fontSize: "13px",
      lineHeight: "1.5",
    },
    ".cm-content": {
      caretColor: "#c8c8c8",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#c8c8c8",
    },
    ".cm-gutters": {
      backgroundColor: "#0a0a0a",
      color: "#666666",
      border: "none",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#141414",
    },
    ".cm-activeLine": {
      backgroundColor: "#141414",
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "#2a2a2a",
    },
    ".cm-line": {
      padding: "0 4px 0 8px",
    },
  },
  { dark: true },
);

const amoledHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#aaaaaa" },
  { tag: tags.name, color: "#c8c8c8" },
  { tag: tags.tagName, color: "#c8c8c8" },
  { tag: tags.attributeName, color: "#999999" },
  { tag: tags.attributeValue, color: "#888888" },
  { tag: tags.string, color: "#888888" },
  { tag: tags.number, color: "#888888" },
  { tag: tags.comment, color: "#666666", fontStyle: "italic" },
  { tag: tags.meta, color: "#777777" },
  { tag: tags.operator, color: "#999999" },
  { tag: tags.punctuation, color: "#777777" },
  { tag: tags.bracket, color: "#888888" },
  { tag: tags.angleBracket, color: "#888888" },
  { tag: tags.squareBracket, color: "#888888" },
  { tag: tags.content, color: "#c8c8c8" },
]);

export const amoledTheme = [amoledEditorTheme, syntaxHighlighting(amoledHighlightStyle)];
