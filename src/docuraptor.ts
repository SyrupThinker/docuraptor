import { parse as argsParse } from "https://deno.land/std@0.61.0/flags/mod.ts";
import {
  serve,
  ServerRequest,
} from "https://deno.land/std@0.61.0/http/server.ts";
import {
  assert,
  unreachable,
} from "https://deno.land/std@0.61.0/testing/asserts.ts";

import * as ddoc from "./deno_doc_json.ts";
import * as info from "./deno_info_json.ts";

interface Asset {
  content: string;
  mimetype?: string;
}

const assets: { [name: string]: Asset } = {
  css: {
    content: `
      :root {
        color: #111;
      }

      img.logo {
        width: 5ch;
      }

      header {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
      }

      header * {
        margin: 0 0.5ch;
      }

      hr {
        border: 0.05em dashed #bbb;
      }

      li {
        border: 0.1em solid #bbb;
        margin: 0.2em;
        padding: 0.5em 1ch;
      }

      li.namespace {
        background: #ddd;
      }

      li.node {
        background: #eee;
      }

      li.node li {
        font-size: 0.9em;
      }

      main {
        font-family: monospace;
        font-size: 16px;
      }

      ol.noborder li {
        border-style: none;
        padding: 0 1ch;
      }

      ol.nomarks {
        list-style-type: none;
        padding-left: 0;
      }

      ol.indent {
        padding: 0 2ch;
      }

      pre {
        white-space: pre-wrap;
        font-size: 0.9em;
      }

      span.exkeyword {
        color: darkgreen;
      }

      span.identifier {
        font-weight: bold;
      }

      span.keyword {
        color: darkmagenta;
      }

      span.literal {
        color: #844605;
      }

      span.typeref {
        color: darkblue;
      }

      span.unimplemented {
        color: #f44;
        background: #222;
        border: 0.2em dashed red;
        font-size: 0.8em;
      }

      .fill {
        flex-grow: 1;
      }

      .inline {
        display: inline-block;
      }

      .padding {
        padding: 0.2em 1em;
      }
    `,
    mimetype: "text/css",
  },
  logo: {
    content: `<?xml version="1.0" encoding="UTF-8"?>
<svg id="SVGRoot" width="1024" height="1024" version="1.1" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:xlink="http://www.w3.org/1999/xlink"><title>Docuraptor</title><metadata><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/><dc:title>Docuraptor</dc:title><cc:license rdf:resource="http://creativecommons.org/licenses/by-nc-nd/4.0/"/><dc:date>19.07.2020</dc:date><dc:creator><cc:Agent><dc:title>Valentin Anger</dc:title></cc:Agent></dc:creator></cc:Work><cc:License rdf:about="http://creativecommons.org/licenses/by-nc-nd/4.0/"><cc:permits rdf:resource="http://creativecommons.org/ns#Reproduction"/><cc:permits rdf:resource="http://creativecommons.org/ns#Distribution"/><cc:requires rdf:resource="http://creativecommons.org/ns#Notice"/><cc:requires rdf:resource="http://creativecommons.org/ns#Attribution"/><cc:prohibits rdf:resource="http://creativecommons.org/ns#CommercialUse"/></cc:License></rdf:RDF></metadata><circle cx="512" cy="512" r="496.47" fill="#323232" stroke="#000" stroke-width="11.728"/><path d="m517.09 560.85c123.1 31.537 29.408 172.91 29.408 172.91s30.221 16.099 57.84 29.934c-65.989 14.627-89.766 7.6793-104.68-7.9718-2.5212-47.444 56.359-123.42-32.352-188.95" fill="#fff" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="12.201"/><path d="m664.62 552.31c40.854-13.852 75.582-66.951 90.496-125.19-1.8788-32.469 182.39 16.616 184.16-43.065 1.2364-41.483-52.065-29.284-131.53-84.786-164.18-138.69-128.45 69.655-172.66 86.359-107.77 40.718-127.57 8.6074-282.24 95.737-62.603 22.355-237.89 2.2081-318.39 39.877 63.419 45.044 230.16 32.91 303.6 30.614 47.404 27.731 95.331 37.602 113.25 92.55 17.597 41.31-26.125 87.313-25.005 137.07 8.0441 30.176 66.032 39.468 109.55 30.686l-61.864-46.225c-4.5563-3.4045 92.008-67.945 35.59-162.05 66.219-30.509 94.407-31.029 155.03-51.583z" fill="#fff" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="12.201"/><g><g transform="matrix(31.6 6.6005 -6.6005 31.6 -34.18 -192.41)"><g fill="#fff" stroke="#000" stroke-linecap="square" stroke-width=".11339"><path d="m25 17h2v3h-2v-3"/><path d="m25.185 17.174h2v3h-2v-3"/><path d="m25.363 17.332h2v3h-2v-3"/></g><text x="25.632729" y="17.887829" font-family="monospace" font-size=".33333px" letter-spacing="0px" word-spacing="0px" style="line-height:1.25" xml:space="preserve"><tspan x="25.632729" y="17.887829">namespace</tspan><tspan x="25.632729" y="18.311554">Deno</tspan></text></g></g><g><path d="m937.42 385.56c-55.293 1.3526-116.83 16.257-162.32-11.135" fill="none" stroke="#000" stroke-width="12.201"/><circle cx="764.81" cy="325.48" r="10.821"/><g stroke="#000"><rect transform="rotate(-14.511)" x="631.63" y="490.25" width="58.584" height="30.632" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.1914"/><path d="m794.56 316.58c16.131-10.401 30.741-8.8292 30.741-8.8292" fill="none" stroke-width="2.4402"/><path d="m605.79 500.33c-36.184 28.884-49.893 73.7-35.616 115.27 12.842 21.117 55.843 29.917 105.58 25.723 24.703-15.256 33.249-28.34 39.088-42.261l-31.555 12.542c-37.867-1.9886-64.999 0.95232-64.887-20.764 0.0646-18.412 10.4-31.748 10.436-31.8" fill="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="12.201"/></g><path id="path130" d="m160 380c40-80 380-300 460-260" display="none" opacity="0" stroke-width="2"/><text fill="#ffffff" font-family="monospace" font-size="96px" letter-spacing="0px" word-spacing="0px" style="line-height:1.25" xml:space="preserve"><textPath xlink:href="#path130"><tspan font-size="96px">Docuraptor</tspan></textPath></text></g></svg>`,
    mimetype: "image/svg+xml",
  },
  script: {
    content: `
      document.getElementById("openDoc")?.addEventListener("click", () => {
        const url = document.getElementById("url");
        const encoded = encodeURIComponent(url.value);
        window.location.href = "/doc/" + encoded;
      });
    `,
    mimetype: "application/javascript",
  },
};

const decoder = new TextDecoder();

function escape(s: string): string {
  return s.replaceAll("&", "&amp").replaceAll("<", "&lt").replaceAll(
    ">",
    "&gt",
  );
}

async function getDenoData(
  specifier?: string,
): Promise<{ doc: ddoc.DocNode[]; info: info.FileInfo | null }> {
  const proc = Deno.run({
    cmd: [
      "deno",
      "doc",
      "--json",
      specifier ?? "--builtin",
    ],
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
  });

  const stdout = decoder.decode(await proc.output());
  const stderr = decoder.decode(await proc.stderrOutput());
  const { success } = await proc.status();

  if (!success) {
    throw { stderr };
  }

  const doc_j: ddoc.DocNode[] = JSON.parse(stdout);
  let info_j: info.FileInfo | null = null;

  if (specifier !== undefined) {
    const proc = Deno.run({
      cmd: [
        "deno",
        "info",
        "--json",
        "--unstable",
        specifier,
      ],
      stdin: "null",
      stdout: "piped",
      stderr: "piped",
    });

    const stdout = decoder.decode(await proc.output());
    const stderr = decoder.decode(await proc.stderrOutput());
    const { success } = await proc.status();

    if (!success) {
      throw { stderr };
    }

    info_j = JSON.parse(stdout);
  }

  return { doc: doc_j, info: info_j };
}

function sortDocNode(a: ddoc.DocNode, b: ddoc.DocNode): number {
  return a.kind !== b.kind
    ? a.kind.localeCompare(b.kind)
    : a.name.localeCompare(b.name);
}

function unimplemented(what: string | undefined | null): string {
  return `<span class=unimplemented>UNIMPLEMENTED${
    what != null ? ": " + escape(what) : ""
  }</span>`;
}

/*
 * Documentation generator
 */

interface DocRendererOptions {
  static?: boolean;
}

class DocRenderer {
  #options: DocRendererOptions;

  constructor(options: DocRendererOptions = {}) {
    this.#options = options;
  }

  async render(specifier?: string): Promise<string> {
    const { doc: doc_j, info: info_j } = await getDenoData(specifier);
    return `<!DOCTYPE html>
      <html>
        <head>
          ${this.renderHead("Docuraptor Documentation")}
        </head>
        <body>
          ${
      this.renderHeader(
        "Documentation for " + (specifier ? escape(specifier) : "Deno"),
      )
    }
          <main>
            ${info_j ? this.renderInfo(info_j) : ""}
            ${this.renderDoc(doc_j)}
          </main>
        </body>
      </html>`;
  }

  renderClassConstructorDef(doc: ddoc.ClassConstructorDef): string {
    let res = `<span class=keyword>${
      doc.accessibility ? escape(doc.accessibility) + " " : ""
    } constructor</span>(${this.renderParams(doc.params)})`;

    if (doc.jsDoc !== null) {
      res += `<hr>${this.renderJSDoc(doc.jsDoc)}`;
    }

    return res;
  }

  renderClassDef(doc: ddoc.DocNodeClass, namespace?: string[]): string {
    const cd = doc.classDef;

    let res = `<span class=keyword>${
      cd.isAbstract ? "abstract " : ""
    }class</span> ${this.renderIdentifier(doc.name, namespace)}${
      this.renderTypeParams(cd.typeParams)
    }`;

    if (cd.extends !== null) {
      res += ` <span class=keyword>extends</span> <span class=typeref>${
        escape(cd.extends)
      }</span>${
        cd.superTypeParams.length > 0
          ? `&lt${
            cd.superTypeParams.map((t) => this.renderTsTypeDef(t)).join(", ")
          }&gt`
          : ""
      }`;
    }

    if (cd.implements.length > 0) {
      res += ` <span class=keyword>implements</span> ${
        cd.implements.map((t) => this.renderTsTypeDef(t)).join(", ")
      }`;
    }

    if (cd.properties.length > 0) {
      res += `<hr><ol class=nomarks>
      ${
        cd.properties.filter((p) => p.accessibility !== "private")
          .map((p) => `<li>${this.renderClassPropertyDef(p)}</li>`).join("")
      }
    </ol>`;
    }

    if (cd.constructors.length > 0) {
      res += `<hr><ol class=nomarks>
      ${
        cd.constructors.filter((m) => m.accessibility !== "private")
          .map((p) => `<li>${this.renderClassConstructorDef(p)}</li>`).join("")
      }
    </ol>`;
    }

    if (cd.methods.length > 0) {
      res += `<hr><ol class=nomarks>
      ${
        cd.methods.filter((m) => m.accessibility !== "private")
          .map((p) => `<li>${this.renderClassMethodDef(p)}</li>`).join("")
      }
    </ol>`;
    }

    if (cd.indexSignatures.length > 0) {
      res += `<hr><ol class=nomarks>
      ${
        cd.indexSignatures.map((p) =>
          `<li>${this.renderIndexSignatureDef(p)}</li>`
        )
          .join("")
      }
    </ol>`;
    }

    return res;
  }

  renderClassMethodDef(doc: ddoc.ClassMethodDef): string {
    let res = `<span class=keyword>${
      doc.accessibility ? escape(doc.accessibility) + " " : ""
    }${doc.isAbstract ? "abstract " : ""}${doc.isStatic ? "static " : ""}${
      doc.kind === "getter"
        ? "get "
        : doc.kind === "setter"
        ? "set "
        : doc.kind === "method"
        ? ""
        : unreachable()
    }</span> ${escape(doc.name)}${doc.optional ? "?" : ""}${
      this.renderTypeParams(doc.functionDef.typeParams)
    }(${this.renderParams(doc.functionDef.params)})`;

    if (doc.jsDoc !== null) {
      res += `<hr>${this.renderJSDoc(doc.jsDoc)}`;
    }

    return res;
  }

  renderClassPropertyDef(doc: ddoc.ClassPropertyDef): string {
    let res = `<span class=keyword>${
      doc.accessibility ? escape(doc.accessibility) + " " : ""
    }${doc.isAbstract ? "abstract " : ""}${doc.isStatic ? "static " : ""}${
      doc.readonly ? "readonly " : ""
    }</span> ${escape(doc.name)}${doc.optional ? "?" : ""}`;

    if (doc.tsType !== null) {
      res += `: ${this.renderTsTypeDef(doc.tsType)}`;
    }

    if (doc.jsDoc !== null) {
      res += `<hr>${this.renderJSDoc(doc.jsDoc)}`;
    }

    return res;
  }

  renderDoc(doc: ddoc.DocNode[], namespace?: string[]): string {
    let final = "<ol class=nomarks>";
    for (const node of doc.sort(sortDocNode)) {
      final += `<li class=${node.kind === "namespace" ? "namespace" : "node"}>${
        this.renderDocNode(node, namespace)
      }</li>`;
    }
    final += "</ol>";
    return final;
  }

  renderDocNode(doc: ddoc.DocNode, namespace?: string[]): string {
    return `
    ${this.renderDocNodeKind(doc, namespace)}
    ${doc.jsDoc !== null ? `<hr>${this.renderJSDoc(doc.jsDoc)}` : ""}
  `;
  }

  renderDocNodeKind(doc: ddoc.DocNode, namespace?: string[]): string {
    switch (doc.kind) {
      case "class":
        return this.renderClassDef(doc, namespace);
      case "enum":
        return this.renderEnumDef(doc, namespace);
      case "function":
        return this.renderFunctionDef(doc, namespace);
      case "interface":
        return this.renderInterfaceDef(doc, namespace);
      case "namespace":
        return this.renderNamespaceDef(doc, namespace);
      case "typeAlias":
        return this.renderTypeAliasDef(doc, namespace);
      case "variable":
        return this.renderVariableDef(doc, namespace);
      default:
        return unimplemented((doc as { kind: string }).kind);
    }
  }

  renderEnumDef(doc: ddoc.DocNodeEnum, namespace?: string[]): string {
    return `<span class=keyword>enum</span> ${
      this.renderIdentifier(doc.name, namespace)
    }
    <ol class="nomarks noborder">${
      doc.enumDef.members.map((m) => `<li>${escape(m.name)}</li>`).join("")
    }</ol>`;
  }

  renderFunctionDef(
    doc: ddoc.DocNodeFunction,
    namespace?: string[],
  ): string {
    let res = `<span class=keyword>${
      doc.functionDef.isAsync ? "async " : ""
    }function${doc.functionDef.isGenerator ? "*" : ""}</span> ${
      this.renderIdentifier(doc.name, namespace)
    }${this.renderTypeParams(doc.functionDef.typeParams)}(${
      this.renderParams(doc.functionDef.params)
    })`;

    if (doc.functionDef.returnType !== null) {
      res += `: ${this.renderTsTypeDef(doc.functionDef.returnType)}`;
    }

    return res;
  }

  renderHead(title: string): string {
    return `
      <meta charset="utf-8">
      <meta name=viewport content="width=device-width">
      <title>${title}</title>
    ` + (
      this.#options.static
        ? `
        <style>${assets.css.content}</style>
        <script>${assets.script.content}</script>
      `
        : `
        <link rel=icon href="/static/logo">
        <link rel=stylesheet href="/static/css">
        <script type=module src="/static/script"></script>
      `
    );
  }

  renderHeader(title: string): string {
    return `<header>
      ${
      this.#options.static
        ? ""
        : `<a href="/"><img class=logo src="/static/logo" alt="Logo"></a>`
    }
      <h3 class="fill inline">${title}</h3>
      ${
      this.#options.static ? "" : `
          <label>Module URL: <input id=url type=url></label>
          <input id=openDoc type=button value=Go>
        `
    }
    </header>`;
  }

  renderIdentifier(identifier: string, namespace?: string[]): string {
    return escape(namespace ? namespace.join(".") + "." : "") +
      `<span class=identifier>${escape(identifier)}</span>`;
  }

  renderIndexSignatureDef(
    doc: ddoc.LiteralIndexSignatureDef,
  ): string {
    let res = `${doc.readonly ? "readonly " : ""} [${
      this.renderParams(doc.params)
    }]`;

    if (doc.tsType !== null) {
      res += `: ${this.renderTsTypeDef(doc.tsType)}`;
    }

    return res;
  }

  renderInfo(info: info.FileInfo): string {
    const unique_deps = new Set(info.deps[1].map((d) => d[0]));
    const direct = unique_deps.size;

    function scan_deps(deps: info.FileDeps): void {
      unique_deps.add(deps[0]);

      for (const dep of deps[1]) {
        scan_deps(dep);
      }
    }
    scan_deps(info.deps);
    unique_deps.delete(info.deps[0]);

    const transitive = unique_deps.size - direct;

    return `<details>
      <summary class=padding>
        Unique dependencies: ${direct} direct; ${transitive} transitive.
      </summary>
      <ol class="nomarks indent">
        ${
      Array.from(unique_deps.values()).sort().map((u) =>
        `<li>${
          this.#options.static
            ? escape(u)
            : `<a href="/doc/${encodeURIComponent(u)}">${escape(u)}</a>`
        }</li>`
      ).join("")
    }
      </ol>
    </details>`;
  }

  renderInterfaceCallSignatureDef(
    doc: ddoc.InterfaceCallSignatureDef,
  ): string {
    let res = `${this.renderTypeParams(doc.typeParams)}(${
      this.renderParams(doc.params)
    })`;

    if (doc.tsType !== null) {
      res += `: ${this.renderTsTypeDef(doc.tsType)}`;
    }

    if (doc.jsDoc !== null) {
      res += `<hr>${this.renderJSDoc(doc.jsDoc)}`;
    }

    return res;
  }

  renderInterfaceDef(
    doc: ddoc.DocNodeInterface,
    namespace?: string[],
  ): string {
    const id = doc.interfaceDef;

    let res = `<span class=keyword>interface</span> ${
      this.renderIdentifier(doc.name, namespace)
    }${this.renderTypeParams(id.typeParams)}`;

    if (id.extends.length > 0) {
      res += ` <span class=keyword>extends</span> <span class=typeref>${
        id.extends.map((t) => this.renderTsTypeDef(t)).join(", ")
      }</span>`;
    }

    if (id.properties.length > 0) {
      res += `<hr><ol class=nomarks>
      ${
        id.properties
          .map((p) => `<li>${this.renderInterfacePropertyDef(p)}</li>`).join("")
      }
    </ol>`;
    }

    if (id.callSignatures.length > 0) {
      res += `<hr><ol class=nomarks>
      ${
        id.callSignatures
          .map((p) => `<li>${this.renderInterfaceCallSignatureDef(p)}</li>`)
          .join("")
      }
    </ol>`;
    }

    if (id.methods.length > 0) {
      res += `<hr><ol class=nomarks>
      ${
        id.methods
          .map((p) => `<li>${this.renderInterfaceMethodDef(p)}</li>`).join("")
      }
    </ol>`;
    }

    if (id.indexSignatures.length > 0) {
      res += `<hr><ol class=nomarks>
      ${
        id.indexSignatures.map((p) =>
          `<li>${this.renderIndexSignatureDef(p)}</li>`
        )
          .join("")
      }
    </ol>`;
    }

    return res;
  }

  renderInterfaceMethodDef(doc: ddoc.InterfaceMethodDef): string {
    let res = `${escape(doc.name)}${doc.optional ? "?" : ""}${
      this.renderTypeParams(doc.typeParams)
    }(${this.renderParams(doc.params)})`;

    if (doc.jsDoc !== null) {
      res += `<hr>${this.renderJSDoc(doc.jsDoc)}`;
    }

    return res;
  }

  renderInterfacePropertyDef(doc: ddoc.InterfacePropertyDef): string {
    let res = `${escape(doc.name)}${doc.optional ? "?" : ""}`;

    if (doc.tsType !== null) {
      res += `: ${this.renderTsTypeDef(doc.tsType)}`;
    }

    if (doc.jsDoc !== null) {
      res += `<hr>${this.renderJSDoc(doc.jsDoc)}`;
    }

    return res;
  }

  renderJSDoc(doc: string): string {
    const summary_end = doc.indexOf("\n\n");
    const [summary, remainder] = summary_end !== -1
      ? [doc.slice(0, summary_end), doc.slice(summary_end)]
      : [doc, undefined];

    let res = `<pre>${escape(summary)}</pre>`;
    if (remainder !== undefined) {
      res = `<details><summary>${res}</summary><pre>${
        escape(remainder)
      }</pre></details>`;
    }
    return res;
  }

  renderLiteralCallSignatureDef(
    doc: ddoc.LiteralCallSignatureDef,
  ): string {
    let res = `${this.renderTypeParams(doc.typeParams)}(${
      this.renderParams(doc.params)
    })`;

    if (doc.tsType !== null) {
      res += `: ${this.renderTsTypeDef(doc.tsType)}`;
    }

    return res;
  }

  renderLiteralMethodDef(doc: ddoc.LiteralMethodDef): string {
    let res = `${escape(doc.name)}${this.renderTypeParams(doc.typeParams)}(${
      this.renderParams(doc.params)
    })`;

    return res;
  }

  renderLiteralPropertyDef(prop: ddoc.LiteralPropertyDef): string {
    let res = `${escape(prop.name)}${prop.optional ? "?" : ""}`;

    if (prop.tsType !== null) {
      res += `: ${this.renderTsTypeDef(prop.tsType)}`;
    }

    return res;
  }

  renderNamespaceDef(
    doc: ddoc.DocNodeNamespace,
    namespace: string[] = [],
  ): string {
    return `<span class=keyword>namespace</span> ${escape(doc.name)} ${
      this.renderDoc(doc.namespaceDef.elements, [...namespace, doc.name])
    }`;
  }

  renderParamDef(doc: ddoc.ParamDef): string {
    let res = this.renderParamDefKind(doc);

    if (doc.tsType !== null) {
      res += `: ${this.renderTsTypeDef(doc.tsType)}`;
    }

    return res;
  }

  renderObjectPatPropDef(prop: ddoc.ObjectPatPropDef): string {
    switch (prop.kind) {
      case "assign":
        // TODO Does not display assigned value
        return escape(prop.key);
      case "keyValue":
        return `${escape(prop.key)}: ${this.renderParamDef(prop.value)}`;
      case "rest":
        return `...${this.renderParamDef(prop.arg)}`;
    }
  }

  renderParamDefKind(doc: ddoc.ParamDef): string {
    switch (doc.kind) {
      case "array":
        return `[${
          doc.elements.map((e) => e === null ? "" : this.renderParamDef(e))
            .join(", ")
        }]${doc.optional ? "?" : ""}`;
      case "assign":
        // TODO Does not display assigned value
        return this.renderParamDef(doc.left);
      case "identifier":
        return escape(doc.name) + (doc.optional ? "?" : "");
      case "object":
        return `{${
          doc.props.map((p) => this.renderObjectPatPropDef(p)).join(", ")
        }}${doc.optional ? "?" : ""}`;
      case "rest":
        return `...${this.renderParamDef(doc.arg)}`;
      default:
        return unimplemented((doc as { kind: string }).kind);
    }
  }

  renderParams(params: ddoc.ParamDef[]): string {
    return params.map((p) => this.renderParamDef(p)).join(", ");
  }

  renderTypeAliasDef(
    doc: ddoc.DocNodeTypeAlias,
    namespace?: string[],
  ): string {
    return `<span class=keyword>type</span> ${
      this.renderIdentifier(doc.name, namespace)
    }${this.renderTypeParams(doc.typeAliasDef.typeParams)} = ${
      this.renderTsTypeDef(doc.typeAliasDef.tsType)
    }`;
  }

  renderTsTypeDef(type_def: ddoc.TsTypeDef): string {
    switch (type_def.kind) {
      case "array":
        return this.renderTsTypeDef(type_def.array) + "[]";
      case "conditional": {
        const ct = type_def.conditionalType;
        return `${
          this.renderTsTypeDef(ct.checkType)
        } <span class=keyword>extends</span> ${
          this.renderTsTypeDef(ct.extendsType)
        } ? ${this.renderTsTypeDef(ct.trueType)} : ${
          this.renderTsTypeDef(ct.falseType)
        }`;
      }
      case "fnOrConstructor": {
        const fn = type_def.fnOrConstructor;
        return `${
          fn.constructor ? "<span class=keyword>constructor</span>" : ""
        }${this.renderTypeParams(fn.typeParams)}(${
          this.renderParams(fn.params)
        }) => ${this.renderTsTypeDef(fn.tsType)}`;
      }
      case "indexedAccess": {
        const ia = type_def.indexedAccess;
        return `${ia.readonly ? "<span class=keyword>readonly</span> " : ""}${
          this.renderTsTypeDef(ia.objType)
        }[${this.renderTsTypeDef(ia.indexType)}]`;
      }
      case "intersection":
        return type_def.intersection.map((t) => this.renderTsTypeDef(t)).join(
          " & ",
        );
      case "keyword":
        return `<span class=exkeyword>${escape(type_def.keyword)}</span>`;
      case "literal": {
        const lit = type_def.literal;
        return `<span class=literal>${
          lit.kind === "boolean"
            ? String(lit.boolean)
            : lit.kind === "number"
            ? String(lit.number)
            : lit.kind === "string"
            ? `"${escape(lit.string)}"`
            : unreachable()
        }</span>`;
      }
      case "optional":
        return `${this.renderTsTypeDef(type_def.optional)}?`;
      case "parenthesized":
        return `(${this.renderTsTypeDef(type_def.parenthesized)})`;
      case "rest":
        return `...${this.renderTsTypeDef(type_def.rest)}`;
      case "this":
        assert(type_def.this);
        return `<span class=keyword>this</span>`;
      case "tuple":
        return `[${
          type_def.tuple.map((t) => this.renderTsTypeDef(t)).join(", ")
        }]`;
      case "typeLiteral":
        return this.renderTypeLiteral(type_def.typeLiteral);
      case "typeOperator":
        return `<span class=keyword>${
          escape(type_def.typeOperator.operator)
        }</span> ${this.renderTsTypeDef(type_def.typeOperator.tsType)}`;
      case "typeQuery":
        return `<span class=typeref>${escape(type_def.typeQuery)}</span>`;
      case "typeRef": {
        const tr = type_def.typeRef;
        return `<span class=typeref>${escape(tr.typeName)}</span>${
          tr.typeParams !== null
            ? `&lt${
              tr.typeParams.map((t) => this.renderTsTypeDef(t)).join(
                ", ",
              )
            }&gt`
            : ""
        }`;
      }
      case "union":
        return type_def.union.map((t) => this.renderTsTypeDef(t)).join(" | ");
      default:
        return unimplemented((type_def as { kind: string }).kind);
    }
  }

  renderTypeLiteral(lit: ddoc.TsTypeLiteralDef): string {
    return `{ ${
      [
        lit.properties.map((p) => this.renderLiteralPropertyDef(p)),
        lit.callSignatures.map((c) => this.renderLiteralCallSignatureDef(c)),
        lit.methods.map((m) => this.renderLiteralMethodDef(m)),
        lit.indexSignatures.map((i) => this.renderIndexSignatureDef(i)),
        "",
      ].flat().join("; ")
    } }`;
  }

  renderTypeParams(type_params: ddoc.TsTypeParamDef[]): string {
    return type_params.length !== 0
      ? `&lt${type_params.map((t) => this.renderTypeParamDef(t)).join(", ")}&gt`
      : "";
  }

  renderTypeParamDef(doc: ddoc.TsTypeParamDef): string {
    let res = `<span class=typeref>${escape(doc.name)}</span>`;

    if (doc.constraint !== undefined) {
      res += ` <span class=keyword>extends</span> ${
        this.renderTsTypeDef(doc.constraint)
      }`;
    }
    if (doc.default !== undefined) {
      res += ` = ${this.renderTsTypeDef(doc.default)}`;
    }

    return res;
  }

  renderVariableDef(
    doc: ddoc.DocNodeVariable,
    namespace?: string[],
  ): string {
    let res = `<span class=keyword>${escape(doc.variableDef.kind)}</span> ${
      this.renderIdentifier(doc.name, namespace)
    }`;

    if (doc.variableDef.tsType !== null) {
      res += `: ${this.renderTsTypeDef(doc.variableDef.tsType)}`;
    }

    return res;
  }
}

/*
 * Request handling
 */

const doc_prefix = "/doc/";
async function handleDoc(req: ServerRequest): Promise<void> {
  assert(req.url.startsWith(doc_prefix));
  const doc_url = decodeURIComponent(req.url.substr(doc_prefix.length));

  let doc;
  try {
    doc = await new DocRenderer().render(
      doc_url.length > 0 ? doc_url : undefined,
    );
  } catch (err) {
    if (err.stderr !== undefined) {
      handleFail(req, 500, escape(err.stderr));
    } else {
      handleFail(req, 500, "Documentation generation failed");
    }
    return;
  }

  await req.respond({
    status: 200,
    body: doc,
  });
}

async function handleFail(
  req: ServerRequest,
  status: number,
  message: string,
): Promise<void> {
  const rend = new DocRenderer();
  await req.respond({
    status,
    body: `<!DOCTYPE html>
    <html>
      <head>
        ${rend.renderHead("Docuraptor Error")}
      </head>
      <body>
        ${rend.renderHeader("An error occured")}
        <main>
          <pre>
            ${escape(message)}
          </pre>
        </main>
      </body>
    </html>`,
  });
}

const file_url = new URL("file:/");
let deps_url: URL | undefined = undefined;
async function handleIndex(req: ServerRequest): Promise<void> {
  const known_documentation = [];

  if (deps_url !== undefined) {
    for await (const protocol of Deno.readDir(deps_url.pathname)) {
      if (!protocol.isDirectory) {
        continue;
      }
      const path_url = new URL(protocol.name + "/", deps_url);
      for await (const host of Deno.readDir(path_url.pathname)) {
        if (!host.isDirectory) {
          continue;
        }
        const host_url = new URL(host.name + "/", path_url);
        for await (const resource of Deno.readDir(host_url.pathname)) {
          if (!resource.isFile || !resource.name.endsWith(".metadata.json")) {
            continue;
          }

          const resource_url = new URL(resource.name, host_url);
          const metadata_string = await Deno.readTextFile(
            resource_url.pathname,
          );
          const metadata: { headers: { [_: string]: string }; url: string } =
            JSON.parse(metadata_string);

          known_documentation.push(metadata.url);
        }
      }
    }
  } else {
    console.warn("Failed to determine cache directory");
  }

  const rend = new DocRenderer();
  await req.respond({
    status: 200,
    body: `<html>
      <head>
        ${rend.renderHead("Docuraptor Index")}
      </head>
      <body>
        ${rend.renderHeader("Docuraptor Index – Locally available modules")}
        <main>
          <ul>
            <li><a href="/doc/">Deno Builtin</a></li>
            ${
      known_documentation.sort().map(
        (url) =>
          `<li><a href="/doc/${encodeURIComponent(url)}">${
            escape(url)
          }</a></li>`,
      ).join("")
    }
          </ul>
        </main>
      </body>
    </html>`,
  });
}

const static_prefix = "/static/";
async function handleStatic(req: ServerRequest): Promise<void> {
  assert(req.url.startsWith(static_prefix));
  const resource = req.url.substr(static_prefix.length);
  const asset = assets[resource];

  if (asset === undefined) {
    handleFail(req, 404, "Resource not found");
  } else {
    await req.respond({
      status: 200,
      headers: new Headers({
        "Content-Type": asset.mimetype ?? "application/octet-stream",
      }),
      body: asset.content,
    });
  }
}

async function handler(req: ServerRequest): Promise<void> {
  if (!["HEAD", "GET"].includes(req.method)) {
    handleFail(req, 404, "Invalid method");
  }

  if (req.url.startsWith(static_prefix)) {
    await handleStatic(req);
  } else if (req.url.startsWith(doc_prefix)) {
    await handleDoc(req);
  } else if (req.url === "/") {
    await handleIndex(req);
  } else {
    await handleFail(req, 404, "Malformed path");
  }
}

/*
 * Main
 */

function argCheck(rest: {}, specifier_rest: (string | number)[]): void {
  if (Object.keys(rest).length > 0 || specifier_rest.length > 0) {
    console.error(
      `Superfluous arguments: ${[Object.keys(rest), specifier_rest].flat()}`,
    );
    Deno.exit(1);
  }
}

function open(s: string): void {
  Deno.run({
    cmd: Deno.build.os === "windows"
      ? ["start", "", s]
      : Deno.build.os === "darwin"
      ? ["open", s]
      : Deno.build.os === "linux"
      ? ["xdg-open", s]
      : unreachable(),
    stdin: "null",
    stdout: "null",
    stderr: "null",
  });
}

if (import.meta.main) {
  const usage_string = `
Docuraptor (${import.meta.url})

Start documentation server:
$ docuraptor [--port=<port>] [--hostname=<hostname>] [--skip-browser] [--builtin | <url>]

When the module specifier is omitted the documentation index is opened instead.

Generate HTML documentation:
$ docuraptor --generate [--builtin] <url>...
    `.trim();

  const { help, generate } = argsParse(Deno.args, {
    boolean: ["help", "generate"],
  });

  if (help) {
    console.log(usage_string);
    Deno.exit(0);
  }

  const p = Deno.run({
    cmd: ["deno", "info", "--json", "--unstable"],
    stdin: "null",
    stdout: "piped",
    stderr: "null",
  });

  const info: { modulesCache: string } = JSON.parse(
    decoder.decode(await p.output()),
  );

  if ((await p.status()).success) {
    deps_url = new URL(info.modulesCache + "/", file_url);
  }

  if (generate) {
    const { builtin, generate, "_": specifiers, ...rest } = argsParse(
      Deno.args,
      {
        boolean: ["builtin", "generate"],
      },
    );
    argCheck(rest, []);

    const targets: [string, string | undefined][] = specifiers.map((
      s,
    ) => [encodeURIComponent(s), s.toString()]);

    if (builtin) {
      targets.push(["Deno", undefined]);
    }

    const encoder = new TextEncoder();
    for (const [name, specifier] of targets) {
      let f;
      try {
        f = await Deno.open(`${name}.html`, {
          create: true,
          truncate: true,
          write: true,
        });
        await Deno.writeAll(
          f,
          encoder.encode(
            await new DocRenderer({ static: true }).render(specifier),
          ),
        );
      } finally {
        f?.close();
      }
    }
  } else {
    const {
      builtin,
      hostname,
      port,
      "skip-browser": skip,
      "_": specifier,
      ...rest
    } = argsParse(Deno.args, {
      default: {
        hostname: "127.0.0.1",
        port: 8709,
      },
      boolean: ["builtin", "skip-browser"],
      string: ["hostname"],
    });
    argCheck(rest, specifier.slice(1));

    if (typeof port !== "number") {
      console.error("Port must be a number");
      Deno.exit(1);
    }

    if (builtin && specifier.length > 0) {
      console.error("--builtin and <url> are mutually exclusive");
      Deno.exit(1);
    }

    let url = `http://${hostname}:${port}/`;
    if (builtin) {
      url += "doc/";
    } else if (specifier.length > 0) {
      url += `doc/${encodeURIComponent(specifier[0])}`;
    }

    console.info("Starting server...", url);

    if (!skip) {
      open(url);
    }

    for await (const req of serve({ hostname, port })) {
      await handler(req);
    }
  }
}
