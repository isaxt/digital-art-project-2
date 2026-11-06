import type { Certificate, Snapshot } from "../types/certificate";
import type { LedgerEvent, StoreShape } from "../types/ledger";
import type { Direction, TranslationRecord } from "../types/translation";
import { canonicalize } from "./canonicalize";
import type { Dataset } from "./dataset";
import { sha256Hex } from "./hashing";
import { appendEvent } from "./ledger";
import { DIRECTION_LABEL, translate } from "./translate";

export const DISCLAIMER =
  "This certificate is an artwork-generated interpretation produced by a fictional institution. " +
  "It is not an endorsement, valuation, ranking or investment assessment of any person or company, " +
  "and the ledger entry beside it records only that the Office produced this text, not that it is true or deserved.";

const SNAPSHOT_VERSION = "1";

export async function buildSnapshot(ds: Dataset, entityId: string, capturedAt: string): Promise<Snapshot> {
  const entity = ds.entities.find((e) => e.id === entityId);
  if (!entity) throw new Error(`Unknown entity ${entityId}`);
  const sourceRecords = ds.sources.filter((s) => s.entityId === entityId).sort((a, b) => a.id.localeCompare(b.id));
  const events = ds.events.filter((e) => e.entityId === entityId).sort((a, b) => a.id.localeCompare(b.id));
  const affiliations = entity.affiliationIds.map((id) => ({
    id, displayName: ds.entities.find((e) => e.id === id)?.displayName ?? id,
  }));
  // Identity depends on content only, so identical source state => identical snapshot id.
  const digest = await sha256Hex(canonicalize({ v: SNAPSHOT_VERSION, entity, affiliations, sourceRecords, events }));
  return {
    id: "OCF-S-" + digest.slice(0, 12).toUpperCase(),
    entityId, capturedAt, payloadVersion: SNAPSHOT_VERSION, entity, affiliations, sourceRecords, events,
  };
}

function classify(direction: Direction, mappedCount: number): { classification: string; note: string } {
  if (mappedCount === 0) {
    return {
      classification: "Unclassified: no mappable source records in this dataset",
      note: "Absence of records is not an assessment of value, potential or reputation.",
    };
  }
  return {
    classification:
      direction === "artist_to_startup"
        ? "Provisional Registrant: Venture-Legible Practice"
        : "Provisional Registrant: Curator-Legible Venture",
    note: "This classification is an authored interpretation. It is unscored, unranked and not comparable between entities.",
  };
}

export interface AssessmentResult {
  applicable: boolean;
  notApplicableReason?: string;
  snapshot?: Snapshot;
  translation?: TranslationRecord;
  certificate?: Certificate;
  newEvents: LedgerEvent[];
  newSnapshot: boolean;
  newTranslation: boolean;
  /** false when an identical assessment already existed (no silent duplicates). */
  created: boolean;
}

/**
 * Create (or find) the translation record + certificate for one entity/direction,
 * appending the corresponding ledger events. Pure with respect to `store`: returns what to add.
 */
export async function createAssessment(
  ds: Dataset, store: StoreShape, entityId: string, direction: Direction, now: string,
): Promise<AssessmentResult> {
  const entity = ds.entities.find((e) => e.id === entityId);
  if (!entity) throw new Error(`Unknown entity ${entityId}`);

  const snapshot = await buildSnapshot(ds, entityId, now);
  const result = translate(entity, snapshot.sourceRecords, snapshot.events, direction, ds.ruleSet);
  if (!result.applicable) {
    return { applicable: false, notApplicableReason: result.notApplicableReason, newEvents: [], newSnapshot: false, newTranslation: false, created: false };
  }

  const existingSnapshot = store.snapshots[snapshot.id];
  const snap = existingSnapshot ?? snapshot;

  const tDigest = await sha256Hex(`${entityId}|${direction}|${ds.ruleSet.ruleSetVersion}|${snap.id}`);
  const translationId = "OCF-T-" + tDigest.slice(0, 10).toUpperCase();
  const existingTranslation = store.translations.find((t) => t.id === translationId);
  const translation: TranslationRecord = existingTranslation ?? {
    id: translationId, entityId, direction, snapshotId: snap.id,
    sourceRecordIds: snap.sourceRecords.map((s) => s.id),
    appliedRuleIds: result.appliedRuleIds,
    ruleSetVersion: ds.ruleSet.ruleSetVersion,
    originalContent: {
      description: snap.entity.description ?? null,
      events: snap.events.map((e) => ({ id: e.id, title: e.title, date: e.date ?? null, originalEventType: e.originalEventType })),
    },
    translatedContent: { outputs: result.outputs },
    rationale: result.rationale, limitations: result.limitations,
    generatedAt: now, generationMethod: "deterministic",
  };

  const certId = "OCF-C-" + (await sha256Hex("cert|" + translationId)).slice(0, 10).toUpperCase();
  const existingCert = store.certificates.find((c) => c.id === certId);
  if (existingCert) {
    return {
      applicable: true, snapshot: snap, translation, certificate: existingCert,
      newEvents: [], newSnapshot: false, newTranslation: false, created: false,
    };
  }

  const mapped = translation.translatedContent.outputs.filter((o) => o.confidenceLabel !== "insufficient_data");
  const { classification, note } = classify(direction, mapped.length);
  const ruleIds = [...new Set(mapped.map((o) => o.ruleId))];
  const certCore: Omit<Certificate, "ledgerEventId"> = {
    id: certId, entityId, entityName: entity.displayName, entityType: entity.entityType,
    translationRecordId: translationId, direction, appliedRuleIds: ruleIds,
    classification,
    rationale: [
      `${mapped.length} source fact(s) were translated (${DIRECTION_LABEL[direction]}) by ${ruleIds.length ? ruleIds.join(", ") : "no rules"}.`,
      note,
      `Source snapshot ${snap.id} and rule set ${ds.ruleSet.ruleSetVersion} are preserved with this certificate.`,
    ],
    issuedAt: now, sourceSnapshotId: snap.id, ruleSetVersion: ds.ruleSet.ruleSetVersion,
    status: "local_simulation", disclaimer: DISCLAIMER,
  };

  const chain = [...store.ledger];
  const newEvents: LedgerEvent[] = [];
  if (!existingTranslation) {
    const ev = await appendEvent(chain, {
      eventType: "translation_created", entityId, sourceRecordIds: translation.sourceRecordIds,
      translationRecordId: translationId, snapshotId: snap.id, timestamp: now,
      ruleSetVersion: ds.ruleSet.ruleSetVersion,
      payload: { direction, appliedRuleIds: translation.appliedRuleIds, outputsDigest: await sha256Hex(canonicalize(translation.translatedContent)) },
    });
    chain.push(ev); newEvents.push(ev);
  }
  const certEvent = await appendEvent(chain, {
    eventType: "certificate_issued", entityId, translationRecordId: translationId, certificateId: certId,
    snapshotId: snap.id, timestamp: now, ruleSetVersion: ds.ruleSet.ruleSetVersion,
    payload: { classification, certificateDigest: await sha256Hex(canonicalize(certCore)), status: "local_simulation" },
  });
  newEvents.push(certEvent);

  return {
    applicable: true, snapshot: snap, translation,
    certificate: { ...certCore, ledgerEventId: certEvent.id },
    newEvents, newSnapshot: !existingSnapshot, newTranslation: !existingTranslation, created: true,
  };
}

/** Register entities + attach sources, in dataset order. Used to build the seed ledger. */
export async function registrationEvents(ds: Dataset, startChain: LedgerEvent[], baseTime: number): Promise<LedgerEvent[]> {
  const chain = [...startChain];
  let t = baseTime;
  const stamp = () => new Date((t += 30_000)).toISOString();
  for (const entity of ds.entities) {
    chain.push(await appendEvent(chain, {
      eventType: "entity_registered", entityId: entity.id, timestamp: stamp(),
      payload: { displayName: entity.displayName, entityType: entity.entityType, verificationStatus: entity.verificationStatus, isFixture: entity.isFixture ?? false },
    }));
    for (const s of ds.sources.filter((x) => x.entityId === entity.id)) {
      chain.push(await appendEvent(chain, {
        eventType: "source_attached", entityId: entity.id, sourceRecordIds: [s.id], timestamp: stamp(),
        payload: { provider: s.provider, sourceUrl: s.sourceUrl, retrievedAt: s.retrievedAt, acquisition: s.acquisition, verificationStatus: s.verificationStatus },
      }));
    }
  }
  return chain.slice(startChain.length);
}
