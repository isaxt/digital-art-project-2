# Data sources

## The Registry's only data sources

| File (src/data/raw/, unchanged) | Contents | Notes |
|---|---|---|
| `nyc_sf_contemporary_galleries.json` | 45 galleries / art spaces in NYC and San Francisco; partial artist rosters; current exhibitions | Statuses (`verified` / `not_yet_parsed`) are carried over as supplied. Empty roster = not yet parsed, not "no artists". Perrotin's roster is a partial extraction (its note says 73 represented artists). |
| `nyc_sf_startups.json` | 99 startups with sector, accelerator, batch, location, website | Descriptions are summaries written for the dataset. Batch is "recorded from known program history". Directory links are city/portfolio level. Location is a city association, not a verified HQ claim. |

## How they are imported (`npm run data:import`)

- Galleries, startups: one entity each, original ID and name kept. The duplicate ID `hashimoto_contemporary` becomes two records with the city appended.
- Source records: one per supplied URL (website, roster page, exhibitions page, accelerator directory), each with the dataset's own status and notes.
- Events: current exhibitions (title, dates, venue, participants as listed); accelerator affiliation (with batch only if supplied, never dated); roster listings on artist records.
- Artists: derived only from exact names in parsed rosters / exhibition listings. "Group exhibition" placeholders are skipped. No biography, ID or relationship terms exist in the data, so none are shown.
- Never inferred: batches, dates, locations/HQ, representation, funding, valuation.

## Parked

`src/data/_unverified_pre_dataset/`: seven earlier records from automated page summaries. Not loaded.

## Adapters (not part of the Registry)

| Adapter | State |
|---|---|
| `src/ingestion/fetchArtInstitute.ts`, `fetchMetMuseum.ts` | Written from public docs, mocked-network tests only; output is candidate-only and never enters the Registry automatically |
| Wikidata, SEC EDGAR, Companies House | Not built |

## Rules for adding records later

1. Real entities from an identifiable source; every fact has a `sourceUrl` and a date.
2. Record the source's own category in `originalEventType`; keep verification status explicit.
3. Do not infer funding, revenue, representation, batches or locations.
4. No personal contact information or images without checking terms.
5. Run `npm run data:validate`, then `npm run data:build`.
