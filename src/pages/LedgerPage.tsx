import { useSearchParams } from "react-router-dom";
import { CONFIG } from "../config";
import { useRecords } from "../store/localRecords";
import { entities } from "../services/registryService";
import { LedgerTimeline } from "../components/ledger/LedgerTimeline";
import { Panel } from "../components/shared";

export default function LedgerPage() {
  const { ledger, verification, tamperDemo, setTamperDemo, localCount, resetLocal } = useRecords();
  const [sp, setSp] = useSearchParams();
  const entity = sp.get("entity") ?? "";
  const type = sp.get("type") ?? "";
  const rows = ledger.filter((e) => (!entity || e.entityId === entity) && (!type || e.eventType === type));
  const types = [...new Set(ledger.map((e) => e.eventType))];

  return (
    <>
      <main className="main stack">
        <div className="pagehead"><h1>Public Ledger</h1><span className="id">CULTURAL CAPITAL PROTOCOL</span></div>
        <p className="integrity ok" style={{ background: "#17191d" }} role="note">
          {CONFIG.ledgerLabel}. Events are hash-chained and append-only in this application&apos;s logic. This is NOT a blockchain: it is not decentralized, not trustless and not independently immutable. Anyone controlling the whole dataset could rewrite it.
        </p>
        <p className={`integrity ${verification?.ok === false ? "fail" : "ok"}`} style={verification?.ok === false ? undefined : { background: "#17191d" }} role="status">
          {verification === null ? "VERIFYING CHAIN…" : verification.ok
            ? `✓ CHAIN VERIFIED: ${ledger.length} events recomputed from the first event. Hashes and links match.`
            : `✗ INTEGRITY WARNING: verification failed at event ${verification.firstFailure + 1} (${verification.perEvent[verification.firstFailure]?.id}). This indicates the chain differs from the expected copy; it is not proof of malicious behavior.`}
        </p>

        <form className="filters" aria-label="Filter ledger" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label htmlFor="l-ent">Entity</label>
            <select id="l-ent" value={entity} onChange={(e) => setSp(e.target.value ? { ...(type ? { type } : {}), entity: e.target.value } : type ? { type } : {})}>
              <option value="">All</option>
              {entities.map((e) => <option key={e.id} value={e.id}>{e.displayName}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="l-type">Event type</label>
            <select id="l-type" value={type} onChange={(e) => setSp(e.target.value ? { ...(entity ? { entity } : {}), type: e.target.value } : entity ? { entity } : {})}>
              <option value="">All</option>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </form>

        <Panel title={`Events (${rows.length} of ${ledger.length}) · newest first`} kind="terminal" controls>
          <LedgerTimeline events={rows} verification={verification} />
        </Panel>
      </main>
      <aside className="aside" aria-label="Ledger controls">
        <h2>Technical status</h2>
        <dl>
          <dt>Type</dt><dd>local_append_only</dd>
          <dt>Hash</dt><dd>SHA-256</dd>
          <dt>Anchor</dt><dd>none (no testnet)</dd>
          <dt>Seed events</dt><dd className="mono">{ledger.length - localCount}</dd>
          <dt>This browser</dt><dd className="mono">{localCount}</dd>
        </dl>
        <h2>Test the check</h2>
        <p className="small">Alter one event in memory to watch verification catch it. Stored records are not changed.</p>
        <label style={{ textTransform: "none", fontFamily: "inherit", fontSize: 12 }}>
          <input type="checkbox" checked={tamperDemo} onChange={(e) => setTamperDemo(e.target.checked)} /> Simulate tampering with event 3
        </label>
        <h2>Local records</h2>
        <p className="small">Certificates and events you create are stored only in this browser.</p>
        <button type="button" disabled={localCount === 0} onClick={() => { if (window.confirm("Remove all records created in this browser? Seed records are kept.")) resetLocal(); }}>Clear my local records</button>
      </aside>
    </>
  );
}
