import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useRecords } from "../store/localRecords";
import { recordStatus } from "../services/ledgerService";
import { CertificatePreview } from "../components/certificate/CertificatePreview";
import { LedgerTimeline } from "../components/ledger/LedgerTimeline";
import { Panel } from "../components/shared";
import { FinalityPanel } from "../components/explorer/FinalityPanel";
import NotFoundPage from "./NotFoundPage";
import { CONFIG } from "../config";

export default function CertificateDetailPage() {
  const { certificateId } = useParams();
  const { certificates, translations, ledger, verification, appendRecordEvent } = useRecords();
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const cert = certificates.find((c) => c.id === certificateId);
  if (!cert) return <NotFoundPage />;
  const tr = translations.find((t) => t.id === cert.translationRecordId);
  const status = recordStatus(ledger, cert.id);
  const history = ledger.filter((e) => e.certificateId === cert.id);

  const file = async (type: "record_corrected" | "record_disputed") => {
    if (!note.trim()) { setMsg("Please describe the correction or dispute first."); return; }
    await appendRecordEvent(type, cert.id, note);
    setNote("");
    setMsg("Recorded as a new ledger event. The original certificate and its events remain unchanged and visible.");
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ certificate: cert, translationRecord: tr, ledgerEvents: history }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${cert.id}.provenance.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <main className="main stack">
        <div className="crumbs"><Link to="/certificates">Certificates</Link> › {cert.id}</div>
        <div className="noprint">
          <button type="button" onClick={() => window.print()}>Print certificate</button>{" "}
          <button type="button" onClick={exportJson}>Export provenance JSON</button>
        </div>
        <CertificatePreview cert={cert} status={status} />

        <FinalityPanel cert={cert} />

        <Panel title="Translation record behind this certificate" kind="source">
          {tr ? (
            <>
              <p className="small mono">{tr.id} · generated {tr.generatedAt} · {tr.generationMethod} · rule set v{tr.ruleSetVersion}</p>
              <table className="data">
                <thead><tr><th>Rule</th><th>Original</th><th>Office translation</th><th>Label</th></tr></thead>
                <tbody>
                  {(tr.translatedContent.outputs as { ruleId: string; translatedValue: string; confidenceLabel: string }[]).map((o, i) => {
                    const orig = (tr.originalContent.outputs as { sourceLabel: string }[])[i];
                    return (<tr key={i}><td className="id">{o.ruleId}</td><td>{orig?.sourceLabel}</td><td>{o.translatedValue}</td><td className="mono">{o.confidenceLabel}</td></tr>);
                  })}
                </tbody>
              </table>
              <p className="small"><Link to={`/translate/${cert.entityId}`}>Re-run this translation in the Engine</Link></p>
            </>
          ) : <p>Translation record not found.</p>}
        </Panel>

        <Panel title="History of this certificate (ledger)" kind="terminal">
          <LedgerTimeline events={history} verification={verification} />
        </Panel>

        <Panel title="Correction or dispute" kind="office">
          <p className="small">
            Corrections and disputes never overwrite a certificate: they append a new event to the ledger, and the certificate&apos;s displayed status changes while its history stays visible.
            Entries are stored in <b>this browser only</b>. Do not enter personal information. For a factual error in a source record, see <Link to="/methods#corrections">Methodology &amp; Terms</Link>: {CONFIG.correctionsContact}
          </p>
          <label htmlFor="note">Describe the issue (max 500 characters)</label>
          <textarea id="note" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
          <p>
            <button type="button" onClick={() => file("record_corrected")}>Record correction</button>{" "}
            <button type="button" onClick={() => file("record_disputed")}>Record dispute</button>
          </p>
          {msg && <p role="status" className="small"><b>{msg}</b></p>}
        </Panel>
      </main>
      <aside className="aside" aria-label="What this certifies">
        <h2>What this certifies</h2>
        <p className="small">That, on the date shown, the Office&apos;s rules (version {cert.ruleSetVersion}) were applied to the identified source snapshot and produced this interpretation.</p>
        <h2>What it does not</h2>
        <p className="small">It does not endorse, value or rank the entity, and it does not show that the sources are correct or that the classification is fair.</p>
        <h2>Status</h2>
        <p><span className="badge gray">{status}</span> <span className="badge">simulated / local</span></p>
      </aside>
    </>
  );
}
