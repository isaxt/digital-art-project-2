import type { VerificationStatus } from "./entity";

export interface SourceRecord {
  id: string;
  entityId: string;

  provider: string;
  providerRecordId?: string;
  sourceUrl: string;
  apiEndpoint?: string;

  retrievedAt: string;
  publishedAt?: string;

  sourceTitle?: string;
  /** Verbatim excerpt. Never paraphrased. */
  sourceExcerpt?: string;

  rawDataReference?: string;
  normalizedFields: Record<string, unknown>;

  reuseNotes?: string;
  verificationStatus: VerificationStatus;
  /** Reviewer note about how this record was obtained / what still needs checking. */
  reviewNote?: string;
}
