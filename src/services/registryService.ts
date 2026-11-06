import entitiesJson from "../data/entities.json";
import sourcesJson from "../data/sources.json";
import eventsJson from "../data/events.json";
import rulesJson from "../data/rules.json";
import ledgerSeed from "../data/generated/ledger.json";
import translationsSeed from "../data/generated/translations.json";
import certificatesSeed from "../data/generated/certificates.json";
import type { Entity, EntityEvent, EntityType } from "../types/entity";
import type { SourceRecord } from "../types/source";
import type { RuleSet, TranslationRecord } from "../types/translation";
import type { LedgerEvent } from "../types/ledger";
import type { Certificate } from "../types/certificate";
import type { EntitySnapshot } from "./translationService";

export const entities = entitiesJson as unknown as Entity[];
export const sources = sourcesJson as unknown as SourceRecord[];
export const events = eventsJson as unknown as EntityEvent[];
export const ruleSet = rulesJson as unknown as RuleSet;
export const seedLedger = ledgerSeed as unknown as LedgerEvent[];
export const seedTranslations = translationsSeed as unknown as TranslationRecord[];
export const seedCertificates = certificatesSeed as unknown as Certificate[];

export const getEntity = (id?: string) => entities.find((e) => e.id === id);
export const getSource = (id: string) => sources.find((s) => s.id === id);
export const sourcesOf = (e: Entity) => sources.filter((s) => e.sourceRecordIds.includes(s.id));
export const eventsOf = (e: Entity) => events.filter((v) => e.eventIds.includes(v.id));
export const snapshotOf = (e: Entity): EntitySnapshot => ({ entity: e, sources: sourcesOf(e), events: eventsOf(e) });

export const TYPE_LABEL: Record<EntityType, string> = {
  artist: "Artist",
  startup: "Startup",
  institution: "Institution",
  project: "Project",
  other: "Other",
};

export type Coverage = { key: string; label: string; known: boolean };

/** What the dataset knows or does not know. A coverage grid, deliberately NOT a score. */
export function coverageOf(e: Entity): Coverage[] {
  const src = sourcesOf(e);
  const ev = eventsOf(e);
  const has = (t: string) => ev.some((x) => x.eventType === t);
  const field = (k: string) => src.some((s) => typeof s.normalizedFields[k] === "string");
  const common: Coverage[] = [
    { key: "desc", label: "Source description", known: !!e.description },
    { key: "src", label: "Source records", known: src.length > 0 },
    { key: "ev", label: "Dated events", known: ev.some((x) => !!x.date) },
  ];
  if (e.entityType === "artist")
    return [
      ...common,
      { key: "exh", label: "Exhibitions", known: has("exhibition") },
      { key: "gal", label: "Gallery", known: has("gallery_representation") },
      { key: "stm", label: "Artist statement", known: field("statement") },
    ];
  if (e.entityType === "startup")
    return [
      ...common,
      { key: "fund", label: "Funding", known: has("funding_round") },
      { key: "acc", label: "Accelerator", known: has("accelerator") },
      { key: "pitch", label: "Pitch text", known: field("pitch") },
    ];
  return common;
}

export function missingFields(e: Entity): string[] {
  return coverageOf(e).filter((c) => !c.known).map((c) => c.label);
}

export function completeness(e: Entity): "complete" | "partial" | "sparse" {
  const c = coverageOf(e);
  const k = c.filter((x) => x.known).length;
  if (k === c.length) return "complete";
  return k / c.length >= 0.5 ? "partial" : "sparse";
}

export const VERIFICATION_LABEL = {
  verified: "VERIFIED",
  partially_verified: "PARTIAL",
  needs_review: "NEEDS REVIEW",
} as const;
