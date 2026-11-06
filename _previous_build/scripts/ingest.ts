/**
 * Usage: npm run ingest -- aic "Kerry James Marshall"
 * Writes reviewable candidates to data-cache/. It NEVER edits src/data automatically:
 * every record passes manual review before entering the Registry (spec 10.2).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { artInstituteAdapter } from "../src/ingestion/fetchArtInstitute";
import type { CandidateFile } from "../src/ingestion/adapter";

const [, , source, ...rest] = process.argv;
const query = rest.join(" ").trim();
if (source !== "aic" || !query) {
  console.error('Usage: npm run ingest -- aic "<artist or artwork query>"');
  process.exit(1);
}
const records = await artInstituteAdapter.search(query);
const out: CandidateFile = {
  provider: artInstituteAdapter.sourceName,
  apiEndpoint: "https://api.artic.edu/api/v1/artworks/search",
  retrievedAt: new Date().toISOString(),
  query,
  candidates: records.map((r) => artInstituteAdapter.normalize(r)),
};
mkdirSync("data-cache", { recursive: true });
const file = `data-cache/aic-${query.replace(/\W+/g, "-").toLowerCase()}.json`;
writeFileSync(file, JSON.stringify(out, null, 2));
console.log(`${out.candidates.length} candidate(s) written to ${file}. Review before adding to src/data.`);
