import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import seed from "../data/seed.json";
import type { Certificate } from "../types/certificate";
import type { LedgerEvent } from "../types/ledger";
import type { SourceSnapshot } from "../types/source";
import type { Direction, TranslationRecord } from "../types/translation";
import { buildAssessment, buildNextEvent, verifyChain, type VerifyRow } from "./assessment";
import { RULESET_VERSION } from "../engine/translate";
import { ENTITIES, SOURCES, EVENTS, getEntity, sourcesFor } from "./registryService";

const KEY = "ocf.local.v1";
interface Local { ledger: LedgerEvent[]; certificates: Certificate[]; translations: TranslationRecord[]; snapshots: SourceSnapshot[] }
const EMPTY: Local = { ledger: [], certificates: [], translations: [], snapshots: [] };

const SEED = seed as unknown as Local;
const SEED_HEAD = SEED.ledger[SEED.ledger.length - 1]?.eventHash ?? null;

function load(): { local: Local; note?: string } {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { local: EMPTY };
    const l = JSON.parse(raw) as Local;
    if (l.ledger.length && l.ledger[0].previousEventHash !== SEED_HEAD)
      return { local: EMPTY, note: "Local additions from an earlier version of the seed ledger were set aside because they no longer link to it." };
    return { local: l };
  } catch { return { local: EMPTY }; }
}

export interface Verification { ok: boolean; rows: VerifyRow[] }
export type NoticeKind = "record_corrected" | "record_disputed";

interface Store {
  ledger: LedgerEvent[]; certificates: Certificate[]; translations: TranslationRecord[]; snapshots: SourceSnapshot[];
  verification: Verification | null; localCount: number; note?: string;
  issue(entityId: string, direction: Direction): Promise<{ certificate: Certificate; created: boolean }>;
  fileNotice(target: LedgerEvent, kind: NoticeKind, text: string): Promise<LedgerEvent>;
  resetLocal(): void;
}
const Ctx = createContext<Store | null>(null);
export const useStore = () => { const s = useContext(Ctx); if (!s) throw new Error("StoreProvider missing"); return s; };

export function StoreProvider({ children }: { children: ReactNode }) {
  const init = useMemo(load, []);
  const [local, setLocal] = useState<Local>(init.local);
  const [verification, setVerification] = useState<Verification | null>(null);

  const ledger = useMemo(() => [...SEED.ledger, ...local.ledger], [local]);
  const certificates = useMemo(() => [...SEED.certificates, ...local.certificates], [local]);
  const translations = useMemo(() => [...SEED.translations, ...local.translations], [local]);
  const snapshots = useMemo(() => [...SEED.snapshots, ...local.snapshots], [local]);

  // The chain is verified from the first event every time it changes.
  useEffect(() => { let live = true; verifyChain(ledger).then((v) => live && setVerification(v)); return () => { live = false; }; }, [ledger]);

  const persist = (next: Local) => { setLocal(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable: session-only */ } };

  const issue = useCallback<Store["issue"]>(async (entityId, direction) => {
    const entity = getEntity(entityId)!;
    const a = await buildAssessment(ledger, entity, sourcesFor(entity), EVENTS.filter((e) => e.entityId === entityId), direction, new Date().toISOString());
    // Same snapshot + direction + rule set ⇒ same translation ID ⇒ same certificate. Reopen, don't reissue.
    const existing = certificates.find((c) => c.translationRecordId === a.translation.id);
    if (existing) return { certificate: existing, created: false };
    persist({
      ledger: [...local.ledger, ...a.events], certificates: [...local.certificates, a.certificate],
      translations: [...local.translations, a.translation], snapshots: [...local.snapshots, a.snapshot],
    });
    return { certificate: a.certificate, created: true };
  }, [ledger, certificates, local]);

  const fileNotice = useCallback<Store["fileNotice"]>(async (target, kind, text) => {
    const ev = await buildNextEvent(ledger, {
      eventType: kind, entityId: target.entityId, sourceRecordIds: target.sourceRecordIds, sourceSnapshotId: target.sourceSnapshotId,
      translationRecordId: target.translationRecordId, certificateId: target.certificateId,
      timestamp: new Date().toISOString(), ruleSetVersion: target.ruleSetVersion ?? RULESET_VERSION,
      payload: { refersToEventId: target.id, refersToEventHash: target.eventHash, note: text.trim(), origin: "visitor, local browser only" },
    });
    persist({ ...local, ledger: [...local.ledger, ev] });
    return ev;
  }, [ledger, local]);

  const resetLocal = () => { try { localStorage.removeItem(KEY); } catch { /* ignore */ } setLocal(EMPTY); };

  const value: Store = { ledger, certificates, translations, snapshots, verification, localCount: local.ledger.length, note: init.note, issue, fileNotice, resetLocal };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const dataCounts = () => ({ entities: ENTITIES.length, sources: SOURCES.length, events: EVENTS.length });
