import { invoke } from "@tauri-apps/api/core";
import { appState } from "$lib/app-state.svelte";
import { get, writable } from "svelte/store";

export type AssetFile = {
  name: string;
  relativePath: string;
  extension: string;
};

export type AssetFolder = {
  name: string;
  files: AssetFile[];
};

export type AssetTree = {
  hasAssetsFolder: boolean;
  folders: AssetFolder[];
};

type AssetScanResult = {
  hasAssetsFolder: boolean;
  categories: AssetFolder[];
};

function scanToTree(result: AssetScanResult): AssetTree {
  return {
    hasAssetsFolder: result.hasAssetsFolder,
    folders: result.categories.map((category) => ({
      name: category.name,
      files: category.files,
    })),
  };
}

export type AssetState = {
  loading: boolean;
  creating: boolean;
  error: string | null;
  tree: AssetTree | null;
};

export const assetStore = writable<AssetState>({
  loading: false,
  creating: false,
  error: null,
  tree: null,
});

export async function refreshAssetTree(): Promise<void> {
  const root = appState.openDirectory;
  if (!root) {
    assetStore.update((s) => ({ ...s, tree: null, error: null }));
    return;
  }

  assetStore.update((s) => ({ ...s, loading: true, error: null }));
  try {
    const scan = await invoke<AssetScanResult>("scan_assets_folder", { projectPath: root });
    assetStore.update((s) => ({ ...s, tree: scanToTree(scan) }));
  } catch (error) {
    assetStore.update((s) => ({
      ...s,
      error: error instanceof Error ? error.message : String(error),
    }));
  } finally {
    assetStore.update((s) => ({ ...s, loading: false }));
  }
}

export type AssetPickPurpose = "backgroundImage";

type AssetPickerState = {
  active: boolean;
  purpose: AssetPickPurpose | null;
  onSelected: ((url: string) => void) | null;
};

export const assetPickerStore = writable<AssetPickerState>({
  active: false,
  purpose: null,
  onSelected: null,
});

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "svg",
  "avif",
  "bmp",
]);

export function isPickableImage(extension: string): boolean {
  return IMAGE_EXTENSIONS.has(extension.toLowerCase());
}

export function startBackgroundImagePick(onSelected: (url: string) => void): void {
  assetPickerStore.set({
    active: true,
    purpose: "backgroundImage",
    onSelected,
  });
  appState.leftTab = "assets";
  void refreshAssetTree();
}

export function cancelAssetPick(): void {
  assetPickerStore.set({
    active: false,
    purpose: null,
    onSelected: null,
  });
}

export async function pickAssetFile(category: string, relativePath: string): Promise<void> {
  const root = appState.openDirectory;
  const picker = get(assetPickerStore);
  if (!root || !picker.active || !picker.onSelected) {
    return;
  }

  try {
    const result = await invoke<{ url: string }>("resolve_asset_url", {
      projectPath: root,
      category,
      relativePath,
    });
    picker.onSelected(result.url);
  } catch (error) {
    assetStore.update((s) => ({
      ...s,
      error: error instanceof Error ? error.message : String(error),
    }));
  } finally {
    cancelAssetPick();
  }
}

export async function createAssetFolder(): Promise<void> {
  const root = appState.openDirectory;
  if (!root || get(assetStore).creating) {
    return;
  }

  assetStore.update((s) => ({ ...s, creating: true, error: null }));
  try {
    await invoke("create_assets_folder", { projectPath: root });
    await refreshAssetTree();
  } catch (error) {
    assetStore.update((s) => ({
      ...s,
      error: error instanceof Error ? error.message : String(error),
    }));
  } finally {
    assetStore.update((s) => ({ ...s, creating: false }));
  }
}
