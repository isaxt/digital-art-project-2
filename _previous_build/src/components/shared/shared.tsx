import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { VerificationStatus } from "../../types/entity";
import { VERIFICATION_LABEL } from "../../utils/format";

/** Spec 9.2 Disclaimer: separates artwork interpretation from factual data. */
export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <p className={"disclaimer" + (compact ? " compact" : "")} role="note">
      <strong>Artwork notice.</strong> The Office of Cultural Futures is a fictional institution. Its classifications and translations
      are speculative interpretations made by explicit, inspectable rules. They are not measures of artistic merit,
      commercial viability or cultural importance, and not an endorsement, valuation or investment assessment.
      {!compact && <> <Link to="/methods">Read the methods</Link>.</>}
    </p>
  );
}

/** Visual + textual label so the fact/interpretation line never depends on colour alone. */
export function Tag({ kind }: { kind: "source" | "office" | "fixture" }) {
  const text = { source: "SOURCE FACT", office: "OFFICE INTERPRETATION", fixture: "FICTIONAL FIXTURE" }[kind];
  return <span className={`tag tag-${kind}`}>{text}</span>;
}

export function StatusBadge({ status }: { status: VerificationStatus }) {
  const mark = { verified: "■", partially_verified: "◩", needs_review: "□" }[status];
  return <span className={`badge badge-${status}`}><span aria-hidden="true">{mark} </span>{VERIFICATION_LABEL[status]}</span>;
}

export function Panel({ title, tag, children, id, className = "" }: { title: string; tag?: ReactNode; children: ReactNode; id?: string; className?: string }) {
  return (
    <section className={"panel " + className} aria-labelledby={id ? id + "-h" : undefined}>
      <header className="panel-title"><h2 id={id ? id + "-h" : undefined}>{title}</h2>{tag}</header>
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) { return <p className="empty">{children}</p>; }

export function Mono({ children, title }: { children: ReactNode; title?: string }) { return <span className="mono" title={title}>{children}</span>; }

export function Crumbs({ trail }: { trail: { to?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      {trail.map((t, i) => (
        <span key={i}>{i > 0 && " › "}{t.to ? <Link to={t.to}>{t.label}</Link> : <span aria-current="page">{t.label}</span>}</span>
      ))}
    </nav>
  );
}
