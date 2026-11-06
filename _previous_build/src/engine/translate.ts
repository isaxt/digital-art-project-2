import rulesData from "../data/rules.json";
import type { Entity, EntityEvent } from "../types/entity";
import type { SourceRecord } from "../types/source";
import type { ConfidenceLabel, Direction, TranslationOutput, TranslationRule } from "../types/translation";

export const RULESET_VERSION: string = rulesData.ruleSetVersion;
export const RULES = rulesData.rules as unknown as TranslationRule[];

export const DIRECTIONS: Record<Direction, { label: string; from: Entity["entityType"]; to: "startup" | "art_world" }> = {
  artist_to_startup: { label: "Artist → Startup", from: "artist", to: "startup" },
  startup_to_art_world: { label: "Startup → Art World", from: "startup", to: "art_world" },
};

export const ruleById = (id: string) => RULES.find((r) => r.id === id);

/** Rules read "events.<eventType>" or "field.<key>" (a normalizedFields key on a source record). */
const parseInput = (r: TranslationRule) => {
  const [kind, key] = r.inputFields[0].split(".");
  return { kind: kind as "events" | "field", key };
};

/** Templates only restate source values; they never add facts. */
function fill(template: string, vars: { title?: string; date?: string; value?: unknown }): string {
  return template
    .replace("{title}", vars.title ?? "")
    .replace("{date}", vars.date && vars.date.trim() ? vars.date : "date not recorded")
    .replace("{value}", vars.value === undefined ? "" : String(vars.value));
}

export interface TranslationResult {
  outputs: TranslationOutput[];
  appliedRuleIds: string[];
  sourceRecordIds: string[];
  missingInputs: string[];
  rationale: string[];
  limitations: string[];
  originalContent: Record<string, unknown>;
  translatedContent: Record<string, unknown>;
}

const NONE = (rule: Pick<TranslationRule, "id" | "version">, label: string, msg: string, explanation = "", limitation = ""): TranslationOutput => ({
  sourceLabel: label, translatedLabel: "No translation", sourceValue: null, translatedValue: msg,
  ruleId: rule.id, ruleVersion: rule.version, explanation, limitation,
  confidenceLabel: "insufficient_data", sourceRecordIds: [],
});

/** Pure and deterministic: same entity, sources, events and rule set → same output. */
export function translate(entity: Entity, sources: SourceRecord[], events: EntityEvent[], direction: Direction): TranslationResult {
  const dir = DIRECTIONS[direction];
  const outputs: TranslationOutput[] = [];
  const missingInputs: string[] = [];

  if (entity.entityType !== dir.from) {
    const msg = `“${dir.label}” applies to ${dir.from} records; this record is a ${entity.entityType}. No rules were applied because the analogy is not appropriate.`;
    outputs.push(NONE({ id: "NO_APPLICABLE_RULE", version: RULESET_VERSION }, "Entity type", msg,
      "Rules are defined only for the source entity type of each direction.",
      "Forcing a mismatched direction would produce meaningless equivalences."));
    return {
      outputs, appliedRuleIds: [], sourceRecordIds: [], missingInputs: [msg],
      rationale: [msg], limitations: ["Direction does not match entity type."],
      originalContent: { entityType: entity.entityType }, translatedContent: { note: msg },
    };
  }

  const rules = RULES.filter((r) => r.enabled && r.sourceEntityType === dir.from && r.targetVocabulary === dir.to);
  for (const rule of rules) {
    const { kind, key } = parseInput(rule);
    const confidence: ConfidenceLabel = rule.mappingKind === "direct" ? "direct_mapping" : "interpretive_mapping";
    const missing = () => {
      missingInputs.push(rule.missingMessage);
      outputs.push({ ...NONE(rule, rule.inputFields.join(", "), rule.missingMessage, rule.rationale, rule.limitation), translatedLabel: rule.outputLabel });
    };
    if (kind === "events") {
      const hits = events.filter((e) => e.eventType === key).sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.id.localeCompare(b.id));
      if (!hits.length) { missing(); continue; }
      for (const ev of hits) {
        outputs.push({
          sourceLabel: ev.originalEventType, translatedLabel: rule.outputLabel,
          sourceValue: { title: ev.title, date: ev.date ?? null }, translatedValue: fill(rule.template, { title: ev.title, date: ev.date }),
          ruleId: rule.id, ruleVersion: rule.version, explanation: rule.rationale, limitation: rule.limitation,
          confidenceLabel: confidence, sourceRecordIds: [ev.sourceRecordId],
        });
      }
    } else {
      const src = sources.find((s) => s.normalizedFields?.[key] !== undefined && s.normalizedFields[key] !== "");
      if (!src) { missing(); continue; }
      const value = src.normalizedFields[key];
      outputs.push({
        sourceLabel: key, translatedLabel: rule.outputLabel, sourceValue: value,
        translatedValue: fill(rule.template, { value }), ruleId: rule.id, ruleVersion: rule.version,
        explanation: rule.rationale, limitation: rule.limitation, confidenceLabel: confidence, sourceRecordIds: [src.id],
      });
    }
  }

  const applied = outputs.filter((o) => o.confidenceLabel !== "insufficient_data");
  const appliedRuleIds = [...new Set(applied.map((o) => o.ruleId))];
  return {
    outputs, appliedRuleIds, missingInputs,
    sourceRecordIds: [...new Set(applied.flatMap((o) => o.sourceRecordIds))].sort(),
    rationale: appliedRuleIds.map((id) => `${id}: ${ruleById(id)!.rationale}`),
    limitations: appliedRuleIds.map((id) => `${id}: ${ruleById(id)!.limitation}`),
    originalContent: Object.fromEntries(applied.map((o, i) => [`${i + 1}. ${o.sourceLabel}`, o.sourceValue])),
    translatedContent: Object.fromEntries(applied.map((o, i) => [`${i + 1}. ${o.translatedLabel}`, o.translatedValue])),
  };
}

/** Authored descriptive category. Never a score or ranking; missing data is never read as low. */
export function classify(outputs: TranslationOutput[]): string {
  const mapped = outputs.filter((o) => o.confidenceLabel !== "insufficient_data");
  if (!mapped.length) return "Provisionally indexed. Comparison not supported by available records";
  return "Provisionally indexed: " + [...new Set(mapped.map((o) => o.translatedLabel))].join("; ");
}
