import { useState } from "react";
import { Link } from "react-router-dom";
import { CONFIG } from "../../config";
import { Addr, Conf } from "./parts";
import { confirmations, isBuried, isFinalized, verifyPow, witnessesOf, with0x } from "../../services/chainService";
import { useRecords } from "../../store/localRecords";
import type { Certificate } from "../../types/certificate";
import { Panel } from "../shared";

export function FinalityPanel({ cert }: { cert: Certificate }) {
  const { ledger, witnesses, newWitness, selectWitness, witness } = useRecords();
  const [msg, setMsg] = useState("");
  const idx = ledger.findIndex((e) => e.id === cert.ledgerEventId);
  const conf = idx >= 0 ? confirmations(ledger.length, idx) : 0;
  const ws = witnessesOf(ledger, cert.id);
  const finalized = isFinalized(ws.length);
  const pow = cert.proofOfWork;
  const mine = witnesses.active && ws.includes(witnesses.active);
  const allLocal = ws.length > 0 && ws.every((w) => witnesses.identities.includes(w));

  const act = async () => {
    const r = await witness(cert.id);
    setMsg(r === "ok" ? "Attestation recorded as a new ledger event. All earlier entries gain one confirmation." : r === "duplicate" ? "This identity has already witnessed this certificate." : "Create a witness identity before attesting.");
  };

  return (
    <Panel title="Finality status" kind="office">
      <table className="data">
        <thead><tr><th>Kind</th><th>Status</th><th>Basis</th></tr></thead>
        <tbody>
          <tr>
            <td><b>Burial</b></td>
            <td><Conf n={conf} /> {isBuried(conf) && <span className="final">FINAL BY BURIAL</span>}</td>
            <td className="small">Number of ledger events recorded after this certificate. Increases with ledger activity, independent of review.</td>
          </tr>
          <tr>
            <td><b>Quorum</b></td>
            <td>
              <div className="quorum" aria-label={`${ws.length} of ${CONFIG.quorum} witnesses`}>{Array.from({ length: Math.max(CONFIG.quorum, ws.length) }, (_, i) => <i key={i} className={i < ws.length ? "on" : ""} />)}</div>
              <span className="mono">{ws.length} / {CONFIG.quorum} witnesses</span>{" "}
              {finalized ? <span className="final">FINALIZED BY QUORUM</span> : <span className="final no">NOT FINALIZED</span>}
            </td>
            <td className="small">Number of distinct witness addresses that have attested. Attestation does not confirm accuracy.</td>
          </tr>
          <tr>
            <td><b>Work</b></td>
            <td>{pow ? (verifyPow(cert.id, pow) ? <span className="verified">✓ nonce {pow.nonce.toLocaleString()} · {pow.difficulty} zeros · {with0x(pow.hash).slice(0, 14)}…</span> : <span className="badge red">✗ invalid proof</span>) : <span className="muted">none</span>}</td>
            <td className="small">{pow ? "Issued after a proof-of-work computation at the stated difficulty." : "Issued by the Registrar (seed record); no proof of work."}</td>
          </tr>
        </tbody>
      </table>

      <h3 style={{ marginTop: 10 }}>Attestation</h3>
      <p className="small">
        Witness identities are generated locally. No signing key or identity verification is required to attest.
      </p>
      <div className="filters" style={{ alignItems: "flex-end" }}>
        <div>
          <label htmlFor="wid">Witness identity</label>
          <select id="wid" value={witnesses.active ?? ""} onChange={(e) => selectWitness(e.target.value)} disabled={!witnesses.identities.length}>
            {!witnesses.identities.length && <option value="">none yet</option>}
            {witnesses.identities.map((w) => <option key={w} value={w}>{w.slice(0, 10)}…{w.slice(-6)}</option>)}
          </select>
        </div>
        <button type="button" onClick={() => { newWitness(); setMsg(""); }}>New witness identity</button>
        <button type="button" className="primary" onClick={act} disabled={!witnesses.active || !!mine}>{mine ? "Already witnessed" : "Witness this certificate"}</button>
      </div>
      {msg && <p role="status" className="small"><b>{msg}</b></p>}
      {ws.length > 0 && (
        <ul className="small" style={{ margin: "6px 0", paddingLeft: 18 }}>{ws.map((w) => <li key={w}><Addr address={w} full /></li>)}</ul>
      )}
      <p className="sybil">
        <b>Identity notice.</b> Witness identities can be created without limit from a single browser. A quorum of {CONFIG.quorum} may therefore represent a single party, and the ledger cannot distinguish the two
        {allLocal && ws.length >= 2 ? <>. <b>All {ws.length} witnesses on this certificate originate from this browser.</b></> : "."}
      </p>
      <p className="small">
        Finalized status indicates that the quorum threshold was met. It is not a determination of accuracy. The rules being attested to are published in the <Link to="/contract">rules contract</Link>.
      </p>
    </Panel>
  );
}
