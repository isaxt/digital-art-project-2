/**
 * Run source adapters for a search term and write CANDIDATES for human review.
 * It never edits the curated dataset: you promote records by hand into src/data/*.json, then `npm run data:build`.
 *
 *   npm run ingest -- aic "Julie Mehretu"
 *   npm run ingest -- met "Kara Walker"
 *
 * Requires network access. Caches nothing; respects a fixed delay between requests.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { aicAdapter } from "../src/ingestion/fetchArtInstitute";
import { metAdapter } from "../src/ingestion/fetchMetMuseum";
import { politeFetcher, type NormalizedCandidate } from "../src/ingestion/adapter";
import { dedupe } from "../src/ingestion/normalizeRecords";
import sources from "../src/data/sources.json" with { type: "json" };
import type { SourceRecord } from "../src/types/source";

const [, , which, ...rest] = process.argv;
const query = rest.join(" ").trim();
if (!which || !query) {
  console.error('Usage: npm run ingest -- <aic|met> "<search term>"');
  process.exit(2);
}

const fetcher = politeFetcher({ delayMs: 500, userAgent: process.env.SEC_USER_AGENT ?? "OfficeOfCulturalFutures-ingest/0.1 (research artwork)" });
const adapter = which === "aic" ? aicAdapter(fetcher) : which === "met" ? metAdapter(fetcher) : null;
if (!adapter) {
  console.error(`Unknown adapter "${which}". Available: aic, met. (Wikidata, EDGAR and Companies House adapters are not implemented yet; see docs/DATA_SOURCES.md.)`);
  process.exit(2);
}

try {
  const raw = await (adapter as { search(q: string, n?: number): Promise<unknown[]> }).search(query, 5);
  const normalized: NormalizedCandidate[] = raw.map((r) => (adapter as { normalize(r: unknown): NormalizedCandidate }).normalize(r));
  const fresh = dedupe(normalized, sources as unknown as SourceRecord[]);
  mkdirSync("data/ingested", { recursive: true });
  const out = "data/ingested/candidates.json";
  const prev: NormalizedCandidate[] = existsSync(out) ? JSON.parse(readFileSync(out, "utf8")) : [];
  writeFileSync(out, JSON.stringify([...prev, ...fresh], null, 2) + "\n");
  console.log(`${fresh.length} new candidate(s) from ${adapter.sourceName} written to ${out} (${normalized.length - fresh.length} duplicates skipped). Review before promoting.`);
} catch (e) {
  console.error("Ingestion failed:", (e as Error).message);
  console.error("The website does not depend on this script; the curated dataset is unaffected.");
  process.exit(1);
}
