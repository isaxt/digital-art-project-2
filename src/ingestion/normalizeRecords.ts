import type { NormalizedCandidate } from "./adapter";
import type { SourceRecord } from "../types/source";

/** Turn a reviewed candidate into a SourceRecord. Always starts as needs_review: a person promotes it after checking the source. */
export function candidateToSourceRecord(c: NormalizedCandidate, id: string, entityId: string): SourceRecord {
  return {
    id,
    entityId,
    provider: c.provider,
    providerRecordId: c.sourceRecordId,
    sourceUrl: c.sourceUrl,
    apiEndpoint: c.apiEndpoint,
    retrievedAt: c.retrievedAt,
    sourceTitle: typeof c.normalizedFields.objectTitle === "string" ? c.normalizedFields.objectTitle : undefined,
    normalizedFields: c.normalizedFields,
    reuseNotes: c.reuseNotes,
    verificationStatus: "needs_review",
    reviewNote: "Imported by script. Not yet checked by a person.",
  };
}

/** Skip candidates already present (same provider + provider record id). */
export function dedupe(candidates: NormalizedCandidate[], existing: SourceRecord[]): NormalizedCandidate[] {
  const seen = new Set(existing.map((s) => `${s.provider}|${s.providerRecordId ?? ""}`));
  return candidates.filter((c) => !seen.has(`${c.provider}|${c.sourceRecordId}`));
}
