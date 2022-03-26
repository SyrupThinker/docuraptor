import { getDenoData } from "./deno_api.ts";
import { assert, pathJoin, pooledMap } from "./deps.ts";
import { DocRenderer } from "./renderer.ts";
import { htmlEscape, moduleToFile } from "./utility.ts";

export interface IndexOptions {
  builtin?: boolean;
  index_filename?: string;
  output_directory?: string;
  private?: boolean;
  recursive?: boolean;
}

// TODO Deno builtin documentation
/**
 * Generate static interlinked documentation for modules (and their dependencies) and an index
 */
export async function generateStatic(
  modules: string[],
  options?: IndexOptions,
): Promise<void> {
  const outdir = options?.output_directory ?? "";
  if (outdir !== "") {
    await Deno.mkdir(outdir, { recursive: true });
  }

  const full_modules: Set<string> = new Set();
  for await (
    const _ of pooledMap(32, modules, async (mod) => {
      const { info } = await getDenoData(mod);

      assert(info, `Deno failed to generate metadata for module ${mod}`);

      if (options?.recursive) {
        for (const mod of info.modules.map((m) => m.specifier)) {
          full_modules.add(mod);
        }
      } else {
        full_modules.add(info.roots[0]);
      }
    })
  );

  const renderer = new DocRenderer({
    private: options?.private,
    static: true,
    link_module: (mod) =>
      full_modules.has(mod) ? `${moduleToFile(mod)}.html` : undefined,
  });

  for await (
    const _ of pooledMap(32, full_modules.keys(), async (mod) => {
      const doc_html = await renderer.render(mod);
      await Deno.writeTextFile(
        pathJoin(outdir, `${moduleToFile(mod)}.html`),
        doc_html,
        {
          create: true,
        },
      );
    })
  );

  await Deno.writeTextFile(
    pathJoin(outdir, options?.index_filename ?? "index.html"),
    renderIndex(Array.from(full_modules.keys())),
  );
}

function renderIndex(modules: string[]): string {
  const rend = new DocRenderer({ static: true });
  return `<html>
      <head>
        ${rend.renderHead("Docuraptor Index")}
      </head>
      <body>
        ${rend.renderHeader("Documentation Index")}
        <main>
          <ul>
            ${
    modules.sort().map(
      (mod) =>
        `<li class=link><a href="./${moduleToFile(mod)}.html">${
          htmlEscape(mod)
        }</a></li>`,
    ).join("")
  }
          </ul>
        </main>
      </body>
    </html>`;
}
