// deno-lint-ignore-file camelcase
import assets from "./assets.ts";
import { argsParse, assert, unreachable } from "./deps.ts";
import { generateStatic } from "./generator.ts";
import { DocRenderer } from "./renderer.ts";
import { htmlEscape } from "./utility.ts";

const decoder = new TextDecoder();

/*
 * Request handling
 */

const doc_prefix = "/doc/";
async function handleDoc(req: Deno.RequestEvent): Promise<void> {
  const path = new URL(req.request.url).pathname;
  assert(path.startsWith(doc_prefix));

  const args = path.substr(doc_prefix.length);
  const search_index = args.indexOf("?");

  const doc_url = decodeURIComponent(
    search_index === -1 ? args : args.slice(0, search_index),
  );
  const search = new URLSearchParams(
    search_index === -1 ? "" : args.slice(search_index),
  );

  let doc;
  try {
    doc = await new DocRenderer({
      private: !!search.get("private"),
      link_module: (mod) => `/doc/${encodeURIComponent(mod)}`,
    }).render(
      doc_url.length > 0 ? doc_url : undefined,
    );
  } catch (err) {
    console.log(err);
    if (err.stderr !== undefined) {
      handleFail(req, 500, htmlEscape(err.stderr));
    } else {
      handleFail(req, 500, "Documentation generation failed");
    }
    return;
  }

  await req.respondWith(
    new Response(doc, {
      status: 200,
      headers: new Headers({
        "Content-Type": "text/html",
      }),
    }),
  );
}

async function handleFail(
  req: Deno.RequestEvent,
  status: number,
  message: string,
): Promise<void> {
  const rend = new DocRenderer();
  await req.respondWith(
    new Response(
      `<!DOCTYPE html>
  <html>
    <head>
      ${rend.renderHead("Docuraptor Error")}
    </head>
    <body>
      ${rend.renderHeader("An error occured")}
      <main>
        <pre>
          ${htmlEscape(message)}
        </pre>
      </main>
    </body>
  </html>`,
      {
        status,
        headers: new Headers({
          "Content-Type": "text/html",
        }),
      },
    ),
  );
}

const file_url = new URL("file:/");
let deps_url: URL | undefined = undefined;
async function handleIndex(req: Deno.RequestEvent): Promise<void> {
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
  await req.respondWith(
    new Response(
      `<html>
  <head>
    ${rend.renderHead("Docuraptor Index")}
  </head>
  <body>
    ${rend.renderHeader("Docuraptor Index – Locally available modules")}
    <main>
      <ul>
        <li class=link><a href="/doc/">Deno Builtin</a></li>
        ${
        known_documentation.sort().map(
          (url) =>
            `<li class=link><a href="/doc/${encodeURIComponent(url)}">${
              htmlEscape(url)
            }</a></li>`,
        ).join("")
      }
      </ul>
    </main>
  </body>
</html>`,
      {
        status: 200,
        headers: new Headers({
          "Content-Type": "text/html",
        }),
      },
    ),
  );
}

const form_prefix = "/form/";
async function handleForm(req: Deno.RequestEvent): Promise<void> {
  const path = new URL(req.request.url).pathname;
  assert(path.startsWith(form_prefix));

  const args = path.substr(form_prefix.length);
  const search_index = args.indexOf("?");
  const form_action = args.slice(0, search_index);
  const search = new URLSearchParams(
    search_index === -1 ? "" : args.slice(search_index),
  );

  switch (form_action) {
    case "open": {
      if (!search.has("url")) {
        await handleFail(req, 400, "Received invalid request");
        return;
      }

      await req.respondWith(
        new Response("", {
          status: 301,
          headers: new Headers({
            "Location": `/doc/${search.get("url")!}`,
          }),
        }),
      );
      break;
    }
    default:
      await handleFail(
        req,
        400,
        `Invalid form action ${htmlEscape(form_action)}`,
      );
  }
}

const static_prefix = "/static/";
async function handleStatic(req: Deno.RequestEvent): Promise<void> {
  const path = new URL(req.request.url).pathname;
  assert(path.startsWith(static_prefix));
  const resource = path.substr(static_prefix.length);
  const asset = assets[resource];

  if (asset === undefined) {
    handleFail(req, 404, "Resource not found");
  } else {
    await req.respondWith(
      new Response(asset.content, {
        status: 200,
        headers: new Headers({
          "Content-Type": asset.mimetype ?? "application/octet-stream",
        }),
      }),
    );
  }
}

async function handler(req: Deno.RequestEvent): Promise<void> {
  try {
    const path = new URL(req.request.url).pathname;
    if (!["HEAD", "GET"].includes(req.request.method)) {
      handleFail(req, 404, "Invalid method");
    }
    if (path.startsWith(static_prefix)) {
      await handleStatic(req);
    } else if (path.startsWith(doc_prefix)) {
      await handleDoc(req);
    } else if (path.startsWith(form_prefix)) {
      await handleForm(req);
    } else if (path === "/") {
      await handleIndex(req);
    } else {
      await handleFail(req, 404, "Malformed path");
    }
  } finally {
    // pass
  }
}

/*
 * Main
 */

function argCheck(
  rest: Record<string, unknown>,
  specifier_rest: (string | number)[],
): void {
  if (Object.keys(rest).length > 0 || specifier_rest.length > 0) {
    console.error(
      `Superfluous arguments: ${[Object.keys(rest), specifier_rest].flat()}`,
    );
    Deno.exit(1);
  }
}

function open(s: string): void {
  const run = Deno.run({
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

  run.status().finally(() => run.close());
}

async function initialize() {
  let p;
  try {
    p = Deno.run({
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
  } finally {
    p?.close();
  }
}

async function mainGenerate() {
  const {
    builtin,
    dependencies,
    index,
    out,
    private: priv,
    "_": specifiers,
    ...rest
  } = argsParse(
    Deno.args,
    {
      boolean: [/*"builtin",*/ "dependencies", "generate", "private"],
      string: ["index", "out"],
    },
  );
  argCheck(rest, []);

  await generateStatic(specifiers.map((v) => v.toString()), {
    builtin,
    index_filename: index,
    output_directory: out,
    private: priv,
    recursive: dependencies,
  });
}

async function mainServer() {
  const {
    builtin,
    hostname,
    port,
    private: priv,
    "skip-browser": skip,
    "_": specifier,
    ...rest
  } = argsParse(Deno.args, {
    default: {
      hostname: "127.0.0.1",
      port: 8709,
    },
    boolean: ["builtin", "private", "skip-browser"],
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

  if (priv && specifier.length === 0) {
    console.error("Must provide a specifier with --private");
    Deno.exit(1);
  }

  let url = `http://${hostname}:${port}/`;
  if (builtin) {
    url += "doc/";
  } else if (specifier.length > 0) {
    url += `doc/${encodeURIComponent(specifier[0])}`;
  }
  if (priv) {
    url += "?private=1";
  }

  console.info("Starting server...", url);

  if (!skip) {
    try {
      const browser = Deno.env.get("DOCURAPTOR_BROWSER") ??
        Deno.env.get("BROWSER");
      if (browser === undefined) {
        throw null;
      }

      const run = Deno.run({
        cmd: [browser, url],
      });

      run.status().finally(() => run.close());
    } catch {
      // open(url);
    }
  }
  const listener = Deno.listen({ port, hostname });
  for await (const conn of listener) {
    (async () => {
      const httpConn = Deno.serveHttp(conn);
      for await (const req of httpConn) {
        handler(req);
      }
    })();
  }
}

if (import.meta.main) {
  const usage_string = `%cDocuraptor%c (${import.meta.url})

%cStart documentation server:%c
$ docuraptor [--port=<port>] [--hostname=<hostname>]
             [--skip-browser] [--private] [--builtin | <url>]

Opens the selected module or,
if the module specifier is omitted, the documentation index,
in the system browser.
Listens on 127.0.0.1:8709 by default.

%cAdditionally requires network access for hostname:port.%c


%cGenerate HTML documentation:%c
$ docuraptor --generate [--out=<output dir>] [--index=<index file>]
             [--dependencies] [--private] <url>...

Writes the documentation of the selected modules
to the output directory, defaulting to the
current working directory.
With the dependencies flag set documentation is also
generated for all modules dependet upon.
Writes an index of all generated documentation
to the index file, defaulting to %cindex.html%c. 

%cAdditionally requires write access to the output directory.%c


%cAll functions require allow-run and read access to the Deno cache.%c

The system browser can be overwritten with the
DOCURAPTOR_BROWSER and BROWSER environment variables.
%cRequires allow-env.%c`;

  const usage_css = [
    "font-weight: bold",
    "",
    "text-decoration: underline;",
    "",
    "font-style: italic;",
    "",
    "text-decoration: underline;",
    "",
    "font-style: italic;",
    "",
    "font-style: italic;",
    "",
    "font-style: italic;",
    "",
    "font-style: italic;",
    "",
  ];

  const { help, generate } = argsParse(Deno.args, {
    boolean: ["help", "generate"],
  });

  if (help) {
    console.log(usage_string, ...usage_css);
    Deno.exit(0);
  }

  await initialize();

  if (generate) {
    mainGenerate();
  } else {
    mainServer();
  }
}
