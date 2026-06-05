import { invoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { appState } from "$lib/app-state.svelte";

export const DREAMLOOM_CSS_FILE = "dreamloom.css";

export type CssVariable = {
  /** Stable list key (original name when loaded; updated on rename in UI). */
  id: string;
  name: string;
  value: string;
};

export const cssVarsStore = $state({
  loading: false,
  saving: false,
  error: null as string | null,
  filePath: null as string | null,
  variables: [] as CssVariable[],
});

const CSS_VAR_PATTERN = /(--[\w-]+)\s*:\s*([^;}\n]+)/g;

export function parseCssVariables(css: string): CssVariable[] {
  const variables: CssVariable[] = [];
  const seen = new Set<string>();

  for (const match of css.matchAll(CSS_VAR_PATTERN)) {
    const name = match[1].trim();
    const value = match[2].trim();
    if (seen.has(name)) {
      continue;
    }
    seen.add(name);
    variables.push({ id: name, name, value });
  }

  variables.sort((a, b) => a.name.localeCompare(b.name));
  return variables;
}

export function isColorValue(value: string): boolean {
  const v = value.trim();
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) {
    return true;
  }
  if (/^(rgb|rgba|hsl|hsla)\(/i.test(v)) {
    return true;
  }
  const named = new Set([
    "transparent",
    "currentcolor",
    "black",
    "white",
    "grey",
    "gray",
    "red",
    "green",
    "blue",
  ]);
  return named.has(v.toLowerCase());
}

export function normalizeVarName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.startsWith("--") ? trimmed : `--${trimmed}`;
}

async function dreamloomCssPath(): Promise<string | null> {
  const root = appState.openDirectory;
  if (!root) {
    return null;
  }
  return join(root, DREAMLOOM_CSS_FILE);
}

function setStoreError(error: unknown): void {
  cssVarsStore.error =
    error instanceof Error ? error.message : String(error);
}

function applyBackendVars(vars: { name: string; value: string }[]): void {
  cssVarsStore.variables = vars.map((v) => ({
    id: v.name,
    name: v.name,
    value: v.value,
  }));
}

export async function refreshCssVars(): Promise<void> {
  const path = await dreamloomCssPath();
  if (!path) {
    cssVarsStore.filePath = null;
    cssVarsStore.variables = [];
    cssVarsStore.error = null;
    return;
  }

  cssVarsStore.loading = true;
  cssVarsStore.error = null;
  cssVarsStore.filePath = path;

  try {
    const vars = await invoke<{ name: string; value: string }[]>("read_css_vars", {
      filePath: path,
    });
    applyBackendVars(vars);
  } catch (error) {
    cssVarsStore.variables = [];
    setStoreError(error);
  } finally {
    cssVarsStore.loading = false;
  }
}

export async function persistCssVar(name: string, value: string): Promise<boolean> {
  const path = cssVarsStore.filePath;
  if (!path) {
    cssVarsStore.error = "No project open";
    return false;
  }

  const normalized = normalizeVarName(name);
  if (!normalized) {
    cssVarsStore.error = "Variable name is required";
    return false;
  }

  cssVarsStore.saving = true;
  cssVarsStore.error = null;

  try {
    const vars = await invoke<{ name: string; value: string }[]>("write_css_var", {
      filePath: path,
      name: normalized,
      value: value.trim(),
    });
    applyBackendVars(vars);
    return true;
  } catch (error) {
    setStoreError(error);
    return false;
  } finally {
    cssVarsStore.saving = false;
  }
}

export async function removeCssVar(name: string): Promise<boolean> {
  const path = cssVarsStore.filePath;
  if (!path) {
    cssVarsStore.error = "No project open";
    return false;
  }

  cssVarsStore.saving = true;
  cssVarsStore.error = null;

  try {
    const vars = await invoke<{ name: string; value: string }[]>("delete_css_var", {
      filePath: path,
      name: normalizeVarName(name),
    });
    applyBackendVars(vars);
    return true;
  } catch (error) {
    setStoreError(error);
    return false;
  } finally {
    cssVarsStore.saving = false;
  }
}

function isDraftRow(name: string): boolean {
  return cssVarsStore.variables.some((v) => v.name === name && v.id.startsWith("draft-"));
}

export async function saveCssVarRow(
  previousName: string,
  nextName: string,
  nextValue: string,
): Promise<boolean> {
  const normalized = normalizeVarName(nextName);
  if (!normalized) {
    cssVarsStore.error = "Variable name is required";
    return false;
  }

  const renamed = normalizeVarName(previousName) !== normalized;
  if (renamed && !isDraftRow(previousName)) {
    const deleted = await removeCssVar(previousName);
    if (!deleted) {
      return false;
    }
  }

  return persistCssVar(normalized, nextValue);
}

export async function deleteCssVarRow(name: string): Promise<boolean> {
  if (isDraftRow(name)) {
    cssVarsStore.variables = cssVarsStore.variables.filter((v) => v.name !== name);
    return true;
  }

  return removeCssVar(name);
}

export function addDraftVariable(): void {
  let index = 1;
  let candidate = `--new-var-${index}`;
  while (cssVarsStore.variables.some((v) => v.name === candidate)) {
    index += 1;
    candidate = `--new-var-${index}`;
  }

  cssVarsStore.variables = [
    ...cssVarsStore.variables,
    { id: `draft-${Date.now()}`, name: candidate, value: "" },
  ];
}
