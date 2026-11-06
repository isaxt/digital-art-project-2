/**
 * Stable serialization: sorted keys, NFC-normalised strings, undefined dropped.
 * Object key order can never change the hash of the same logical event.
 */
export function canonicalize(value: unknown): string {
  if (value === undefined || value === null) return "null";
  switch (typeof value) {
    case "string":
      return JSON.stringify(value.normalize("NFC").trim());
    case "number":
      if (!Number.isFinite(value)) throw new Error("Cannot canonicalize non-finite number");
      return JSON.stringify(value);
    case "boolean":
      return value ? "true" : "false";
    case "object": {
      if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
      const obj = value as Record<string, unknown>;
      const keys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort();
      return "{" + keys.map((k) => JSON.stringify(k.normalize("NFC")) + ":" + canonicalize(obj[k])).join(",") + "}";
    }
    default:
      throw new Error(`Cannot canonicalize ${typeof value}`);
  }
}
