import type { EntityEvent } from "../../types/entity";
import type { SourceRecord } from "../../types/source";
import { ACQUISITION_LABEL, fmtDate } from "../../utils/format";
import { StatusBadge } from "../shared/shared";

export function SourceRecordPanel({ sources }: { sources: SourceRecord[] }) {
  return (
    <ul className="sources">
      {sources.map((s) => (
        <li key={s.id}>
          <div><strong>{s.sourceTitle ?? s.provider}</strong> <span className="mono">{s.id}</span> <StatusBadge status={s.verificationStatus} /></div>
          <dl className="kv">
            <dt>Provider</dt><dd>{s.provider}</dd>
            <dt>Source link</dt>
            <dd>{/^https:\/\/example\.invalid/.test(s.sourceUrl) ? <span>none (fictional fixture)</span>
              : <a href={s.sourceUrl} target="_blank" rel="noreferrer noopener">{s.sourceUrl} <span className="sr-only">(opens in a new tab)</span></a>}</dd>
            {s.providerRecordId && <><dt>Provider record ID</dt><dd className="mono">{s.providerRecordId}</dd></>}
            <dt>Record date</dt><dd className="mono">{s.retrievedAt}</dd>
            <dt>Acquisition</dt><dd>{ACQUISITION_LABEL[s.acquisition]}</dd>
            {Object.entries(s.normalizedFields).map(([k, v]) => (
              <span key={k} className="kvrow"><dt>Field “{k}”</dt><dd>{String(v)}</dd></span>
            ))}
            {s.reuseNotes && <><dt>Reuse notes</dt><dd>{s.reuseNotes}</dd></>}
          </dl>
        </li>
      ))}
    </ul>
  );
}

export function EntityTimeline({ events }: { events: EntityEvent[] }) {
  return (
    <table className="data">
      <caption className="sr-only">Event timeline</caption>
      <thead><tr><th scope="col">Date</th><th scope="col">Event</th><th scope="col">Original category (source)</th><th scope="col">Office category</th></tr></thead>
      <tbody>
        {events.map((e) => (
          <tr key={e.id}>
            <td className="mono">{fmtDate(e.date)}</td>
            <td>{e.title}<div className="mono muted">{e.id} ← {e.sourceRecordId}</div></td>
            <td>{e.originalEventType}</td>
            <td className="mono">{e.eventType}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
