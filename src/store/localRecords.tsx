/**
 * Visitor-generated records live in this browser only (localStorage), appended after the seed chain.
 * Nothing is sent anywhere. Storage can be unavailable or cleared, so every access is guarded and the
 * site works without it.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CONFIG } from "../config";
import type { Certificate } from "../types/certificate";
import type { LedgerEvent } from "../types/ledger";
import type { Direction, TranslationRecord } from "../types/translation";
import { issue, certificateIdFor } from "../services/certificateService";
import { appendEvent, verifyChain, type NewEventInput } from "../services/ledgerService";
import { ruleSet, seedCertificates, seedLedger, seedTranslations, snapshotOf, getEntity } from "../services/registryService";
import { snapshotId } from "../services/translationService";
import type { VerificationResult } from "../types/ledger";
import { nowIso } from "../utils/dates";

interface Local {
  events: LedgerEvent[];
  certificates: Certificate[];
  translations: TranslationRecord[];
}
const EMPTY: Local = { events: [], certificates: [], translations: [] };

function load(): Local {
  try {
    const raw = window.localStorage.getItem(CONFIG.localStorageKey);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Local) } : EMPTY;
  } catch {
    return EMPTY;
  }
}
function save(l: Local) {
  try {
    window.localStorage.setItem(CONFIG.localStorageKey, JSON.stringify(l));
  } catch {
    /* storage unavailable: records last for this session only */
  }
}

interface Ctx {
  ledger: LedgerEvent[];
  certificates: Certificate[];
  translations: TranslationRecord[];
  verification: VerificationResult | null;
  localCount: number;
  issueCertificate: (entityId: string, direction: Direction) => Promise<{ certificateId: string; created: boolean }>;
  appendRecordEvent: (type: "record_corrected" | "record_disputed" | "record_withdrawn", certificateId: string, note: string) => Promise<void>;
  resetLocal: () => void;
  /** Test hook for the "break the chain" demonstration on the ledger page. */
  tamperDemo: boolean;
  setTamperDemo: (b: boolean) => void;
}
const Store = createContext<Ctx | null>(null);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [local, setLocal] = useState<Local>(EMPTY);
  const [tamperDemo, setTamperDemo] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const localRef = useRef(local);
  localRef.current = local;

  useEffect(() => setLocal(load()), []);

  const baseLedger = useMemo(() => [...seedLedger, ...local.events], [local.events]);
  // The tamper demo alters a copy in memory to show verification catching it; stored data is untouched.
  const ledger = useMemo(() => {
    if (!tamperDemo || baseLedger.length < 3) return baseLedger;
    const copy = baseLedger.map((e) => ({ ...e }));
    copy[2] = { ...copy[2], payload: { ...copy[2].payload, tampered: true } };
    return copy;
  }, [baseLedger, tamperDemo]);

  useEffect(() => {
    let live = true;
    verifyChain(ledger).then((v) => live && setVerification(v));
    return () => {
      live = false;
    };
  }, [ledger]);

  const commit = useCallback((next: Local) => {
    setLocal(next);
    save(next);
  }, []);

  const certificates = useMemo(() => [...seedCertificates, ...local.certificates], [local.certificates]);
  const translations = useMemo(() => [...seedTranslations, ...local.translations], [local.translations]);

  const issueCertificate: Ctx["issueCertificate"] = useCallback(
    async (entityId, direction) => {
      const entity = getEntity(entityId);
      if (!entity) throw new Error("Unknown entity");
      const snap = snapshotOf(entity);
      const certId = await certificateIdFor(entityId, direction, await snapshotId(snap), ruleSet.version);
      const existing = [...seedCertificates, ...localRef.current.certificates].find((c) => c.id === certId);
      if (existing) return { certificateId: existing.id, created: false }; // refresh never silently re-issues
      const chain = [...seedLedger, ...localRef.current.events];
      const out = await issue(snap, direction, ruleSet, chain, nowIso());
      const newEvents = out.chain.slice(chain.length);
      commit({
        events: [...localRef.current.events, ...newEvents],
        certificates: [...localRef.current.certificates, out.certificate],
        translations: [...localRef.current.translations, out.translation],
      });
      return { certificateId: out.certificate.id, created: true };
    },
    [commit],
  );

  const appendRecordEvent: Ctx["appendRecordEvent"] = useCallback(
    async (type, certificateId, note) => {
      const cert = [...seedCertificates, ...localRef.current.certificates].find((c) => c.id === certificateId);
      if (!cert) return;
      const chain = [...seedLedger, ...localRef.current.events];
      const input: NewEventInput = {
        eventType: type,
        entityId: cert.entityId,
        sourceSnapshotId: cert.sourceSnapshotId,
        translationRecordId: cert.translationRecordId,
        certificateId,
        timestamp: nowIso(),
        ruleSetVersion: cert.ruleSetVersion,
        // Visitors are told not to enter personal information; the note is stored verbatim in this browser only.
        payload: { note: note.trim().slice(0, 500), supersedes: cert.ledgerEventId ?? null },
      };
      const next = await appendEvent(chain, input);
      commit({ ...localRef.current, events: [...localRef.current.events, ...next.slice(chain.length)] });
    },
    [commit],
  );

  const resetLocal = useCallback(() => commit(EMPTY), [commit]);

  const value: Ctx = {
    ledger,
    certificates,
    translations,
    verification,
    localCount: local.events.length,
    issueCertificate,
    appendRecordEvent,
    resetLocal,
    tamperDemo,
    setTamperDemo,
  };
  return <Store.Provider value={value}>{children}</Store.Provider>;
}

export function useRecords(): Ctx {
  const c = useContext(Store);
  if (!c) throw new Error("RecordsProvider missing");
  return c;
}
