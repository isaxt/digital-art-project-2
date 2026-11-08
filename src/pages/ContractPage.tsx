import { Link } from "react-router-dom";
import { useRecords } from "../store/localRecords";
import { CONTRACT, KV } from "../components/explorer/parts";
import { Panel } from "../components/shared";
import { blockOfEvent, REGISTRAR_ADDRESS } from "../services/chainService";
import { ruleSet } from "../services/registryService";
import { sha256HexSync } from "../utils/sha256";
import { fmtTimestamp } from "../utils/dates";

export default function ContractPage() {
  const { ledger, blocks } = useRecords();
  const recomputed = sha256HexSync(CONTRACT.source);
  const verified = recomputed === CONTRACT.hash && `0x${recomputed.slice(0, 40)}` === CONTRACT.address;
  const firstUse = ledger.findIndex((e) => e.ruleSetVersion === CONTRACT.version);
  const calls = ledger.filter((e) => e.ruleSetVersion === CONTRACT.version && (e.eventType === "translation_created" || e.eventType === "certificate_issued"));
  const otherVersions = new Set(ledger.map((e) => e.ruleSetVersion).filter((v) => v && v !== CONTRACT.version));
  return (
    <main className="main stack">
      <div className="crumbs"><Link to="/explorer">Explorer</Link> › Contract</div>
      <div className="pagehead"><h1>Contract: {CONTRACT.name}</h1><span className="badge blue">v{CONTRACT.version}</span>{verified && <span className="verified">✓ SOURCE VERIFIED</span>}</div>
      <p className="intro">
        The Office&apos;s translation rules, presented as a smart contract. Each rule is a function that takes a recorded fact and returns an interpretation. Once written as code,
        an analogy such as <i>an exhibition is a traction event</i> stops looking like a choice and starts looking like a law of nature.
      </p>
      <Panel title="Overview" kind="terminal">
        <KV rows={[
          ["Contract address", <span className="hash">{CONTRACT.address}</span>],
          ["Name · version", `${CONTRACT.name} · v${CONTRACT.version}`],
          ["Source hash (SHA-256)", <span className="hash">0x{CONTRACT.hash}</span>],
          ["Verified source", verified ? <span className="verified">✓ the hash of the source below, recomputed in your browser just now, equals this address</span> : <span className="badge red">✗ mismatch</span>],
          ["Creator", <Link to={`/address/${REGISTRAR_ADDRESS}`} className="mono">{REGISTRAR_ADDRESS}</Link>],
          ["First used", firstUse >= 0 ? <><Link to={`/tx/${ledger[firstUse].id}`}>{ledger[firstUse].id}</Link> in <Link to={`/block/${blockOfEvent(blocks, firstUse).height}`}>block #{blockOfEvent(blocks, firstUse).height}</Link> · {fmtTimestamp(ledger[firstUse].timestamp)}</> : "not yet"],
          ["Calls", `${calls.length} (translations and certificates issued under this version)`],
          ["Upgradeable", <b>No. No upgrades after deployment.</b>],
          ["Other versions on this chain", otherVersions.size ? [...otherVersions].join(", ") : "none"],
        ]} />
        <p className="small">
          <b>What “no upgrades” means here.</b> Change one character of the rules and the hash, and therefore the address, changes: the old rules cannot be quietly edited, only replaced by a different contract.
          <b> What it does not mean:</b> the rules were drafted and revised freely before this chain existed, nothing on-chain records who chose these analogies or why, and a rule set that cannot be edited is not a rule set that is right.
          Immutability protects the wording; it says nothing about the judgment.
        </p>
      </Panel>

      <Panel title="Read contract" kind="source">
        <p className="small">Every rule, as a callable. Inputs are fields of a source snapshot; outputs are interpretations with a stated limitation. The limitation is part of the code.</p>
        <div className="scroll-x">
          <table className="data">
            <thead><tr><th>Function</th><th>Reads</th><th>Returns</th><th>Confidence</th><th>Limitation (revert reason)</th></tr></thead>
            <tbody>
              {ruleSet.rules.map((r) => (
                <tr key={r.id}>
                  <td className="id">{r.id}(snapshot)</td>
                  <td className="mono small">{r.inputFields.join(", ")}</td>
                  <td>{r.outputLabel}</td>
                  <td className="mono small">{r.confidenceLabel}</td>
                  <td className="small">{r.limitation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Contract source (canonical JSON)" kind="terminal">
        <pre className="src" tabIndex={0}>{CONTRACT.source}</pre>
        <p className="small">This is exactly what is hashed. Keys are sorted and strings normalized, so the same rules always give the same address. Human-readable version: <Link to="/methods#rules">Methods / Terms</Link>.</p>
      </Panel>
    </main>
  );
}
