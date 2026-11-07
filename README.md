# The Office of Cultural Futures

A speculative web institution (a critical digital artwork) that registers artists, startups and institutions from cited public records, translates between art-world and startup vocabulary through explicit rules, and issues certificates whose provenance is recorded in a local hash-chained ledger.

Built to `Office_of_Cultural_Futures_Technical_Build_Spec.md` with the look from the visual-identity brief (blue institution, yellow classification, dense tables, monospaced data, dark ledger terminal).

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 22 tests: engine, ledger, certificates, adapters
npm run build        # validates data, rebuilds seed ledger, typechecks, builds to dist/
npm run preview
```

`dist/` is plain static files with relative paths and hash routing, so it runs from any folder or static host (including an exhibition machine, offline).

## Status against the spec

| Area | State |
|---|---|
| Home, Registry (search, type/verification filters, sorts, coverage grid), Entity pages, Translation Engine (both directions), Certificates, Public Ledger, Methods / Terms | Built |
| Deterministic rule engine, 9 versioned rules, inspectable, limitations shown | Built, unit-tested |
| Missing data shown as unavailable, never negative; unmapped facts and mismatched directions reported, not forced | Built, unit-tested |
| Certificates: deterministic IDs, frozen snapshot + rule-set version, refresh never re-issues | Built, unit-tested |
| Ledger: canonical JSON, SHA-256, previous-hash link, verify-on-load, corrections/disputes append events, tamper demo | Built, unit-tested |
| Archive page: desktop mock with Substack icons; click opens a scrollable replica window of each post (text in `src/data/articles/`) | Built; **only the opening passages are in so far, full text needed** |
| Ingestion adapters (Art Institute of Chicago, Met) + candidate review script | Written, **untested against the live APIs** (no network where it was built) |
| Wikidata, SEC EDGAR, Companies House adapters | Not built |
| Dataset of 20–40 entities | **Not met: 7 records** (see below) |
| AI-assisted mode, testnet anchoring, wallets, visitor submissions | Not built (P2/P3 by the spec) |

## The dataset (read this)

Only records that were actually retrieved are in the dataset: 5 entities plus 2 institutions, from Met pages, three Y Combinator directory pages and one TechCrunch article, retrieved 2026-11-05. They were read through an automated page summary and **have not been checked line by line by a person**; each source record carries a `verificationStatus` and `reviewNote` saying what is unconfirmed. Nothing is filled in from memory: no funding amounts, valuations or gallery representation appear because no cited source states them.

To grow it: run `npm run ingest -- aic "Name"` (or `met`) on a machine with network access, review `data/ingested/candidates.json`, promote records by hand into `src/data/*.json`, then `npm run data:build`. Suggested research columns are in spec §5.4. Still needed: an artist with very sparse public information, a startup with a clear funding announcement, and more art-side entities.

## Layout

```
src/types/      shared types (entity, source, event, rule, translation, certificate, ledger)
src/data/       curated JSON (entities, sources, events, rules) + generated/ (seed ledger, translations, certificates)
src/services/   translationService (pure engine), certificateService, ledgerService, registryService
src/store/      browser-local records (localStorage), merged after the seed chain
src/ingestion/  adapters (AIC, Met), normalize + dedupe
src/pages, src/components/, src/styles/   UI. tokens.css holds all colours/type; config.ts holds institutional wording
scripts/        validateData, buildLedger (deterministic seed), ingest
docs/           DATA_SOURCES, TRANSLATION_RULES, LEDGER_SPEC, LIMITATIONS
_previous_build/  files from an earlier build found in this folder, parked untouched (see its README)
```

## Ledger in one paragraph

`eventHash = SHA-256(canonical(event fields) + "|" + previousEventHash)`. Seed events are built by `scripts/buildLedger.ts` (fixed timestamps, derived IDs, byte-reproducible). Events a visitor creates (certificates, corrections, disputes) are appended in that browser's localStorage after the seed chain and are never sent anywhere. The chain is verified from the first event on every load. It is a local simulation and the UI says so everywhere; it is not decentralized, trustless or immutable.

## Environment variables

None are needed to run the site. `.env.example` lists optional keys for ingestion (`COMPANIES_HOUSE_API_KEY`, `SEC_USER_AGENT`); they are only read by Node scripts and never reach the browser bundle.

## Before exhibiting

- Set `correctionsContact` in `src/config.ts`.
- Have a person verify every source record, then update statuses.
- Replace the placeholder emblem (`Emblem` in `src/components/shared/index.tsx`) with the final mark.
- Check each source's terms for any reuse beyond the short factual fields stored.

## Orientation and Archive

On first visit a two-step orientation window explains the concept, then shows the original Substack post (scrollable). It can be reopened from the header, footer or Archive. The Archive keeps the post as a reference. The article text lives in `src/data/articles/parallels.txt` (set `complete: true` and `url` in `articles.json` once the full text and link are added).
