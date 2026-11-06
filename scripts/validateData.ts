import entities from "../src/data/entities.json" with { type: "json" };
import sources from "../src/data/sources.json" with { type: "json" };
import events from "../src/data/events.json" with { type: "json" };
import rules from "../src/data/rules.json" with { type: "json" };
import { validateDataset } from "../src/utils/validation";

const errs = validateDataset({
  entities: entities as never,
  sources: sources as never,
  events: events as never,
  rules: rules as never,
});

if (errs.length) {
  console.error("Dataset validation FAILED:\n - " + errs.join("\n - "));
  process.exit(1);
}
console.log(`Dataset OK: ${entities.length} entities, ${sources.length} sources, ${events.length} events, ${rules.rules.length} rules.`);
