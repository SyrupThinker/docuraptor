import assets from "./assets.ts";
import {
  assert,
  argsParse,
  pathJoin,
  serve,
  ServerRequest,
  unreachable,
} from "./deps.ts";
import { DocRenderer } from "./renderer.ts";
import { htmlEscape } from "./utility.ts";

const decoder = new TextDecoder();

/*
 * Request handling
 */

const doc_prefix = "/doc/";
async function handleDoc(req: ServerRequest): Promise<void> {
  assert(req.url.startsWith(doc_prefix));

  const args = req.url.substr(doc_prefix.length);
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
    if (err.stderr !== undefined) {
      handleFail(req, 500, htmlEscape(err.stderr));
    } else {
      handleFail(req, 500, "Documentation generation failed");
    }
    return;
  }

  await req.respond({
    status: 200,
    headers: new Headers({
      "Content-Type": "text/html",
    }),
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
    headers: new Headers({
      "Content-Type": "text/html",
    }),
    body: `<!DOCTYPE html>
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
    headers: new Headers({
      "Content-Type": "text/html",
    }),
    body: `<html>
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
  });
}

const form_prefix = "/form/";
async function handleForm(req: ServerRequest): Promise<void> {
  assert(req.url.startsWith(form_prefix));

  const args = req.url.substr(form_prefix.length);
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

      await req.respond({
        status: 301,
        headers: new Headers({
          "Location": `/doc/${search.get("url")!}`,
        }),
      });
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
  try {
    if (!["HEAD", "GET"].includes(req.method)) {
      handleFail(req, 404, "Invalid method");
    }

    if (req.url.startsWith(static_prefix)) {
      await handleStatic(req);
    } else if (req.url.startsWith(doc_prefix)) {
      await handleDoc(req);
    } else if (req.url.startsWith(form_prefix)) {
      await handleForm(req);
    } else if (req.url === "/") {
      await handleIndex(req);
    } else {
      await handleFail(req, 404, "Malformed path");
    }
  } finally {
    req.finalize();
    req.conn.close();
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

async function initialize() {
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
}

async function mainGenerate() {
  const { builtin, generate, out, private: priv, "_": specifiers, ...rest } =
    argsParse(
      Deno.args,
      {
        boolean: ["builtin", "generate", "private"],
        string: ["out"],
      },
    );
  argCheck(rest, []);

  const targets: [string, string | undefined][] = specifiers.map((
    s,
  ) => [encodeURIComponent(s), s.toString()]);

  if (builtin) {
    targets.push(["Deno", undefined]);
  }

  if (out !== undefined) {
    await Deno.mkdir(out, { recursive: true });
  }

  const encoder = new TextEncoder();
  for (const [name, specifier] of targets) {
    const filename = `${name}.html`;
    const filepath = out !== undefined ? pathJoin(out, filename) : filename;

    let f;
    try {
      f = await Deno.open(filepath, {
        create: true,
        truncate: true,
        write: true,
      });
      await Deno.writeAll(
        f,
        encoder.encode(
          await new DocRenderer({ static: true, private: priv }).render(
            specifier,
          ),
        ),
      );
    } finally {
      f?.close();
    }
  }
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

      Deno.run({
        cmd: [browser, url],
      });
    } catch {
      open(url);
    }
  }

  for await (const req of serve({ hostname, port })) {
    await handler(req);
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
$ docuraptor --generate [--private] [--out=<output dir>]
             [--builtin] <url>...

Writes the documentation of the selected modules
to the output directory, defaulting to the
current working directory.

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
