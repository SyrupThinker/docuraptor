export type Info = DenoInfo | FileInfo;

export interface DenoInfo {
  denoDir: string;
  modulesCache: string;
  typescriptCache: string;
}

export type FileDeps = [string, FileDeps[]];

export interface FileInfo {
  local: string;
  fileType: "TypeScript" | "JavaScript";
  compiled: string;
  map: string | null;
  deps: FileDeps;
}
