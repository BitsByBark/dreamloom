import {
  clampSettings,
  defaultSettings,
  loadSettings,
  saveSettings,
  type AppSettings,
} from "$settings/storage";

export const settings = $state<AppSettings>({ ...defaultSettings });

let initialized = false;

export async function initSettings(): Promise<void> {
  if (initialized) {
    return;
  }

  const loaded = await loadSettings();
  Object.assign(settings, loaded);
  initialized = true;
}

export async function persistSettings(): Promise<void> {
  Object.assign(settings, clampSettings(settings));
  await saveSettings(settings);
}
