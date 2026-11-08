import { Link } from "react-router-dom";
import { CONFIG } from "../config";
import { entities, getEntity, TYPE_LABEL, eventsOf, sourcesOf } from "../services/registryService";
import { useRecords } from "../store/localRecords";
import { Disclaimer, Panel, VerificationBadge } from "../components/shared";
import { LedgerTimeline } from "../components/ledger/LedgerTimeline";
import { defaultDirection, DIRECTIONS } from "../services/translationService";
import { fmtTimestamp } from "../utils/dates";

export default function HomePage() {
  const { ledger, certificates, verification } = useRecords();
  const latest = [...certificates].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)).slice(0, 5);
  const review = entities.filter((e) => e.verificationStatus === "needs_review");
  const featured = entities.find((e) => e.id === CONFIG.featuredEntityId)!;
  const featuredDir = defaultDirection(featured.entityType);
  const featuredCert = certificates.find((c) => c.entityId === featured.id);

  return (
    <>
      <main className="main stack">
        <div className="pagehead"><h1>{CONFIG.institutionName}</h1><span className="id">EST. REGISTRY 0001</span></div>

        <p className="intro">
          The Office registers galleries, artists and startups from two supplied datasets of real, source-linked records, translates what is known
          about each into the vocabulary of the other ecosystem, and issues certificates of their anticipated cultural and
          economic potential. The data is real; the interpretation is the artwork. Every certificate can be traced to its sources, its rule and a ledger entry.
        </p>

        <div className="notice-strip" role="note"><b>{CONFIG.notice.ref} · </b>{CONFIG.notice.text}</div>

        <div className="counters" aria-label="Office totals">
          <div className="counter"><b>{String(entities.length).padStart(4, "0")}</b><span>Records (galleries, artists, startups)</span></div>
          <div className="counter"><b>{String(entities.reduce((n, e) => n + sourcesOf(e).length, 0)).padStart(4, "0")}</b><span>Source records</span></div>
          <div className="counter"><b>{String(certificates.length).padStart(4, "0")}</b><span>Certificates</span></div>
          <div className="counter"><b>{String(ledger.length).padStart(6, "0")}</b><span>Ledger events</span></div>
        </div>

        <p>
          <Link to="/registry"><button className="primary" type="button" tabIndex={-1}>Enter the Registry →</button></Link>{" "}
          <span className="small muted">or follow the featured example below from record to certificate to ledger.</span>
        </p>

        <Panel title="From the archive: where this began">
          <p className="small">
            The Office started as a post. Read the original text of the Substack piece that prompted it.{" "}
            <Link to="/archive?open=parallels"><b>Open “parallels between the start up world and the fine art world” →</b></Link>
          </p>
        </Panel>

        <Panel title="Featured record" controls>
          <div className="grid2">
            <div>
              <h2><Link to={`/registry/${featured.id}`}>{featured.displayName}</Link> <span className="badge">{TYPE_LABEL[featured.entityType]}</span></h2>
              <p className="small mono">{featured.id} · {sourcesOf(featured).length} source records · {eventsOf(featured).length} events</p>
              <p className="small">An artist named on a gallery&apos;s parsed roster and in the same gallery&apos;s current-exhibition listing, so both rules that artists can be read by have something to read.</p>
            </div>
            <ol className="small" style={{ margin: 0, paddingLeft: 18 }}>
              <li><Link to={`/registry/${featured.id}`}>Inspect the source records</Link></li>
              {featuredDir && <li><Link to={`/translate/${featured.id}`}>Translate: {DIRECTIONS[featuredDir].label}</Link>, with rules and limitations</li>}
              {featuredCert && <li><Link to={`/certificates/${featuredCert.id}`}>Open the certificate</Link></li>}
              {featuredCert?.ledgerEventId && <li><Link to={`/ledger/${featuredCert.ledgerEventId}`}>Inspect its ledger event</Link></li>}
            </ol>
          </div>
        </Panel>

        <div className="grid2">
          <Panel title="Latest assessments">
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {latest.map((c) => (
                <li key={c.id} style={{ padding: "3px 0", borderBottom: "1px dotted #858d99" }}>
                  <Link to={`/certificates/${c.id}`}><b>{c.entityName}</b></Link> <span className="badge yellow">{c.classificationCode}</span>
                  <div className="small mono muted">{c.id} · {fmtTimestamp(c.issuedAt)}</div>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title={`Records needing review (${review.length})`}>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {review.slice(0, 8).map((e) => (
                <li key={e.id} style={{ padding: "3px 0", borderBottom: "1px dotted #858d99" }}>
                  <Link to={`/registry/${e.id}`}>{getEntity(e.id)!.displayName}</Link> <VerificationBadge status={e.verificationStatus} />
                </li>
              ))}
            </ul>
            <p className="small"><Link to="/registry?ver=needs_review">See all {review.length} →</Link></p>
          </Panel>
        </div>

        <Panel title="Recently recorded · public ledger (local simulation)" kind="terminal" controls>
          <LedgerTimeline events={ledger} verification={verification} limit={5} />
          <p className="small"><Link to="/ledger">Open the full ledger →</Link></p>
        </Panel>

        <Disclaimer />
      </main>
    </>
  );
}
