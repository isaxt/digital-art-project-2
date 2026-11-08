/**
 * Builds the seed provenance data from the curated JSON: registration + source events for every entity,
 * then a translation + certificate for each translatable entity. Deterministic: fixed timestamps,
 * derived IDs, so re-running yields byte-identical output unless the source data or rules changed.
 *
 *   npm run data:build
 */
import { mkdirSync, writeFileSync } from "node:fs";
import entities from "../src/data/entities.json" with { type: "json" };
import sources from "../src/data/sources.json" with { type: "json" };
import events from "../src/data/events.json" with { type: "json" };
import rules from "../src/data/rules.json" with { type: "json" };
import type { Entity, EntityEvent } from "../src/types/entity";
import type { SourceRecord } from "../src/types/source";
import type { RuleSet } from "../src/types/translation";
import type { LedgerEvent } from "../src/types/ledger";
import type { Certificate } from "../src/types/certificate";
import type { TranslationRecord } from "../src/types/translation";
import { appendEvent, verifyChain } from "../src/services/ledgerService";
import { issue } from "../src/services/certificateService";
import { defaultDirection, mappedOutputs, translate } from "../src/services/translationService";

const E = entities as unknown as Entity[];
const S = sources as unknown as SourceRecord[];
const V = events as unknown as EntityEvent[];
const R = rules as unknown as RuleSet;

const REGISTERED_AT = "2026-11-07T00:00:00Z";
const ISSUE_BASE = Date.parse("2026-11-07T01:00:00Z");

let chain: LedgerEvent[] = [];
for (const e of E) {
  chain = await appendEvent(chain, {
    eventType: "entity_registered",
    entityId: e.id,
    timestamp: REGISTERED_AT,
    payload: { displayName: e.displayName, entityType: e.entityType, verificationStatus: e.verificationStatus },
  });
  for (const s of S.filter((x) => x.entityId === e.id)) {
    chain = await appendEvent(chain, {
      eventType: "source_attached",
      entityId: e.id,
      sourceRecordIds: [s.id],
      timestamp: REGISTERED_AT,
      payload: { provider: s.provider, sourceUrl: s.sourceUrl, retrievedAt: s.retrievedAt, verificationStatus: s.verificationStatus },
    });
  }
}

const translations: TranslationRecord[] = [];
const certificates: Certificate[] = [];
let n = 0;
for (const e of E) {
  const dir = defaultDirection(e.entityType);
  if (!dir) continue;
  const snap = {
    entity: e,
    sources: S.filter((s) => e.sourceRecordIds.includes(s.id)),
    events: V.filter((v) => e.eventIds.includes(v.id)),
  };
  // Seed certificates only where at least one rule can read a recorded fact. Nothing is issued for "nothing to read".
  if (mappedOutputs(translate(snap, dir, R)).length === 0) continue;
  // Artist records are deliberately left unissued: they start in the mempool, so a visitor can mine and issue them.
  if (e.entityType === "artist") continue;
  const issuedAt = new Date(ISSUE_BASE + n++ * 60_000).toISOString().replace(/\.\d{3}Z$/, "Z");
  const out = await issue(snap, dir, R, chain, issuedAt);
  chain = out.chain;
  translations.push(out.translation);
  certificates.push(out.certificate);
}

const v = await verifyChain(chain);
if (!v.ok) throw new Error("seed chain failed verification at index " + v.firstFailure);

mkdirSync("src/data/generated", { recursive: true });
const w = (f: string, d: unknown) => writeFileSync(`src/data/generated/${f}`, JSON.stringify(d, null, 2) + "\n");
w("ledger.json", chain);
w("translations.json", translations);
w("certificates.json", certificates);
console.log(`Seed built: ${chain.length} ledger events, ${translations.length} translations, ${certificates.length} certificates. Chain verified.`);
