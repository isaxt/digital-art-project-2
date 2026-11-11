import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { entities } from "../services/registryService";
import { EntityList } from "../components/registry/EntityList";
import { RegistrySearch, type RegistryQuery } from "../components/registry/RegistrySearch";
import { Disclaimer } from "../components/shared";

export default function RegistryPage() {
  const [params, setParams] = useSearchParams();
  const query: RegistryQuery = { q: params.get("q") ?? "", type: params.get("type") ?? "", ver: params.get("ver") ?? "", sort: params.get("sort") ?? "name", city: params.get("city") ?? "", acc: params.get("acc") ?? "", sector: params.get("sector") ?? "" };
  const [limit, setLimit] = useState(100);

  const items = useMemo(() => {
    const q = query.q.trim().toLowerCase();
    const list = entities.filter(
      (e) =>
        (!q || e.displayName.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || (e.alternateNames ?? []).some((n) => n.toLowerCase().includes(q))) &&
        (!query.city || e.location?.city === query.city) &&
        (!query.sector || (e.sector ?? []).includes(query.sector)) &&
        (!query.acc || (query.acc === "__none" ? e.entityType === "startup" && !e.accelerator : e.accelerator === query.acc)) &&
        (!query.type || e.entityType === query.type) &&
        (!query.ver || e.verificationStatus === query.ver),
    );
    // No universal quality score exists, so none can be a sort key.
    const sorters: Record<string, (a: (typeof list)[0], b: (typeof list)[0]) => number> = {
      name: (a, b) => a.displayName.localeCompare(b.displayName),
      record: (a, b) => a.id.localeCompare(b.id),
      updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.displayName.localeCompare(b.displayName),
    };
    return [...list].sort(sorters[query.sort] ?? sorters.name);
  }, [query.q, query.type, query.ver, query.sort, query.city, query.acc, query.sector]);

  const update = (v: RegistryQuery) => {
    const next = new URLSearchParams();
    for (const [k, val] of Object.entries(v)) if (val && !(k === "sort" && val === "name")) next.set(k, val);
    setLimit(100);
    setParams(next, { replace: true });
  };

  return (
    <>
      <main className="main stack">
        <div className="pagehead"><h1>Registry</h1><span className="id">{entities.length} RECORDS</span></div>
        <p className="small">
          Galleries and art spaces, artists named in their listings, and startups, all imported unchanged from two supplied datasets, with each record&apos;s source links and review status shown.
          Sorted by name by default. The Office keeps no universal quality score and does not rank its records.
        </p>
        <RegistrySearch value={query} onChange={update} />
        {(query.q || query.type || query.ver || query.city || query.acc || query.sector) && (
          <div className="chips" aria-label="Active filters">
            {query.q && <span className="chip">name: {query.q}</span>}
            {query.type && <span className="chip">type: {query.type}</span>}
            {query.ver && <span className="chip">status: {query.ver}</span>}
            {query.city && <span className="chip">city: {query.city}</span>}
            {query.sector && <span className="chip">sector: {query.sector}</span>}
            {query.acc && <span className="chip">accelerator: {query.acc === "__none" ? "none recorded" : query.acc}</span>}
          </div>
        )}
        <EntityList items={items.slice(0, limit)} caption={`Showing ${Math.min(limit, items.length)} of ${items.length} matching records (${entities.length} in the registry)`} />
        {items.length > limit && <p><button type="button" onClick={() => setLimit(limit + 100)}>Show 100 more</button></p>}
        <p className="legend">
          FIELDS RECORDED: <span className="cov"><i /></span> recorded in the supplied dataset · <span className="cov"><i className="no" /></span> not recorded.
          A hatched square means <b>unknown</b>, not zero and not a negative finding.
        </p>
        <Disclaimer compact />
      </main>
      <aside className="aside" aria-label="Dataset notes">
        <h2>Dataset</h2>
        <dl>
          <dt>Records</dt><dd className="mono">{entities.length}</dd>
          <dt>Galleries</dt><dd className="mono">{entities.filter((e) => e.entityType === "gallery").length}</dd>
          <dt>Startups</dt><dd className="mono">{entities.filter((e) => e.entityType === "startup").length}</dd>
          <dt>Artists</dt><dd className="mono">{entities.filter((e) => e.entityType === "artist").length}</dd>
          <dt>Origin</dt><dd>Two source-linked datasets. No records are added by the Office. See Methodology &amp; Terms.</dd>
        </dl>
        <h2>Reading the table</h2>
        <p className="small">“Source record” describes how complete the entity&apos;s fields are for the Office&apos;s rules, not how important the entity is.</p>
      </aside>
    </>
  );
}
