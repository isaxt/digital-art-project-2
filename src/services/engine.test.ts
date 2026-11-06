import { describe, expect, it } from "vitest";
import { entities, events, ruleSet, sources, seedLedger, seedCertificates } from "./registryService";
import { buildTranslationRecord, defaultDirection, mappedOutputs, snapshotId, translate, type EntitySnapshot } from "./translationService";
import { appendEvent, verifyChain } from "./ledgerService";
import { issue, classify } from "./certificateService";
import { canonicalize } from "../utils/canonicalize";
import { validateDataset } from "../utils/validation";

const snapOf = (id: string): EntitySnapshot => {
  const e = entities.find((x) => x.id === id)!;
  return { entity: e, sources: sources.filter((s) => e.sourceRecordIds.includes(s.id)), events: events.filter((v) => e.eventIds.includes(v.id)) };
};

describe("dataset", () => {
  it("validates", () => {
    expect(validateDataset({ entities, sources, events, rules: ruleSet })).toEqual([]);
  });
  it("every entity has a traceable source", () => {
    for (const e of entities) expect(e.sourceRecordIds.length).toBeGreaterThan(0);
  });
});

describe("translation engine", () => {
  it("is deterministic: same snapshot + rules, same output", async () => {
    const s = snapOf("OCF-0001");
    const a = await buildTranslationRecord(s, "artist_to_startup", ruleSet, "2026-01-01T00:00:00Z");
    const b = await buildTranslationRecord(s, "artist_to_startup", ruleSet, "2026-01-01T00:00:00Z");
    expect(canonicalize(a)).toBe(canonicalize(b));
  });

  it("maps an exhibition and cites the rule, limitation and source", () => {
    const r = translate(snapOf("OCF-0001"), "artist_to_startup", ruleSet);
    const hit = r.outputs.find((o) => o.ruleId === "ART_EXHIBITION_TO_TRACTION")!;
    expect(hit.confidenceLabel).toBe("interpretive_mapping");
    expect(hit.limitation).toMatch(/market demand/);
    expect(hit.sourceRecordIds).toEqual(["SRC-0001"]);
  });

  it("represents missing inputs as insufficient_data, never as a negative", () => {
    const r = translate(snapOf("OCF-0001"), "artist_to_startup", ruleSet);
    const missing = r.outputs.filter((o) => o.confidenceLabel === "insufficient_data");
    expect(missing.length).toBeGreaterThan(0);
    for (const m of missing) expect(m.translatedValue).not.toMatch(/low|weak|poor|fail/i);
    const funding = translate(snapOf("OCF-0002"), "startup_to_art_world", ruleSet).outputs.find((o) => o.ruleId === "STARTUP_FUNDING_TO_PATRONAGE")!;
    expect(funding.translatedValue).toBe("Funding history not available in selected sources.");
  });

  it("reports facts no rule reads instead of forcing a translation", () => {
    const r = translate(snapOf("OCF-0001"), "artist_to_startup", ruleSet);
    expect(r.unmapped.map((u) => u.label)).toEqual(expect.arrayContaining(["library catalogue record", "collection object record"]));
  });

  it("refuses to translate an entity type with no direction", () => {
    expect(defaultDirection("institution")).toBeNull();
    const r = translate(snapOf("OCF-0006"), "artist_to_startup", ruleSet);
    expect(r.directionNotApplicable).toBeTruthy();
    expect(r.outputs).toHaveLength(0);
  });

  it("handles an entity with no description (EveryArt)", () => {
    const r = translate(snapOf("OCF-0005"), "startup_to_art_world", ruleSet);
    expect(r.outputs.find((o) => o.ruleId === "STARTUP_PITCH_TO_PROPOSITION")!.translatedValue).toBe("No source description available.");
  });

  it("snapshot id changes when source data changes", async () => {
    const s = snapOf("OCF-0002");
    const before = await snapshotId(s);
    const changed = { ...s, events: s.events.slice(1) };
    expect(await snapshotId(changed)).not.toBe(before);
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
    const next = await appendEvent(seedLedger, { eventType: "record_corrected", entityId: "OCF-0001", timestamp: "2026-11-06T00:00:00Z", payload: { note: "x" } });
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
    const s = snapOf("OCF-0003");
    const a = await issue(s, "startup_to_art_world", ruleSet, seedLedger, "2026-12-01T00:00:00Z");
    const b = await issue(s, "startup_to_art_world", ruleSet, seedLedger, "2027-01-01T00:00:00Z");
    expect(a.certificate.id).toBe(b.certificate.id);
    expect(seedCertificates.find((c) => c.entityId === "OCF-0003")!.id).toBe(a.certificate.id);
  });
  it("links certificate to translation, snapshot, rule-set version and ledger event", () => {
    for (const c of seedCertificates) {
      expect(c.translationRecordId).toMatch(/^TR-/);
      expect(c.sourceSnapshotId).toMatch(/^SNAP-/);
      expect(c.ruleSetVersion).toBe(ruleSet.version);
      expect(seedLedger.find((e) => e.id === c.ledgerEventId)?.certificateId).toBe(c.id);
      expect(c.status).toBe("local_simulation");
    }
  });
  it("mapped count is consistent with classification", async () => {
    const s = snapOf("OCF-0001");
    // Only the exhibition is readable; no gallery, residency, acquisition or statement in the sources.
    expect(mappedOutputs(translate(s, "artist_to_startup", ruleSet)).length).toBe(1);
    expect(seedCertificates.find((c) => c.entityId === "OCF-0001")!.classificationCode).toBe("OCF-C2");
  });
});
