export interface Certificate {
  id: string;
  entityId: string;
  entityName: string;
  entityType: string;
  translationRecordId: string;
  direction: string;

  classificationCode: string;
  classification: string;
  rationale: string[];

  issuedAt: string;
  sourceSnapshotId: string;
  ruleSetVersion: string;
  appliedRuleIds: string[];

  ledgerEventId?: string;

  /** Present only when the certificate was issued through the mining ritual. Seed certificates have none. */
  proofOfWork?: ProofOfWork;

  status: "local_simulation" | "testnet_anchored";

  disclaimer: string;
}

export interface ProofOfWork {
  /** Hash of the chain head the miner built on. */
  head: string;
  nonce: number;
  /** Required number of leading zero hex digits. */
  difficulty: number;
  /** sha256(canonical({certificateId, head, nonce})) */
  hash: string;
}
