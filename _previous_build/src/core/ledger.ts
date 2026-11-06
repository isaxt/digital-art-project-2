import type { LedgerEvent } from "../types/ledger";
import { canonicalize } from "./canonicalize";
import { sha256Hex } from "./hashing";

export const PAYLOAD_VERSION = "1";
const GENESIS = "GENESIS";

export type LedgerDraft = Omit<
  LedgerEvent,
  "id" | "previousEventHash" | "eventHash" | "ledgerType" | "hashAlgorithm" | "payloadVersion"
>;

/** Everything that is hashed. Volatile UI-only fields are never included. */
function hashable(e: Omit<LedgerEvent, "eventHash">) {
  return {
    id: e.id, eventType: e.eventType, entityId: e.entityId, sourceRecordIds: e.sourceRecordIds,
    translationRecordId: e.translationRecordId, certificateId: e.certificateId, snapshotId: e.snapshotId,
    timestamp: e.timestamp, ruleSetVersion: e.ruleSetVersion, payload: e.payload,
    hashAlgorithm: e.hashAlgorithm, payloadVersion: e.payloadVersion, ledgerType: e.ledgerType,
  };
}

// eventHash = SHA256( canonicalEventPayload + "\n" + previousEventHash )
export async function computeEventHash(e: Omit<LedgerEvent, "eventHash">): Promise<string> {
  return sha256Hex(canonicalize(hashable(e)) + "\n" + (e.previousEventHash ?? GENESIS));
}

export function nextEventId(chain: LedgerEvent[]): string {
  return "OCF-L-" + String(chain.length + 1).padStart(5, "0");
}

export async function appendEvent(chain: LedgerEvent[], draft: LedgerDraft): Promise<LedgerEvent> {
  const base: Omit<LedgerEvent, "eventHash"> = {
    ...draft,
    id: nextEventId(chain),
    hashAlgorithm: "SHA-256",
    payloadVersion: PAYLOAD_VERSION,
    ledgerType: "local_append_only",
    previousEventHash: chain.length ? chain[chain.length - 1].eventHash : null,
  };
  return { ...base, eventHash: await computeEventHash(base) };
}

export interface EventCheck {
  id: string;
  hashMatches: boolean;
  linkMatches: boolean;
  ok: boolean;
}
export interface ChainVerification {
  ok: boolean;
  checked: number;
  firstFailureIndex: number | null;
  results: EventCheck[];
}

/** Verify from the first event onward. A failure is an integrity warning, not proof of tampering. */
export async function verifyChain(chain: LedgerEvent[]): Promise<ChainVerification> {
  const results: EventCheck[] = [];
  let firstFailureIndex: number | null = null;
  for (let i = 0; i < chain.length; i++) {
    const e = chain[i];
    const { eventHash, ...rest } = e;
    const hashMatches = (await computeEventHash(rest)) === eventHash;
    const linkMatches = e.previousEventHash === (i === 0 ? null : chain[i - 1].eventHash);
    const ok = hashMatches && linkMatches;
    if (!ok && firstFailureIndex === null) firstFailureIndex = i;
    results.push({ id: e.id, hashMatches, linkMatches, ok });
  }
  return { ok: firstFailureIndex === null, checked: chain.length, firstFailureIndex, results };
}

export type RecordStatus = "current" | "corrected" | "disputed" | "withdrawn";

/** Derived, never stored: later events change an earlier record's *status*, not its content. */
export function statusOf(event: LedgerEvent, chain: LedgerEvent[]): RecordStatus {
  let status: RecordStatus = "current";
  for (const later of chain) {
    if (later.payload.targetEventId !== event.id) continue;
    if (later.eventType === "record_withdrawn") status = "withdrawn";
    else if (later.eventType === "record_disputed" && status !== "withdrawn") status = "disputed";
    else if (later.eventType === "record_corrected" && status === "current") status = "corrected";
  }
  return status;
}
