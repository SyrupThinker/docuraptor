export type Info = DenoInfo | FileInfo;

export interface DenoInfo {
  denoDir: string;
  modulesCache: string;
  typescriptCache: string;
}

export interface FileDeps {
  name: string;
  size: number;
  totalSize: number | null;
  deps: FileDeps[];
}

export interface FileInfo {
  local: string;
  fileType: "TypeScript" | "JavaScript";
  compiled: string;
  map: string | null;
  deps: FileDeps;
}
