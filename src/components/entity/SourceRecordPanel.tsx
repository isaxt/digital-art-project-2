import type { SourceRecord } from "../../types/source";
import { OriginTag, Panel, VerificationBadge } from "../shared";
import { fmtDate } from "../../utils/dates";

export function SourceRecordPanel({ source }: { source: SourceRecord }) {
  return (
    <Panel id={`src-${source.id}`} title={`${source.id} · ${source.provider}`} kind="source">
      <p><OriginTag kind="source" /> <VerificationBadge status={source.verificationStatus} /></p>
      {source.sourceTitle && <p><b>{source.sourceTitle}</b></p>}
      {source.sourceExcerpt && <blockquote className="serif" style={{ margin: "0 0 6px", borderLeft: "3px solid #858d99", paddingLeft: 8 }}>{source.sourceExcerpt}</blockquote>}
      <dl className="small" style={{ margin: 0, display: "grid", gridTemplateColumns: "130px 1fr", gap: "2px 8px" }}>
        <dt className="mono">Source link</dt>
        <dd style={{ margin: 0, wordBreak: "break-all" }}><a href={source.sourceUrl} target="_blank" rel="noopener noreferrer">{source.sourceUrl}<span className="sr-only"> (opens in a new tab)</span></a></dd>
        {source.providerRecordId && (<><dt className="mono">Provider record ID</dt><dd style={{ margin: 0 }} className="mono">{source.providerRecordId}</dd></>)}
        <dt className="mono">Retrieved</dt><dd style={{ margin: 0 }} className="mono">{fmtDate(source.retrievedAt)}</dd>
        {source.publishedAt && (<><dt className="mono">Published</dt><dd style={{ margin: 0 }} className="mono">{fmtDate(source.publishedAt)}</dd></>)}
        {Object.entries(source.normalizedFields).map(([k, v]) => (
          <div key={k} style={{ display: "contents" }}>
            <dt className="mono">{k}</dt>
            <dd style={{ margin: 0 }}>{String(v)}</dd>
          </div>
        ))}
        {source.reuseNotes && (<><dt className="mono">Reuse notes</dt><dd style={{ margin: 0 }}>{source.reuseNotes}</dd></>)}
        {source.reviewNote && (<><dt className="mono">Reviewer note</dt><dd style={{ margin: 0 }}>{source.reviewNote}</dd></>)}
      </dl>
    </Panel>
  );
}
