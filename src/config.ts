/**
 * Content & institutional configuration. Kept apart from components so the visual-design pass
 * (or the artist) can change wording without touching behaviour.
 */
export const CONFIG = {
  institutionName: "The Office of Cultural Futures",
  shortName: "OCF",
  tagline: "Public Registry · Assessment · Provenance",
  ruleSetVersion: "1.1.0",
  ledgerLabel: "Ledger: local append-only record (simulated; not a blockchain)",
  disclaimer:
    "Classifications, translations and certificates issued by the Office are interpretive assessments produced under the published rule set. They do not constitute endorsements, valuations, investment advice or judgments of artistic merit.",
  notice: {
    ref: "NOTICE 2026/01",
    text: "The Registry is compiled from two source-linked datasets. Records marked Needs review or Partial, and sections marked Not yet parsed, have not completed verification. Missing fields are recorded as Not available and carry no negative weight in any assessment.",
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
