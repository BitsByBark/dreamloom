export type LeftTab = "repo" | "git" | "log";

export type RightTab = "editor" | "properties" | "cssVars";

export const appState = $state({
  openDirectory: null as string | null,
  leftTab: "repo" as LeftTab,
  rightTab: "editor" as RightTab,
  openFilePath: null as string | null,
  openFileContent: null as string | null,
});
