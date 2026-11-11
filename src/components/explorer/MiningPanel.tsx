import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CONFIG } from "../../config";
import { expectedAttempts, mineChunk, type MineProgress, with0x } from "../../services/chainService";
import { useRecords } from "../../store/localRecords";
import type { Direction } from "../../types/translation";
import { Panel } from "../shared";

interface View { nonce: number; last: string; bestZ: number; best: string; elapsed: number; feed: string[] }
const BLANK: View = { nonce: 0, last: "", bestZ: 0, best: "", elapsed: 0, feed: [] };

export function MiningPanel({ entityId, entityName, direction }: { entityId: string; entityName: string; direction: Direction }) {
  const { mempool, submitToMempool, dropFromMempool, issueCertificate, ledger } = useRecords();
  const nav = useNavigate();
  const [difficulty, setDifficulty] = useState<number>(CONFIG.miningDefaultDifficulty);
  const [running, setRunning] = useState(false);
  const [view, setView] = useState<View>(BLANK);
  const [msg, setMsg] = useState("");
  const prog = useRef<MineProgress | null>(null);

  const tx = mempool.find((m) => m.entityId === entityId && m.direction === direction);
  const head = ledger[ledger.length - 1].eventHash;
  const expected = expectedAttempts(difficulty);

  useEffect(() => {
    if (!running || !tx) return;
    let alive = true;
    prog.current = null;
    const t0 = performance.now();
    const step = async () => {
      if (!alive) return;
      const p = mineChunk(tx.certificateId, head, difficulty, prog.current, 16);
      prog.current = p;
      setView((v) => ({ nonce: p.nonce, last: p.lastHash, bestZ: p.bestZeros, best: p.bestHash, elapsed: (performance.now() - t0) / 1000, feed: [...v.feed, p.lastHash].slice(-9) }));
      if (p.found) {
        setRunning(false);
        const r = await issueCertificate(entityId, direction, p.found);
        if (r.stale) setMsg("The ledger advanced during computation and this proof is no longer valid. Restart on the current ledger head.");
        else nav(`/certificates/${r.certificateId}`);
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const submit = async () => { setMsg(""); setView(BLANK); await submitToMempool(entityId, direction); };
  const drop = () => { setRunning(false); if (tx) dropFromMempool(tx.key); setView(BLANK); };
  const rate = view.elapsed > 0 ? Math.round(view.nonce / view.elapsed) : 0;
  const pct = Math.min(100, (view.nonce / expected) * 100);

  return (
    <Panel title="Certificate issuance · proof-of-work queue" kind="office">
      <p className="small">
        Certificates are not issued on request. Each assessment is submitted to the pending queue (<b>mempool</b>) and is issued once this device completes a
        <b> proof-of-work</b> computation: the certificate ID, the latest ledger hash and a counter are hashed until the result begins with the required number of zeros.
        An assessment always resolves to the same certificate ID, so resubmission cannot produce a duplicate.
      </p>
      {!tx ? (
        <p><button className="primary" type="button" onClick={submit}>Submit {entityName} for issuance</button></p>
      ) : (
        <>
          <p className="small"><span className="badge orange">PENDING</span> <span className="mono">{tx.certificateId}</span> · {entityName} · {direction.replace(/_/g, " ")}</p>
          <div className="miner" aria-live="off">
            <label htmlFor="diff">Difficulty: {difficulty} leading zero hex digits (≈ {expected.toLocaleString()} hashes expected)</label>
            <input id="diff" type="range" min={1} max={6} value={difficulty} disabled={running} onChange={(e) => setDifficulty(Number(e.target.value))} />
            <p>
              {!running ? <button type="button" className="primary" onClick={() => { setMsg(""); setView(BLANK); setRunning(true); }}>Start mining</button> : <button type="button" onClick={() => setRunning(false)}>Stop</button>}
              <button type="button" onClick={drop}>Withdraw from mempool</button>
            </p>
            <div className="meter" aria-hidden="true"><i style={{ width: `${pct}%` }} /></div>
            <dl className="row">
              <dt>Target</dt><dd>0x{"0".repeat(difficulty)}{"…".padEnd(3, "…")}</dd>
              <dt>Building on</dt><dd>{with0x(head).slice(0, 22)}… (latest ledger hash)</dd>
              <dt>Nonce</dt><dd>{view.nonce.toLocaleString()}</dd>
              <dt>Hash rate</dt><dd>{rate.toLocaleString()} hashes / second · {view.elapsed.toFixed(1)} s</dd>
              <dt>Closest so far</dt><dd>{view.best ? `${view.bestZ} zeros: 0x${view.best.slice(0, 18)}…` : "—"}</dd>
            </dl>
            <div className="feed" aria-hidden="true">
              {view.feed.map((f, i) => <div key={i} className={f.startsWith("0".repeat(difficulty)) ? "hit" : ""}>0x{f}</div>)}
            </div>
          </div>
          <p className="small">
            Proof of work confirms that the computation was performed. It does not verify the sources, the rules or the assessment itself.
          </p>
        </>
      )}
      {msg && <p role="status" className="small"><b>{msg}</b></p>}
      <p className="small">Pending transactions are listed in the <Link to="/explorer">explorer&apos;s mempool</Link>. Pending submissions are held in this browser session only.</p>
    </Panel>
  );
}
