import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { CONFIG } from "../config";
import { InstitutionHeader } from "../components/navigation/InstitutionHeader";
import { SiteNavigation } from "../components/navigation/SiteNavigation";
import { entities, TYPE_LABEL } from "../services/registryService";
import { useRecords } from "../store/localRecords";
import type { EntityType } from "../types/entity";

function StatusTicker() {
  const { ledger, certificates, verification, localCount } = useRecords();
  const chain = verification === null ? "VERIFYING…" : verification.ok ? "CHAIN OK" : `CHAIN FAILED @${verification.firstFailure + 1}`;
  const cls = verification === null ? "warn" : verification.ok ? "" : "bad";
  return (
    <div className="ticker" role="status" aria-live="polite">
      <span>RECORDS <b>{String(entities.length).padStart(4, "0")}</b></span>
      <span>CERTIFICATES <b>{String(certificates.length).padStart(4, "0")}</b></span>
      <span>LEDGER EVENTS <b>{String(ledger.length).padStart(6, "0")}</b></span>
      <span>LOCAL (THIS BROWSER) <b>{String(localCount).padStart(3, "0")}</b></span>
      <span className={cls}>INTEGRITY: {chain}</span>
      <span className="warn">LEDGER TYPE: LOCAL / SIMULATED</span>
    </div>
  );
}

function Rail() {
  const loc = useLocation();
  const active = new URLSearchParams(loc.search).get("type");
  const types = (Object.keys(TYPE_LABEL) as EntityType[]).filter((t) => entities.some((e) => e.entityType === t));
  return (
    <aside className="rail" aria-label="Directory">
      <h2>Directory</h2>
      <ul>
        <li><NavLink to="/registry" end className={() => (loc.pathname.startsWith("/registry") && !active ? "active" : "")}>All records <span className="count">{entities.length}</span></NavLink></li>
        {types.map((t) => (
          <li key={t}>
            <Link to={`/registry?type=${t}`} className={loc.pathname === "/registry" && active === t ? "active" : ""}>
              {TYPE_LABEL[t]} <span className="count">{entities.filter((e) => e.entityType === t).length}</span>
            </Link>
          </li>
        ))}
      </ul>
      <h2>Systems</h2>
      <ul>
        <li><NavLink to="/translate">Translation Engine</NavLink></li>
        <li><NavLink to="/certificates">Certificates</NavLink></li>
        <li><NavLink to="/ledger">Public Ledger</NavLink></li>
        <li><NavLink to="/methods">Methods / Terms</NavLink></li>
      </ul>
      <div className="notice">
        <b className="mono">{CONFIG.notice.ref}</b>
        <br />
        Classifications are speculative interpretations. See Methods / Terms.
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <div className="app">
      <a className="skip" href="#content">Skip to content</a>
      <InstitutionHeader />
      <SiteNavigation />
      <StatusTicker />
      <div className="panes" id="content">
        <Rail />
        <Outlet />
      </div>
      <footer className="foot">
        {CONFIG.institutionName} · A critical digital artwork · {CONFIG.ledgerLabel} · Rule set v{CONFIG.ruleSetVersion} ·{" "}
        <Link to="/methods">Methods / Terms</Link>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
