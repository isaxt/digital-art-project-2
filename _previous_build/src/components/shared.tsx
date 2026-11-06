import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import type { EntityEvent, VerificationStatus } from "../types/entity";
import type { SourceRecord } from "../types/source";
import { COMPLETENESS_LABEL, EVENT_LABEL, STATUS_LABEL, type Completeness } from "../services/registryService";

export function Panel({ title, kind = "src", right, children }: { title: string; kind?: "src" | "office"; right?: ReactNode; children: ReactNode }) {
  return (
    <section className={`panel ${kind}`}>
      <header><h2>{title}</h2>{right}</header>
      <div className="body">{children}</div>
    </section>
  );
}

/** Source facts and Office interpretations are visually and semantically distinct. */
export const FactLabel = () => <span className="tag b" title="Information from a cited public source">Source fact</span>;
export const OfficeLabel = () => <span className="tag y" title="Authored interpretation by the fictional Office">Office interpretation</span>;

const SYMBOL: Record<VerificationStatus, string> = { verified: "✓", partially_verified: "◐", needs_review: "?" };
export const StatusBadge = ({ s }: { s: VerificationStatus }) => (
  <span className={`tag ${s === "needs_review" ? "g" : ""}`}>{SYMBOL[s]} {STATUS_LABEL[s]}</span>
);
const CSYM: Record<Completeness, string> = { complete: "■■■", partial: "■■□", thin: "■□□" };
export const CompletenessBadge = ({ c }: { c: Completeness }) => (
  <span className="mono nowrap" title="Completeness of the source record. It is not a measure of merit.">{CSYM[c]} {COMPLETENESS_LABEL[c]}</span>
);

export const Disclaimer = () => (
  <p className="callout quiet" role="note">
    <b>Speculative interpretation.</b> The Office of Cultural Futures is a fictional institution and a critical artwork. Its classifications and translations are constructed interpretations, not measures of artistic merit, commercial viability or cultural importance, and not an endorsement, valuation or investment assessment.
  </p>
);

export const LedgerStatus = ({ short }: { short?: boolean }) => (
  <span className="tag y">{short ? "LOCAL SIMULATION" : "LEDGER: LOCAL APPEND-ONLY HASH CHAIN · NOT A BLOCKCHAIN"}</span>
);

export const Crumbs = ({ trail }: { trail: [string, string?][] }) => (
  <nav className="crumbs" aria-label="Breadcrumb">
    {trail.map(([label, to], i) => (
      <span key={i}>{i > 0 && " › "}{to ? <Link to={to}>{label}</Link> : <span aria-current="page">{label}</span>}</span>
    ))}
  </nav>
);

export const Missing = ({ children }: { children: ReactNode }) => (
  <span className="muted"><i>{children}</i> <span className="tag g">unknown, not zero</span></span>
);

export function SourceRecordPanel({ sources }: { sources: SourceRecord[] }) {
  return (
    <Panel title={`Original source records (${sources.length})`} right={<FactLabel />}>
      {sources.map((s) => (
        <article key={s.id} style={{ borderBottom: "1px solid var(--gray)", paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <b>{s.sourceTitle ?? s.provider}</b> <StatusBadge s={s.verificationStatus} />
          </div>
          <dl className="kv" style={{ marginTop: 4 }}>
            <dt>Record</dt><dd className="mono">{s.id}</dd>
            <dt>Provider</dt><dd>{s.provider}</dd>
            <dt>Link</dt><dd><a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">{s.sourceUrl}<span className="tiny"> (opens external site)</span></a></dd>
            <dt>Retrieved</dt><dd className="mono">{s.retrievedAt ?? <Missing>not retrieved by the Office</Missing>}{s.retrievalMethod ? ` · ${s.retrievalMethod}` : ""}</dd>
            {s.providerRecordId && (<><dt>Provider ID</dt><dd className="mono">{s.providerRecordId}</dd></>)}
            {s.sourceExcerpt && (<><dt>Excerpt</dt><dd>“{s.sourceExcerpt}”</dd></>)}
            {s.researcherNote && (<><dt>Researcher note</dt><dd>{s.researcherNote} <span className="tag g">paraphrase</span></dd></>)}
            {Object.keys(s.normalizedFields).length > 0 && (<><dt>Fields used</dt><dd className="mono">{Object.entries(s.normalizedFields).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join("  ")}</dd></>)}
            {s.reuseNotes && (<><dt>Reuse</dt><dd className="tiny">{s.reuseNotes}</dd></>)}
          </dl>
        </article>
      ))}
    </Panel>
  );
}

export function EntityTimeline({ events }: { events: EntityEvent[] }) {
  if (!events.length) return <p><Missing>No event records included in this dataset.</Missing></p>;
  return (
    <div className="scroll">
      <table className="t">
        <thead><tr><th>Date</th><th>Event</th><th>Original category</th><th>Normalized</th><th>Source</th></tr></thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <td className="mono nowrap">{e.date ?? "—"}</td>
              <td>{e.title}{e.description && <div className="tiny">{e.description}</div>}</td>
              <td>{e.originalEventType}</td>
              <td><span className="tag">{EVENT_LABEL[e.eventType]}</span></td>
              <td className="mono">{e.sourceRecordId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
