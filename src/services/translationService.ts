/**
 * Translation Engine (Layer 3). Pure and deterministic: the same entity snapshot + rule set always
 * yields the same output. No clocks, no randomness, no network. Timestamps and IDs are supplied by callers.
 */
import type { Entity, EntityEvent } from "../types/entity";
import type { SourceRecord } from "../types/source";
import type {
  Direction,
  RuleSet,
  TranslationOutput,
  TranslationResult,
  TranslationRule,
  UnmappedFact,
} from "../types/translation";
import { canonicalize } from "../utils/canonicalize";
import { derivedId } from "../utils/ids";
import { shortHash } from "../utils/hashing";
import type { TranslationRecord } from "../types/translation";

export const DIRECTIONS: Record<Direction, { label: string; from: Entity["entityType"]; target: "startup" | "art_world" }> = {
  artist_to_startup: { label: "Artist → Startup", from: "artist", target: "startup" },
  startup_to_art_world: { label: "Startup → Art World", from: "startup", target: "art_world" },
};

export function defaultDirection(t: Entity["entityType"]): Direction | null {
  if (t === "artist") return "artist_to_startup";
  if (t === "startup") return "startup_to_art_world";
  return null;
}

export interface EntitySnapshot {
  entity: Entity;
  sources: SourceRecord[];
  events: EntityEvent[];
}

function fmt(template: string, vars: { title?: string; date?: string; text?: string }): string {
  return template
    .replace("{title}", vars.title ?? "")
    .replace("{dateSuffix}", vars.date ? ` (${vars.date})` : "")
    .replace("{text}", vars.text ?? "");
}

function eventsFor(rule: TranslationRule, snap: EntitySnapshot): EntityEvent[] {
  if (rule.match.kind !== "event") return [];
  const t = rule.match.eventType;
  return snap.events.filter((e) => e.eventType === t);
}

export function translate(snap: EntitySnapshot, direction: Direction, ruleSet: RuleSet): TranslationResult {
  const dir = DIRECTIONS[direction];
  if (snap.entity.entityType !== dir.from) {
    return {
      outputs: [],
      unmapped: [],
      directionNotApplicable: `Direction “${dir.label}” reads ${dir.from} records. This record is a${/^[aeiou]/.test(snap.entity.entityType) ? "n" : ""} ${snap.entity.entityType}. The Office defines no rules for it; forcing a comparison would be inappropriate.`,
    };
  }

  const rules = ruleSet.rules.filter((r) => r.enabled && r.sourceEntityType === dir.from && r.targetVocabulary === dir.target);
  const outputs: TranslationOutput[] = [];
  const coveredEvents = new Set<string>();
  const coveredSourceFields = new Set<string>();

  for (const rule of rules) {
    const base = {
      ruleId: rule.id,
      ruleVersion: rule.version,
      explanation: `${rule.description} ${rule.rationale}`,
      limitation: rule.limitation,
      inputFields: rule.inputFields,
    };

    if (rule.match.kind === "event") {
      const matches = eventsFor(rule, snap);
      if (matches.length === 0) {
        outputs.push({
          ...base,
          sourceLabel: rule.inputFields[0],
          translatedLabel: rule.outputLabel,
          sourceValue: null,
          translatedValue: rule.missingMessage,
          confidenceLabel: "insufficient_data",
          sourceRecordIds: [],
        });
        continue;
      }
      for (const ev of matches) {
        coveredEvents.add(ev.id);
        outputs.push({
          ...base,
          sourceLabel: `${ev.originalEventType}: ${ev.title}`,
          translatedLabel: rule.outputLabel,
          sourceValue: { title: ev.title, date: ev.date ?? null, originalEventType: ev.originalEventType, description: ev.description ?? null },
          translatedValue: fmt(rule.template, { title: ev.title, date: ev.date }),
          confidenceLabel: rule.confidenceLabel,
          sourceRecordIds: [ev.sourceRecordId],
        });
      }
    } else {
      const key = rule.match.key;
      const hits = snap.sources.filter((s) => typeof s.normalizedFields[key] === "string" && (s.normalizedFields[key] as string).trim() !== "");
      if (hits.length === 0) {
        outputs.push({
          ...base,
          sourceLabel: rule.inputFields[0],
          translatedLabel: rule.outputLabel,
          sourceValue: null,
          translatedValue: rule.missingMessage,
          confidenceLabel: "insufficient_data",
          sourceRecordIds: [],
        });
        continue;
      }
      for (const s of hits) {
        coveredSourceFields.add(`${s.id}:${key}`);
        const text = s.normalizedFields[key] as string;
        outputs.push({
          ...base,
          sourceLabel: `${s.provider} · ${key}`,
          translatedLabel: rule.outputLabel,
          sourceValue: text,
          translatedValue: fmt(rule.template, { text }),
          confidenceLabel: rule.confidenceLabel,
          sourceRecordIds: [s.id],
        });
      }
    }
  }

  // Facts that no rule reads. Reported, not hidden: the places where the analogy breaks.
  const unmapped: UnmappedFact[] = snap.events
    .filter((e) => !coveredEvents.has(e.id))
    .map((e) => ({
      label: e.originalEventType,
      value: e.title + (e.date ? ` (${e.date})` : ""),
      sourceRecordId: e.sourceRecordId,
      note: `Normalized as “${e.eventType}”. No ${dir.label} rule reads this event type, so the Office offers no translation.`,
    }));

  return { outputs, unmapped };
}

export function mappedOutputs(r: TranslationResult): TranslationOutput[] {
  return r.outputs.filter((o) => o.confidenceLabel !== "insufficient_data");
}

/** Hash of the exact inputs: lets a certificate prove which version of the source data it used. */
export async function snapshotId(snap: EntitySnapshot): Promise<string> {
  const payload = {
    entity: {
      id: snap.entity.id,
      entityType: snap.entity.entityType,
      displayName: snap.entity.displayName,
      description: snap.entity.description,
      updatedAt: snap.entity.updatedAt,
    },
    sources: [...snap.sources].sort((a, b) => a.id.localeCompare(b.id)),
    events: [...snap.events].sort((a, b) => a.id.localeCompare(b.id)),
  };
  return `SNAP-${await shortHash(canonicalize(payload), 12)}`;
}

export async function buildTranslationRecord(
  snap: EntitySnapshot,
  direction: Direction,
  ruleSet: RuleSet,
  generatedAt: string,
): Promise<TranslationRecord> {
  const result = translate(snap, direction, ruleSet);
  const snapId = await snapshotId(snap);
  const mapped = mappedOutputs(result);
  const sourceRecordIds = [...new Set(result.outputs.flatMap((o) => o.sourceRecordIds))].sort();
  const appliedRuleIds = [...new Set(mapped.map((o) => o.ruleId))];
  const id = await derivedId("TR", { e: snap.entity.id, direction, snapId, v: ruleSet.version });

  return {
    id,
    entityId: snap.entity.id,
    direction,
    sourceRecordIds,
    appliedRuleIds,
    sourceSnapshotId: snapId,
    ruleSetVersion: ruleSet.version,
    originalContent: {
      outputs: result.outputs.map((o) => ({ ruleId: o.ruleId, sourceLabel: o.sourceLabel, sourceValue: o.sourceValue })),
      unmapped: result.unmapped,
    },
    translatedContent: {
      outputs: result.outputs.map((o) => ({
        ruleId: o.ruleId,
        ruleVersion: o.ruleVersion,
        translatedLabel: o.translatedLabel,
        translatedValue: o.translatedValue,
        confidenceLabel: o.confidenceLabel,
      })),
    },
    rationale: [...new Set(mapped.map((o) => `${o.ruleId}: ${o.explanation}`))],
    limitations: [...new Set(mapped.map((o) => `${o.ruleId}: ${o.limitation}`))],
    generatedAt,
    generationMethod: "deterministic",
  };
}
