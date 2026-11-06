import { readFileSync } from "node:fs";
import type { Dataset } from "../src/core/dataset";

const read = (f: string) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), "utf8"));
export function loadDataset(): Dataset {
  return { entities: read("entities.json"), sources: read("sources.json"), events: read("events.json"), ruleSet: read("rules.json") };
}
