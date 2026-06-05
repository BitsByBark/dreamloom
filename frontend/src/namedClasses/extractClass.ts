import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { get } from "svelte/store";
import { activeFileContent } from "$lib/active-file-content";
import { appState } from "$lib/app-state.svelte";
import { centerTabs } from "$lib/center-tabs.svelte";
import { currentBridgeDlClass } from "$lib/bridge-selection.svelte";
import { elementStyles, setElementStyles, type ElementStylesByState } from "$properties/element-styles.svelte";
import { propertiesPseudo } from "$properties/properties-pseudo.svelte";
import type { PropertyPseudoState } from "$properties/property-pseudo-state";
import { addNamedClass, emptyNamedClassStyles, namedClassStore, selectNamedClass, setNamedClasses } from "./namedClassStore";

type ExtractOutcome = {
  className: string;
  propertiesCopied: number;
};

type CssRule = {
  selector: string;
  declarations: Record<string, string>;
};

const PSEUDO_STATES: PropertyPseudoState[] = ["default", "hover", "focus", "active", "visited"];

export async function dreamloomCssPath(): Promise<string | null> {
  if (!appState.openDirectory) {
    return null;
  }
  return join(appState.openDirectory, "dreamloom.css");
}

function normalizeClassName(value: string): string | null {
  const normalized = value.trim().replace(/^\./, "");
  if (!normalized || /^dl-/.test(normalized) || /[\s.:;{}]/.test(normalized)) {
    return null;
  }
  return normalized;
}

function parseRules(css: string): CssRule[] {
  const rules: CssRule[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (const match of css.matchAll(re)) {
    const selector = match[1].trim();
    const declarations: Record<string, string> = {};
    for (const decl of match[2].split(";")) {
      const colon = decl.indexOf(":");
      if (colon <= 0) continue;
      const property = decl.slice(0, colon).trim();
      const value = decl.slice(colon + 1).trim();
      if (property && value) {
        declarations[property] = value;
      }
    }
    rules.push({ selector, declarations });
  }
  return rules;
}

function renderRules(rules: CssRule[]): string {
  return rules
    .map((rule) => {
      const declarations = Object.entries(rule.declarations)
        .map(([property, value]) => `  ${property}: ${value};`)
        .join("\n");
      return `${rule.selector} {\n${declarations}\n}`;
    })
    .join("\n\n") + "\n";
}

function stylesForClass(css: string, className: string): ElementStylesByState {
  const styles = emptyNamedClassStyles();
  for (const rule of parseRules(css)) {
    for (const state of PSEUDO_STATES) {
      const selector = state === "default" ? `.${className}` : `.${className}:${state}`;
      if (rule.selector === selector) {
        styles[state] = rule.declarations;
      }
    }
  }
  return styles;
}

export async function refreshNamedClasses(): Promise<void> {
  const cssPath = await dreamloomCssPath();
  if (!cssPath) {
    setNamedClasses([]);
    return;
  }

  try {
    const css = await invoke<string>("read_text_file", { path: cssPath });
    const names = parseRules(css)
      .map((rule) => rule.selector.match(/^\.([a-zA-Z][\w-]*)(?::[\w-]+)?$/)?.[1] ?? null)
      .filter((name): name is string => name !== null && !name.startsWith("dl-"));
    setNamedClasses(names);
  } catch {
    setNamedClasses([]);
  }
}

export async function loadNamedClassStyles(className: string): Promise<void> {
  const cssPath = await dreamloomCssPath();
  if (!cssPath) return;
  try {
    const css = await invoke<string>("read_text_file", { path: cssPath });
    setElementStyles(stylesForClass(css, className));
    selectNamedClass(className);
  } catch {
    setElementStyles(emptyNamedClassStyles());
    selectNamedClass(className);
  }
}

export async function extractCurrentDlClass(newClassInput: string): Promise<void> {
  const newClassName = normalizeClassName(newClassInput);
  const dlClass = currentBridgeDlClass();
  const { path } = activeFileContent();
  const cssPath = await dreamloomCssPath();
  if (!newClassName || !dlClass || !path?.endsWith(".svelte") || !cssPath) {
    return;
  }

  const outcome = await invoke<ExtractOutcome>("extract_named_class", {
    sveltePath: path,
    cssPath,
    dlClass,
    newClassName,
  });

  const nextContent = await invoke<string>("read_text_file", { path });
  const tab = centerTabs.tabs.find((entry) => entry.path === path);
  if (tab) {
    tab.content = nextContent;
  }
  if (centerTabs.activePath === path) {
    appState.openFileContent = nextContent;
  }

  addNamedClass(outcome.className);
  await loadNamedClassStyles(outcome.className);
}

export async function writeNamedClassProperty(property: string, value: string): Promise<boolean> {
  const state = get(namedClassStore);
  const className = state.activeClass;
  const cssPath = await dreamloomCssPath();
  if (!className || !cssPath) {
    return false;
  }

  let css = "";
  try {
    css = await invoke<string>("read_text_file", { path: cssPath });
  } catch {
    css = "";
  }

  const rules = parseRules(css);
  const pseudo = propertiesPseudo.active;
  const selector = pseudo === "default" ? `.${className}` : `.${className}:${pseudo}`;
  let rule = rules.find((entry) => entry.selector === selector);
  if (!rule) {
    rule = { selector, declarations: {} };
    rules.push(rule);
  }
  if (value.trim()) {
    rule.declarations[property] = value;
  } else {
    delete rule.declarations[property];
  }

  const nextRules = rules.filter((entry) => Object.keys(entry.declarations).length > 0);
  await invoke("write_text_file", { path: cssPath, content: renderRules(nextRules) });
  elementStyles.data = stylesForClass(renderRules(nextRules), className);
  return true;
}
