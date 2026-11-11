import { Link, Navigate, useParams } from "react-router-dom";
import { useRecords } from "../store/localRecords";
import { CONTRACT, KV, lookupAddress } from "../components/explorer/parts";
import { LedgerTimeline } from "../components/ledger/LedgerTimeline";
import { Panel } from "../components/shared";
import { entityAddress, isAddress, REGISTRAR_ADDRESS } from "../services/chainService";
import { getEntity } from "../services/registryService";
import NotFoundPage from "./NotFoundPage";

export default function AddressPage() {
  const { address = "" } = useParams();
  const { ledger, verification, witnesses } = useRecords();
  const a = address.toLowerCase();
  if (!isAddress(a)) return <NotFoundPage />;
  if (a === CONTRACT.address) return <Navigate to="/contract" replace />;
  const info = lookupAddress(a);
  const witnessed = ledger.filter((e) => e.eventType === "certificate_witnessed" && e.payload.witness === a);
  const isWitness = witnessed.length > 0 || witnesses.identities.includes(a);
  if (!info && !isWitness) return <NotFoundPage />;

  let kind = "", label = "", txs = ledger.filter(() => false), note = "";
  if (info?.kind === "entity") {
    const id = ledger.find((e) => e.entityId && entityAddress(e.entityId) === a)?.entityId ?? getEntity(info.label)?.id;
    kind = "Record address"; label = info.label;
    txs = ledger.filter((e) => e.entityId && entityAddress(e.entityId) === a);
    note = "Derived from the record ID. The address holds no balance and initiates no transactions; it identifies the record on the ledger.";
    void id;
  } else if (info?.kind === "registrar") {
    kind = "Office registrar"; label = info.label;
    txs = ledger.filter((e) => e.eventType !== "certificate_witnessed" && !e.eventType.startsWith("record_"));
    note = "Sole writer of the seed ledger. All registrations, translations and certificates were authorized by this address; the ledger is not decentralized.";
  } else {
    kind = "Witness identity"; label = "Created in a browser";
    txs = witnessed;
    note = "A random 20-byte value generated in a visitor's browser. No private key is associated with it, and one person may create any number of them.";
  }
  return (
    <main className="main stack">
      <div className="crumbs"><Link to="/explorer">Explorer</Link> › Address</div>
      <div className="pagehead"><h1>{kind}</h1><span className="badge blue">{label}</span></div>
      <Panel title="Overview" kind="terminal">
        <KV rows={[
          ["Address", <span className="hash">{a}</span>],
          ["Kind", kind],
          ["Record", info?.kind === "entity" ? <Link to={info.to}>{info.label}</Link> : "—"],
          ["Balance", "Not applicable. The Office assigns no monetary value to records."],
          ["Private key", "none exists"],
          ["Transactions", String(txs.length)],
        ]} />
        <p className="small">{note}</p>
        {info?.kind === "entity" && <p className="small mono">address = 0x + first 40 hex of SHA-256("ocf:entity:&lt;record id&gt;")</p>}
      </Panel>
      <Panel title={`Transactions${txs.length > 50 ? " (latest 50)" : ""}`} kind="terminal">
        {txs.length ? <LedgerTimeline events={txs} verification={verification} limit={50} /> : <p className="small">None yet.</p>}
      </Panel>
    </main>
  );
}
