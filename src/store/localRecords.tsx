/**
 * Visitor-generated records live in this browser only (localStorage), appended after the seed chain.
 * Nothing is sent anywhere. Storage can be unavailable or cleared, so every access is guarded and the
 * site works without it.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CONFIG } from "../config";
import type { Certificate, ProofOfWork } from "../types/certificate";
import type { LedgerEvent } from "../types/ledger";
import type { Direction, TranslationRecord } from "../types/translation";
import { issue, certificateIdFor } from "../services/certificateService";
import { appendEvent, verifyChain, type NewEventInput } from "../services/ledgerService";
import { ruleSet, seedCertificates, seedLedger, seedTranslations, snapshotOf, getEntity } from "../services/registryService";
import { snapshotId } from "../services/translationService";
import { buildBlocks, newWitnessAddress, verifyPow, witnessesOf, type Block } from "../services/chainService";
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

export interface PendingTx {
  key: string;
  entityId: string;
  entityName: string;
  direction: Direction;
  certificateId: string;
  submittedAt: string;
}

interface WitnessState { identities: string[]; active: string | null }
function loadWitnesses(): WitnessState {
  try {
    const raw = window.localStorage.getItem(CONFIG.witnessKey);
    if (raw) return JSON.parse(raw) as WitnessState;
  } catch { /* ignore */ }
  return { identities: [], active: null };
}
function saveWitnesses(w: WitnessState) {
  try { window.localStorage.setItem(CONFIG.witnessKey, JSON.stringify(w)); } catch { /* session only */ }
}

interface Ctx {
  ledger: LedgerEvent[];
  blocks: Block[];
  mempool: PendingTx[];
  submitToMempool: (entityId: string, direction: Direction) => Promise<PendingTx>;
  dropFromMempool: (key: string) => void;
  /** Witness identities created in this browser. They are random addresses; no key backs them. */
  witnesses: WitnessState;
  newWitness: () => string;
  selectWitness: (address: string) => void;
  witness: (certificateId: string) => Promise<"ok" | "duplicate" | "no_identity">;
  certificates: Certificate[];
  translations: TranslationRecord[];
  verification: VerificationResult | null;
  localCount: number;
  issueCertificate: (entityId: string, direction: Direction, pow?: ProofOfWork) => Promise<{ certificateId: string; created: boolean; stale?: boolean }>;
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
  const [mempool, setMempool] = useState<PendingTx[]>([]);
  const [witnesses, setWitnesses] = useState<WitnessState>({ identities: [], active: null });
  const localRef = useRef(local);
  localRef.current = local;

  useEffect(() => { setLocal(load()); setWitnesses(loadWitnesses()); }, []);

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
    async (entityId, direction, pow) => {
      const entity = getEntity(entityId);
      if (!entity) throw new Error("Unknown entity");
      const snap = snapshotOf(entity);
      const certId = await certificateIdFor(entityId, direction, await snapshotId(snap), ruleSet.version);
      const existing = [...seedCertificates, ...localRef.current.certificates].find((c) => c.id === certId);
      if (existing) return { certificateId: existing.id, created: false }; // refresh never silently re-issues
      const chain = [...seedLedger, ...localRef.current.events];
      // Work was done against a specific chain head. If the chain moved while mining, the block is stale.
      if (pow && (pow.head !== chain[chain.length - 1].eventHash || !verifyPow(certId, pow))) return { certificateId: certId, created: false, stale: true };
      const out = await issue(snap, direction, ruleSet, chain, nowIso(), pow);
      const newEvents = out.chain.slice(chain.length);
      commit({
        events: [...localRef.current.events, ...newEvents],
        certificates: [...localRef.current.certificates, out.certificate],
        translations: [...localRef.current.translations, out.translation],
      });
      setMempool((m) => m.filter((x) => x.certificateId !== certId));
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

  const resetLocal = useCallback(() => { commit(EMPTY); setMempool([]); }, [commit]);

  const submitToMempool: Ctx["submitToMempool"] = useCallback(async (entityId, direction) => {
    const entity = getEntity(entityId);
    if (!entity) throw new Error("Unknown entity");
    const snap = snapshotOf(entity);
    const certificateId = await certificateIdFor(entityId, direction, await snapshotId(snap), ruleSet.version);
    const tx: PendingTx = { key: certificateId, entityId, entityName: entity.displayName, direction, certificateId, submittedAt: nowIso() };
    setMempool((m) => (m.some((x) => x.key === tx.key) ? m : [...m, tx]));
    return tx;
  }, []);
  const dropFromMempool = useCallback((key: string) => setMempool((m) => m.filter((x) => x.key !== key)), []);

  const newWitness = useCallback(() => {
    const addr = newWitnessAddress();
    const next = { identities: [...witnesses.identities, addr], active: addr };
    setWitnesses(next); saveWitnesses(next);
    return addr;
  }, [witnesses]);
  const selectWitness = useCallback((address: string) => {
    const next = { ...witnesses, active: address };
    setWitnesses(next); saveWitnesses(next);
  }, [witnesses]);

  const witness: Ctx["witness"] = useCallback(async (certificateId) => {
    const w = witnesses.active;
    if (!w) return "no_identity";
    const cert = [...seedCertificates, ...localRef.current.certificates].find((c) => c.id === certificateId);
    if (!cert) return "no_identity";
    const chain = [...seedLedger, ...localRef.current.events];
    if (witnessesOf(chain, certificateId).includes(w)) return "duplicate";
    const next = await appendEvent(chain, {
      eventType: "certificate_witnessed", entityId: cert.entityId, sourceSnapshotId: cert.sourceSnapshotId,
      translationRecordId: cert.translationRecordId, certificateId, timestamp: nowIso(), ruleSetVersion: cert.ruleSetVersion,
      payload: { witness: w, statement: "I witness this certificate.", signed: false },
    });
    commit({ ...localRef.current, events: [...localRef.current.events, ...next.slice(chain.length)] });
    return "ok";
  }, [commit, witnesses.active]);

  const blocks = useMemo(() => buildBlocks(ledger), [ledger]);

  const value: Ctx = {
    ledger, blocks, mempool, submitToMempool, dropFromMempool, witnesses, newWitness, selectWitness, witness,
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
