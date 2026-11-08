import { Link } from "react-router-dom";
import { useRecords } from "../store/localRecords";
import { recordStatus } from "../services/ledgerService";
import { Disclaimer } from "../components/shared";
import { fmtTimestamp } from "../utils/dates";
import { confirmations, isBuried, isFinalized, witnessesOf } from "../services/chainService";

export default function CertificatesPage() {
  const { certificates, ledger } = useRecords();
  const rows = [...certificates].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  return (
    <main className="main stack">
      <div className="pagehead"><h1>Certificates</h1><span className="id">{rows.length} ISSUED</span></div>
      <p className="small">Each certificate is reproducible from its stored data and linked to a translation record and a ledger event. Classifications describe how much of a record the Office&apos;s rules could read. They are not scores.</p>
      <div className="scroll-x">
        <table className="data">
          <caption>Issued certificates, newest first</caption>
          <thead><tr><th>Certificate</th><th>Entity</th><th>Direction</th><th>Classification</th><th>Issued (UTC)</th><th>Status</th><th>Confirmations</th><th>Witnesses</th><th>Ledger</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="id"><Link to={`/certificates/${c.id}`}>{c.id}</Link></td>
                <td>{c.entityName} <span className="mono small">{c.entityId}</span></td>
                <td>{c.direction}</td>
                <td><span className="badge yellow">{c.classificationCode}</span> {c.classification}</td>
                <td className="mono nowrap">{fmtTimestamp(c.issuedAt)}</td>
                <td><span className="badge gray">{recordStatus(ledger, c.id)}</span> <span className="badge">simulated</span></td>
                {(() => {
                  const i = ledger.findIndex((e) => e.id === c.ledgerEventId);
                  const n = i >= 0 ? confirmations(ledger.length, i) : 0;
                  const w = witnessesOf(ledger, c.id).length;
                  return (<><td className="mono nowrap">{n} {isBuried(n) ? "· buried" : "· shallow"}</td><td className="mono nowrap">{w}{isFinalized(w) ? " · FINAL" : ""}</td></>);
                })()}
                <td className="id">{c.ledgerEventId ? <Link to={`/ledger/${c.ledgerEventId}`}>{c.ledgerEventId}</Link> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small">To issue a new certificate, open a record in the <Link to="/translate">Translation Engine</Link>.</p>
      <Disclaimer />
    </main>
  );
}
