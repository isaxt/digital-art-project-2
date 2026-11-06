import { DIRECTION_LABEL } from "../../core/translate";
import type { Direction, TranslationOutput, TranslationRule } from "../../types/translation";
import { Tag } from "../shared/shared";

export function TranslationDirectionToggle({ value, onChange }: { value: Direction; onChange: (d: Direction) => void }) {
  return (
    <fieldset className="toggle">
      <legend>Translation direction</legend>
      {(Object.keys(DIRECTION_LABEL) as Direction[]).map((d) => (
        <label key={d} className={value === d ? "on" : ""}>
          <input type="radio" name="direction" checked={value === d} onChange={() => onChange(d)} /> {DIRECTION_LABEL[d]}
        </label>
      ))}
    </fieldset>
  );
}

const CONF: Record<string, string> = {
  direct_mapping: "Direct mapping", interpretive_mapping: "Interpretive mapping", insufficient_data: "Insufficient data",
};

function sourceText(v: unknown): string {
  if (v === null || v === undefined) return "No input recorded";
  if (typeof v === "string") return `“${v}”`;
  const o = v as { title?: string; date?: string | null };
  return `${o.title ?? JSON.stringify(v)}${o.date ? ` (${o.date})` : ""}`;
}

export function RuleExplanation({ rule, output }: { rule?: TranslationRule; output?: TranslationOutput }) {
  const r = rule ?? { id: output!.ruleId, version: output!.ruleVersion, description: output!.explanation, limitation: output!.limitation, rationale: "", inputFields: [] as string[] };
  return (
    <details className="rule">
      <summary>Inspect rule <span className="mono">{r.id}</span> v{r.version}</summary>
      <dl className="kv">
        <dt>Reads fields</dt><dd className="mono">{("inputFields" in r ? r.inputFields : []).join(", ") || "n/a"}</dd>
        <dt>What it does</dt><dd>{r.description}</dd>
        {"rationale" in r && r.rationale && <><dt>Why the analogy</dt><dd>{r.rationale}</dd></>}
        <dt>Limitation</dt><dd><strong>{r.limitation}</strong></dd>
      </dl>
    </details>
  );
}

export function TranslationComparison({ outputs, rules }: { outputs: TranslationOutput[]; rules: TranslationRule[] }) {
  const mapped = outputs.filter((o) => o.confidenceLabel !== "insufficient_data");
  const missing = outputs.filter((o) => o.confidenceLabel === "insufficient_data");
  const rule = (id: string) => rules.find((r) => r.id === id);
  return (
    <>
      <div className="compare">
        <div className="compare-head"><h3>Original <Tag kind="source" /></h3><h3>Translated <Tag kind="office" /></h3></div>
        {mapped.length === 0 && <p className="empty">No source facts could be mapped by the rules for this direction. This is a statement about the dataset, not about the entity.</p>}
        {mapped.map((o, i) => (
          <article className="compare-row" key={i}>
            <div className="orig"><span className="lbl">{o.sourceLabel}</span><p>{sourceText(o.sourceValue)}</p><span className="mono muted">refs: {o.sourceRefs.join(", ")}</span></div>
            <div className="trans">
              <span className="lbl">{o.translatedLabel} · <span className={`conf conf-${o.confidenceLabel}`}>{CONF[o.confidenceLabel]}</span></span>
              <p>{o.translatedValue}</p>
              <p className="limit"><strong>Limitation:</strong> {o.limitation}</p>
              <RuleExplanation rule={rule(o.ruleId)} output={o} />
            </div>
          </article>
        ))}
      </div>
      {missing.length > 0 && (
        <div className="missing" role="group" aria-label="Missing inputs">
          <h3>Missing inputs <span className="muted">(not an assessment of the entity)</span></h3>
          <ul>
            {missing.map((o) => (
              <li key={o.ruleId}><span className="mono">{o.ruleId}</span>: {o.translatedValue}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
