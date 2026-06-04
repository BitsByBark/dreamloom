import { join } from "@tauri-apps/api/path";
import { exists, mkdir } from "@tauri-apps/plugin-fs";

/** Subfolders under project `assets/` (snake_case). */
export const ASSET_CATEGORY_FOLDERS = [
  "images",
  "fonts",
  "video",
  "audio",
  "documents",
  "data",
  "code",
] as const;

/** Creates `assets/` and category subfolders at the project root. */
export async function createAssetsFolder(projectRoot: string): Promise<void> {
  const assetsRoot = await join(projectRoot, "assets");
  await mkdir(assetsRoot, { recursive: true });

  for (const name of ASSET_CATEGORY_FOLDERS) {
    await mkdir(await join(assetsRoot, name), { recursive: true });
  }
}

export type AssetCategoryFolder = (typeof ASSET_CATEGORY_FOLDERS)[number];

/** Category subfolders under `assets/` that already exist on disk. */
export async function listExistingAssetFolders(
  projectRoot: string,
): Promise<AssetCategoryFolder[]> {
  const found: AssetCategoryFolder[] = [];

  for (const name of ASSET_CATEGORY_FOLDERS) {
    const path = await join(projectRoot, "assets", name);
    if (await exists(path)) {
      found.push(name);
    }
  }

  return found;
}

export function assetFolderSectionTitle(folder: AssetCategoryFolder): string {
  return folder.replace(/-/g, " ").toUpperCase();
}
