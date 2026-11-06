# Limitations

- **Small, unverified-by-a-person dataset.** 7 records (target 20–40). Source pages were read through an automated summary and need human checking. Several fields the spec lists (gallery representation, funding rounds, artist statements) have no verified input yet, so those rule slots show "not available".
- **No artist with sparse public data yet**, and no startup with a clear funding announcement. Both are needed for the spec's test cases (§12.1).
- **Ingestion adapters are untested live.** They follow the published API docs and are tested only against mocked responses. Wikidata, EDGAR and Companies House adapters do not exist.
- **EveryArt** rests on a single 2012 press article; whether it still operates is unknown.
- **Directory listings are weaker evidence than a dated selection.** The accelerator rule says so in its limitation text.
- **Local ledger only.** Browser-local records are per browser and disappear if site data is cleared. Anyone controlling the dataset can rewrite the chain.
- **Visitor flow for a brand-new certificate** is covered by unit tests and a persisted correction flow in the browser test, but every seeded entity already has its certificate, so issuing a fresh one through the button only happens after data or rules change.
- **Placeholder emblem; wording placeholders** (`correctionsContact`).
- **Accessibility** was designed in (semantic tables, labels, focus states, text alongside colour) and checked for horizontal scroll at 390px, but has not had a screen-reader or automated audit pass.
- **Not built:** AI-assisted mode, testnet anchor, comparison view, visitor submissions.
