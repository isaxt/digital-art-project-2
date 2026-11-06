import type { Entity, EntityEvent, EntityType } from "../types/entity";
import type { SourceRecord } from "../types/source";
import type { Direction, RuleSet, TranslationOutput, TranslationRule } from "../types/translation";

export const DIRECTION_SOURCE_TYPE: Record<Direction, EntityType> = {
  artist_to_startup: "artist",
  startup_to_art_world: "startup",
};

export const DIRECTION_LABEL: Record<Direction, string> = {
  artist_to_startup: "Artist → Startup",
  startup_to_art_world: "Startup → Art World",
};

export interface TranslationResult {
  applicable: boolean;
  /** Set when the analogy is judged inappropriate for this entity. */
  notApplicableReason?: string;
  outputs: TranslationOutput[];
  appliedRuleIds: string[];
  rationale: string[];
  limitations: string[];
}

export function compatibleDirection(type: EntityType): Direction | null {
  if (type === "artist") return "artist_to_startup";
  if (type === "startup") return "startup_to_art_world";
  return null;
}

function fill(template: string, vars: Record<string, string | undefined>): string {
  // "(…{date}…)" style optional groups collapse when the value is unknown.
  return template
    .replace(/\[([^\]]*)\]/g, (_m, inner: string) => {
      const keys = [...inner.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      return keys.every((k) => vars[k]) ? inner : "";
    })
    .replace(/\{(\w+)\}/g, (_m, k: string) => vars[k] ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

interface Found { label: string; value: unknown; vars: Record<string, string | undefined>; refs: string[] }

function readInputs(rule: TranslationRule, events: EntityEvent[], sources: SourceRecord[], entity: Entity): Found[] {
  const found: Found[] = [];
  for (const field of rule.inputFields) {
    const [ns, key] = field.split(".");
    if (ns === "events") {
      for (const ev of events.filter((e) => e.eventType === key)) {
        found.push({
          label: `${ev.originalEventType}: ${ev.title}`,
          value: { title: ev.title, date: ev.date ?? null, originalEventType: ev.originalEventType },
          vars: { title: ev.title, date: ev.date, name: entity.displayName },
          refs: [ev.id, ev.sourceRecordId],
        });
      }
    } else if (ns === "source") {
      for (const s of sources) {
        const v = s.normalizedFields[key];
        if (typeof v === "string" && v.trim()) {
          found.push({ label: `Source field “${key}”`, value: v, vars: { text: v, name: entity.displayName }, refs: [s.id] });
        }
      }
    }
  }
  return found;
}

/**
 * Pure and deterministic: same entity + sources + events + rule set => same output.
 * Missing inputs yield explicit "insufficient_data" items, never a negative value.
 */
export function translate(
  entity: Entity,
  sources: SourceRecord[],
  events: EntityEvent[],
  direction: Direction,
  ruleSet: RuleSet,
): TranslationResult {
  const required = DIRECTION_SOURCE_TYPE[direction];
  if (entity.entityType !== required) {
    return {
      applicable: false,
      notApplicableReason:
        `${DIRECTION_LABEL[direction]} reads facts about a ${required}. This record is a ${entity.entityType}, ` +
        `and the Office's rules define no honest analogy for it. The comparison is declined rather than forced.`,
      outputs: [], appliedRuleIds: [], rationale: [], limitations: [],
    };
  }

  const rules = ruleSet.rules.filter((r) => r.enabled && r.sourceEntityType === required);
  const outputs: TranslationOutput[] = [];
  const applied = new Set<string>();

  for (const rule of rules) {
    const found = readInputs(rule, events, sources, entity);
    if (found.length === 0) {
      outputs.push({
        sourceLabel: rule.inputFields.join(", "),
        translatedLabel: rule.outputLabel,
        sourceValue: null,
        translatedValue: rule.missingMessage,
        ruleId: rule.id, ruleVersion: rule.version,
        explanation: rule.description, limitation: rule.limitation,
        confidenceLabel: "insufficient_data", sourceRefs: [],
      });
      continue;
    }
    applied.add(rule.id);
    for (const f of found) {
      outputs.push({
        sourceLabel: f.label,
        translatedLabel: rule.outputLabel,
        sourceValue: f.value,
        translatedValue: fill(rule.template, f.vars),
        ruleId: rule.id, ruleVersion: rule.version,
        explanation: rule.description, limitation: rule.limitation,
        confidenceLabel: rule.confidence, sourceRefs: f.refs,
      });
    }
  }

  const appliedRules = rules.filter((r) => applied.has(r.id));
  return {
    applicable: true,
    outputs,
    appliedRuleIds: appliedRules.map((r) => r.id),
    rationale: appliedRules.map((r) => `${r.id}: ${r.rationale}`),
    limitations: appliedRules.map((r) => `${r.id}: ${r.limitation}`),
  };
}
