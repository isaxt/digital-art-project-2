import type { Entity, EntityEvent } from "../types/entity";
import type { SourceRecord } from "../types/source";
import type { RuleSet } from "../types/translation";

/** Returns a list of human-readable problems; empty list = valid. Used by scripts/validateData.ts and tests. */
export function validateDataset(d: {
  entities: Entity[];
  sources: SourceRecord[];
  events: EntityEvent[];
  rules: RuleSet;
}): string[] {
  const errs: string[] = [];
  const entityIds = new Set<string>();
  const sourceIds = new Set<string>();
  const eventIds = new Set<string>();

  for (const e of d.entities) {
    if (entityIds.has(e.id)) errs.push(`duplicate entity id ${e.id}`);
    entityIds.add(e.id);
  }
  for (const s of d.sources) {
    if (sourceIds.has(s.id)) errs.push(`duplicate source id ${s.id}`);
    sourceIds.add(s.id);
    if (!entityIds.has(s.entityId)) errs.push(`source ${s.id} references unknown entity ${s.entityId}`);
    if (!/^https?:\/\//.test(s.sourceUrl)) errs.push(`source ${s.id} has no usable sourceUrl`);
    if (!s.retrievedAt) errs.push(`source ${s.id} has no retrievedAt`);
  }
  for (const ev of d.events) {
    if (eventIds.has(ev.id)) errs.push(`duplicate event id ${ev.id}`);
    eventIds.add(ev.id);
    if (!entityIds.has(ev.entityId)) errs.push(`event ${ev.id} references unknown entity ${ev.entityId}`);
    if (!sourceIds.has(ev.sourceRecordId)) errs.push(`event ${ev.id} references unknown source ${ev.sourceRecordId}`);
    if (!ev.originalEventType) errs.push(`event ${ev.id} lacks originalEventType`);
  }
  for (const e of d.entities) {
    if (e.sourceRecordIds.length === 0) errs.push(`entity ${e.id} has no traceable source`);
    for (const id of e.sourceRecordIds) if (!sourceIds.has(id)) errs.push(`entity ${e.id} lists unknown source ${id}`);
    for (const id of e.eventIds) if (!eventIds.has(id)) errs.push(`entity ${e.id} lists unknown event ${id}`);
    for (const id of e.affiliationIds) if (!entityIds.has(id)) errs.push(`entity ${e.id} lists unknown affiliation ${id}`);
  }
  const ruleIds = new Set<string>();
  for (const r of d.rules.rules) {
    if (ruleIds.has(r.id)) errs.push(`duplicate rule ${r.id}`);
    ruleIds.add(r.id);
    if (!r.limitation || !r.rationale || !r.missingMessage) errs.push(`rule ${r.id} lacks rationale/limitation/missingMessage`);
  }
  return errs;
}
