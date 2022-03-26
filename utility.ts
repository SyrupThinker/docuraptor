export function htmlEscape(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(
    ">",
    "&gt;",
  );
}

const size_units = ["B", "KiB", "MiB", "GiB"];
export function humanSize(bytes: number): string {
  let unit = 0;
  while (bytes > 1024 && unit < size_units.length - 1) {
    bytes /= 1024;
    unit++;
  }

  const visual = Math.round(bytes * 100) / 100;
  return `${visual !== bytes ? "~" : ""}${visual}${size_units[unit]}`;
}

export function identifierId(namespace: string[], identifier: string): string {
  const namespace_html = htmlEscape(
    namespace.length ? namespace.join(".") + "." : "",
  );
  return `ident_${namespace_html}${htmlEscape(identifier)}`;
}

const encoder = new TextEncoder();
/**
 * Convert a module identifier to a file name compatible with URL's and most file systems
 *
 * Achieved by encoding all non ASCII alphanumeric bytes.
 */
export function moduleToFile(module_url: string): string {
  return Array.from(encoder.encode(module_url).values()).map((byte) =>
    ((0x30 <= byte && byte < 0x3A) || (0x41 <= byte && byte < 0x5B) ||
        (0x61 <= byte && byte < 0x7B))
      ? String.fromCharCode(byte)
      : `$${byte.toString(16).padStart(2, "0")}`
  ).join("");
}
