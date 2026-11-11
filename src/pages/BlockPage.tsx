import { Link, useParams } from "react-router-dom";
import { useRecords } from "../store/localRecords";
import { CONFIG } from "../config";
import { Hash0x, KV, Conf } from "../components/explorer/parts";
import { Panel } from "../components/shared";
import { merkleLevels } from "../services/chainService";
import { fmtTimestamp } from "../utils/dates";
import NotFoundPage from "./NotFoundPage";

export default function BlockPage() {
  const { height } = useParams();
  const { blocks } = useRecords();
  const b = blocks[Number(height)];
  if (!b || !/^\d+$/.test(height ?? "")) return <NotFoundPage />;
  const levels = merkleLevels(b.events.map((e) => e.eventHash));
  const conf = blocks.length - 1 - b.height;
  const idOf = new Map(b.events.map((e) => [e.eventHash, e.id]));
  return (
    <main className="main stack">
      <div className="crumbs"><Link to="/explorer">Explorer</Link> › Block {b.height}</div>
      <div className="pagehead"><h1>Block #{b.height}</h1><span className={`badge ${b.sealed ? "green" : "orange"}`}>{b.sealed ? "sealed" : "open (provisional hash)"}</span></div>
      <Panel title="Overview" kind="terminal">
        <KV rows={[
          ["Block height", <span className="mono">{b.height}</span>],
          ["Status", b.sealed ? "Sealed: full, hash will not change unless an earlier event is altered." : `Open: holds ${b.events.length} of ${CONFIG.blockSize} events. Its hash changes when the next event arrives.`],
          ["Timestamp", fmtTimestamp(b.timestamp)],
          ["Transactions", `${b.events.length} (events ${b.events[0].id} to ${b.events[b.events.length - 1].id})`],
          ["Block hash", <Hash0x value={b.hash} full />],
          ["Parent hash", b.height > 0 ? <Link to={`/block/${b.height - 1}`}><Hash0x value={b.previousBlockHash} full /></Link> : "GENESIS (no parent)"],
          ["Merkle root", <Hash0x value={b.merkleRoot} full />],
          ["Confirmations", <><Conf n={conf} /> <span className="small muted">(blocks on top)</span></>],
          ["Miner", "none. The Office registrar wrote these events; no work was done to seal this block."],
        ]} />
        <p className="small">Block hash = SHA-256 of height, parent hash, Merkle root, timestamp and event count. The grouping is a presentation rule (every {CONFIG.blockSize} events), not a consensus.</p>
      </Panel>

      <Panel title="Merkle tree of this block's transaction hashes" kind="source">
        <div className="merkle">
          {[...levels].reverse().map((lv, i) => {
            const isLeaf = i === levels.length - 1;
            return (
              <div key={i}>
                <div className="tag">{i === 0 ? "root" : isLeaf ? "leaves (transaction hashes)" : `level ${levels.length - 1 - i}`}</div>
                <div className="lvl">
                  {lv.map((x, j) => (
                    <div key={j} title={`0x${x}`}>
                      {isLeaf && idOf.get(x) ? <Link to={`/tx/${idOf.get(x)}`}>{idOf.get(x)}</Link> : null}
                      <div>0x{x.slice(0, 10)}…</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="small">Simplified Merkle tree: each parent is the SHA-256 of its two children&apos;s hex strings; an odd final node is paired with itself. It allows a transaction to be proven part of a block without the others.</p>
      </Panel>

      <Panel title="Transactions in this block" kind="terminal">
        <div className="scroll-x">
          <table className="term">
            <thead><tr><th>Tx</th><th>Hash</th><th>Method</th><th>Record</th><th>Time (UTC)</th></tr></thead>
            <tbody>
              {b.events.map((e) => (
                <tr key={e.id}>
                  <td><Link to={`/tx/${e.id}`}>{e.id}</Link></td>
                  <td><Hash0x value={e.eventHash} /></td>
                  <td>{e.eventType}</td>
                  <td>{e.entityId ? <Link to={`/registry/${e.entityId}`}>{e.entityId}</Link> : "—"}</td>
                  <td className="nowrap">{fmtTimestamp(e.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <p className="small">
        {b.height > 0 && <Link to={`/block/${b.height - 1}`}>← Block {b.height - 1}</Link>}
        {b.height > 0 && b.height < blocks.length - 1 && " · "}
        {b.height < blocks.length - 1 && <Link to={`/block/${b.height + 1}`}>Block {b.height + 1} →</Link>}
      </p>
    </main>
  );
}
