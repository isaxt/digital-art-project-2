import { ruleSet } from "../../services/registryService";

export function RuleExplanation({ ruleId }: { ruleId: string }) {
  const r = ruleSet.rules.find((x) => x.id === ruleId);
  if (!r) return null;
  return (
    <details className="rule">
      <summary>Inspect rule {r.id} v{r.version}</summary>
      <dl>
        <dt>Reads</dt><dd className="mono">{r.inputFields.join(", ")}</dd>
        <dt>Produces</dt><dd>{r.outputLabel}</dd>
        <dt>Does</dt><dd>{r.description}</dd>
        <dt>Rationale</dt><dd>{r.rationale}</dd>
        <dt>Limitation</dt><dd><b>{r.limitation}</b></dd>
        <dt>If input absent</dt><dd>{r.missingMessage}</dd>
        <dt>Template</dt><dd className="mono">{r.template}</dd>
      </dl>
    </details>
  );
}
