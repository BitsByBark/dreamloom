export const STATE_SELECTOR_COLLAPSED_KEY = "dreamloom-properties-state-collapsed";

/** Minimal bridge selection shape for identity / reset (avoids importing bridge at load). */
export type PseudoSelectionIdentity = {
  matchKind: "dl" | "id" | "element";
  dlClass?: string;
  occurrenceIndex?: number;
  id?: string;
  pendingDlClass?: string;
  fromLine: number;
  toLine: number;
};

export const PROPERTY_PSEUDO_OPTIONS = [
  { id: "default", label: "DEFAULT" },
  { id: "hover", label: "HOVER" },
  { id: "focus", label: "FOCUS" },
  { id: "active", label: "ACTIVE" },
  { id: "visited", label: "VISITED" },
] as const;

export type PropertyPseudoState = (typeof PROPERTY_PSEUDO_OPTIONS)[number]["id"];

export function pseudoSuffix(state: PropertyPseudoState): string {
  switch (state) {
    case "default":
      return "";
    case "hover":
      return ":hover";
    case "focus":
      return ":focus";
    case "active":
      return ":active";
    case "visited":
      return ":visited";
  }
}

/** CSS selector for a dl-* class in the active pseudo state (e.g. `.dl-foo:hover`). */
export function cssSelectorForPseudo(dlClass: string, state: PropertyPseudoState): string {
  const normalized = dlClass.startsWith(".") ? dlClass.slice(1) : dlClass;
  return `.${normalized}${pseudoSuffix(state)}`;
}

export function selectionIdentity(sel: PseudoSelectionIdentity | null): string | null {
  if (!sel) {
    return null;
  }

  if (sel.matchKind === "dl") {
    return `dl:${sel.dlClass ?? ""}:${sel.occurrenceIndex ?? 0}:${sel.fromLine}:${sel.toLine}`;
  }

  if (sel.matchKind === "element") {
    return `element:${sel.pendingDlClass ?? ""}:${sel.fromLine}:${sel.toLine}`;
  }

  return `id:${sel.id}:${sel.fromLine}:${sel.toLine}`;
}

export function loadStateSelectorCollapsed(): boolean {
  if (typeof localStorage === "undefined") {
    return false;
  }

  try {
    return localStorage.getItem(STATE_SELECTOR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveStateSelectorCollapsed(collapsed: boolean): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STATE_SELECTOR_COLLAPSED_KEY, collapsed ? "true" : "false");
  } catch {
    // ignore quota / private mode
  }
}
