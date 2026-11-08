import type { EntityEvent } from "../../types/entity";

export function EntityTimeline({ events }: { events: EntityEvent[] }) {
  if (events.length === 0) return <p className="muted">No events included in this dataset. This is not a statement that none exist.</p>;
  const sorted = [...events].sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"));
  return (
    <ol className="timeline">
      {sorted.map((e) => (
        <li key={e.id}>
          <div className="when">{e.date ?? "start date not recorded"}{e.endDate ? ` → ${e.endDate}` : ""} · {e.id}</div>
          <div><b>{e.title}</b></div>
          {e.description && <div className="small muted">{e.description}</div>}
          {e.venue && <div className="small">Venue: {e.venue}</div>}
          {e.participants && <div className="small">Listed participants: {e.participants.join(", ")}</div>}
          <div className="small">
            Source category: <span className="badge">{e.originalEventType}</span> → Office category: <span className="badge blue">{e.eventType}</span>{" "}
            <a href="#!" onClick={(ev) => { ev.preventDefault(); document.getElementById(`src-${e.sourceRecordId}`)?.scrollIntoView(); }}>{e.sourceRecordId}</a>
          </div>
        </li>
      ))}
    </ol>
  );
}
