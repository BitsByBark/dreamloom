import { invoke } from "@tauri-apps/api/core";

export type BuildInfo = {
  appVersion: string;
  osLabel: string;
  arch: string;
  targetOs: string;
  targetFamily: string;
  cpu: string | null;
  memory: string | null;
};

/** One block for the version modal — OS, arch, target, CPU, RAM. */
export function formatSystemSpecs(info: BuildInfo): string {
  const lines = [
    info.osLabel,
    info.arch,
    `${info.targetOs} (${info.targetFamily})`,
  ];
  if (info.cpu) {
    lines.push(info.cpu);
  }
  if (info.memory) {
    lines.push(info.memory);
  }
  return lines.join("\n");
}

export const BUILD_STACK = [
  "Tauri 2",
  "SvelteKit 2 + Svelte 5",
  "Rust backend",
  "CodeMirror 6",
] as const;

export async function fetchBuildInfo(): Promise<BuildInfo> {
  return invoke<BuildInfo>("get_build_info");
}
