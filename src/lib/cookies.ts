export function parseCookie(header?: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  header.split(";").forEach((part) => {
    const [k, ...rest] = part.trim().split("=");
    out[k] = decodeURIComponent(rest.join("=") || "");
  });
  return out;
}

export function makeCookie(
  name: string,
  value: string,
  opts: { httpOnly?: boolean; path?: string; maxAge?: number } = {}
) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path || "/"}`);
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  return parts.join("; ");
}
