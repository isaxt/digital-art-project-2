/** Display helpers. Stored values stay ISO 8601 strings; formatting never mutates data. */
export function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return iso.length > 10 ? iso.slice(0, 10) : iso;
}

export function fmtTimestamp(iso?: string): string {
  if (!iso) return "—";
  return iso.replace("T", " ").replace(/\.\d+Z$/, "Z");
}

export function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}
