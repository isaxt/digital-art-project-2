import { Link } from "react-router-dom";
import type { LedgerEvent, VerificationResult } from "../../types/ledger";
import { fmtTimestamp } from "../../utils/dates";
import { ShortHash } from "../shared";

export function LedgerTimeline({ events, verification, limit }: { events: LedgerEvent[]; verification?: VerificationResult | null; limit?: number }) {
  const rows = limit ? events.slice(-limit).reverse() : [...events].reverse();
  const bad = new Map(verification?.perEvent.map((p) => [p.id, !(p.hashOk && p.linkOk)]) ?? []);
  return (
    <div className="scroll-x">
      <table className="term">
        <caption className="sr-only">Ledger events, newest first</caption>
        <thead>
          <tr>
            <th scope="col">Event</th><th scope="col">Type</th><th scope="col">Entity</th><th scope="col">Certificate</th>
            <th scope="col">Timestamp (UTC)</th><th scope="col">Snapshot</th><th scope="col">Rules</th>
            <th scope="col">Previous hash</th><th scope="col">Event hash</th><th scope="col">Check</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id} className={bad.get(e.id) ? "bad" : ""}>
              <td><Link to={`/ledger/${e.id}`}>{e.id}</Link></td>
              <td>{e.eventType}</td>
              <td>{e.entityId ? <Link to={`/registry/${e.entityId}`}>{e.entityId}</Link> : "—"}</td>
              <td>{e.certificateId ? <Link to={`/certificates/${e.certificateId}`}>{e.certificateId}</Link> : "—"}</td>
              <td className="nowrap">{fmtTimestamp(e.timestamp)}</td>
              <td>{e.sourceSnapshotId ?? "—"}</td>
              <td>{e.ruleSetVersion ?? "—"}</td>
              <td><ShortHash value={e.previousEventHash} /></td>
              <td><ShortHash value={e.eventHash} /></td>
              <td>{verification ? (bad.get(e.id) ? "✗ FAIL" : "✓ OK") : "…"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
