import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { LedgerEvent } from "../../types/ledger";
import { computeEventHash } from "../../services/ledgerService";
import { Panel } from "../shared";
import { fmtTimestamp } from "../../utils/dates";

export function LedgerEventDetail({ event, previous }: { event: LedgerEvent; previous?: LedgerEvent }) {
  const [recomputed, setRecomputed] = useState<string | null>(null);
  useEffect(() => {
    const { eventHash: _h, ...rest } = event;
    computeEventHash(rest).then(setRecomputed);
  }, [event]);
  const hashOk = recomputed === null ? null : recomputed === event.eventHash;
  const linkOk = (previous?.eventHash ?? null) === event.previousEventHash;

  return (
    <div className="stack">
      <Panel title={`Event ${event.id}`} kind="terminal" controls>
        <table className="term">
          <tbody>
            <tr><th scope="row">Event type</th><td>{event.eventType}</td></tr>
            <tr><th scope="row">Timestamp</th><td>{fmtTimestamp(event.timestamp)}</td></tr>
            <tr><th scope="row">Entity</th><td>{event.entityId ? <Link to={`/registry/${event.entityId}`}>{event.entityId}</Link> : "—"}</td></tr>
            <tr><th scope="row">Certificate</th><td>{event.certificateId ? <Link to={`/certificates/${event.certificateId}`}>{event.certificateId}</Link> : "—"}</td></tr>
            <tr><th scope="row">Translation record</th><td>{event.translationRecordId ?? "—"}</td></tr>
            <tr><th scope="row">Source records</th><td>{event.sourceRecordIds?.join(", ") ?? "—"}</td></tr>
            <tr><th scope="row">Source snapshot</th><td>{event.sourceSnapshotId ?? "—"}</td></tr>
            <tr><th scope="row">Rule-set version</th><td>{event.ruleSetVersion ?? "—"}</td></tr>
            <tr><th scope="row">Ledger type</th><td>{event.ledgerType} (local simulation)</td></tr>
            <tr><th scope="row">Hash algorithm</th><td>{event.hashAlgorithm} · payload v{event.payloadVersion}</td></tr>
            <tr><th scope="row">Previous event</th><td>{previous ? <Link to={`/ledger/${previous.id}`}>{previous.id}</Link> : "none (first event)"}</td></tr>
            <tr><th scope="row">Previous hash</th><td className="hash">{event.previousEventHash ?? "GENESIS"}</td></tr>
            <tr><th scope="row">Event hash</th><td className="hash">{event.eventHash}</td></tr>
            <tr><th scope="row">Recomputed hash</th><td className="hash">{recomputed ?? "computing…"}</td></tr>
            <tr><th scope="row">External anchor</th><td>{event.externalTransactionHash ?? "none (no testnet anchor created)"}</td></tr>
          </tbody>
        </table>
        <p className={`integrity ${hashOk === false || !linkOk ? "fail" : "ok"}`} role="status" style={{ marginTop: 8 }}>
          {hashOk === null ? "VERIFYING…" : `HASH ${hashOk ? "✓ MATCHES" : "✗ DOES NOT MATCH"} · LINK TO PREVIOUS EVENT ${linkOk ? "✓ OK" : "✗ BROKEN"}`}
        </p>
        <p className="small">
          A matching hash shows this event is unchanged relative to the copy of the chain you are viewing. It does not show that the underlying source claim is true, or that the Office&apos;s judgment is fair.
        </p>
      </Panel>
      <Panel title="Canonical payload" kind="terminal">
        <pre className="payload">{JSON.stringify(event.payload, null, 2)}</pre>
      </Panel>
    </div>
  );
}
