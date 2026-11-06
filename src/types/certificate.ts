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

  status: "local_simulation" | "testnet_anchored";

  disclaimer: string;
}
