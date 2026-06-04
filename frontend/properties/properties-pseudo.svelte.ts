import {
  cssSelectorForPseudo,
  loadStateSelectorCollapsed,
  saveStateSelectorCollapsed,
  type PropertyPseudoState,
} from "./property-pseudo-state";

export const propertiesPseudo = $state({
  active: "default" as PropertyPseudoState,
  collapsed: loadStateSelectorCollapsed(),
});

export function setPropertyPseudoState(state: PropertyPseudoState): void {
  propertiesPseudo.active = state;
}

export function togglePropertyPseudoCollapsed(): void {
  propertiesPseudo.collapsed = !propertiesPseudo.collapsed;
  saveStateSelectorCollapsed(propertiesPseudo.collapsed);
}

export function resetPropertyPseudoState(): void {
  propertiesPseudo.active = "default";
}

/** Selector for the current pseudo state — property edits should target this rule. */
export function activeCssSelectorForDl(dlClass: string): string {
  return cssSelectorForPseudo(dlClass, propertiesPseudo.active);
}
