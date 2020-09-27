export type Info = DenoInfo | FileInfo;

export interface DenoInfo {
  denoDir: string;
  modulesCache: string;
  typescriptCache: string;
}

export interface FileDependency {
  size: number;
  deps: string[];
}

export interface FileInfo {
  local: string;
  fileType: "TypeScript" | "JavaScript";
  compiled: string | null;
  map: string | null;
  depCount: number;
  totalSize: number;
  files: Record<string, FileDependency>;
}
