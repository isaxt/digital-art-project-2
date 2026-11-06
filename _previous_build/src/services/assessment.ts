import type { Entity, EntityEvent } from "../types/entity";
import type { SourceRecord } from "../types/source";
import type { Certificate } from "../types/certificate";
import type { LedgerEvent, LedgerEventType } from "../types/ledger";
import type { SourceSnapshot } from "../types/source";
import type { Direction, TranslationRecord } from "../types/translation";
import { canonicalize } from "../utils/canonicalize";
import { sha256Hex } from "../utils/hashing";
import { eventId } from "../utils/ids";
import { RULESET_VERSION, classify, translate, DIRECTIONS } from "../engine/translate";

export const CERT_DISCLAIMER =
  "This certificate is an artwork-generated interpretation produced by a fictional institution. It is not an endorsement, valuation, or investment assessment, and it does not establish that any source claim is true.";

export async function makeSnapshot(
  entity: Entity, sources: SourceRecord[], events: EntityEvent[], capturedAt: string,
): Promise<SourceSnapshot> {
  const body = { entity, sourceRecords: sources, events };
  const hash = await sha256Hex(canonicalize(body));
  return { id: "SNAP-" + hash.slice(0, 12).toUpperCase(), entityId: entity.id, capturedAt, entity, sourceRecords: sources, events, hash };
}

export async function makeTranslationRecord(
  entity: Entity, snapshot: SourceSnapshot, direction: Direction, generatedAt: string,
): Promise<TranslationRecord> {
  const r = translate(snapshot.entity, snapshot.sourceRecords, snapshot.events, direction);
  const h = await sha256Hex([entity.id, direction, snapshot.id, RULESET_VERSION].join("|"));
  return {
    id: "TR-" + h.slice(0, 10).toUpperCase(), entityId: entity.id, direction, sourceSnapshotId: snapshot.id,
    sourceRecordIds: r.sourceRecordIds, appliedRuleIds: r.appliedRuleIds, ruleSetVersion: RULESET_VERSION,
    originalContent: r.originalContent, translatedContent: r.translatedContent,
    outputs: r.outputs, rationale: r.rationale, limitations: r.limitations,
    missingInputs: r.missingInputs, generatedAt, generationMethod: "deterministic",
  };
}

export const nextEventId = (chain: LedgerEvent[]) => eventId(chain.length + 1);

/** Body that is hashed. Excludes id-independent UI fields and the hash itself. */
function hashBody(e: Omit<LedgerEvent, "eventHash">) {
  return {
    id: e.id, sequence: e.sequence, eventType: e.eventType, entityId: e.entityId,
    sourceRecordIds: e.sourceRecordIds, sourceSnapshotId: e.sourceSnapshotId,
    translationRecordId: e.translationRecordId, certificateId: e.certificateId,
    timestamp: new Date(e.timestamp).toISOString(), ruleSetVersion: e.ruleSetVersion,
    payload: e.payload, hashAlgorithm: e.hashAlgorithm, payloadVersion: e.payloadVersion,
    ledgerType: e.ledgerType,
  };
}

export async function computeEventHash(e: Omit<LedgerEvent, "eventHash">): Promise<string> {
  return sha256Hex(canonicalize(hashBody(e)) + "|" + (e.previousEventHash ?? "GENESIS"));
}

export type NewEvent = {
  eventType: LedgerEventType; entityId?: string; sourceRecordIds?: string[]; sourceSnapshotId?: string;
  translationRecordId?: string; certificateId?: string; timestamp: string; ruleSetVersion?: string;
  payload: Record<string, unknown>;
};

/** Returns a NEW event; never mutates the chain. */
export async function buildNextEvent(chain: LedgerEvent[], n: NewEvent): Promise<LedgerEvent> {
  const prev = chain.length ? chain[chain.length - 1] : null;
  const partial: Omit<LedgerEvent, "eventHash"> = {
    id: nextEventId(chain), sequence: chain.length + 1, ...n,
    timestamp: new Date(n.timestamp).toISOString(),
    previousEventHash: prev ? prev.eventHash : null,
    hashAlgorithm: "SHA-256", payloadVersion: 1, ledgerType: "local_append_only",
  };
  return { ...partial, eventHash: await computeEventHash(partial) };
}

export interface VerifyRow { eventId: string; ok: boolean; reason?: string }

export async function verifyChain(chain: LedgerEvent[]): Promise<{ ok: boolean; rows: VerifyRow[] }> {
  const rows: VerifyRow[] = [];
  for (let i = 0; i < chain.length; i++) {
    const e = chain[i];
    const expectedPrev = i === 0 ? null : chain[i - 1].eventHash;
    if (e.sequence !== i + 1) { rows.push({ eventId: e.id, ok: false, reason: "sequence gap or reorder" }); continue; }
    if (e.previousEventHash !== expectedPrev) { rows.push({ eventId: e.id, ok: false, reason: "previous-hash link does not match prior event" }); continue; }
    const { eventHash, ...rest } = e;
    const recomputed = await computeEventHash(rest);
    rows.push(recomputed === eventHash ? { eventId: e.id, ok: true } : { eventId: e.id, ok: false, reason: "recomputed hash differs from stored hash" });
  }
  return { ok: rows.every((r) => r.ok), rows };
}

export interface Assessment {
  snapshot: SourceSnapshot; translation: TranslationRecord; certificate: Certificate; events: LedgerEvent[];
}

/** Creates snapshot + translation + certificate and the two ledger events that record them. */
export async function buildAssessment(
  chain: LedgerEvent[], entity: Entity, sources: SourceRecord[], events: EntityEvent[],
  direction: Direction, timestamp: string,
): Promise<Assessment> {
  const snapshot = await makeSnapshot(entity, sources, events, timestamp);
  const translation = await makeTranslationRecord(entity, snapshot, direction, timestamp);
  const certHash = await sha256Hex(translation.id);

  const trEvent = await buildNextEvent(chain, {
    eventType: "translation_created", entityId: entity.id, sourceRecordIds: translation.sourceRecordIds,
    sourceSnapshotId: snapshot.id, translationRecordId: translation.id, timestamp,
    ruleSetVersion: RULESET_VERSION,
    payload: { direction, appliedRuleIds: translation.appliedRuleIds, outputCount: translation.outputs.length, missingInputs: translation.missingInputs, generationMethod: "deterministic" },
  });
  const chain2 = [...chain, trEvent];

  const certificate: Certificate = {
    id: "CERT-" + certHash.slice(0, 8).toUpperCase(), entityId: entity.id, entityName: entity.displayName,
    entityType: entity.entityType, translationRecordId: translation.id, direction: DIRECTIONS[direction].label,
    appliedRuleIds: translation.appliedRuleIds, classification: classify(translation.outputs),
    rationale: [
      ...translation.rationale,
      ...(translation.missingInputs.length ? ["Missing inputs are recorded as unknown. They are not read as a negative assessment."] : []),
    ],
    issuedAt: new Date(timestamp).toISOString(), sourceSnapshotId: snapshot.id, ruleSetVersion: RULESET_VERSION,
    ledgerEventId: nextEventId(chain2), status: "local_simulation", disclaimer: CERT_DISCLAIMER,
  };
  const certEvent = await buildNextEvent(chain2, {
    eventType: "certificate_issued", entityId: entity.id, sourceRecordIds: translation.sourceRecordIds,
    sourceSnapshotId: snapshot.id, translationRecordId: translation.id, certificateId: certificate.id,
    timestamp, ruleSetVersion: RULESET_VERSION, payload: { certificate },
  });
  return { snapshot, translation, certificate, events: [trEvent, certEvent] };
}
