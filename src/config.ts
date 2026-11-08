/**
 * Content & institutional configuration. Kept apart from components so the visual-design pass
 * (or the artist) can change wording without touching behaviour.
 */
export const CONFIG = {
  institutionName: "The Office of Cultural Futures",
  shortName: "OCF",
  tagline: "Registry · Translation · Provenance of Anticipated Potential",
  ruleSetVersion: "1.1.0",
  ledgerLabel: "LOCAL APPEND-ONLY LEDGER — SIMULATION (not a blockchain)",
  disclaimer:
    "Classifications, translations and certificates issued by this Office are speculative interpretations produced by an artwork. They are not endorsements, valuations, investment assessments or measures of artistic merit.",
  notice: {
    ref: "NOTICE 2026/01",
    text: "The Registry is built from two supplied datasets of real, source-linked records. Records marked NEEDS REVIEW or PARTIAL, and sections marked not yet parsed, have not completed verification. Absence of a field is recorded as unavailable, never as low value.",
  },
  /** Where visitors should send factual corrections. Fill in before exhibiting. */
  correctionsContact: "[corrections contact to be supplied by the project owner]",
  localStorageKey: "ocf.local-records.v1",
  /** Featured example on the home page: an artist named on a gallery roster AND in that gallery's current-exhibition listing. */
  featuredEntityId: "artist-sandra-cinto",
  /** Chain presentation: events are grouped into blocks of this many events; the last partial block is "open". */
  blockSize: 8,
  /** A transaction with this many later events on top of it is called "final by burial". */
  finalityDepth: 6,
  /** Distinct witness addresses needed before a certificate is called "finalized by quorum". */
  quorum: 3,
  miningDefaultDifficulty: 4,
  witnessKey: "ocf.witnesses.v1",
  introKey: "ocf.intro-seen.v1",
} as const;
