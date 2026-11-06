import type { TranslationOutput } from "../../types/translation";
import { OriginTag } from "../shared";
import { RuleExplanation } from "./RuleExplanation";

const CONF: Record<string, string> = {
  direct_mapping: "DIRECT MAPPING",
  interpretive_mapping: "INTERPRETIVE MAPPING",
  insufficient_data: "INSUFFICIENT DATA",
};

function srcText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  const o = v as { title?: string; date?: string | null; originalEventType?: string };
  return `${o.title ?? ""}${o.date ? ` (${o.date})` : ""}`;
}

export function TranslationComparison({ outputs }: { outputs: TranslationOutput[] }) {
  return (
    <div>
      {outputs.map((o, i) => {
        const missing = o.confidenceLabel === "insufficient_data";
        return (
          <article key={`${o.ruleId}-${i}`} className={`cmp ${missing ? "missing" : ""}`} aria-label={`${o.ruleId} result`}>
            <div className="cmp__src">
              <h3>{missing ? <span className="origin" style={{ borderColor: "#858d99", color: "#4d5562" }}>No source input</span> : <OriginTag kind="source" />} Original</h3>
              {missing ? (
                <p className="muted">Input not present in selected sources: <span className="mono">{o.inputFields.join(", ")}</span></p>
              ) : (
                <>
                  <blockquote>{srcText(o.sourceValue)}</blockquote>
                  <div className="small mono">{o.sourceLabel}</div>
                  <div className="small mono">source record: {o.sourceRecordIds.join(", ")}</div>
                </>
              )}
            </div>
            <div className="cmp__rule">
              <div><b>{o.ruleId}</b></div>
              <div>v{o.ruleVersion}</div>
              <div style={{ marginTop: 6 }}><span className={`badge ${missing ? "gray" : "yellow"}`}>{CONF[o.confidenceLabel]}</span></div>
            </div>
            <div className="cmp__out">
              <h3>{missing ? <span className="origin" style={{ borderColor: "#858d99", color: "#4d5562" }}>Nothing translated</span> : <OriginTag kind="office" />} {o.translatedLabel}</h3>
              <p>{o.translatedValue}</p>
              {!missing && <p className="small"><b>Limitation:</b> {o.limitation}</p>}
              <RuleExplanation ruleId={o.ruleId} />
            </div>
          </article>
        );
      })}
    </div>
  );
}
