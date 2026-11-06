import { CONFIG } from "../config";
import { entities, ruleSet, sources } from "../services/registryService";
import { Panel } from "../components/shared";

export default function MethodsPage() {
  const providers = [...new Map(sources.map((s) => [s.provider, s.sourceUrl])).entries()];
  return (
    <main className="main stack" style={{ maxWidth: 980 }}>
      <div className="pagehead"><h1>Methods / Terms</h1><span className="id">RULE SET v{ruleSet.version}</span></div>
      <p className="intro">This page is part of the work. It states what the Office knows, how it knows it, and what its certificates cannot establish.</p>

      <Panel title="1. Sources" kind="source" id="sources">
        <p>Records come from a small set of cited public pages, retrieved on 2026-11-05 and saved as a fixed dataset. The website never calls these sources live, so it works when they are unavailable and every certificate keeps the exact snapshot it used.</p>
        <ul>{providers.map(([p, u]) => <li key={p}><a href={u} target="_blank" rel="noopener noreferrer">{p}</a></li>)}</ul>
        <p className="small">Planned adapters (not yet run for this dataset): Art Institute of Chicago API, The Met Collection API, Wikidata Query Service, SEC EDGAR, Companies House. See docs/DATA_SOURCES.md.</p>
        <p className="small"><b>How records were obtained:</b> source pages were read through an automated page summary and have <b>not yet been checked line by line by a person</b>. Each source record carries a verification status and a reviewer note saying what is still unconfirmed. Records marked PARTIAL or NEEDS REVIEW should not be quoted as verified.</p>
      </Panel>

      <Panel title="2. Selection" kind="source">
        <p>The first intake is {entities.length} hand-selected records (target: 20–40). Each entity page states why the record was chosen. Selection favours records that make the comparison instructive, including records where the analogy fails. Museum acquisition and funding are not treated as measures of merit, and inclusion is not endorsement.</p>
        <p className="small">The intake is currently smaller than the 20–40 target, and has no artist with very sparse public information yet. Both are listed as open work in the README.</p>
      </Panel>

      <Panel title="3. Fields collected" kind="source">
        <p>Entity name and type, a verbatim source description or pitch line, dated events with both the source&apos;s own category and the Office&apos;s normalized category, source URLs, retrieval dates and a verification status. No personal contact information is collected. No valuations, funding amounts or revenue figures are recorded unless a cited source states them.</p>
      </Panel>

      <Panel title="4. Translation rules" kind="office" id="rules">
        <p>Rules are explicit, versioned and deterministic. No AI is used anywhere in this version. Every translated line names its rule, and each rule states what it reads, what it produces, why the analogy is offered and where it fails.</p>
        <div className="scroll-x">
          <table className="data">
            <thead><tr><th>Rule</th><th>Reads</th><th>Produces</th><th>Rationale</th><th>Limitation</th></tr></thead>
            <tbody>
              {ruleSet.rules.map((r) => (
                <tr key={r.id}><td className="id">{r.id} v{r.version}</td><td className="mono">{r.inputFields.join(", ")}</td><td>{r.outputLabel}</td><td>{r.rationale}</td><td>{r.limitation}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="5. What is fictional" kind="office">
        <p>All Office classifications, translations, certificate wording and institutional framing are authored interpretations. Classification codes (OCF-C3, OCF-C2, OCF-C0) describe how many source facts the rules could read. They are not quality, merit, potential or investment ratings, and no ranking is produced.</p>
      </Panel>

      <Panel title="6. Missing data">
        <p>Missing data is shown as <i>unavailable in selected sources</i> and as hatched squares in the Registry. It is never converted into zero, failure or a low classification. A record with nothing the rules can read receives “Not classified: insufficient mapped data (no inference drawn)”.</p>
      </Panel>

      <Panel title="7. The ledger: what it can and cannot verify" kind="terminal" id="ledger">
        <p>{CONFIG.ledgerLabel}</p>
        <ul>
          <li>Each event stores a SHA-256 hash of its canonical payload plus the previous event&apos;s hash. Events are never overwritten; corrections and disputes append new events.</li>
          <li>The chain is verified from the first event each time the site loads.</li>
          <li><b>It can show</b> that an event is unchanged relative to the copy being viewed, and which snapshot and rule-set version produced it.</li>
          <li><b>It cannot show</b> that a source claim is true, that the Office&apos;s judgment is fair, or that the chain was not rewritten as a whole by whoever controls it. It is not decentralized, trustless or independently immutable.</li>
          <li>No testnet anchor exists. If one is added, only a hash will be anchored, and a transaction would confirm only that a hash was submitted, not that its content is true or meritorious.</li>
          <li>Records you create are stored in your browser only (localStorage) and are never sent anywhere.</li>
        </ul>
      </Panel>

      <Panel title="8. Corrections and revisions" id="corrections">
        <p>A factual error in a source record can be reported to: {CONFIG.correctionsContact}. In the prototype, a correction or dispute can also be recorded against any certificate; it appends a ledger event, changes the displayed status, and keeps the original visible.</p>
      </Panel>

      <Panel title="9. Reuse and accessibility">
        <p>Only short factual fields and brief attributed excerpts are stored; no images are reproduced. Public availability is not treated as permission for unrestricted reuse. Check each source&apos;s terms before reusing. The site uses semantic HTML, keyboard-operable controls and visible focus, and does not rely on colour alone for status.</p>
      </Panel>
    </main>
  );
}
