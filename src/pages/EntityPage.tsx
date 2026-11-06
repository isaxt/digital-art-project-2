import { Link, useParams } from "react-router-dom";
import { eventsOf, getEntity, missingFields, sourcesOf, TYPE_LABEL, entities } from "../services/registryService";
import { defaultDirection, DIRECTIONS } from "../services/translationService";
import { useRecords } from "../store/localRecords";
import { Coverage, Disclaimer, OriginTag, Panel, VerificationBadge, EntityLink } from "../components/shared";
import { SourceRecordPanel } from "../components/entity/SourceRecordPanel";
import { EntityTimeline } from "../components/entity/EntityTimeline";
import { LedgerTimeline } from "../components/ledger/LedgerTimeline";
import { recordStatus } from "../services/ledgerService";
import { fmtDate } from "../utils/dates";
import NotFoundPage from "./NotFoundPage";

export default function EntityPage() {
  const { entityId } = useParams();
  const { ledger, certificates, verification } = useRecords();
  const e = getEntity(entityId);
  if (!e) return <NotFoundPage />;
  const dir = defaultDirection(e.entityType);
  const srcs = sourcesOf(e);
  const evs = eventsOf(e);
  const missing = missingFields(e);
  const certs = certificates.filter((c) => c.entityId === e.id);
  const related = ledger.filter((x) => x.entityId === e.id);
  const affiliations = e.affiliationIds.map((id) => entities.find((x) => x.id === id)!).filter(Boolean);
  const affiliatedWith = entities.filter((x) => x.affiliationIds.includes(e.id));

  return (
    <>
      <main className="main stack">
        <div className="crumbs"><Link to="/registry">Registry</Link> › {e.id}</div>
        <div className="pagehead">
          <h1>{e.displayName}</h1>
          <span className="badge blue">{TYPE_LABEL[e.entityType]}</span>
          <span className="id">{e.id}</span>
          <VerificationBadge status={e.verificationStatus} />
        </div>

        <Panel title="Source facts" kind="source" controls>
          <p><OriginTag kind="source" /></p>
          {e.description ? (
            <>
              <p className="serif" style={{ fontSize: 15 }}>{e.description}</p>
              {e.descriptionSourceRecordId && <p className="small mono">from {e.descriptionSourceRecordId}</p>}
            </>
          ) : (
            <p className="muted">No source description available.</p>
          )}
          {affiliations.length > 0 && <p className="small"><b>Affiliations:</b> {affiliations.map((a, i) => (<span key={a.id}>{i > 0 && ", "}<EntityLink id={a.id} name={a.displayName} /></span>))}</p>}
          {affiliatedWith.length > 0 && <p className="small"><b>Referenced by:</b> {affiliatedWith.map((a, i) => (<span key={a.id}>{i > 0 && ", "}<EntityLink id={a.id} name={a.displayName} /></span>))}</p>}
          {e.selectionNote && <p className="small"><b>Why this record was selected:</b> {e.selectionNote}</p>}
        </Panel>

        <Panel title="Timeline of recorded events" kind="source">
          <EntityTimeline events={evs} />
        </Panel>

        <div className="stack" aria-label="Source records">
          {srcs.map((s) => <SourceRecordPanel key={s.id} source={s} />)}
        </div>

        <Panel title="Missing or unavailable fields" kind="source">
          {missing.length ? (
            <>
              <ul style={{ margin: "0 0 6px", paddingLeft: 18 }}>{missing.map((m) => <li key={m}>{m}: <i>not recorded in selected sources</i></li>)}</ul>
              <p className="small">These are gaps in the Office&apos;s dataset. They are not findings about the entity and are never translated into a low rating.</p>
            </>
          ) : <p>No gaps against the Office&apos;s field list.</p>}
        </Panel>

        <Panel title="Office interpretation" kind="office" controls>
          <p><OriginTag kind="office" /></p>
          {dir ? (
            <>
              <p>
                <Link to={`/translate/${e.id}`}><button className="primary" type="button" tabIndex={-1}>Open Translation Engine: {DIRECTIONS[dir].label} →</button></Link>
              </p>
              {certs.length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {certs.map((c) => (
                    <li key={c.id}>
                      <Link to={`/certificates/${c.id}`}>{c.id}</Link> · <span className="badge yellow">{c.classificationCode}</span> {c.classification} ·{" "}
                      <span className="mono small">{fmtDate(c.issuedAt)}</span> · status: {recordStatus(ledger, c.id)}
                    </li>
                  ))}
                </ul>
              ) : <p className="muted">No certificate has been issued for this record.</p>}
            </>
          ) : (
            <p>The Office defines no translation direction for a{/^[aeiou]/i.test(e.entityType) ? "n" : ""} {e.entityType}. Institutions are registered so that other records can cite them; they are not themselves assessed.</p>
          )}
        </Panel>

        <Panel title="Related ledger events" kind="terminal">
          {related.length ? <LedgerTimeline events={related} verification={verification} /> : <p>No events.</p>}
        </Panel>
        <Disclaimer compact />
      </main>
      <aside className="aside" aria-label="Record metadata">
        <h2>Record</h2>
        <dl>
          <dt>ID</dt><dd className="mono">{e.id}</dd>
          <dt>Type</dt><dd>{TYPE_LABEL[e.entityType]}</dd>
          <dt>Created</dt><dd className="mono">{fmtDate(e.createdAt)}</dd>
          <dt>Updated</dt><dd className="mono">{fmtDate(e.updatedAt)}</dd>
          <dt>Sources</dt><dd className="mono">{srcs.length}</dd>
          <dt>Events</dt><dd className="mono">{evs.length}</dd>
        </dl>
        <h2>Fields recorded</h2>
        <p><Coverage entity={e} /></p>
        {e.tags && (<><h2>Tags</h2><div className="chips">{e.tags.map((t) => <span className="chip" key={t}>{t}</span>)}</div></>)}
        <h2>Source links</h2>
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {srcs.map((s) => <li key={s.id}><a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">{s.provider}<span className="sr-only"> (opens in a new tab)</span></a></li>)}
        </ul>
      </aside>
    </>
  );
}
