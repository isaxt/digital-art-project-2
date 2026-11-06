import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { entities, getEntity, snapshotOf, ruleSet, TYPE_LABEL } from "../services/registryService";
import { defaultDirection, DIRECTIONS, mappedOutputs, snapshotId, translate } from "../services/translationService";
import { certificateIdFor } from "../services/certificateService";
import { useRecords } from "../store/localRecords";
import type { Direction } from "../types/translation";
import { Disclaimer, OriginTag, Panel } from "../components/shared";
import { TranslationComparison } from "../components/translation/TranslationComparison";
import { TranslationDirectionToggle } from "../components/translation/TranslationDirectionToggle";
import { useEffect } from "react";

export default function TranslationPage() {
  const { entityId } = useParams();
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const { issueCertificate, certificates } = useRecords();
  const entity = getEntity(entityId);
  const [busy, setBusy] = useState(false);
  const [existing, setExisting] = useState<string | null>(null);

  const dir: Direction = (sp.get("dir") as Direction) || (entity ? defaultDirection(entity.entityType) : null) || "artist_to_startup";
  const snap = useMemo(() => (entity ? snapshotOf(entity) : null), [entity]);
  const result = useMemo(() => (snap ? translate(snap, dir, ruleSet) : null), [snap, dir]);

  useEffect(() => {
    let live = true;
    setExisting(null);
    if (!snap) return;
    snapshotId(snap).then((sid) => certificateIdFor(snap.entity.id, dir, sid, ruleSet.version)).then((id) => {
      if (live && certificates.some((c) => c.id === id)) setExisting(id);
    });
    return () => { live = false; };
  }, [snap, dir, certificates]);

  if (!entity || !snap || !result) {
    const groups = [
      { title: "Artists → Startup language", list: entities.filter((e) => e.entityType === "artist") },
      { title: "Startups → Art-world language", list: entities.filter((e) => e.entityType === "startup") },
    ];
    return (
      <main className="main stack">
        <div className="pagehead"><h1>Translation Engine</h1><span className="id">RULE SET v{ruleSet.version}</span></div>
        <p className="intro">Select a record. The Engine shows the original source facts beside the Office&apos;s translation, the rule that produced each line, and where the analogy breaks.</p>
        <div className="grid2">
          {groups.map((g) => (
            <Panel key={g.title} title={g.title}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {g.list.map((e) => (<li key={e.id}><Link to={`/translate/${e.id}`}>{e.displayName}</Link> <span className="mono small">{e.id}</span></li>))}
              </ul>
            </Panel>
          ))}
        </div>
        <Panel title="Rules in force" kind="office">
          <table className="data">
            <thead><tr><th>Rule</th><th>Reads</th><th>Produces</th><th>Direction</th></tr></thead>
            <tbody>
              {ruleSet.rules.map((r) => (
                <tr key={r.id}><td className="id">{r.id}</td><td className="mono">{r.inputFields.join(", ")}</td><td>{r.outputLabel}</td><td>{r.sourceEntityType} → {r.targetVocabulary}</td></tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <Disclaimer compact />
      </main>
    );
  }

  const mapped = mappedOutputs(result);
  const issue = async () => {
    setBusy(true);
    try {
      const { certificateId } = await issueCertificate(entity.id, dir);
      nav(`/certificates/${certificateId}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <main className="main stack">
        <div className="crumbs"><Link to="/translate">Translation Engine</Link> › <Link to={`/registry/${entity.id}`}>{entity.displayName}</Link></div>
        <div className="pagehead"><h1>Translate: {entity.displayName}</h1><span className="id">{entity.id}</span><span className="badge blue">{TYPE_LABEL[entity.entityType]}</span></div>

        <div className="filters" style={{ alignItems: "center" }}>
          <div>
            <label htmlFor="sel-entity">Record</label>
            <select id="sel-entity" value={entity.id} onChange={(e) => nav(`/translate/${e.target.value}`)}>
              {entities.map((x) => <option key={x.id} value={x.id}>{x.displayName} ({TYPE_LABEL[x.entityType]})</option>)}
            </select>
          </div>
          <div>
            <span className="mono small" id="dir-l" style={{ display: "block", marginBottom: 2 }}>DIRECTION</span>
            <TranslationDirectionToggle value={dir} onChange={(d) => setSp({ dir: d }, { replace: true })} />
          </div>
        </div>

        {result.directionNotApplicable ? (
          <Panel title="No applicable translation" kind="office">
            <p><OriginTag kind="office" /></p>
            <p>{result.directionNotApplicable}</p>
            <p className="small">The Engine declines rather than force an analogy. Try the direction that matches this record&apos;s type.</p>
          </Panel>
        ) : (
          <>
            <p className="small">
              Reading <b>{DIRECTIONS[dir].label}</b>: {mapped.length} of {result.outputs.length} rule slots could be filled from this record&apos;s sources.
              Empty slots mean the dataset holds no input for them; they say nothing about the entity.
            </p>
            <TranslationComparison outputs={result.outputs} />

            {result.unmapped.length > 0 && (
              <Panel title="Where the analogy breaks: facts no rule reads" kind="source">
                <p className="small">These recorded facts have no counterpart in the {DIRECTIONS[dir].label} vocabulary. The Office offers no translation for them.</p>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {result.unmapped.map((u, i) => (
                    <li key={i}><b>{u.value}</b> <span className="badge">{u.label}</span> <span className="mono small">{u.sourceRecordId}</span><div className="small muted">{u.note}</div></li>
                  ))}
                </ul>
              </Panel>
            )}

            <Panel title="Issue Office certificate" kind="office">
              <p className="small">
                Issuing freezes the current source snapshot and rule-set version into a certificate and appends two events to the ledger. The same assessment always has the same certificate ID, so refreshing or re-issuing never creates a lookalike.
              </p>
              {existing ? (
                <p>A certificate for this exact assessment already exists: <Link to={`/certificates/${existing}`} className="mono">{existing}</Link></p>
              ) : (
                <button className="primary" type="button" onClick={issue} disabled={busy}>{busy ? "Issuing…" : "Issue certificate and record to ledger"}</button>
              )}
            </Panel>
          </>
        )}
        <Disclaimer compact />
      </main>
      <aside className="aside" aria-label="Translation record">
        <h2>Translation record</h2>
        <dl>
          <dt>Rule set</dt><dd className="mono">v{ruleSet.version}</dd>
          <dt>Method</dt><dd>deterministic (no AI)</dd>
          <dt>Direction</dt><dd>{DIRECTIONS[dir].label}</dd>
          <dt>Mapped</dt><dd className="mono">{mapped.length}</dd>
          <dt>Insufficient</dt><dd className="mono">{result.outputs.length - mapped.length}</dd>
          <dt>Unmapped</dt><dd className="mono">{result.unmapped.length}</dd>
        </dl>
        <h2>Source fields used</h2>
        <ul style={{ margin: 0, paddingLeft: 16 }} className="mono small">
          {[...new Set(mapped.flatMap((m) => m.inputFields))].map((f) => <li key={f}>{f}</li>)}
        </ul>
        <h2>Reproducibility</h2>
        <p className="small">The same snapshot and rule-set version always produce this output. No timestamps or random values enter the translation.</p>
      </aside>
    </>
  );
}
