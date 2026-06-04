export type LeftTab = "repo" | "git" | "log";

export type RightTab = "editor" | "properties" | "cssVars";

export type DevServerStatus = "idle" | "starting" | "running" | "error";

export const appState = $state({
  openDirectory: null as string | null,
  leftTab: "repo" as LeftTab,
  rightTab: "editor" as RightTab,
  openFilePath: null as string | null,
  openFileContent: null as string | null,
  devServerPort: null as number | null,
  devServerStatus: "idle" as DevServerStatus,
  devServerError: null as string | null,
});
