import type { EntityType, EventType } from "./entity";

export type Direction = "artist_to_startup" | "startup_to_art_world";

export type ConfidenceLabel = "direct_mapping" | "interpretive_mapping" | "insufficient_data";

/** How a rule finds its input in a normalized record. */
export type RuleMatch =
  | { kind: "event"; eventType: EventType }
  | { kind: "sourceField"; key: string };

export interface TranslationRule {
  id: string;
  version: string;

  sourceEntityType: EntityType;
  targetVocabulary: "startup" | "art_world";

  inputFields: string[];
  outputLabel: string;
  description: string;

  rationale: string;
  limitation: string;

  enabled: boolean;

  // Extensions needed to make the rule executable and deterministic.
  match: RuleMatch;
  /** Placeholders: {title} {date} {text}. */
  template: string;
  confidenceLabel: Exclude<ConfidenceLabel, "insufficient_data">;
  /** Shown when the input is absent. Missing is never translated into a negative. */
  missingMessage: string;
}

export interface RuleSet {
  version: string;
  rules: TranslationRule[];
}

export interface TranslationOutput {
  sourceLabel: string;
  translatedLabel: string;

  sourceValue: unknown;
  translatedValue: string;

  ruleId: string;
  ruleVersion: string;

  explanation: string;
  limitation: string;

  confidenceLabel: ConfidenceLabel;

  // Provenance extras
  inputFields: string[];
  sourceRecordIds: string[];
}

export interface UnmappedFact {
  label: string;
  value: string;
  sourceRecordId: string;
  note: string;
}

export interface TranslationResult {
  outputs: TranslationOutput[];
  unmapped: UnmappedFact[];
  /** True when the entity type has no translation direction (e.g. institutions). */
  directionNotApplicable?: string;
}

export interface TranslationRecord {
  id: string;
  entityId: string;

  direction: Direction;

  sourceRecordIds: string[];
  appliedRuleIds: string[];
  ruleSetVersion: string;
  sourceSnapshotId: string;

  originalContent: Record<string, unknown>;
  translatedContent: Record<string, unknown>;

  rationale: string[];
  limitations: string[];

  generatedAt: string;
  generationMethod: "deterministic" | "ai_assisted";
}
