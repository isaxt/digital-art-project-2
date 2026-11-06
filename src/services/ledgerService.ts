/**
 * Cultural Capital Protocol (Layer 4): a local, append-only hash chain.
 * Tamper-EVIDENT only relative to a trusted copy of earlier events. It is not decentralized,
 * trustless, or immutable in the sense of a public blockchain, and the UI says so.
 */
import type { LedgerEvent, LedgerEventType, VerificationResult } from "../types/ledger";
import { canonicalize } from "../utils/canonicalize";
import { sha256Hex } from "../utils/hashing";
import { eventId } from "../utils/ids";

export const GENESIS = "GENESIS";

export type NewEventInput = {
  eventType: LedgerEventType;
  entityId?: string;
  sourceRecordIds?: string[];
  sourceSnapshotId?: string;
  translationRecordId?: string;
  certificateId?: string;
  timestamp: string;
  ruleSetVersion?: string;
  payload: Record<string, unknown>;
};

/** Only stable, non-UI fields are hashed. Key order is irrelevant (canonicalize sorts). */
export function hashableView(e: Omit<LedgerEvent, "eventHash">) {
  return {
    hashAlgorithm: e.hashAlgorithm,
    payloadVersion: e.payloadVersion,
    id: e.id,
    eventType: e.eventType,
    entityId: e.entityId,
    sourceRecordIds: e.sourceRecordIds,
    sourceSnapshotId: e.sourceSnapshotId,
    translationRecordId: e.translationRecordId,
    certificateId: e.certificateId,
    timestamp: e.timestamp,
    ruleSetVersion: e.ruleSetVersion,
    payload: e.payload,
    ledgerType: e.ledgerType,
  };
}

export async function computeEventHash(e: Omit<LedgerEvent, "eventHash">): Promise<string> {
  return sha256Hex(canonicalize(hashableView(e)) + "|" + (e.previousEventHash ?? GENESIS));
}

/** Returns a NEW array; the input chain is never mutated. */
export async function appendEvent(chain: readonly LedgerEvent[], input: NewEventInput): Promise<LedgerEvent[]> {
  const previous = chain.length ? chain[chain.length - 1].eventHash : null;
  const partial: Omit<LedgerEvent, "eventHash"> = {
    id: eventId(chain.length),
    ...input,
    hashAlgorithm: "SHA-256",
    payloadVersion: 1,
    previousEventHash: previous,
    ledgerType: "local_append_only",
  };
  const eventHash = await computeEventHash(partial);
  return [...chain, { ...partial, eventHash }];
}

export async function verifyChain(chain: readonly LedgerEvent[]): Promise<VerificationResult> {
  const perEvent: VerificationResult["perEvent"] = [];
  let firstFailure = -1;
  for (let i = 0; i < chain.length; i++) {
    const e = chain[i];
    const { eventHash, ...rest } = e;
    const hashOk = (await computeEventHash(rest)) === eventHash;
    const expectedPrev = i === 0 ? null : chain[i - 1].eventHash;
    const linkOk = e.previousEventHash === expectedPrev;
    perEvent.push({ id: e.id, hashOk, linkOk });
    if ((!hashOk || !linkOk) && firstFailure === -1) firstFailure = i;
  }
  return { ok: firstFailure === -1, firstFailure, perEvent };
}

/** Status of a record: the latest correction/dispute/withdrawal event referencing it wins; history stays visible. */
export function recordStatus(chain: readonly LedgerEvent[], certificateId: string): "current" | "corrected" | "disputed" | "withdrawn" {
  let status: "current" | "corrected" | "disputed" | "withdrawn" = "current";
  for (const e of chain) {
    if (e.certificateId !== certificateId) continue;
    if (e.eventType === "record_corrected") status = "corrected";
    if (e.eventType === "record_disputed") status = "disputed";
    if (e.eventType === "record_withdrawn") status = "withdrawn";
  }
  return status;
}
