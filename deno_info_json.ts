export type Info = DenoInfo | FileInfo;

export interface DenoInfo {
  denoDir: string;
  modulesCache: string;
  typescriptCache: string;
}

export interface Dependency {
  specifier: string;
  code: string;
}

export interface Module {
  specifier: string;
  dependencies: Dependency[];
  size: number;
  mediaType: string;
  local: string;
  checksum: string;
  emit: string;
}

export interface FileInfo {
  root: string;
  modules: Module[];
  size: number;
}
