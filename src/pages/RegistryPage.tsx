import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { entities } from "../services/registryService";
import { EntityList } from "../components/registry/EntityList";
import { RegistrySearch, type RegistryQuery } from "../components/registry/RegistrySearch";
import { Disclaimer } from "../components/shared";

export default function RegistryPage() {
  const [params, setParams] = useSearchParams();
  const query: RegistryQuery = { q: params.get("q") ?? "", type: params.get("type") ?? "", ver: params.get("ver") ?? "", sort: params.get("sort") ?? "name" };

  const items = useMemo(() => {
    const q = query.q.trim().toLowerCase();
    const list = entities.filter(
      (e) =>
        (!q || e.displayName.toLowerCase().includes(q) || (e.alternateNames ?? []).some((n) => n.toLowerCase().includes(q))) &&
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
  }, [query.q, query.type, query.ver, query.sort]);

  const update = (v: RegistryQuery) => {
    const next = new URLSearchParams();
    for (const [k, val] of Object.entries(v)) if (val && !(k === "sort" && val === "name")) next.set(k, val);
    setParams(next, { replace: true });
  };

  return (
    <>
      <main className="main stack">
        <div className="pagehead"><h1>Registry</h1><span className="id">BUREAU OF UNPROVEN POTENTIAL</span></div>
        <p className="small">
          A small curated catalogue of artists, startups and institutions, built from cited public records. Sorted by name by default.
          The Office keeps no universal quality score and does not rank its records.
        </p>
        <RegistrySearch value={query} onChange={update} />
        {(query.q || query.type || query.ver) && (
          <div className="chips" aria-label="Active filters">
            {query.q && <span className="chip">name: {query.q}</span>}
            {query.type && <span className="chip">type: {query.type}</span>}
            {query.ver && <span className="chip">status: {query.ver}</span>}
          </div>
        )}
        <EntityList items={items} caption={`${items.length} of ${entities.length} records`} />
        <p className="legend">
          FIELDS RECORDED: <span className="cov"><i /></span> recorded in selected sources · <span className="cov"><i className="no" /></span> not recorded.
          A hatched square means <b>unknown</b>, not zero and not a negative finding.
        </p>
        <Disclaimer compact />
      </main>
      <aside className="aside" aria-label="Dataset notes">
        <h2>Dataset</h2>
        <dl>
          <dt>Records</dt><dd className="mono">{entities.length}</dd>
          <dt>Target</dt><dd>20–40 (first intake is smaller)</dd>
          <dt>Selection</dt><dd>Hand-selected; see each record&apos;s note and Methods / Terms.</dd>
        </dl>
        <h2>Reading the table</h2>
        <p className="small">“Source record” describes how complete the entity&apos;s fields are for the Office&apos;s rules, not how important the entity is.</p>
      </aside>
    </>
  );
}
