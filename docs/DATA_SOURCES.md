# Data sources

## In the current dataset (retrieved 2026-11-05)

| Provider | Used for | Notes |
|---|---|---|
| The Met: exhibition listing, three collection pages | Kara Walker records; Met as institution | Page content read via automated summary; not yet human-verified. One collection page's credit line names a private collection, so it is NOT recorded as a Met holding. One is a library catalogue entry for a book. |
| Y Combinator company directory (airbnb, dropbox, aesthetic) | Startup description line, founded year, location, directory listing | Batch/cohort is not shown on these pages and is not recorded. Team size is volatile and stored "as listed at retrieval". |
| TechCrunch article, 2012-03-21 | EveryArt | Headline only; states no funding amount. One press source, so `needs_review`. |

Pages that could not be fetched during the build (not used, nothing inferred): Art Institute of Chicago API and pages, Met API, Wikidata, Y Combinator pages for Stripe, Twitch and Reddit.

## Adapters

| Adapter | State |
|---|---|
| `src/ingestion/fetchArtInstitute.ts` | Written from the public docs, mocked-network tests only |
| `src/ingestion/fetchMetMuseum.ts` | Written from the public docs, mocked-network tests only |
| Wikidata (SPARQL, narrow queries) | Not built |
| SEC EDGAR (descriptive User-Agent, caching) | Not built |
| Companies House (API key via env) | Not built |

Adapters return normalized candidates only. `npm run ingest` writes `data/ingested/candidates.json`; nothing enters the Registry without manual promotion, and imported records start as `needs_review`.

## Rules for adding records

1. Every fact needs a `sourceUrl` and `retrievedAt`. Quote excerpts verbatim and briefly.
2. Do not infer funding, revenue, traction or affiliation from marketing language.
3. Record the source's own event category in `originalEventType`.
4. Do not store personal contact information or images without checking terms.
5. Run `npm run data:validate`, then `npm run data:build`.
