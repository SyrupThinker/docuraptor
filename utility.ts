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

  let visual = Math.round(bytes * 100) / 100;
  return `${visual !== bytes ? "~" : ""}${visual}${size_units[unit]}`;
}

export function identifierId(namespace: string[], identifier: string): string {
  const namespace_html = htmlEscape(
    namespace.length ? namespace.join(".") + "." : "",
  );
  return `ident_${namespace_html}${htmlEscape(identifier)}`;
}
