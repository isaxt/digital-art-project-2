import type { Dataset } from "../core/dataset";
import type { Entity, EntityEvent } from "../types/entity";
import type { SourceRecord } from "../types/source";
import type { RuleSet } from "../types/translation";
import type { StoreShape } from "../types/ledger";
import entities from "./entities.json";
import events from "./events.json";
import rules from "./rules.json";
import sources from "./sources.json";
import seed from "./store.seed.json";

export const dataset: Dataset = {
  entities: entities as unknown as Entity[],
  sources: sources as unknown as SourceRecord[],
  events: events as unknown as EntityEvent[],
  ruleSet: rules as unknown as RuleSet,
};
export const seedStore = seed as unknown as StoreShape;
