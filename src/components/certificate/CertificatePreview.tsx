import { Link } from "react-router-dom";
import { CONFIG } from "../../config";
import type { Certificate } from "../../types/certificate";
import { fmtTimestamp } from "../../utils/dates";

export function CertificatePreview({ cert, status }: { cert: Certificate; status?: string }) {
  return (
    <article className="cert" aria-label={`Certificate ${cert.id}`}>
      <svg className="cert__seal" viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r="37" fill="none" stroke="#102eab" strokeWidth="3" />
        <circle cx="40" cy="40" r="29" fill="none" stroke="#102eab" strokeWidth="1" strokeDasharray="3 3" />
        <rect x="30" y="30" width="20" height="20" fill="#f7ef35" stroke="#17191d" />
        <path d="M40 8v64M8 40h64" stroke="#102eab" strokeWidth="1" />
      </svg>
      <div className="mono muted">{CONFIG.institutionName.toUpperCase()}</div>
      <h1>Certificate of Anticipated Potential</h1>
      <div className="small muted">Interpretive assessment issued under Rule Set {cert.ruleSetVersion}. Not an endorsement, valuation or investment assessment.</div>
      <div className="class">{cert.classificationCode} · {cert.classification}</div>
      {status && status !== "current" && (<p><span className="stamp">Record {status}</span></p>)}
      <dl>
        <dt>Certificate ID</dt><dd className="mono">{cert.id}</dd>
        <dt>Entity</dt><dd><Link to={`/registry/${cert.entityId}`}>{cert.entityName}</Link> <span className="mono">({cert.entityId} · {cert.entityType})</span></dd>
        <dt>Issued</dt><dd className="mono">{fmtTimestamp(cert.issuedAt)}</dd>
        <dt>Translation</dt><dd>{cert.direction} · <span className="mono">{cert.translationRecordId}</span></dd>
        <dt>Rules applied</dt><dd className="mono">{cert.appliedRuleIds.length ? cert.appliedRuleIds.join(", ") : "none: no rule could read this record"}</dd>
        <dt>Source snapshot</dt><dd className="mono">{cert.sourceSnapshotId}</dd>
        <dt>Rule-set version</dt><dd className="mono">{cert.ruleSetVersion}</dd>
        <dt>Ledger event</dt><dd>{cert.ledgerEventId ? <Link to={`/ledger/${cert.ledgerEventId}`} className="mono">{cert.ledgerEventId}</Link> : "—"}</dd>
        <dt>Status</dt><dd className="mono">{cert.status === "local_simulation" ? "LOCAL RECORD · SIMULATED (not on any blockchain)" : "TESTNET-ANCHORED"}</dd>
        <dt>Short rationale</dt>
        <dd>
          <ul style={{ margin: 0, paddingLeft: 16 }}>{cert.rationale.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </dd>
      </dl>
      <p className="disclaimer">{cert.disclaimer}</p>
    </article>
  );
}
