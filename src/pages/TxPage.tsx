import { Link, useParams } from "react-router-dom";
import { useRecords } from "../store/localRecords";
import { Addr, Conf, Hash0x, KV, CONTRACT } from "../components/explorer/parts";
import { LedgerEventDetail } from "../components/ledger/LedgerEventDetail";
import { Panel } from "../components/shared";
import { blockOfEvent, confirmations, entityAddress, REGISTRAR_ADDRESS, strip0x, verifyPow, with0x } from "../services/chainService";
import type { ProofOfWork } from "../types/certificate";
import { fmtTimestamp } from "../utils/dates";
import NotFoundPage from "./NotFoundPage";

export default function TxPage() {
  const { eventId = "" } = useParams();
  const { ledger, blocks, verification } = useRecords();
  const key = eventId.toUpperCase().startsWith("EVT-") ? eventId.toUpperCase() : strip0x(eventId);
  const i = ledger.findIndex((e) => e.id === key || e.eventHash === key);
  if (i < 0) return <NotFoundPage />;
  const e = ledger[i];
  const block = blockOfEvent(blocks, i);
  const conf = confirmations(ledger.length, i);
  const check = verification?.perEvent[i];
  const ok = check ? check.hashOk && check.linkOk : null;
  const pow = e.payload.proofOfWork as ProofOfWork | undefined;
  const witness = typeof e.payload.witness === "string" ? e.payload.witness : null;

  const system = e.eventType === "entity_registered" || e.eventType === "source_attached";
  const from = witness ? <Addr address={witness} /> : e.eventType.startsWith("record_") ? <span>anonymous local visitor <span className="small muted">(no key, unsigned)</span></span> : <Addr address={REGISTRAR_ADDRESS} />;
  const to = system || witness || e.eventType.startsWith("record_")
    ? (e.entityId ? <Addr address={entityAddress(e.entityId)} /> : "—")
    : <span><Addr address={CONTRACT.address} /> <span className="small muted">(rules contract)</span></span>;

  return (
    <main className="main stack">
      <div className="crumbs"><Link to="/explorer">Explorer</Link> › Transaction {e.id}</div>
      <div className="pagehead"><h1>Transaction details</h1><span className="id">{e.id}</span></div>
      <Panel title="Overview" kind="terminal" controls>
        <KV rows={[
          ["Transaction hash", <Hash0x value={e.eventHash} full />],
          ["Status", ok === null ? "verifying…" : ok ? <span className="verified">✓ SUCCESS · hash and link verified</span> : <span className="badge red">✗ CHAIN CHECK FAILED</span>],
          ["Block", <><Link to={`/block/${block.height}`}>#{block.height}</Link> <span className="small muted">{block.sealed ? "sealed" : "open"}</span></>],
          ["Confirmations", <><Conf n={conf} /><div className="small muted" style={{ marginTop: 3 }}>Number of ledger events recorded after this one. The event itself is unchanged.</div></>],
          ["Timestamp", fmtTimestamp(e.timestamp)],
          ["From", from],
          ["Interacted with (to)", to],
          ["Method", <span className="mono">{e.eventType}</span>],
          ["Record", e.entityId ? <Link to={`/registry/${e.entityId}`}>{e.entityId}</Link> : "—"],
          ["Certificate", e.certificateId ? <Link to={`/certificates/${e.certificateId}`}>{e.certificateId}</Link> : "—"],
          ["Rule-set", e.ruleSetVersion ? <>v{e.ruleSetVersion} · <Link to="/contract">contract {CONTRACT.address.slice(0, 10)}…</Link></> : "—"],
          ["Proof of work", pow ? (verifyPow(e.certificateId ?? "", pow) ? <span className="verified">✓ valid: nonce {pow.nonce}, hash {with0x(pow.hash).slice(0, 14)}… ({pow.difficulty} leading zeros)</span> : <span className="badge red">✗ invalid</span>) : <span className="muted">none. Issued on the registrar&apos;s authority, not by work.</span>],
          ["Transaction fee", "none. This ledger charges no gas; the cost is attention."],
          ["Parent transaction", i > 0 ? <Link to={`/tx/${ledger[i - 1].id}`}><Hash0x value={ledger[i - 1].eventHash} /></Link> : "GENESIS"],
        ]} />
        <p className="small"><b>Scope.</b> Success confirms that the transaction is intact relative to this copy of the ledger. It does not confirm that the underlying source is correct.</p>
      </Panel>
      <Panel title="Input data" kind="terminal"><pre className="payload">{JSON.stringify(e.payload, null, 2)}</pre></Panel>
      <LedgerEventDetail event={e} previous={ledger[i - 1]} />
      <p className="small">
        {i > 0 && <Link to={`/tx/${ledger[i - 1].id}`}>← {ledger[i - 1].id}</Link>}
        {i > 0 && i < ledger.length - 1 && " · "}
        {i < ledger.length - 1 && <Link to={`/tx/${ledger[i + 1].id}`}>{ledger[i + 1].id} →</Link>}
      </p>
    </main>
  );
}
