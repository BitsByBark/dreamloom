import { invoke } from "@tauri-apps/api/core";
import type { PropertyPseudoState } from "./property-pseudo-state";
import { propertiesPseudo } from "./properties-pseudo.svelte";

export type ElementStylesByState = {
  default: Record<string, string>;
  hover: Record<string, string>;
  focus: Record<string, string>;
  active: Record<string, string>;
  visited: Record<string, string>;
};

export const elementStyles = $state({
  data: null as ElementStylesByState | null,
});

export function clearElementStyles(): void {
  elementStyles.data = null;
}

export function setElementStyles(data: ElementStylesByState | null): void {
  elementStyles.data = data;
}

export async function loadElementStyles(
  filePath: string,
  dlClass: string,
): Promise<ElementStylesByState | null> {
  if (!filePath.trim() || !dlClass.trim()) {
    clearElementStyles();
    return null;
  }

  try {
    const styles = await invoke<ElementStylesByState>("read_element_styles", {
      filePath,
      dlClass,
    });
    console.log("[dreamloom] read_element_styles", styles);
    setElementStyles(styles);
    return styles;
  } catch (err) {
    console.warn("[dreamloom] read_element_styles failed", err);
    clearElementStyles();
    return null;
  }
}

/** CSS declarations for the active pseudo state in the properties panel. */
export function getActiveCssProperties(): Record<string, string> {
  const data = elementStyles.data;
  if (!data) {
    return {};
  }

  const state: PropertyPseudoState = propertiesPseudo.active;
  return data[state] ?? {};
}
