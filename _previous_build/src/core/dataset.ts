import type { Entity, EntityEvent } from "../types/entity";
import type { SourceRecord } from "../types/source";
import type { RuleSet } from "../types/translation";

export interface Dataset {
  entities: Entity[];
  sources: SourceRecord[];
  events: EntityEvent[];
  ruleSet: RuleSet;
}
