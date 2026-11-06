import { Link, NavLink } from "react-router-dom";
import { dataset } from "../../data";
import { useChainVerification } from "../../services/ledgerService";
import { localRecordCount, resetLocalRecords, useStore } from "../../services/store";
import { typeCounts } from "../../services/registryService";
import { TYPE_LABEL } from "../../utils/format";

function Emblem() {
  return (
    <svg className="emblem" viewBox="0 0 40 40" role="img" aria-label="Office of Cultural Futures emblem">
      <rect x="1" y="1" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="20" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M20 1v38M1 20h38" stroke="currentColor" strokeWidth="1" />
      <rect x="15" y="15" width="10" height="10" fill="var(--yellow)" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

export function InstitutionHeader() {
  const v = useChainVerification();
  const status = v === null ? "CHECKING…" : v.ok ? `CHAIN VERIFIED ${v.checked}/${v.checked}` : `INTEGRITY WARNING @ #${(v.firstFailureIndex ?? 0) + 1}`;
  return (
    <header className="masthead">
      <Link to="/" className="brand">
        <Emblem />
        <span>
          <span className="brand-name">Office of Cultural Futures</span>
          <span className="brand-sub">Registry · Translation · Provenance &nbsp;|&nbsp; est. as an artwork, 2026</span>
        </span>
      </Link>
      <div className="sysstatus mono" aria-label="System status">
        <div>LEDGER: LOCAL / SIMULATED</div>
        <div className={v && !v.ok ? "warn" : ""}>{status}</div>
      </div>
    </header>
  );
}

const NAV: [string, string][] = [
  ["/", "Office"], ["/registry", "Registry"], ["/translate", "Translation Engine"],
  ["/certificates", "Certificates"], ["/ledger", "Public Ledger"],
];

export function SiteNavigation() {
  return (
    <nav className="primary" aria-label="Primary">
      <ul>
        {NAV.map(([to, label]) => (
          <li key={to}><NavLink to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>{label}</NavLink></li>
        ))}
      </ul>
      <NavLink to="/methods" className={({ isActive }) => "secondary" + (isActive ? " active" : "")}>Methods / Terms</NavLink>
    </nav>
  );
}

export function RecordTicker() {
  const s = useStore();
  const items = [
    `ENTITIES ${dataset.entities.length}`, `SOURCES ${dataset.sources.length}`, `EVENTS ${dataset.events.length}`,
    `RULES ${dataset.ruleSet.rules.length} (${dataset.ruleSet.ruleSetVersion})`, `TRANSLATIONS ${s.translations.length}`,
    `CERTIFICATES ${s.certificates.length}`, `LEDGER EVENTS ${s.ledger.length}`,
  ];
  return <div className="ticker mono" role="status" aria-label="Record counts">{items.map((i) => <span key={i}>{i}</span>)}</div>;
}

export function ArchiveIndex() {
  useStore(); // re-render when local records change
  const counts = typeCounts();
  const local = localRecordCount();
  return (
    <aside className="index" aria-label="Archive index">
      <h2>Archive index</h2>
      <ul>
        <li><Link to="/registry">All records <span className="mono">{dataset.entities.length}</span></Link></li>
        {Object.entries(counts).map(([t, n]) => (
          <li key={t} className="sub"><Link to={`/registry?type=${t}`}>{TYPE_LABEL[t]} <span className="mono">{n}</span></Link></li>
        ))}
      </ul>
      <ul>
        <li><Link to="/translate">Translation Engine</Link></li>
        <li><Link to="/certificates">Certificates</Link></li>
        <li><Link to="/ledger">Public Ledger</Link></li>
        <li><Link to="/methods#sources">Data sources</Link></li>
        <li><Link to="/methods#rules">Translation rules</Link></li>
        <li><Link to="/methods#corrections">Corrections</Link></li>
      </ul>
      <div className="localbox mono">
        <div>LOCAL RECORDS: {local}</div>
        <p>Assessments you create are stored only in this browser.</p>
        {local > 0 && (
          <button type="button" onClick={() => { if (confirm("Remove all records created in this browser? The founding ledger is unaffected.")) resetLocalRecords(); }}>
            Reset local records
          </button>
        )}
      </div>
    </aside>
  );
}
