import { CONFIG } from "../config";
import { entities, ruleSet, sources } from "../services/registryService";
import { Panel } from "../components/shared";

export default function MethodsPage() {
    return (
    <main className="main stack" style={{ maxWidth: 980 }}>
      <div className="pagehead"><h1>Methodology &amp; Terms</h1><span className="id">RULE SET v{ruleSet.version}</span></div>
      <p className="intro">This page sets out the Office&apos;s data sources, assessment rules and record-keeping, and the limits of what its certificates establish.</p>

      <Panel title="1. Data sources" kind="source" id="sources">
        <p>
          <b>Policy: real entities, cited source records, disclosed interpretation.</b> Every gallery, artist and startup in the Registry comes from one of two supplied datasets, kept unchanged in <span className="mono">src/data/raw/</span>:
        </p>
        <ul>
          <li><b>Contemporary Fine Art Galleries — New York City and San Francisco</b> (schema 1.0.0, generated 2026-11-07): {entities.filter((e) => e.entityType === "gallery").length} galleries and art spaces, with artist rosters and current exhibitions where parsed.</li>
          <li><b>NYC + San Francisco Startup Directory</b> (schema 1.0.0, generated 2026-11-07): {entities.filter((e) => e.entityType === "startup").length} startups and technology companies, with sectors, accelerators and batches where recorded.</li>
        </ul>
        <p>The Office does not generate, simulate or add records. Names, descriptions, URLs, classifications, status fields and notes are preserved as supplied. The website never calls these sources live, so every certificate keeps the exact snapshot it used. Source pages linked from each record are the datasets&apos; own references; they open the gallery, company or directory site.</p>
        <p className="small">Source families linked from records:</p>
        <ul className="small"><li>Gallery websites, roster pages and exhibition pages ({sources.filter((s) => entities.find((e) => e.id === s.entityId)?.entityType === "gallery").length} source records)</li><li>Company websites and accelerator directory pages (Y Combinator, South Park Commons)</li></ul>
        <p className="small"><b>Review status.</b> The datasets mark some sections <i>verified</i> and others <i>not yet parsed</i>. The Office shows these labels as supplied and adds no verification of its own. A status describes review state, not quality, and an unparsed section is never a finding of absence.</p>
      </Panel>

      <Panel title="2. What the Office derives, and what it never infers" kind="source">
        <ul>
          <li><b>Artists.</b> The galleries dataset has no artist-level records. An artist entity exists only because its exact name appears in a parsed roster or in an exhibition listing. Identity is by exact name string; same-named people are not disambiguated and different spellings are not merged.</li>
          <li><b>Roster.</b> A name on a parsed roster page is shown as such. The dataset states no terms of representation. A gallery whose roster is <i>not yet parsed</i> shows no artists, which means unknown, never “none”.</li>
          <li><b>Exhibitions.</b> Shown as the gallery&apos;s listing on the date it was checked, with venue and dates as supplied. “Group exhibition” placeholders are not turned into artists. One listing is at a Paris venue under a gallery with a New York record; the venue is displayed, not corrected.</li>
          <li><b>Never inferred:</b> accelerator batches, company locations or headquarters, artist representation, exhibition participation beyond the listing, funding, valuations or market value. A missing accelerator means “none recorded”, not “never joined one”.</li>
          <li><b>Duplicate ID in the supplied file.</b> <span className="mono">hashimoto_contemporary</span> appears twice (New York and San Francisco entries). Both are kept as separate records with the city appended to their registry ID; the original ID is shown as “Dataset ID”. The Office has not decided whether they are one gallery or a data-entry repeat.</li>
        </ul>
      </Panel>

      <Panel title="3. Fields collected" kind="source">
        <p>Record ID (original where supplied), name, type, category, city association, description (startups), sector labels, accelerator and batch, roster names, exhibition titles, venues and dates, source URLs, the dataset&apos;s own status fields and notes. No personal contact information, valuations, funding amounts or revenue figures are recorded. Additional records may be added later only from identifiable real-world sources with their URLs and verification status.</p>
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

      <Panel title="5. Status of Office assessments" kind="office">
        <p>All Office classifications, translations, certificate wording and institutional framing are authored interpretations. Classification codes (OCF-C3, OCF-C2, OCF-C0) describe how many source facts the rules could read. They are not quality, merit, potential or investment ratings, and no ranking is produced.</p>
      </Panel>

      <Panel title="6. Missing data">
        <p>Missing data is shown as <i>not recorded</i> or <i>not yet parsed</i> and as hatched squares in the Registry. It is never converted into zero, failure or a low classification. A record with nothing the rules can read receives “Not classified: insufficient mapped data (no inference drawn)”.</p>
      </Panel>

      <Panel title="7. Ledger: scope of verification" kind="terminal" id="ledger">
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

      <Panel title="8. Explorer conventions: blocks, confirmations, mining, witnesses" kind="terminal" id="chain">
        <p>
          The <a href="#/explorer">Explorer</a> reads the ledger the way a public chain is read. These are <b>presentation devices over one local ledger</b>, not a network. Nothing is stored for them; all of it is recomputed from the events.
        </p>
        <ul>
          <li><b>Blocks:</b> every 8 events are grouped, with a simplified Merkle root and a hash linking to the previous block. The last group is open and its hash is provisional.</li>
          <li><b>Addresses:</b> <code>0x…</code> values are hashes of record IDs. No keys exist, so no one can sign as an address.</li>
          <li><b>Confirmations:</b> the number of later events. They accumulate whether or not anyone checked the certificate. Six counts as buried.</li>
          <li><b>Rules contract:</b> the rule set is shown with an address that is the hash of its canonical text. “No upgrades” means a changed rule has a different address. It does not mean the rules are right, and the Office can publish a new contract.</li>
          <li><b>Mining:</b> certificates wait in a mempool until your browser finds a nonce. The work proves hashing took place. It does not test the sources or the rules.</li>
          <li><b>Witnessing:</b> three distinct witness addresses mark a certificate “finalized”. Anyone can create addresses without limit, so this is a Sybil-vulnerable quorum, shown as such.</li>
        </ul>
        <p>The seed ledger holds 54 certificates, all for startups and all from one rule (accelerator to network). Galleries have no translation direction, so none is issued for them, and artist certificates start unissued so visitors can mine them.</p>
      </Panel>

      <Panel title="9. Corrections and revisions" id="corrections">
        <p>A factual error in a source record can be reported to: {CONFIG.correctionsContact}. A correction or dispute can also be recorded against any certificate; it appends a ledger event, changes the displayed status, and keeps the original visible.</p>
      </Panel>

      <Panel title="10. Reuse and accessibility">
        <p>Only short factual fields and brief attributed excerpts are stored; no images are reproduced. Public availability is not treated as permission for unrestricted reuse. Check each source&apos;s terms before reusing. The site uses semantic HTML, keyboard-operable controls and visible focus, and does not rely on colour alone for status.</p>
      </Panel>
    </main>
  );
}
