/**
 * Stable serialization: object keys are sorted, strings are NFC-normalized and trimmed,
 * `undefined` members are dropped (as JSON would), so key order or absent optionals
 * never change a hash for the same logical content.
 */
export function canonicalize(value: unknown): string {
  return JSON.stringify(normalize(value));
}

function normalize(v: unknown): unknown {
  if (v === null) return null;
  if (typeof v === "string") return v.normalize("NFC").trim();
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (Array.isArray(v)) return v.map((x) => (x === undefined ? null : normalize(x)));
  if (typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(v as object).sort()) {
      const val = (v as Record<string, unknown>)[k];
      if (val !== undefined) out[k] = normalize(val);
    }
    return out;
  }
  return null;
}
