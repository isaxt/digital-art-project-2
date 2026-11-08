# Limitations

- **The data is only as good as the two supplied files.** Most galleries (42 of 45) have no parsed roster and many have no parsed exhibitions; startups' batches are "recorded from known program history" and directory links are city/portfolio level. The Office does not verify or extend them. Records stay NEEDS REVIEW / PARTIAL until a person checks them.
- **Artists are derived from names only.** Same-name people are not disambiguated; spelling variants are not merged. Two artists appear under more than one gallery (matched by exact name).
- **Exhibitions go stale.** "Current" means current on 2026-11-07.
- **Duplicate ID in the galleries file** (`hashimoto_contemporary`, NY and SF) is kept as two records and flagged, not resolved.
- **Few rules can read this data.** Artists have roster and exhibition facts only; startups have an accelerator at most. No funding, launch, acquisition, residency or statement data exists, so those slots read "not in the supplied dataset", and 45 startups have nothing any rule can read (no seed certificate is issued for them).
- **Ingestion adapters are untested live** and are not used for the Registry.
- **Local ledger only.** Browser-local records are per browser. Anyone controlling the dataset can rewrite the chain.
- **Chain forms are presentation only.** Blocks are a grouping of events (8 per block); addresses are hashes of IDs with no keys; witnessing has no signatures, so one browser can mint any quorum; proof of work proves hashing, not truth; mempool and witness identities live in this browser only. The simulation is stated in the UI.
- **Artist certificates are intentionally not seeded** so visitors can mine them.
- **Placeholder emblem; `correctionsContact`** still to be set.
- **Accessibility** designed in and checked for horizontal scroll at 390px; no screen-reader or automated audit yet.
- **Not built:** AI-assisted mode, testnet anchor, comparison view, visitor submissions.
