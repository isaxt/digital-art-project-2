import { canonicalize } from "./canonicalize";
import { shortHash } from "./hashing";

/** Deterministic IDs: the same logical assessment always yields the same ID (no random UUIDs). */
export async function derivedId(prefix: string, parts: unknown): Promise<string> {
  return `${prefix}-${await shortHash(canonicalize(parts), 10)}`;
}

export function eventId(index: number): string {
  return `EVT-${String(index + 1).padStart(6, "0")}`;
}
