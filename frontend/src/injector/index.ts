import { centerTabs } from "$lib/center-tabs.svelte";
import {
  currentBridgeDlClass,
  editorBridge,
  materializePendingDlClass,
} from "$lib/bridge-selection.svelte";
import { resolveDlClassSource } from "$lib/resolve-component-source";
import { propertiesPseudo } from "$properties/properties-pseudo.svelte";
import { appendUndo } from "$git/undoStore";
import { buildDelta, type StyleDelta } from "./delta";
import { injectSvelteStyle } from "./strategies/svelte";

import { borderDraftKeyToCssProperty, camelToCssProperty } from "./css-property";

export { buildDelta, type StyleDelta } from "./delta";
export { camelToCssProperty, borderDraftKeyToCssProperty } from "./css-property";

export type InjectFramework = "svelte" | "unknown";

export function detectFramework(filePath: string): InjectFramework {
  if (filePath.endsWith(".svelte")) {
    return "svelte";
  }
  return "unknown";
}

export async function injectStyle(filePath: string, delta: StyleDelta): Promise<void> {
  const framework = detectFramework(filePath);
  console.log("[injector] strategy:", framework);

  switch (framework) {
    case "svelte":
      await injectSvelteStyle(filePath, delta);
      break;
    default:
      console.log("[injector] no strategy for file:", filePath);
  }
}

async function resolveInjectFilePath(dlClass: string): Promise<string | null> {
  const sel = editorBridge.selection;
  if (sel?.matchKind === "dl") {
    const resolved = await resolveDlClassSource(dlClass, sel.occurrenceIndex);
    if (resolved?.path) {
      return resolved.path;
    }
  }

  const active = centerTabs.activePath;
  if (active?.endsWith(".svelte")) {
    return active;
  }

  return null;
}

export async function commitPropertyChange(property: string, value: string): Promise<void> {
  // A bare element carries a generated dl-* class that isn't in source yet.
  // Inject it before the first style write; abort the edit if injection fails.
  if (editorBridge.selection?.matchKind === "element") {
    const ok = await materializePendingDlClass();
    if (!ok) {
      console.warn("[injector] skip: dl-class injection failed");
      return;
    }
  }

  const dlClass = currentBridgeDlClass();
  if (!dlClass) {
    console.log("[injector] skip: no dl class selected");
    return;
  }

  const filePath = await resolveInjectFilePath(dlClass);
  if (!filePath) {
    console.log("[injector] skip: no .svelte file path");
    return;
  }

  const delta = buildDelta(dlClass, propertiesPseudo.active, property, value);
  await injectStyle(filePath, delta);

  const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
  const state = propertiesPseudo.active === "default" ? "" : `:${propertiesPseudo.active}`;
  appendUndo(`${fileName}: .${dlClass.replace(/^\./, "")}${state} { ${property}: ${value || "(cleared)"} }`);
}

/** Fire-and-forget inject when a control has a bound CSS property name. */
export function maybeCommitProperty(cssProperty: string | undefined, value: string): void {
  if (cssProperty) {
    void commitPropertyChange(cssProperty, value);
  }
}

export async function commitDraftPatch(
  patch: Record<string, string>,
  resolveCssProperty: (key: string) => string = camelToCssProperty,
): Promise<void> {
  for (const [key, value] of Object.entries(patch)) {
    await commitPropertyChange(resolveCssProperty(key), value);
  }
}