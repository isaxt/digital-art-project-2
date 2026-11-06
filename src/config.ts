/**
 * Content & institutional configuration. Kept apart from components so the visual-design pass
 * (or the artist) can change wording without touching behaviour.
 */
export const CONFIG = {
  institutionName: "The Office of Cultural Futures",
  shortName: "OCF",
  tagline: "Registry · Translation · Provenance of Anticipated Potential",
  ruleSetVersion: "1.0.0",
  ledgerLabel: "LOCAL APPEND-ONLY LEDGER — SIMULATION (not a blockchain)",
  disclaimer:
    "Classifications, translations and certificates issued by this Office are speculative interpretations produced by an artwork. They are not endorsements, valuations, investment assessments or measures of artistic merit.",
  notice: {
    ref: "NOTICE 2026/01",
    text: "The Registry is currently open to a small, curated first intake. Records marked NEEDS REVIEW or PARTIAL have not completed manual verification. Absence of a field is recorded as unavailable, never as low value.",
  },
  /** Where visitors should send factual corrections. Fill in before exhibiting. */
  correctionsContact: "[corrections contact to be supplied by the project owner]",
  localStorageKey: "ocf.local-records.v1",
} as const;
