export type Info = DenoInfo | FileInfo;

export interface DenoInfo {
  denoDir: string;
  modulesCache: string;
  typescriptCache: string;
}

export interface Dependency {
  specifier: string;
  code?: Reference;
  type?: Reference;
}

export interface FileInfo {
  roots: string[];
  modules: Module[];
  redirects: undefined[];
}

export interface Module {
  dependencies?: Dependency[];
  kind: "esm";
  local: string;
  emit: string;
  map: null;
  size: number;
  mediaType: "JavaScript" | "TypeScript";
  specifier: string;
}

export interface Reference {
  specifier: string;
}
