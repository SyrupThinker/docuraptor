// deno-lint-ignore-file camelcase
import type * as ddoc from "./deno_doc_json.ts";
import { createGraph, ModuleGraph } from "./deps.ts";

const decoder = new TextDecoder();

export async function getDenoData(
  specifier?: string,
  { private: priv }: { private?: boolean } = {},
): Promise<{ doc: ddoc.DocNode[]; info: ModuleGraph | null }> {
  let proc_d;
  try {
    proc_d = Deno.run({
      cmd: [
        "deno",
        "doc",
        "--json",
        ...(priv ? ["--private"] : []),
        specifier ?? "--builtin",
      ],
      stdin: "null",
      stdout: "piped",
      stderr: "piped",
    });

    const stdout = decoder.decode(await proc_d.output());
    const stderr = decoder.decode(await proc_d.stderrOutput());
    const { success } = await proc_d.status();

    if (!success) {
      throw { stderr };
    }

    const doc_j: ddoc.DocNode[] = JSON.parse(stdout);
    let info_j: ModuleGraph | null = null;

    if (specifier !== undefined) {
      info_j = await createGraph(specifier);
    }

    return { doc: doc_j, info: info_j };
  } finally {
    proc_d?.close();
  }
}
