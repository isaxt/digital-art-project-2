import { Link, useParams } from "react-router-dom";
import { eventsOf, getEntity, missingFields, sourcesOf, TYPE_LABEL, entities, rosterOf, listedInExhibitionsOf } from "../services/registryService";
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
  const roster = e.entityType === "gallery" ? rosterOf(e.id) : [];
  const inShows = e.entityType === "gallery" ? listedInExhibitionsOf(e.id) : [];
  const ds = e.datasetStatus ?? {};

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

        <Panel title="Source facts" kind="source">
          <p><OriginTag kind="source" /></p>
          {e.description ? (
            <>
              <p className="serif" style={{ fontSize: 15 }}>{e.description}</p>
              {e.descriptionSourceRecordId && <p className="small mono">from {e.descriptionSourceRecordId}</p>}
            </>
          ) : (
            <p className="muted">{e.entityType === "startup" ? "No source description available." : `The supplied dataset has no description for ${e.entityType === "artist" ? "artists" : "galleries"}. None is written here.`}</p>
          )}
          <dl className="facts">
            {e.category && <><dt>Category (dataset)</dt><dd className="mono">{e.category}</dd></>}
            {e.location && <><dt>City association (dataset)</dt><dd>{[e.location.city, e.location.state, e.location.country].filter(Boolean).join(", ")}</dd></>}
            {e.entityType === "startup" && <><dt>Sector (dataset label)</dt><dd>{e.sector?.length ? e.sector.join(" · ") : <i>Not available</i>}</dd></>}
            {e.entityType === "startup" && <><dt>Accelerator</dt><dd>{e.accelerator ?? <i>None recorded in the dataset. This is not proof the company never joined one.</i>}</dd></>}
            {e.entityType === "startup" && e.accelerator && <><dt>Batch</dt><dd>{e.batch ? <><b className="mono">{e.batch}</b> <span className="small muted">({ds.batch_status?.replace(/_/g, " ")}; never inferred by the Office)</span></> : <i>Not recorded</i>}</dd></>}
          </dl>
          {Object.keys(ds).length > 0 && (
            <div className="small"><b>Dataset status fields:</b><div className="chips" style={{ marginTop: 3 }}>{Object.entries(ds).map(([k, v]) => <span key={k} className="chip" title={k}>{k.replace(/_/g, " ")}: {v.replace(/_/g, " ")}</span>)}</div></div>
          )}
          {e.sourceNotes?.map((n) => <p key={n} className="small"><b>Dataset note:</b> {n}</p>)}
          {affiliations.length > 0 && <p className="small"><b>{e.entityType === "artist" ? "Named in the listings of:" : "Affiliations:"}</b> {affiliations.map((a, i) => (<span key={a.id}>{i > 0 && ", "}<EntityLink id={a.id} name={a.displayName} /></span>))}</p>}
          {e.selectionNote && <p className="small"><b>Why this record was selected:</b> {e.selectionNote}</p>}
        </Panel>

        {e.entityType === "gallery" && (
          <Panel title="Artist roster (as parsed)" kind="source">
            {ds.artist_roster === "verified" ? (
              <>
                <p className="small">{roster.length} names, as parsed from the roster page in the supplied dataset.{e.sourceNotes?.length ? ` Dataset note: ${e.sourceNotes[0]}` : ""}</p>
                <div className="chips">{roster.map((a) => <Link key={a.id} className="chip" to={`/registry/${a.id}`}>{a.displayName}</Link>)}</div>
              </>
            ) : (
              <p><b>Roster not yet parsed.</b> The supplied dataset has not read this gallery&apos;s roster. An empty list here means <i>unknown</i>, not that the gallery represents no artists.</p>
            )}
            {inShows.length > 0 && <p className="small"><b>Artists named in current exhibitions:</b> {inShows.map((a, i) => <span key={a.id}>{i > 0 && ", "}<EntityLink id={a.id} name={a.displayName} /></span>)}</p>}
          </Panel>
        )}

        <Panel title="Timeline of recorded events" kind="source">
          <EntityTimeline events={evs} />
        </Panel>

        <div className="stack" aria-label="Source records">
          {srcs.map((s) => <SourceRecordPanel key={s.id} source={s} />)}
        </div>

        <Panel title="Missing or unavailable fields" kind="source">
          {missing.length ? (
            <>
              <ul style={{ margin: "0 0 6px", paddingLeft: 18 }}>{missing.map((m) => <li key={m.label}>{m.label}: <i>{m.why}</i></li>)}</ul>
              <p className="small">These are gaps in the supplied dataset. They are not findings about the entity and are never translated into a low rating.</p>
            </>
          ) : <p>No gaps against the Office&apos;s field list.</p>}
        </Panel>

        <Panel title="Office interpretation" kind="office">
          <p><OriginTag kind="office" /></p>
          {dir ? (
            <>
              <p>
                <Link to={`/translate/${e.id}`}><button className="primary" type="button" tabIndex={-1}>Open in Translation Engine: {DIRECTIONS[dir].label}</button></Link>
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
            <p>The Office defines no translation direction for a{/^[aeiou]/i.test(e.entityType) ? "n" : ""} {e.entityType}. Galleries and institutions are registered so that artists and listings can cite them; they are not themselves assessed or translated.</p>
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
          {e.datasetRecordId && <><dt>Dataset ID</dt><dd className="mono">{e.datasetRecordId}</dd></>}
          <dt>Type</dt><dd>{TYPE_LABEL[e.entityType]}</dd>
          <dt>Dataset date</dt><dd className="mono">{fmtDate(e.createdAt)}</dd>
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
