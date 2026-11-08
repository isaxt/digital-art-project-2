import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRecords } from "../store/localRecords";
import { CONFIG } from "../config";
import { Hash0x, CONTRACT, lookupAddress } from "../components/explorer/parts";
import { Panel } from "../components/shared";
import { entities } from "../services/registryService";
import { isAddress, strip0x } from "../services/chainService";
import { fmtTimestamp } from "../utils/dates";
import type { LedgerEvent } from "../types/ledger";
import type { Block } from "../services/chainService";

export function resolveQuery(q: string, ledger: LedgerEvent[], blocks: Block[], witnessAddrs: string[]): string | null {
  const s = q.trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) return blocks[Number(s)] ? `/block/${Number(s)}` : null;
  if (/^EVT-\d+$/i.test(s)) return ledger.some((e) => e.id === s.toUpperCase()) ? `/tx/${s.toUpperCase()}` : null;
  if (/^CERT-/i.test(s)) return `/certificates/${s.toUpperCase()}`;
  if (isAddress(s)) return lookupAddress(s) || witnessAddrs.includes(s.toLowerCase()) ? `/address/${s.toLowerCase()}` : null;
  if (/^(0x)?[0-9a-f]{64}$/i.test(s)) {
    const hx = strip0x(s);
    const ev = ledger.find((e) => e.eventHash === hx);
    if (ev) return `/tx/${ev.id}`;
    const b = blocks.find((x) => x.hash === hx || x.merkleRoot === hx);
    if (b) return `/block/${b.height}`;
    if (hx === CONTRACT.hash) return "/contract";
    return null;
  }
  const e = entities.find((x) => x.id === s || x.displayName.toLowerCase() === s.toLowerCase());
  return e ? `/registry/${e.id}` : null;
}

export default function ExplorerPage() {
  const { ledger, blocks, mempool, verification } = useRecords();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [miss, setMiss] = useState(false);
  const go = (e: FormEvent) => {
    e.preventDefault();
    const to = resolveQuery(q, ledger, blocks, []);
    if (to) nav(to); else setMiss(true);
  };
  const latestBlocks = [...blocks].reverse().slice(0, 12);
  const latestTx = [...ledger].reverse().slice(0, 12);
  const sealed = blocks.filter((b) => b.sealed).length;
  return (
    <main className="main stack">
      <div className="pagehead"><h1>Ledger Explorer</h1><span className="id">LOCAL / SIMULATED — NOT A PUBLIC CHAIN</span></div>
      <p className="intro">
        The Office&apos;s ledger, read the way a public chain is read: blocks, transactions, addresses, confirmations. The blocks are a way of <i>presenting</i> the events,
        not a network: one machine wrote them, and every number here is derived by hashing.
      </p>
      <form onSubmit={go} role="search" className="filters" style={{ alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label htmlFor="xq">Search by block height, tx hash, EVT id, 0x address, certificate id or record</label>
          <input id="xq" style={{ width: "100%" }} value={q} onChange={(e) => { setQ(e.target.value); setMiss(false); }} placeholder="0x… / 12 / EVT-000042 / CERT-… / ramp" />
        </div>
        <button type="submit">Search</button>
        {miss && <span role="status" className="small"><b>Nothing found.</b> Unknown to this ledger is not the same as not existing.</span>}
      </form>

      <div className="statrow">
        <div className="stat"><b>#{blocks.length - 1}</b><span>Latest block</span></div>
        <div className="stat"><b>{sealed}</b><span>Sealed blocks</span></div>
        <div className="stat"><b>{ledger.length}</b><span>Transactions</span></div>
        <div className="stat"><b>{mempool.length}</b><span>Mempool</span></div>
        <div className="stat"><b>{CONFIG.finalityDepth}</b><span>Burial depth</span></div>
        <div className="stat"><b>{verification ? (verification.ok ? "OK" : "FAIL") : "…"}</b><span>Chain check</span></div>
      </div>

      <Panel title="Latest blocks (newest on the right)" kind="source">
        <div className="blockstrip">
          {[...latestBlocks].reverse().map((b) => (
            <div key={b.height} className={`blk ${b.sealed ? "" : "open"}`}>
              <Link to={`/block/${b.height}`}>#{b.height}</Link>{!b.sealed && <span className="small"> OPEN</span>}
              <div>{b.events.length} tx</div>
              <div className="mono"><Hash0x value={b.hash} /></div>
              <div className="small muted">{fmtTimestamp(b.timestamp).slice(5, 16)}</div>
            </div>
          ))}
        </div>
        <p className="small">Each block carries the hash of the one before it. Change any event and every later block hash changes. An open block is not yet sealed and its hash is provisional.</p>
      </Panel>

      {mempool.length > 0 && (
        <Panel title={`Mempool (${mempool.length} pending)`} kind="office">
          <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
            {mempool.map((m) => <li key={m.key}><Link to={`/translate/${m.entityId}?dir=${m.direction}`}>{m.certificateId}</Link> for {m.entityName}: waiting for a miner</li>)}
          </ul>
        </Panel>
      )}

      <Panel title="Latest transactions" kind="terminal">
        <div className="scroll-x">
          <table className="term">
            <thead><tr><th>Tx hash</th><th>Method</th><th>Record</th><th>Block</th><th>Time (UTC)</th></tr></thead>
            <tbody>
              {latestTx.map((e) => (
                <tr key={e.id}>
                  <td><Link to={`/tx/${e.id}`}><Hash0x value={e.eventHash} /></Link></td>
                  <td>{e.eventType}</td>
                  <td>{e.entityId ? <Link to={`/registry/${e.entityId}`}>{e.entityId}</Link> : "—"}</td>
                  <td><Link to={`/block/${Math.floor((Number(e.id.slice(4)) - 1) / CONFIG.blockSize)}`}>#{Math.floor((Number(e.id.slice(4)) - 1) / CONFIG.blockSize)}</Link></td>
                  <td className="nowrap">{fmtTimestamp(e.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <p className="small">Contract: <Link to="/contract" className="mono">{CONTRACT.address}</Link> · <Link to="/ledger">Raw ledger table</Link></p>
    </main>
  );
}
