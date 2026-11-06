export type LedgerEventType =
  | "entity_registered"
  | "source_attached"
  | "translation_created"
  | "certificate_issued"
  | "record_corrected"
  | "record_disputed"
  | "record_withdrawn"
  | "testnet_anchor_created";

export interface LedgerEvent {
  id: string;
  eventType: LedgerEventType;

  entityId?: string;
  sourceRecordIds?: string[];
  sourceSnapshotId?: string;
  translationRecordId?: string;
  certificateId?: string;

  timestamp: string;
  ruleSetVersion?: string;

  payload: Record<string, unknown>;

  hashAlgorithm: "SHA-256";
  payloadVersion: 1;
  previousEventHash: string | null;
  eventHash: string;

  ledgerType: "local_append_only";
  externalTransactionHash?: string;
  externalExplorerUrl?: string;
}

export interface VerificationResult {
  ok: boolean;
  /** Index of first failing event, or -1. */
  firstFailure: number;
  perEvent: { id: string; hashOk: boolean; linkOk: boolean }[];
}
