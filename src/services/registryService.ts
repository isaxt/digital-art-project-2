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
  gallery: "Gallery / art space",
  institution: "Institution",
  project: "Project",
  other: "Other",
};

export type Coverage = { key: string; label: string; known: boolean; why?: string };

const NOT_PARSED = "not yet parsed in the supplied dataset (this is not a finding that there is none)";

/** What the dataset knows or does not know. A coverage grid, deliberately NOT a score. */
export function coverageOf(e: Entity): Coverage[] {
  const ev = eventsOf(e);
  const has = (t: string) => ev.some((x) => x.eventType === t);
  const ds = e.datasetStatus ?? {};
  if (e.entityType === "gallery")
    return [
      { key: "web", label: "Website URL", known: true },
      { key: "ros", label: "Artist roster", known: ds.artist_roster === "verified", why: NOT_PARSED },
      { key: "exh", label: "Current exhibitions", known: ds.current_exhibitions === "verified", why: NOT_PARSED },
    ];
  if (e.entityType === "startup")
    return [
      { key: "desc", label: "Description", known: !!e.description },
      { key: "sec", label: "Sector", known: !!e.sector?.length },
      { key: "acc", label: "Accelerator", known: !!e.accelerator, why: "none recorded in the dataset (not proof the company never joined one)" },
      { key: "bat", label: "Batch", known: !!e.batch, why: "not recorded, or not verified (never inferred from founding year)" },
    ];
  if (e.entityType === "artist")
    return [
      { key: "ros", label: "Roster listing", known: has("gallery_representation"), why: "not named on a parsed roster in the supplied dataset" },
      { key: "exh", label: "Exhibition listing", known: has("exhibition"), why: "not named in a current-exhibition listing in the supplied dataset" },
      { key: "bio", label: "Biography / statement", known: false, why: "the supplied dataset has no artist-level records" },
    ];
  return [{ key: "src", label: "Source records", known: sourcesOf(e).length > 0 }];
}

export function missingFields(e: Entity): { label: string; why: string }[] {
  return coverageOf(e).filter((c) => !c.known).map((c) => ({ label: c.label, why: c.why ?? "not recorded in the supplied dataset" }));
}

export function completeness(e: Entity): "complete" | "partial" | "sparse" {
  const c = coverageOf(e);
  const k = c.filter((x) => x.known).length;
  if (k === c.length) return "complete";
  return k / c.length >= 0.5 ? "partial" : "sparse";
}

/** Entities by id, galleries' rosters and listings. */
export const galleriesOf = (artistId: string) => entities.filter((x) => x.entityType === "gallery" && getEntity(artistId)?.affiliationIds.includes(x.id));
export const rosterOf = (galleryId: string) =>
  entities.filter((x) => x.entityType === "artist" && events.some((v) => v.entityId === x.id && v.eventType === "gallery_representation" && v.sourceRecordId === `src:${galleryId}:roster`));
export const listedInExhibitionsOf = (galleryId: string) =>
  entities.filter((x) => x.entityType === "artist" && events.some((v) => v.entityId === x.id && v.eventType === "exhibition" && v.sourceRecordId === `src:${galleryId}:exhibitions`));

export const VERIFICATION_LABEL = {
  verified: "VERIFIED",
  partially_verified: "PARTIAL",
  needs_review: "NEEDS REVIEW",
} as const;
