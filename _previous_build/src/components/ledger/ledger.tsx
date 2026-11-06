import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { computeEventHash, statusOf } from "../../core/ledger";
import type { LedgerEvent } from "../../types/ledger";
import { fmtTime, short } from "../../utils/format";

export function LedgerTimeline({ events, chain }: { events: LedgerEvent[]; chain: LedgerEvent[] }) {
  return (
    <div className="table-wrap">
      <table className="data term">
        <caption className="sr-only">Ledger events</caption>
        <thead>
          <tr><th scope="col">Event</th><th scope="col">Type</th><th scope="col">Entity</th><th scope="col">Certificate</th><th scope="col">Timestamp (UTC)</th><th scope="col">Rules</th><th scope="col">Prev hash</th><th scope="col">Hash</th><th scope="col">Status</th></tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <td><Link to={`/ledger/${e.id}`} className="mono">{e.id}</Link></td>
              <td className="mono">{e.eventType}</td>
              <td className="mono">{e.entityId ? <Link to={`/registry/${e.entityId}`}>{e.entityId}</Link> : "—"}</td>
              <td className="mono">{e.certificateId ? <Link to={`/certificates/${e.certificateId}`}>{e.certificateId}</Link> : "—"}</td>
              <td className="mono">{fmtTime(e.timestamp)}</td>
              <td className="mono">{e.ruleSetVersion ?? "—"}</td>
              <td className="mono hash">{short(e.previousEventHash, 8)}</td>
              <td className="mono hash">{short(e.eventHash, 8)}</td>
              <td className="mono">{statusOf(e, chain)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LedgerEventDetail({ event }: { event: LedgerEvent }) {
  const [recomputed, setRecomputed] = useState<string | null>(null);
  useEffect(() => {
    const { eventHash: _h, ...rest } = event; void _h;
    computeEventHash(rest).then(setRecomputed);
  }, [event]);
  const match = recomputed === null ? null : recomputed === event.eventHash;
  return (
    <dl className="kv term-kv mono">
      <dt>Event ID</dt><dd>{event.id}</dd>
      <dt>Event type</dt><dd>{event.eventType}</dd>
      <dt>Ledger type</dt><dd>{event.ledgerType} (not a blockchain)</dd>
      <dt>Timestamp</dt><dd>{event.timestamp}</dd>
      {event.entityId && <><dt>Entity</dt><dd><Link to={`/registry/${event.entityId}`}>{event.entityId}</Link></dd></>}
      {event.certificateId && <><dt>Certificate</dt><dd><Link to={`/certificates/${event.certificateId}`}>{event.certificateId}</Link></dd></>}
      {event.translationRecordId && <><dt>Translation record</dt><dd>{event.translationRecordId}</dd></>}
      {event.snapshotId && <><dt>Source snapshot</dt><dd>{event.snapshotId}</dd></>}
      {event.sourceRecordIds && <><dt>Source records</dt><dd>{event.sourceRecordIds.join(", ")}</dd></>}
      {event.ruleSetVersion && <><dt>Rule-set version</dt><dd>{event.ruleSetVersion}</dd></>}
      <dt>Hash algorithm</dt><dd>{event.hashAlgorithm} · payload v{event.payloadVersion}</dd>
      <dt>Previous event hash</dt><dd className="hashfull">{event.previousEventHash ?? "null (first event)"}</dd>
      <dt>Event hash</dt><dd className="hashfull">{event.eventHash}</dd>
      <dt>Recomputed hash</dt>
      <dd className="hashfull">{recomputed ?? "computing…"}{" "}
        {match !== null && <strong className={match ? "ok" : "warn"}>{match ? "✔ MATCH" : "✘ MISMATCH (integrity warning)"}</strong>}</dd>
    </dl>
  );
}
