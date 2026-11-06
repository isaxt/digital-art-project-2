import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createAssessment, registrationEvents } from "../src/core/assessment";
import { canonicalize } from "../src/core/canonicalize";
import { _sha256FallbackForTests, sha256Hex } from "../src/core/hashing";
import { appendEvent, statusOf, verifyChain } from "../src/core/ledger";
import { translate } from "../src/core/translate";
import type { StoreShape } from "../src/types/ledger";
import { loadDataset } from "../scripts/shared";

const ds = loadDataset();
const entity = (id: string) => ds.entities.find((e) => e.id === id)!;
const run = (id: string, dir: "artist_to_startup" | "startup_to_art_world") =>
  translate(entity(id), ds.sources.filter((s) => s.entityId === id), ds.events.filter((e) => e.entityId === id), dir, ds.ruleSet);
const empty = (): StoreShape => ({ snapshots: {}, translations: [], certificates: [], ledger: [] });

describe("canonicalize + hashing", () => {
  it("is independent of key order", () => {
    expect(canonicalize({ b: 1, a: { d: 2, c: 3 } })).toBe(canonicalize({ a: { c: 3, d: 2 }, b: 1 }));
  });
  it("sha256 matches node crypto, including the pure-JS fallback", async () => {
    for (const s of ["", "abc", "é".repeat(100), "x".repeat(1000)]) {
      const expected = createHash("sha256").update(s).digest("hex");
      expect(await sha256Hex(s)).toBe(expected);
      expect(_sha256FallbackForTests(new TextEncoder().encode(s))).toBe(expected);
    }
  });
});

describe("translation engine", () => {
  it("is deterministic", () => {
    expect(JSON.stringify(run("OCF-E-0001", "artist_to_startup"))).toBe(JSON.stringify(run("OCF-E-0001", "artist_to_startup")));
  });
  it("maps an exhibition and a gallery and keeps source facts", () => {
    const r = run("OCF-E-0001", "artist_to_startup");
    expect(r.appliedRuleIds).toEqual(["ART_EXHIBITION_TO_TRACTION", "ART_GALLERY_TO_BACKING"]);
    expect(r.outputs.find((o) => o.ruleId === "ART_EXHIBITION_TO_TRACTION")!.translatedValue).toContain("Mastry");
  });
  it("reports missing input neutrally, never as a negative value", () => {
    const r = run("OCF-E-0006", "startup_to_art_world"); // Dropbox: no funding round
    const funding = r.outputs.find((o) => o.ruleId === "STARTUP_FUNDING_TO_PATRONAGE")!;
    expect(funding.confidenceLabel).toBe("insufficient_data");
    expect(funding.translatedValue).toBe("Funding history not available in selected sources.");
    expect(JSON.stringify(r)).not.toMatch(/low traction|weak|low potential/i);
  });
  it("declines inappropriate analogies", () => {
    const r = run("OCF-E-0011", "artist_to_startup"); // an institution
    expect(r.applicable).toBe(false);
    expect(r.notApplicableReason).toBeTruthy();
  });
  it("does not infer traction from a pitch alone", () => {
    const r = run("OCF-E-0014", "startup_to_art_world");
    expect(r.appliedRuleIds).toEqual(["STARTUP_PITCH_TO_PROPOSITION"]);
  });
});

describe("assessment + ledger", () => {
  const t0 = "2026-11-06T10:00:00.000Z";
  it("builds a verifiable chain; a changed byte fails verification", async () => {
    const store = empty();
    store.ledger.push(...(await registrationEvents(ds, [], Date.parse(t0))));
    expect((await verifyChain(store.ledger)).ok).toBe(true);
    const tampered = structuredClone(store.ledger);
    (tampered[3].payload as Record<string, unknown>).displayName = "Altered";
    const v = await verifyChain(tampered);
    expect(v.ok).toBe(false);
    expect(v.firstFailureIndex).toBe(3);
  });
  it("issues a certificate once; repeating returns the same one (no silent duplicates)", async () => {
    const store = empty();
    store.ledger.push(...(await registrationEvents(ds, [], Date.parse(t0))));
    const a = await createAssessment(ds, store, "OCF-E-0001", "artist_to_startup", t0);
    expect(a.created).toBe(true);
    store.snapshots[a.snapshot!.id] = a.snapshot!;
    store.translations.push(a.translation!);
    store.certificates.push(a.certificate!);
    store.ledger.push(...a.newEvents);
    const b = await createAssessment(ds, store, "OCF-E-0001", "artist_to_startup", "2027-01-01T00:00:00.000Z");
    expect(b.created).toBe(false);
    expect(b.certificate!.id).toBe(a.certificate!.id);
    expect(b.certificate!.issuedAt).toBe(t0);
    expect(b.newEvents).toHaveLength(0);
    expect((await verifyChain(store.ledger)).ok).toBe(true);
  });
  it("corrections append and change derived status without altering the original event", async () => {
    const store = empty();
    store.ledger.push(...(await registrationEvents(ds, [], Date.parse(t0))));
    const target = store.ledger[0];
    const before = JSON.stringify(target);
    store.ledger.push(await appendEvent(store.ledger, {
      eventType: "record_corrected", entityId: target.entityId, timestamp: t0, payload: { targetEventId: target.id, note: "x" },
    }));
    expect(JSON.stringify(store.ledger[0])).toBe(before);
    expect(statusOf(target, store.ledger)).toBe("corrected");
    expect((await verifyChain(store.ledger)).ok).toBe(true);
  });
  it("shipped seed store verifies", async () => {
    const seed: StoreShape = JSON.parse(readFileSync(new URL("../src/data/store.seed.json", import.meta.url), "utf8"));
    expect((await verifyChain(seed.ledger)).ok).toBe(true);
    expect(seed.certificates.length).toBeGreaterThan(0);
  });
});
