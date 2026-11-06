import { Link } from "react-router-dom";
import { DIRECTION_LABEL } from "../../core/translate";
import type { Certificate } from "../../types/certificate";
import { fmtTime, TYPE_LABEL } from "../../utils/format";

export function CertificatePreview({ cert }: { cert: Certificate }) {
  return (
    <article className="certificate" aria-label={`Certificate ${cert.id}`}>
      <div className="cert-border">
        <p className="cert-inst">Office of Cultural Futures</p>
        <h2 className="cert-title">Certificate of Recorded Interpretation</h2>
        <p className="cert-stamp mono">{cert.status === "local_simulation" ? "SIMULATED · LOCAL RECORD" : "TESTNET ANCHORED"}</p>
        <dl className="cert-grid">
          <dt>Certificate ID</dt><dd className="mono">{cert.id}</dd>
          <dt>Entity</dt><dd><Link to={`/registry/${cert.entityId}`}>{cert.entityName}</Link> <span className="mono">{cert.entityId}</span></dd>
          <dt>Entity type</dt><dd>{TYPE_LABEL[cert.entityType]}</dd>
          <dt>Issued</dt><dd className="mono">{fmtTime(cert.issuedAt)}</dd>
          <dt>Direction</dt><dd>{DIRECTION_LABEL[cert.direction]}</dd>
          <dt>Rules applied</dt><dd className="mono">{cert.appliedRuleIds.join(", ") || "none"}</dd>
          <dt>Rule-set version</dt><dd className="mono">{cert.ruleSetVersion}</dd>
          <dt>Source snapshot</dt><dd className="mono">{cert.sourceSnapshotId}</dd>
          <dt>Translation record</dt><dd className="mono">{cert.translationRecordId}</dd>
          <dt>Ledger event</dt><dd>{cert.ledgerEventId ? <Link className="mono" to={`/ledger/${cert.ledgerEventId}`}>{cert.ledgerEventId}</Link> : "none"}</dd>
        </dl>
        <p className="cert-class-label">Office classification <span className="tag tag-office">OFFICE INTERPRETATION</span></p>
        <p className="cert-class">{cert.classification}</p>
        <ul className="cert-rationale">{cert.rationale.map((r, i) => <li key={i}>{r}</li>)}</ul>
        <p className="cert-disclaimer">{cert.disclaimer}</p>
      </div>
    </article>
  );
}
