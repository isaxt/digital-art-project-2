import type { Certificate, ProofOfWork } from "../types/certificate";
import type { LedgerEvent } from "../types/ledger";
import type { Direction, RuleSet, TranslationRecord } from "../types/translation";
import { CONFIG } from "../config";
import { derivedId } from "../utils/ids";
import { appendEvent } from "./ledgerService";
import { buildTranslationRecord, DIRECTIONS, type EntitySnapshot } from "./translationService";

/**
 * Authored classification vocabulary. It describes how much of the record the rules could read.
 * It is NOT a quality, merit or potential score, and "nothing to read" is never negative.
 */
export function classify(mappedCount: number): { code: string; label: string } {
  if (mappedCount >= 3) return { code: "OCF-C3", label: "Interpretable: multiple rule mappings" };
  if (mappedCount >= 1) return { code: "OCF-C2", label: "Interpretable: partial rule mapping" };
  return { code: "OCF-C0", label: "Not classified: insufficient mapped data (no inference drawn)" };
}

export interface Issuance {
  translation: TranslationRecord;
  certificate: Certificate;
  chain: LedgerEvent[];
}

/** Deterministic certificate ID: re-issuing the same assessment returns the same ID, never a lookalike. */
export async function certificateIdFor(entityId: string, direction: Direction, snapshotId: string, ruleSetVersion: string) {
  return derivedId("CERT", { entityId, direction, snapshotId, ruleSetVersion });
}

export async function issue(
  snap: EntitySnapshot,
  direction: Direction,
  ruleSet: RuleSet,
  chain: readonly LedgerEvent[],
  issuedAt: string,
  pow?: ProofOfWork,
): Promise<Issuance> {
  const translation = await buildTranslationRecord(snap, direction, ruleSet, issuedAt);
  const mappedCount = (translation.translatedContent.outputs as { confidenceLabel: string }[]).filter(
    (o) => o.confidenceLabel !== "insufficient_data",
  ).length;
  const cls = classify(mappedCount);
  const certId = await certificateIdFor(snap.entity.id, direction, translation.sourceSnapshotId, ruleSet.version);

  let next = await appendEvent(chain, {
    eventType: "translation_created",
    entityId: snap.entity.id,
    sourceRecordIds: translation.sourceRecordIds,
    sourceSnapshotId: translation.sourceSnapshotId,
    translationRecordId: translation.id,
    timestamp: issuedAt,
    ruleSetVersion: ruleSet.version,
    payload: { direction, appliedRuleIds: translation.appliedRuleIds, generationMethod: translation.generationMethod },
  });

  next = await appendEvent(next, {
    eventType: "certificate_issued",
    entityId: snap.entity.id,
    sourceRecordIds: translation.sourceRecordIds,
    sourceSnapshotId: translation.sourceSnapshotId,
    translationRecordId: translation.id,
    certificateId: certId,
    timestamp: issuedAt,
    ruleSetVersion: ruleSet.version,
    payload: { classificationCode: cls.code, classification: cls.label, direction, mappedCount, ...(pow ? { proofOfWork: pow } : {}) },
  });

  const ledgerEventId = next[next.length - 1].id;
  const certificate: Certificate = {
    id: certId,
    entityId: snap.entity.id,
    entityName: snap.entity.displayName,
    entityType: snap.entity.entityType,
    translationRecordId: translation.id,
    direction: DIRECTIONS[direction].label,
    classificationCode: cls.code,
    classification: cls.label,
    rationale: [
      `${mappedCount} source fact(s) were readable by the ${DIRECTIONS[direction].label} rules.`,
      ...translation.rationale,
    ],
    issuedAt,
    sourceSnapshotId: translation.sourceSnapshotId,
    ruleSetVersion: ruleSet.version,
    appliedRuleIds: translation.appliedRuleIds,
    ledgerEventId,
    ...(pow ? { proofOfWork: pow } : {}),
    status: "local_simulation",
    disclaimer: CONFIG.disclaimer,
  };
  return { translation, certificate, chain: next };
}
