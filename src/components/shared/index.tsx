import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CONFIG } from "../../config";
import type { Entity } from "../../types/entity";
import { coverageOf, VERIFICATION_LABEL } from "../../services/registryService";

export function Panel({
  title,
  kind,
  children,
  controls,
  id,
}: {
  title: string;
  kind?: "source" | "office" | "terminal";
  children: ReactNode;
  controls?: boolean;
  id?: string;
}) {
  return (
    <section className={`panel ${kind ?? ""}`} aria-labelledby={id ? `${id}-t` : undefined} id={id}>
      <div className="panel__title">
        <span id={id ? `${id}-t` : undefined}>{title}</span>
        {controls && <span className="ctl" aria-hidden="true">▫▫▪</span>}
      </div>
      <div className="panel__body">{children}</div>
    </section>
  );
}

export function OriginTag({ kind }: { kind: "source" | "office" }) {
  return kind === "source" ? (
    <span className="origin source" title="A fact taken from a cited source">Source fact</span>
  ) : (
    <span className="origin office" title="An authored interpretation by the Office, not a fact">Office interpretation</span>
  );
}

export function VerificationBadge({ status }: { status: Entity["verificationStatus"] }) {
  const cls = status === "verified" ? "green" : status === "partially_verified" ? "orange" : "red";
  return <span className={`badge ${cls}`}>{VERIFICATION_LABEL[status]}</span>;
}

export function Coverage({ entity }: { entity: Entity }) {
  const c = coverageOf(entity);
  const known = c.filter((x) => x.known).length;
  return (
    <span className="cov" role="img" aria-label={`${known} of ${c.length} fields recorded. Not recorded: ${c.filter((x) => !x.known).map((x) => x.label).join(", ") || "none"}`} title={c.map((x) => `${x.known ? "■" : "□"} ${x.label}`).join("\n")}>
      {c.map((x) => (
        <i key={x.key} className={x.known ? "" : "no"} />
      ))}
    </span>
  );
}

export function Disclaimer({ compact }: { compact?: boolean }) {
  return (
    <p className="disclaimer" role="note">
      <b>ARTWORK NOTICE · </b>
      {compact ? "Office classifications are speculative interpretations, not endorsements, valuations or measures of merit." : CONFIG.disclaimer}
    </p>
  );
}

export function ShortHash({ value }: { value: string | null }) {
  if (!value) return <span className="mono">GENESIS</span>;
  return (
    <span className="hash" title={value}>
      {value.slice(0, 12)}
      <span className="dim">…{value.slice(-6)}</span>
    </span>
  );
}

export function EntityLink({ id, name }: { id: string; name: string }) {
  return <Link to={`/registry/${id}`}>{name}</Link>;
}

export function Emblem({ size = 38 }: { size?: number }) {
  // Placeholder institutional mark (geometric). Final emblem to be supplied by the identity work.
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="hdr__emblem">
      <rect x="1" y="1" width="38" height="38" fill="#071b69" stroke="#f7ef35" strokeWidth="2" />
      <circle cx="20" cy="20" r="11" fill="none" stroke="#fff" strokeWidth="2" />
      <path d="M20 9v22M9 20h22" stroke="#f7ef35" strokeWidth="2" />
      <rect x="16" y="16" width="8" height="8" fill="#f7ef35" />
    </svg>
  );
}
