/**
 * Imports the two supplied datasets (src/data/raw/*.json, kept byte-for-byte as received) into the
 * application's Entity / SourceRecord / EntityEvent model. NOTHING is invented here:
 *   - every entity, name, description, URL, status and note comes from the raw files;
 *   - artist entities are derived ONLY from names that appear in a gallery roster or exhibition listing;
 *   - an unparsed roster produces no artists and no claim;
 *   - batches, dates, locations, representation and funding are never inferred.
 *
 *   npm run data:import      (then npm run data:build)
 */
import { readFileSync, writeFileSync } from "node:fs";
import type { Entity, EntityEvent, VerificationStatus } from "../src/types/entity";
import type { SourceRecord } from "../src/types/source";

const gal = JSON.parse(readFileSync("src/data/raw/nyc_sf_contemporary_galleries.json", "utf8"));
const stu = JSON.parse(readFileSync("src/data/raw/nyc_sf_startups.json", "utf8"));

const STAMP = `${gal.generated_on}T00:00:00Z`; // dataset generation date; not a retrieval claim by the Office
const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const entities: Entity[] = [];
const sources: SourceRecord[] = [];
const events: EntityEvent[] = [];
const issues: string[] = [];
const idUse = new Map<string, number>();
for (const g of gal.galleries) idUse.set(g.id, (idUse.get(g.id) ?? 0) + 1);

const dupGalleryIds = [...idUse].filter(([, n]) => n > 1).map(([id]) => id);
const startupIds = new Set<string>(stu.records.map((r: { id: string }) => r.id));
for (const g of gal.galleries) if (startupIds.has(g.id)) issues.push(`gallery id ${g.id} collides with a startup id`);

// ---------- galleries ----------
type Roster = { galleryEntityId: string; sourceId: string; name: string };
const rosterEntries: Roster[] = [];
type ExhEntry = { galleryEntityId: string; sourceId: string; galleryName: string; ex: any; evId: string };
const exhEntries: ExhEntry[] = [];

for (const g of gal.galleries) {
  const eid = idUse.get(g.id)! > 1 ? `${g.id}--${slug(g.city)}` : g.id;
  const ds = g.data_status;
  const srcIds: string[] = [];
  const evIds: string[] = [];

  const web: SourceRecord = {
    id: `src:${eid}:website`, entityId: eid, provider: `${g.name} — official website (URL supplied in dataset)`,
    sourceUrl: g.website, retrievedAt: STAMP, sourceTitle: g.name,
    normalizedFields: { category: g.category, city: g.city, country: g.country },
    reuseNotes: "Link only. No page content stored.",
    verificationStatus: "needs_review",
    reviewNote: "The dataset supplies this URL but makes no verification claim about the page itself.",
  };
  sources.push(web); srcIds.push(web.id);

  if (g.artist_roster_source) {
    const s: SourceRecord = {
      id: `src:${eid}:roster`, entityId: eid, provider: `${g.name} — artist roster page`, sourceUrl: g.artist_roster_source,
      retrievedAt: `${ds.last_checked}T00:00:00Z`, sourceTitle: "Artist roster (as parsed in the supplied dataset)",
      normalizedFields: { artistRoster: g.artist_roster, rosterStatus: ds.artist_roster, rosterCount: g.artist_roster.length },
      reuseNotes: "Names only, as listed in the supplied dataset.",
      verificationStatus: ds.artist_roster === "verified" ? "verified" : "needs_review",
      reviewNote: `Dataset status: artist_roster = ${ds.artist_roster}.` + (g.notes ? ` Dataset note: ${g.notes}` : ""),
    };
    sources.push(s); srcIds.push(s.id);
    for (const name of g.artist_roster) rosterEntries.push({ galleryEntityId: eid, sourceId: s.id, name });
  }

  if (g.exhibitions_source) {
    const s: SourceRecord = {
      id: `src:${eid}:exhibitions`, entityId: eid, provider: `${g.name} — exhibitions page`, sourceUrl: g.exhibitions_source,
      retrievedAt: `${ds.last_checked}T00:00:00Z`, sourceTitle: "Exhibitions listed as current when checked",
      normalizedFields: { currentExhibitionCount: g.current_exhibitions.length, exhibitionsStatus: ds.current_exhibitions, lastChecked: ds.last_checked },
      reuseNotes: "Titles, dates, venues and artist names as listed in the supplied dataset.",
      verificationStatus: ds.current_exhibitions === "verified" ? "verified" : "needs_review",
      reviewNote: `Dataset status: current_exhibitions = ${ds.current_exhibitions}; last_checked ${ds.last_checked}. A listing "current" on that date may have since closed.`,
    };
    sources.push(s); srcIds.push(s.id);
    g.current_exhibitions.forEach((ex: any, i: number) => {
      const evId = `ev:${eid}:exh:${i + 1}`;
      evIds.push(evId);
      events.push({
        id: evId, entityId: eid, eventType: "exhibition", title: ex.title,
        description: `Listed as ${ex.status} at ${ex.venue}.`,
        ...(ex.start_date ? { date: ex.start_date } : {}), ...(ex.end_date ? { endDate: ex.end_date } : {}),
        venue: ex.venue, participants: ex.artists, sourceRecordId: s.id, originalEventType: "current_exhibition (gallery listing)",
      });
      exhEntries.push({ galleryEntityId: eid, sourceId: s.id, galleryName: g.name, ex, evId });
    });
  }

  const statuses = [ds.artist_roster, ds.current_exhibitions].filter(Boolean);
  const nVer = statuses.filter((x: string) => x === "verified").length;
  const ver: VerificationStatus = nVer === statuses.length ? "verified" : nVer > 0 ? "partially_verified" : "needs_review";
  entities.push({
    id: eid, entityType: "gallery", displayName: g.name, sourceRecordIds: srcIds, affiliationIds: [], eventIds: evIds,
    createdAt: STAMP, updatedAt: STAMP, verificationStatus: ver, dataset: "galleries", datasetRecordId: g.id,
    category: g.category, location: { city: g.city, country: g.country },
    datasetStatus: Object.fromEntries(Object.entries(ds).map(([k, v]) => [k, String(v)])),
    ...(g.notes ? { sourceNotes: [g.notes] } : {}),
  });
}

// ---------- artists: exact-name derivation from rosters and exhibition listings ----------
const PLACEHOLDER = new Set(["Group exhibition"]);
const artistOrder: string[] = [];
const artistMap = new Map<string, { sourceIds: Set<string>; evIds: string[]; galleries: Set<string>; roster: string[]; exh: string[] }>();
const touch = (name: string) => {
  if (!artistMap.has(name)) { artistMap.set(name, { sourceIds: new Set(), evIds: [], galleries: new Set(), roster: [], exh: [] }); artistOrder.push(name); }
  return artistMap.get(name)!;
};
const galName = (eid: string) => entities.find((e) => e.id === eid)!.displayName;

for (const r of rosterEntries) { const a = touch(r.name); a.sourceIds.add(r.sourceId); a.galleries.add(r.galleryEntityId); a.roster.push(r.galleryEntityId); }
for (const x of exhEntries) for (const name of x.ex.artists as string[]) {
  if (PLACEHOLDER.has(name)) continue;
  const a = touch(name); a.sourceIds.add(x.sourceId); a.galleries.add(x.galleryEntityId); a.exh.push(x.evId);
}
// near-duplicate report (diacritics / case / punctuation): reported, never merged
const byNorm = new Map<string, string[]>();
for (const n of artistOrder) byNorm.set(slug(n), [...(byNorm.get(slug(n)) ?? []), n]);
const slugUse = new Map<string, number>();
for (const [k, v] of byNorm) { if (v.length > 1) issues.push(`names collapse to one slug (${k}): ${v.join(" | ")} — NOT merged, id will be suffixed`); }

for (const name of artistOrder) {
  const a = artistMap.get(name)!;
  let base = `artist-${slug(name)}`;
  const n = (slugUse.get(base) ?? 0) + 1; slugUse.set(base, n);
  const id = n > 1 ? `${base}-${n}` : base;
  const evIds: string[] = [];
  for (const gid of a.roster) {
    const evId = `ev:${id}:roster:${gid}`;
    evIds.push(evId);
    events.push({
      id: evId, entityId: id, eventType: "gallery_representation", title: `Named on the artist roster of ${galName(gid)}`,
      description: "Appears in the roster as parsed in the supplied dataset. The dataset does not state the terms of any relationship.",
      sourceRecordId: `src:${gid}:roster`, originalEventType: "artist_roster (parsed roster page)",
    });
  }
  for (const evId of a.exh) {
    const gEv = events.find((e) => e.id === evId)!;
    const ev2 = `ev:${id}:${evId.replace(/^ev:/, "")}`;
    evIds.push(ev2);
    events.push({ ...gEv, id: ev2, entityId: id, description: `Named in ${galName(gEv.entityId)}'s listing. ${gEv.description}` });
  }
  const sourceNotes: string[] = [];
  const dsets = [...a.galleries].map((g) => `${galName(g)}`);
  entities.push({
    id, entityType: "artist", displayName: name, sourceRecordIds: [...a.sourceIds], affiliationIds: [...a.galleries], eventIds: evIds,
    createdAt: STAMP, updatedAt: STAMP, verificationStatus: "partially_verified", dataset: "derived_from_galleries",
    sourceNotes: [`Name taken verbatim from: ${dsets.join("; ")}. Identity is by exact name string only; the supplied dataset has no artist-level record, biography or ID.`, ...sourceNotes],
  });
}

// ---------- startups ----------
for (const r of stu.records) {
  const eid = r.id;
  const v = r.verification;
  const web = r.source_links.find((l: any) => l.type === "company_website");
  const dir = r.source_links.find((l: any) => l.type === "accelerator_directory");
  const srcIds: string[] = []; const evIds: string[] = [];
  const s1: SourceRecord = {
    id: `src:${eid}:website`, entityId: eid, provider: `${r.name} — company website (URL supplied in dataset)`, sourceUrl: web.url,
    retrievedAt: `${v.last_reviewed}T00:00:00Z`, sourceTitle: r.name,
    normalizedFields: { description: r.description, sector: r.sector, location: r.location, companyWebsiteProvided: v.company_website_provided },
    reuseNotes: "The description is a summary written for the supplied dataset, not a quotation from the company.",
    verificationStatus: "needs_review",
    reviewNote: "The dataset supplies this URL and a summary description; it makes no verification claim about the page.",
  };
  sources.push(s1); srcIds.push(s1.id);
  if (dir) {
    const s2: SourceRecord = {
      id: `src:${eid}:accelerator`, entityId: eid, provider: `${r.accelerator} — directory (city / portfolio level)`, sourceUrl: dir.url,
      retrievedAt: `${v.last_reviewed}T00:00:00Z`, sourceTitle: `${r.accelerator} directory listing`,
      normalizedFields: { accelerator: r.accelerator, batch: r.batch, acceleratorAffiliationStatus: v.accelerator_affiliation_status, batchStatus: v.batch_status },
      reuseNotes: "Dataset note: directory links are city-level or portfolio-level sources, not always individual company profile pages.",
      verificationStatus: "partially_verified",
      reviewNote: `Dataset status: accelerator_affiliation = ${v.accelerator_affiliation_status}; batch = ${v.batch_status}.`
        + (r.batch ? " The batch is recorded from the dataset author's program knowledge and is not confirmed against an individual directory page." : ""),
    };
    sources.push(s2); srcIds.push(s2.id);
    const evId = `ev:${eid}:accelerator`;
    evIds.push(evId);
    events.push({
      id: evId, entityId: eid, eventType: "accelerator", title: `${r.accelerator}${r.batch ? ` ${r.batch}` : ""}`,
      description: r.batch ? `Batch ${r.batch} (${v.batch_status}). No date is recorded or inferred.` : "No batch recorded in the dataset (not verified or not applicable).",
      sourceRecordId: s2.id, originalEventType: `accelerator_affiliation (${v.accelerator_affiliation_status})`,
    });
  }
  entities.push({
    id: eid, entityType: "startup", displayName: r.name, description: r.description, descriptionSourceRecordId: s1.id,
    sourceRecordIds: srcIds, affiliationIds: [], eventIds: evIds, createdAt: STAMP, updatedAt: STAMP,
    verificationStatus: dir ? "partially_verified" : "needs_review", dataset: "startups", datasetRecordId: r.id,
    location: { city: r.location.city, state: r.location.state, country: r.location.country },
    sector: r.sector, accelerator: r.accelerator, batch: r.batch,
    datasetStatus: { accelerator_affiliation_status: v.accelerator_affiliation_status, batch_status: v.batch_status, company_website_provided: String(v.company_website_provided), last_reviewed: v.last_reviewed },
  });
}

// ---------- integrity ----------
const ids = new Set<string>();
for (const e of entities) { if (ids.has(e.id)) issues.push(`duplicate entity id ${e.id}`); ids.add(e.id); }
const notes = [
  `galleries in file: ${gal.galleries.length}; imported: ${entities.filter((e) => e.entityType === "gallery").length}`,
  `startup records in file: ${stu.records.length} (file header says record_count ${stu.record_count}, description says "100"); imported: ${entities.filter((e) => e.entityType === "startup").length}`,
  `duplicate gallery ids in file (kept as two records, disambiguated by city): ${dupGalleryIds.join(", ") || "none"}`,
  `artist entities derived from exact names: ${entities.filter((e) => e.entityType === "artist").length}`,
  `galleries with roster not yet parsed: ${gal.galleries.filter((g: any) => g.data_status.artist_roster !== "verified").length}`,
];
const w = (f: string, d: unknown) => writeFileSync(`src/data/${f}.json`, JSON.stringify(d, null, 1) + "\n");
w("entities", entities); w("sources", sources); w("events", events);
console.log(notes.join("\n"));
console.log(`entities ${entities.length}, sources ${sources.length}, events ${events.length}`);
if (issues.length) { console.log("ISSUES:\n - " + issues.join("\n - ")); }
