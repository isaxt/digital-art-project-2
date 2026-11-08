import { Link } from "react-router-dom";
import type { Entity } from "../../types/entity";
import { completeness, eventsOf, sourcesOf, TYPE_LABEL } from "../../services/registryService";
import { Coverage, VerificationBadge } from "../shared";
import { fmtDate } from "../../utils/dates";

export function EntityList({ items, caption }: { items: Entity[]; caption?: string }) {
  if (items.length === 0)
    return (
      <p className="panel" style={{ padding: 10 }} role="status">
        No records match these filters. Nothing is implied about entities outside the supplied datasets.
      </p>
    );
  return (
    <div className="scroll-x">
      <table className="data">
        <caption>{caption ?? `${items.length} record(s)`}</caption>
        <thead>
          <tr>
            <th scope="col">Record ID</th>
            <th scope="col">Name</th>
            <th scope="col">Type</th>
            <th scope="col">City</th>
            <th scope="col">Fields recorded</th>
            <th scope="col">Source record</th>
            <th scope="col">Verification</th>
            <th scope="col" className="num">Src</th>
            <th scope="col" className="num">Evt</th>
            <th scope="col">Dataset date</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => (
            <tr key={e.id}>
              <td className="id">{e.id}</td>
              <td><Link to={`/registry/${e.id}`}><b>{e.displayName}</b></Link></td>
              <td>{TYPE_LABEL[e.entityType]}</td>
              <td>{e.location?.city ?? <span className="muted">n/a</span>}</td>
              <td><Coverage entity={e} /></td>
              <td><span className="badge gray">{completeness(e)}</span></td>
              <td><VerificationBadge status={e.verificationStatus} /></td>
              <td className="num">{sourcesOf(e).length}</td>
              <td className="num">{eventsOf(e).length}</td>
              <td className="mono">{fmtDate(e.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
