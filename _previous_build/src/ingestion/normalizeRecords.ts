import type { Acquisition, SourceRecord } from "../types/source";
import type { NormalizedCandidate } from "./adapter";

/** Turn an adapter candidate into a SourceRecord draft. Always `needs_review` until a human verifies it. */
export function toSourceRecordDraft(
  c: NormalizedCandidate, entityId: string, id: string, provider: string, apiEndpoint: string, retrievedAt: string,
  acquisition: Acquisition = "api",
): SourceRecord {
  return {
    id, entityId, provider, providerRecordId: c.sourceRecordId, sourceUrl: c.sourceUrl, apiEndpoint,
    retrievedAt, sourceTitle: c.displayName, normalizedFields: c.normalizedFields,
    verificationStatus: "needs_review", acquisition,
    reuseNotes: "Review the provider's terms before displaying images or reproducing text.",
  };
}
