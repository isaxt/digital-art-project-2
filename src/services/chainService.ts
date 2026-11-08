/**
 * Chain presentation layer. Everything here is DERIVED from the ledger and the rule set; nothing is stored.
 *  - blocks: fixed-size groups of events with a (toy) Merkle root and linked block hashes
 *  - addresses: 0x identifiers derived by hashing; no key controls any of them
 *  - confirmations: how many later events sit on top of an event
 *  - witnesses / quorum: distinct addresses that clicked "witness"
 *  - proof of work: nonce search over a certificate id and the chain head
 * It is still the local, simulated ledger: none of this makes it decentralized or trustless.
 */
import { CONFIG } from "../config";
import type { ProofOfWork } from "../types/certificate";
import type { LedgerEvent } from "../types/ledger";
import type { RuleSet } from "../types/translation";
import { canonicalize } from "../utils/canonicalize";
import { sha256HexSync } from "../utils/sha256";

export const h = sha256HexSync;
export const with0x = (hex: string | null | undefined) => (hex ? `0x${hex}` : "—");
export const strip0x = (s: string) => s.replace(/^0x/i, "").toLowerCase();

// ---------- addresses ----------
export const addressOf = (kind: string, id: string) => `0x${h(`ocf:${kind}:${id}`).slice(0, 40)}`;
export const entityAddress = (entityId: string) => addressOf("entity", entityId);
export const REGISTRAR_ADDRESS = addressOf("registrar", "office");
export const isAddress = (s: string) => /^0x[0-9a-f]{40}$/i.test(s);

/** The rule set as a "contract": its address is the first 20 bytes of the hash of its canonical source. */
export function contractOf(rules: RuleSet) {
  const source = canonicalize(rules);
  const hash = h(source);
  return { source, hash, address: `0x${hash.slice(0, 40)}`, name: "OCF-TranslationRules", version: rules.version };
}

export function newWitnessAddress(): string {
  const b = new Uint8Array(20);
  globalThis.crypto.getRandomValues(b);
  return "0x" + Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

// ---------- merkle ----------
/** Toy Merkle tree: parent = sha256(hexLeft + hexRight); an odd last node is paired with itself. */
export function merkleLevels(leaves: string[]): string[][] {
  if (leaves.length === 0) return [[h("")]];
  const levels = [leaves];
  while (levels[levels.length - 1].length > 1) {
    const cur = levels[levels.length - 1];
    const next: string[] = [];
    for (let i = 0; i < cur.length; i += 2) next.push(h(cur[i] + (cur[i + 1] ?? cur[i])));
    levels.push(next);
  }
  return levels;
}
export const merkleRoot = (leaves: string[]) => {
  const l = merkleLevels(leaves);
  return l[l.length - 1][0];
};

// ---------- blocks ----------
export interface Block {
  height: number;
  startIndex: number;
  events: LedgerEvent[];
  merkleRoot: string;
  previousBlockHash: string | null;
  hash: string;
  /** Timestamp of the last event in the block. */
  timestamp: string;
  /** A block is sealed only when full. The last partial block is open: its hash will change when the next event arrives. */
  sealed: boolean;
}

export function buildBlocks(ledger: readonly LedgerEvent[], size = CONFIG.blockSize): Block[] {
  const blocks: Block[] = [];
  for (let i = 0; i < ledger.length; i += size) {
    const events = ledger.slice(i, i + size);
    const root = merkleRoot(events.map((e) => e.eventHash));
    const prev = blocks.length ? blocks[blocks.length - 1].hash : null;
    const timestamp = events[events.length - 1].timestamp;
    const height = blocks.length;
    blocks.push({
      height, startIndex: i, events, merkleRoot: root, previousBlockHash: prev, timestamp,
      sealed: events.length === size,
      hash: h(canonicalize({ height, previousBlockHash: prev ?? "GENESIS", merkleRoot: root, timestamp, eventCount: events.length })),
    });
  }
  return blocks;
}

export const blockOfEvent = (blocks: Block[], eventIndex: number) => blocks[Math.floor(eventIndex / CONFIG.blockSize)];

// ---------- confirmations ----------
/** Number of later events stacked on top of this one. */
export const confirmations = (ledgerLength: number, eventIndex: number) => Math.max(0, ledgerLength - 1 - eventIndex);
export const isBuried = (conf: number) => conf >= CONFIG.finalityDepth;

// ---------- witnesses ----------
export function witnessesOf(ledger: readonly LedgerEvent[], certificateId: string): string[] {
  const seen: string[] = [];
  for (const e of ledger) {
    if (e.eventType !== "certificate_witnessed" || e.certificateId !== certificateId) continue;
    const w = String(e.payload.witness ?? "");
    if (w && !seen.includes(w)) seen.push(w);
  }
  return seen;
}
export const isFinalized = (witnessCount: number) => witnessCount >= CONFIG.quorum;

// ---------- proof of work ----------
export const powHash = (certificateId: string, head: string, nonce: number) => h(canonicalize({ certificateId, head, nonce }));
export const meetsTarget = (hash: string, difficulty: number) => hash.startsWith("0".repeat(difficulty));
export const leadingZeros = (hash: string) => hash.length - hash.replace(/^0+/, "").length;
export const verifyPow = (certificateId: string, pow: ProofOfWork) =>
  powHash(certificateId, pow.head, pow.nonce) === pow.hash && meetsTarget(pow.hash, pow.difficulty);

export interface MineProgress {
  nonce: number;
  lastHash: string;
  bestZeros: number;
  bestHash: string;
  found: ProofOfWork | null;
}
/** Hash attempts until `budgetMs` elapses or a valid nonce is found. Pure apart from reading the clock. */
export function mineChunk(certificateId: string, head: string, difficulty: number, from: MineProgress | null, budgetMs = 20): MineProgress {
  let nonce = from?.nonce ?? 0;
  let bestZeros = from?.bestZeros ?? 0;
  let bestHash = from?.bestHash ?? "";
  let last = from?.lastHash ?? "";
  const end = performance.now() + budgetMs;
  do {
    last = powHash(certificateId, head, nonce);
    const z = leadingZeros(last);
    if (z > bestZeros) { bestZeros = z; bestHash = last; }
    if (z >= difficulty) return { nonce: nonce + 1, lastHash: last, bestZeros, bestHash, found: { head, nonce, difficulty, hash: last } };
    nonce++;
  } while (nonce % 256 !== 0 || performance.now() < end);
  return { nonce, lastHash: last, bestZeros, bestHash, found: null };
}
export const expectedAttempts = (difficulty: number) => 16 ** difficulty;
