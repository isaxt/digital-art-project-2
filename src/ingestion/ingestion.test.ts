import { describe, expect, it } from "vitest";
import { aicAdapter } from "./fetchArtInstitute";
import { metAdapter } from "./fetchMetMuseum";
import { dedupe, candidateToSourceRecord } from "./normalizeRecords";
import { politeFetcher } from "./adapter";

const fakeFetch = (body: unknown, status = 200) => async () => new Response(JSON.stringify(body), { status });

describe("adapters (mocked network: shapes follow the published API docs)", () => {
  it("AIC normalizes and preserves id + url", async () => {
    const a = aicAdapter(politeFetcher({ delayMs: 0, fetchImpl: fakeFetch({ data: [{ id: 1, title: "T", artist_display: "Name\nAmerican", date_display: "2000" }] }) }));
    const [r] = await a.search("x");
    const n = a.normalize(r);
    expect(n.displayName).toBe("Name");
    expect(n.sourceUrl).toBe("https://www.artic.edu/artworks/1");
    expect(n.sourceRecordId).toBe("1");
  });
  it("AIC rejects an unexpected response shape instead of guessing", async () => {
    const a = aicAdapter(politeFetcher({ delayMs: 0, fetchImpl: fakeFetch({ nope: true }) }));
    await expect(a.search("x")).rejects.toThrow(/shape/);
  });
  it("Met tolerates missing optional fields and flags non-public-domain", async () => {
    const a = metAdapter(politeFetcher({ delayMs: 0, fetchImpl: fakeFetch({ objectID: 5 }) }));
    const n = a.normalize(await a.getById("5"));
    expect(n.displayName).toBe("(artist not stated)");
    expect(n.reuseNotes).toMatch(/do not reproduce/i);
  });
  it("surfaces HTTP errors", async () => {
    const f = politeFetcher({ delayMs: 0, fetchImpl: fakeFetch({}, 404) });
    await expect(f("https://example.test")).rejects.toThrow(/404/);
  });
  it("imports start as needs_review and duplicates are skipped", async () => {
    const a = metAdapter(politeFetcher({ delayMs: 0, fetchImpl: fakeFetch({ objectID: 7, title: "X" }) }));
    const c = a.normalize(await a.getById("7"));
    const rec = candidateToSourceRecord(c, "SRC-X", "OCF-X");
    expect(rec.verificationStatus).toBe("needs_review");
    expect(dedupe([c], [rec])).toHaveLength(0);
  });
});
