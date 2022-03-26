import type * as ddoc from "./deno_doc_json.ts";
import type * as info from "./deno_info_json.ts";

const decoder = new TextDecoder();

export async function getDenoData(
  specifier?: string,
  { private: priv }: { private?: boolean } = {},
): Promise<{ doc: ddoc.DocNode[]; info: info.FileInfo | null }> {
  let proc_d;
  let proc_i;
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
    let info_j: info.FileInfo | null = null;

    if (specifier !== undefined) {
      proc_i = Deno.run({
        cmd: [
          "deno",
          "info",
          "--json",
          specifier,
        ],
        stdin: "null",
        stdout: "piped",
        stderr: "piped",
      });

      const stdout = decoder.decode(await proc_i.output());
      const stderr = decoder.decode(await proc_i.stderrOutput());
      const { success } = await proc_i.status();

      if (!success) {
        throw { stderr };
      }

      info_j = JSON.parse(stdout);
    }

    return { doc: doc_j, info: info_j };
  } finally {
    proc_d?.close();
    proc_i?.close();
  }
}
