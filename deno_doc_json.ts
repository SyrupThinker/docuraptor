export type Accessibility = "public" | "protected" | "private";

export interface ClassConstructorDef {
  jsDoc: DocJsDoc | null;
  accessibility: Accessibility | null;
  name: string;
  params: ParamDef[];
  location: Location;
}

export interface ClassDef {
  isAbstract: boolean;
  constructors: ClassConstructorDef[];
  properties: ClassPropertyDef[];
  indexSignatures: ClassIndexSignatureDef[];
  methods: ClassMethodDef[];
  extends: string | null;
  implements: TsTypeDef[];
  typeParams: TsTypeParamDef[];
  superTypeParams: TsTypeDef[];
}

export interface ClassIndexSignatureDef {
  readonly: boolean;
  params: ParamDef[];
  tsType: TsTypeDef | null;
}

export interface ClassMethodDef {
  jsDoc: DocJsDoc | null;
  accessibility: Accessibility | null;
  optional: boolean;
  isAbstract: boolean;
  isStatic: boolean;
  name: string;
  kind: MethodKind;
  functionDef: FunctionDef;
  location: Location;
}

export interface ClassPropertyDef {
  jsDoc: DocJsDoc | null;
  tsType: TsTypeDef;
  readonly: boolean;
  accessibility: Accessibility | null;
  optional: boolean;
  isAbstract: boolean;
  isStatic: boolean;
  name: string;
  location: Location;
}

export interface DocJsDoc {
  doc?: string;
}

export type DocNode =
  | DocNodeClass
  | DocNodeEnum
  | DocNodeFunction
  | DocNodeImport
  | DocNodeInterface
  | DocNodeNamespace
  | DocNodeTypeAlias
  | DocNodeVariable;

export interface DocNodeBase {
  name: string;
  location: Location;
  jsDoc: DocJsDoc | null;
}

export interface DocNodeClass extends DocNodeBase {
  kind: "class";
  classDef: ClassDef;
}

export interface DocNodeEnum extends DocNodeBase {
  kind: "enum";
  enumDef: EnumDef;
}

export interface DocNodeFunction extends DocNodeBase {
  kind: "function";
  functionDef: FunctionDef;
}

export interface DocNodeImport extends DocNodeBase {
  kind: "import";
  importDef: ImportDef;
}

export interface DocNodeInterface extends DocNodeBase {
  kind: "interface";
  interfaceDef: InterfaceDef;
}

export interface DocNodeNamespace extends DocNodeBase {
  kind: "namespace";
  namespaceDef: NamespaceDef;
}

export interface DocNodeTypeAlias extends DocNodeBase {
  kind: "typeAlias";
  typeAliasDef: TypeAliasDef;
}

export interface DocNodeVariable extends DocNodeBase {
  kind: "variable";
  variableDef: VariableDef;
}

export interface EnumDef {
  members: { name: string }[];
}

export interface FunctionDef {
  params: ParamDef[];
  returnType: TsTypeDef | null;
  isAsync: boolean;
  isGenerator: boolean;
  typeParams: TsTypeParamDef[];
}

export interface ImportDef {
  src: string;
  imported: string | null;
}

export interface InterfaceCallSignatureDef {
  location: Location;
  jsDoc: DocJsDoc | null;
  params: ParamDef[];
  tsType: TsTypeDef | null;
  typeParams: TsTypeParamDef[];
}

export interface InterfaceDef {
  extends: TsTypeDef[];
  methods: InterfaceMethodDef[];
  properties: InterfacePropertyDef[];
  callSignatures: InterfaceCallSignatureDef[];
  indexSignatures: InterfaceIndexSignatureDef[];
  typeParams: TsTypeParamDef[];
}

export interface InterfaceIndexSignatureDef {
  readonly: boolean;
  params: ParamDef[];
  tsType: TsTypeDef | null;
}

export interface InterfaceMethodDef {
  name: string;
  location: Location;
  jsDoc: DocJsDoc | null;
  optional: boolean;
  params: ParamDef[];
  returnType: TsTypeDef | null;
  typeParams: TsTypeParamDef[];
}

export interface InterfacePropertyDef {
  name: string;
  location: Location;
  jsDoc: DocJsDoc;
  params: ParamDef[];
  computed: boolean;
  optional: boolean;
  tsType: TsTypeDef | null;
  typeParams: TsTypeParamDef[];
}

export interface LiteralCallSignatureDef {
  params: ParamDef[];
  tsType: TsTypeDef | null;
  typeParams: TsTypeParamDef[];
}

export type LiteralDef = {
  kind: "number";
  number: number;
} | {
  kind: "string";
  string: string;
} | {
  kind: "boolean";
  boolean: boolean;
};

export interface LiteralIndexSignatureDef {
  readonly: boolean;
  params: ParamDef[];
  tsType: TsTypeDef | null;
}

export interface LiteralMethodDef {
  name: string;
  params: ParamDef[];
  returnType: TsTypeDef | null;
  typeParams: TsTypeParamDef[];
}

export interface LiteralPropertyDef {
  name: string;
  params: ParamDef[];
  computed: boolean;
  optional: boolean;
  tsType: TsTypeDef | null;
  typeParams: TsTypeParamDef[];
}

export interface Location {
  filename: string;
  line: number;
  col: number;
}

export type MethodKind = "method" | "getter" | "setter";

export interface NamespaceDef {
  elements: DocNode[];
}

export type ObjectPatPropDef = {
  kind: "assign";
  key: string;
  value: string | null;
} | {
  kind: "keyValue";
  key: string;
  value: ParamDef;
} | {
  kind: "rest";
  arg: ParamDef;
};

export type ParamDef =
  | ParamDefArray
  | ParamDefAssign
  | ParamDefIdentifier
  | ParamDefObject
  | ParamDefRest;

export interface ParamDefBase {
  tsType: TsTypeDef | null;
}

export interface ParamDefArray extends ParamDefBase {
  kind: "array";
  elements: (ParamDef | null)[];
  optional: boolean;
}

export interface ParamDefAssign extends ParamDefBase {
  kind: "assign";
  left: ParamDef;
  right: string;
}

export interface ParamDefIdentifier extends ParamDefBase {
  kind: "identifier";
  name: string;
  optional: boolean;
}

export interface ParamDefObject extends ParamDefBase {
  kind: "object";
  props: ObjectPatPropDef[];
  optional: boolean;
}

export interface ParamDefRest extends ParamDefBase {
  kind: "rest";
  arg: ParamDef;
}

export interface TypeAliasDef {
  tsType: TsTypeDef;
  typeParams: TsTypeParamDef[];
}

export type TsTypeDef = {
  kind: "array";
  array: TsTypeDef;
} | {
  kind: "conditional";
  conditionalType: {
    checkType: TsTypeDef;
    extendsType: TsTypeDef;
    trueType: TsTypeDef;
    falseType: TsTypeDef;
  };
} | {
  kind: "fnOrConstructor";
  fnOrConstructor: {
    constructor: boolean;
    tsType: TsTypeDef;
    params: ParamDef[];
    typeParams: TsTypeParamDef[];
  };
} | {
  kind: "indexedAccess";
  indexedAccess: {
    readonly: boolean;
    objType: TsTypeDef;
    indexType: TsTypeDef;
  };
} | {
  kind: "intersection";
  intersection: TsTypeDef[];
} | {
  kind: "keyword";
  keyword: string;
} | {
  kind: "literal";
  literal: LiteralDef;
} | {
  kind: "optional";
  optional: TsTypeDef;
} | {
  kind: "parenthesized";
  parenthesized: TsTypeDef;
} | {
  kind: "rest";
  rest: TsTypeDef;
} | {
  kind: "this";
  this: boolean;
} | {
  kind: "tuple";
  tuple: TsTypeDef[];
} | {
  kind: "typeLiteral";
  typeLiteral: TsTypeLiteralDef;
} | {
  kind: "typeOperator";
  typeOperator: {
    operator: string;
    tsType: TsTypeDef;
  };
} | {
  kind: "typeQuery";
  typeQuery: string;
} | {
  kind: "typeRef";
  typeRef: {
    typeParams: TsTypeDef[] | null;
    typeName: string;
  };
} | {
  kind: "union";
  union: TsTypeDef[];
};

export interface TsTypeLiteralDef {
  methods: LiteralMethodDef[];
  properties: LiteralPropertyDef[];
  callSignatures: LiteralCallSignatureDef[];
  indexSignatures: LiteralIndexSignatureDef[];
}

export interface TsTypeParamDef {
  name: string;
  constraint?: TsTypeDef;
  default?: TsTypeDef;
}

type VarDeclKind = "var" | "let" | "const";

export interface VariableDef {
  tsType: TsTypeDef | null;
  kind: VarDeclKind;
}
