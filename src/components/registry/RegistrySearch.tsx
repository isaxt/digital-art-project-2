import { TYPE_LABEL } from "../../services/registryService";
import type { EntityType } from "../../types/entity";

export interface RegistryQuery { q: string; type: string; ver: string; sort: string }

export function RegistrySearch({ value, onChange }: { value: RegistryQuery; onChange: (v: RegistryQuery) => void }) {
  const set = (k: keyof RegistryQuery) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value });
  return (
    <form className="filters" role="search" aria-label="Filter registry" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label htmlFor="f-q">Name</label>
        <input id="f-q" type="search" value={value.q} onChange={set("q")} placeholder="search by entity name" />
      </div>
      <div>
        <label htmlFor="f-type">Entity type</label>
        <select id="f-type" value={value.type} onChange={set("type")}>
          <option value="">All types</option>
          {(Object.keys(TYPE_LABEL) as EntityType[]).map((t) => (
            <option key={t} value={t}>{TYPE_LABEL[t]}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-ver">Verification</label>
        <select id="f-ver" value={value.ver} onChange={set("ver")}>
          <option value="">Any status</option>
          <option value="verified">Verified</option>
          <option value="partially_verified">Partial</option>
          <option value="needs_review">Needs review</option>
        </select>
      </div>
      <div>
        <label htmlFor="f-sort">Sort by</label>
        <select id="f-sort" value={value.sort} onChange={set("sort")}>
          <option value="name">Name</option>
          <option value="record">Record ID</option>
          <option value="updated">Recently updated</option>
        </select>
      </div>
    </form>
  );
}
