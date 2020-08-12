import * as ddoc from "./deno_doc_json.ts";
import * as info from "./deno_info_json.ts";

const decoder = new TextDecoder();

export async function getDenoData(
  specifier?: string,
  { private: priv }: { private?: boolean } = {},
): Promise<{ doc: ddoc.DocNode[]; info: info.FileInfo | null }> {
  const proc = Deno.run({
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
