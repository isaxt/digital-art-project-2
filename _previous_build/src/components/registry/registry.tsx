import { Link } from "react-router-dom";
import { completenessOf, eventsFor } from "../../services/registryService";
import type { Entity, EntityType } from "../../types/entity";
import { TYPE_LABEL } from "../../utils/format";
import { StatusBadge, Tag } from "../shared/shared";

interface SearchProps {
  q: string; type: string; sort: string;
  onChange: (next: { q?: string; type?: string; sort?: string }) => void;
}
const TYPES: (EntityType | "all")[] = ["all", "artist", "startup", "institution", "project", "other"];

export function RegistrySearch({ q, type, sort, onChange }: SearchProps) {
  return (
    <form className="filters" role="search" aria-label="Search the Registry" onSubmit={(e) => e.preventDefault()}>
      <label>Name or record ID
        <input type="search" value={q} onChange={(e) => onChange({ q: e.target.value })} placeholder="e.g. Marshall, OCF-E-0005" />
      </label>
      <label>Entity type
        <select value={type} onChange={(e) => onChange({ type: e.target.value })}>
          {TYPES.map((t) => <option key={t} value={t}>{t === "all" ? "All types" : TYPE_LABEL[t]}</option>)}
        </select>
      </label>
      <label>Sort by
        <select value={sort} onChange={(e) => onChange({ sort: e.target.value })}>
          <option value="name">Name</option>
          <option value="created">Record date</option>
          <option value="updated">Recently updated</option>
        </select>
      </label>
    </form>
  );
}

export function CompletenessMark({ entity }: { entity: Entity }) {
  const c = completenessOf(entity);
  const text = { complete: "Complete source record", partial: "Partial source record", minimal: "Missing fields" }[c.level];
  return <span title={c.missing.length ? "Not recorded: " + c.missing.join(", ") : "All tracked fields present"}>{text}{c.missing.length > 0 && <small className="mono"> (no {c.missing.join(", ")})</small>}</span>;
}

export function EntityList({ entities, selected }: { entities: Entity[]; selected?: string }) {
  return (
    <div className="table-wrap">
      <table className="data">
        <caption className="sr-only">Registry records</caption>
        <thead>
          <tr><th scope="col">Record ID</th><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Source record</th><th scope="col">Verification</th><th scope="col" className="num">Events</th></tr>
        </thead>
        <tbody>
          {entities.map((e) => (
            <tr key={e.id} className={e.id === selected ? "selected" : ""}>
              <td className="mono">{e.id}</td>
              <td><Link to={`/registry/${e.id}`}>{e.displayName}</Link>{e.isFixture && <> <Tag kind="fixture" /></>}</td>
              <td>{TYPE_LABEL[e.entityType]}</td>
              <td><CompletenessMark entity={e} /></td>
              <td><StatusBadge status={e.verificationStatus} /></td>
              <td className="num mono">{eventsFor(e.id).length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EntitySummary({ entity }: { entity: Entity }) {
  return (
    <li className="summary">
      <Link to={`/registry/${entity.id}`}><strong>{entity.displayName}</strong></Link>
      <span className="mono"> {entity.id} · {TYPE_LABEL[entity.entityType]}</span>
      {entity.isFixture && <> <Tag kind="fixture" /></>}
      {entity.description && <p>{entity.description}</p>}
    </li>
  );
}
