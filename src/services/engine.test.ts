import { describe, expect, it } from "vitest";
import { entities, events, ruleSet, sources, seedLedger, seedCertificates, rosterOf, getEntity } from "./registryService";
import { buildTranslationRecord, defaultDirection, mappedOutputs, snapshotId, translate, type EntitySnapshot } from "./translationService";
import { appendEvent, verifyChain } from "./ledgerService";
import { issue, classify } from "./certificateService";
import { canonicalize } from "../utils/canonicalize";
import { validateDataset } from "../utils/validation";
import { CONFIG } from "../config";
import rawGalleries from "../data/raw/nyc_sf_contemporary_galleries.json";
import rawStartups from "../data/raw/nyc_sf_startups.json";

const snapOf = (id: string): EntitySnapshot => {
  const e = entities.find((x) => x.id === id)!;
  return { entity: e, sources: sources.filter((s) => e.sourceRecordIds.includes(s.id)), events: events.filter((v) => e.eventIds.includes(v.id)) };
};
const CINTO = "artist-sandra-cinto";
const RAMP = "ramp";
const CLAY = "clay"; // no accelerator recorded
const GAGOSIAN = "gagosian"; // roster not yet parsed

describe("dataset validity", () => {
  it("validates", () => {
    expect(validateDataset({ entities, sources, events, rules: ruleSet })).toEqual([]);
  });
  it("every entity has a traceable source with a URL", () => {
    for (const e of entities) {
      expect(e.sourceRecordIds.length).toBeGreaterThan(0);
      for (const id of e.sourceRecordIds) expect(sources.find((s) => s.id === id)!.sourceUrl).toMatch(/^https?:\/\//);
    }
  });
  it("featured entity exists and carries both a roster listing and an exhibition", () => {
    const e = getEntity(CONFIG.featuredEntityId)!;
    const ev = events.filter((v) => e.eventIds.includes(v.id)).map((v) => v.eventType);
    expect(ev).toEqual(expect.arrayContaining(["gallery_representation", "exhibition"]));
  });
});

describe("fidelity to the supplied datasets (no invented data)", () => {
  const G = entities.filter((e) => e.entityType === "gallery");
  const S = entities.filter((e) => e.entityType === "startup");

  it("imports every gallery and every startup record", () => {
    expect(G).toHaveLength(rawGalleries.galleries.length);
    expect(S).toHaveLength(rawStartups.records.length);
    expect(rawStartups.records).toHaveLength(rawStartups.record_count);
  });

  it("startups keep original id, name, description, website, sector, accelerator, batch and location", () => {
    for (const r of rawStartups.records) {
      const e = entities.find((x) => x.id === r.id)!;
      expect(e.displayName).toBe(r.name);
      expect(e.description).toBe(r.description);
      expect(e.sector).toEqual(r.sector);
      expect(e.accelerator).toBe(r.accelerator);
      expect(e.batch).toBe(r.batch);
      expect(e.location).toEqual({ city: r.location.city, state: r.location.state, country: r.location.country });
      const web = sources.find((s) => s.id === `src:${r.id}:website`)!;
      expect(web.sourceUrl).toBe(r.source_links.find((l) => l.type === "company_website")!.url);
    }
  });

  it("never infers a batch, a date or funding for startups", () => {
    for (const r of rawStartups.records.filter((x) => x.batch === null)) expect(getEntity(r.id)!.batch).toBeNull();
    for (const ev of events.filter((v) => v.eventType === "accelerator")) expect(ev.date).toBeUndefined();
    expect(events.some((v) => v.eventType === "funding_round")).toBe(false);
    expect(getEntity(CLAY)!.eventIds).toHaveLength(0);
  });

  it("galleries keep name, website, category, city and the dataset's own status fields", () => {
    for (const g of rawGalleries.galleries) {
      const e = G.find((x) => x.datasetRecordId === g.id && x.location!.city === g.city)!;
      expect(e.displayName).toBe(g.name);
      expect(e.category).toBe(g.category);
      expect(sources.find((s) => s.id === `src:${e.id}:website`)!.sourceUrl).toBe(g.website);
      expect(e.datasetStatus!.artist_roster).toBe(g.data_status.artist_roster);
      expect(e.datasetStatus!.current_exhibitions).toBe(g.data_status.current_exhibitions);
    }
  });

  it("keeps both entries of the duplicated dataset id, unmerged, with the original id preserved", () => {
    const dupes = G.filter((e) => e.datasetRecordId === "hashimoto_contemporary");
    expect(dupes).toHaveLength(2);
    expect(new Set(dupes.map((d) => d.id)).size).toBe(2);
    expect(dupes.map((d) => d.location!.city).sort()).toEqual(["New York", "San Francisco"]);
  });

  it("rosters are reproduced name-for-name; unparsed rosters yield no artists and no claim", () => {
    for (const g of rawGalleries.galleries) {
      const e = G.find((x) => x.datasetRecordId === g.id && x.location!.city === g.city)!;
      const names = rosterOf(e.id).map((a) => a.displayName).sort();
      expect(names).toEqual([...new Set(g.artist_roster)].sort());
      if (g.data_status.artist_roster !== "verified") expect(names).toHaveLength(0);
    }
    expect(getEntity(GAGOSIAN)!.datasetStatus!.artist_roster).toBe("not_yet_parsed");
  });

  it("every artist name comes from a roster or exhibition listing; placeholders are not artists", () => {
    const names = new Set<string>();
    for (const g of rawGalleries.galleries) {
      g.artist_roster.forEach((n) => names.add(n));
      g.current_exhibitions.forEach((x) => x.artists.forEach((n) => names.add(n)));
    }
    const artists = entities.filter((e) => e.entityType === "artist");
    expect(artists.length).toBeGreaterThan(0);
    for (const a of artists) expect(names.has(a.displayName)).toBe(true);
    expect(artists.some((a) => a.displayName === "Group exhibition")).toBe(false);
    expect(new Set(artists.map((a) => a.displayName)).size).toBe(artists.length);
  });

  it("exhibitions keep title, dates and venue as supplied (including the Paris venue)", () => {
    for (const g of rawGalleries.galleries) {
      const e = G.find((x) => x.datasetRecordId === g.id && x.location!.city === g.city)!;
      const evs = events.filter((v) => e.eventIds.includes(v.id));
      expect(evs).toHaveLength(g.current_exhibitions.length);
      g.current_exhibitions.forEach((x, i) => {
        const ev = evs[i];
        expect(ev.title).toBe(x.title);
        expect(ev.date).toBe((x as { start_date?: string }).start_date);
        expect(ev.endDate).toBe(x.end_date);
        expect(ev.venue).toBe(x.venue);
      });
    }
    const mg = events.find((v) => v.entityId === "marian_goodman_gallery" && v.title === "Drawing Blind")!;
    expect(mg.venue).toBe("Paris");
  });

  it("the registry contains only entities that trace to the supplied files", () => {
    for (const e of entities) expect(["galleries", "startups", "derived_from_galleries"]).toContain(e.dataset);
  });
});

describe("translation engine", () => {
  it("is deterministic: same snapshot + rules, same output", async () => {
    const s = snapOf(CINTO);
    const a = await buildTranslationRecord(s, "artist_to_startup", ruleSet, "2026-01-01T00:00:00Z");
    const b = await buildTranslationRecord(s, "artist_to_startup", ruleSet, "2026-01-01T00:00:00Z");
    expect(canonicalize(a)).toBe(canonicalize(b));
  });

  it("maps an exhibition and cites the rule, limitation and source", () => {
    const r = translate(snapOf(CINTO), "artist_to_startup", ruleSet);
    const hit = r.outputs.find((o) => o.ruleId === "ART_EXHIBITION_TO_TRACTION" && o.confidenceLabel !== "insufficient_data")!;
    expect(hit.confidenceLabel).toBe("interpretive_mapping");
    expect(hit.limitation).toMatch(/market demand/);
    expect(hit.sourceRecordIds[0]).toMatch(/exhibitions$/);
  });

  it("represents missing inputs as insufficient_data, never as a negative", () => {
    const r = translate(snapOf(CINTO), "artist_to_startup", ruleSet);
    const missing = r.outputs.filter((o) => o.confidenceLabel === "insufficient_data");
    expect(missing.length).toBeGreaterThan(0);
    for (const m of missing) expect(m.translatedValue).not.toMatch(/\b(low|weak|poor|fail)/i);
    const funding = translate(snapOf(RAMP), "startup_to_art_world", ruleSet).outputs.find((o) => o.ruleId === "STARTUP_FUNDING_TO_PATRONAGE")!;
    expect(funding.translatedValue).toMatch(/No funding history in the supplied dataset/);
  });

  it("does not present a dataset-written summary as the company's own pitch", () => {
    const out = translate(snapOf(RAMP), "startup_to_art_world", ruleSet).outputs.find((o) => o.ruleId === "STARTUP_PITCH_TO_PROPOSITION")!;
    expect(out.confidenceLabel).toBe("insufficient_data");
    expect(out.translatedValue).toMatch(/not by the company/);
  });

  it("reads the accelerator without inventing a date", () => {
    const out = translate(snapOf(RAMP), "startup_to_art_world", ruleSet).outputs.find((o) => o.ruleId === "STARTUP_ACCELERATOR_TO_NETWORK")!;
    expect(out.translatedValue).toBe("Network validation: Y Combinator W20");
  });

  it("refuses to translate an entity type with no direction (galleries)", () => {
    expect(defaultDirection("gallery")).toBeNull();
    const r = translate(snapOf(GAGOSIAN), "artist_to_startup", ruleSet);
    expect(r.directionNotApplicable).toBeTruthy();
    expect(r.outputs).toHaveLength(0);
  });

  it("snapshot id changes when source data changes", async () => {
    const s = snapOf(CINTO);
    const before = await snapshotId(s);
    expect(await snapshotId({ ...s, events: s.events.slice(1) })).not.toBe(before);
  });
});

describe("classification vocabulary", () => {
  it("never labels an absence of data as a low or negative class", () => {
    expect(classify(0).label).toMatch(/insufficient mapped data/);
    expect(classify(0).label).not.toMatch(/low|weak|poor/i);
  });
});

describe("ledger", () => {
  it("seed chain verifies", async () => {
    expect((await verifyChain(seedLedger)).ok).toBe(true);
  });

  it("detects a tampered payload and a broken link", async () => {
    const t = seedLedger.map((e) => ({ ...e }));
    t[4] = { ...t[4], payload: { ...t[4].payload, x: 1 } };
    const v = await verifyChain(t);
    expect(v.ok).toBe(false);
    expect(v.firstFailure).toBe(4);
    const removed = [...seedLedger.slice(0, 3), ...seedLedger.slice(4)];
    expect((await verifyChain(removed)).ok).toBe(false);
  });

  it("is append-only: appending returns a new array and leaves earlier events untouched", async () => {
    const before = JSON.stringify(seedLedger);
    const next = await appendEvent(seedLedger, { eventType: "record_corrected", entityId: RAMP, timestamp: "2026-11-08T00:00:00Z", payload: { note: "x" } });
    expect(next).toHaveLength(seedLedger.length + 1);
    expect(JSON.stringify(seedLedger)).toBe(before);
    expect(next[next.length - 1].previousEventHash).toBe(seedLedger[seedLedger.length - 1].eventHash);
    expect((await verifyChain(next)).ok).toBe(true);
  });

  it("hash is independent of object key order", async () => {
    const a = await appendEvent([], { eventType: "entity_registered", timestamp: "t", payload: { a: 1, b: 2 } });
    const b = await appendEvent([], { eventType: "entity_registered", timestamp: "t", payload: { b: 2, a: 1 } });
    expect(a[0].eventHash).toBe(b[0].eventHash);
  });
});

describe("certificates", () => {
  it("re-issuing the same assessment yields the same certificate ID", async () => {
    const s = snapOf(RAMP);
    const a = await issue(s, "startup_to_art_world", ruleSet, seedLedger, "2026-12-01T00:00:00Z");
    const b = await issue(s, "startup_to_art_world", ruleSet, seedLedger, "2027-01-01T00:00:00Z");
    expect(a.certificate.id).toBe(b.certificate.id);
    expect(seedCertificates.find((c) => c.entityId === RAMP)!.id).toBe(a.certificate.id);
  });
  it("links certificate to translation, snapshot, rule-set version and ledger event", () => {
    expect(seedCertificates.length).toBeGreaterThan(0);
    for (const c of seedCertificates) {
      expect(c.translationRecordId).toMatch(/^TR-/);
      expect(c.sourceSnapshotId).toMatch(/^SNAP-/);
      expect(c.ruleSetVersion).toBe(ruleSet.version);
      expect(seedLedger.find((e) => e.id === c.ledgerEventId)?.certificateId).toBe(c.id);
      expect(c.status).toBe("local_simulation");
    }
  });
  it("seeds a certificate only where a rule could read at least one recorded fact", () => {
    expect(seedCertificates.find((c) => c.entityId === CLAY)).toBeUndefined();
    for (const e of entities.filter((x) => defaultDirection(x.entityType))) {
      const n = mappedOutputs(translate(snapOf(e.id), defaultDirection(e.entityType)!, ruleSet)).length;
      // Artists are deliberately unissued in the seed (they start in the mempool to be mined).
      expect(seedCertificates.some((c) => c.entityId === e.id)).toBe(n > 0 && e.entityType !== "artist");
    }
  });
  it("mapped count is consistent with classification", () => {
    expect(mappedOutputs(translate(snapOf(CINTO), "artist_to_startup", ruleSet)).length).toBe(2);
    expect(seedCertificates.find((c) => c.entityId === CINTO)).toBeUndefined();
    const any = seedCertificates[0];
    const e = entities.find((x) => x.id === any.entityId)!;
    const n = mappedOutputs(translate(snapOf(e.id), defaultDirection(e.entityType)!, ruleSet)).length;
    expect(n).toBeGreaterThan(0);
  });
});
