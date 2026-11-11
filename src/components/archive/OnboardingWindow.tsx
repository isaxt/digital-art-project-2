import { useState } from "react";
import { CONFIG } from "../../config";
import { articles } from "../../services/articleService";
import { ArticleContent } from "./ArticleContent";
import { useModal } from "./useModal";

/**
 * First-visit orientation. Step 1: the concept. Step 2: where it came from (the original post).
 * Dismissable at any step; re-openable from the header, footer and Archive.
 */
export function OnboardingWindow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const { box, initial } = useModal(onClose, [onClose, step]);
  const article = articles[0];

  return (
    <div className="sw-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sw ob" role="dialog" aria-modal="true" aria-labelledby="ob-title" ref={box}>
        <div className="ob__bar">
          <span className="ob__title">Office orientation <span className="mono">· step {step} of 2</span></span>
          <button className="ob__x" onClick={onClose} aria-label="Close orientation">✕</button>
        </div>

        {step === 1 ? (
          <div className="sw__scroll ob__scroll" tabIndex={0} role="region" aria-label="The concept">
            <div className="ob__pane">
              <p className="ob__eyebrow">Orientation</p>
              <h1 id="ob-title" className="ob__h1">{CONFIG.institutionName}</h1>
              <p className="ob__lede">
                The Office of Cultural Futures maintains a public registry of galleries, artists and startups. It assesses each record against a published rule set, translates its recorded activity into the vocabulary of the other sector, and issues certificates of anticipated cultural and economic potential.
              </p>

              <p className="ob__q"><b>Mandate.</b> To make anticipated potential comparable across the creative and venture economies, and to keep a verifiable record of every assessment.</p>

              <h2 className="ob__h2">Services</h2>
              <ol className="ob__list">
                <li><b>The Registry.</b> Galleries, artists and startups compiled from two source-linked datasets.</li>
                <li><b>The Translation Engine.</b> Nine published rules that restate one sector&apos;s recorded activity in the other&apos;s terms: an exhibition is assessed as a traction event, an accelerator place as network validation. Each rule states its limitation.</li>
                <li><b>The Cultural Capital Protocol.</b> An append-only ledger recording the sources, rule and snapshot behind every certificate.</li>
              </ol>

              <h2 className="ob__h2">Reading a record</h2>
              <ul className="ob__list">
                <li><span className="origin source">Source fact</span> is taken from a cited page. <span className="origin office">Office interpretation</span> is authored by the Office and is not a fact.</li>
                <li>Missing information is recorded as Not available and carries no negative weight.</li>
                <li>The ledger is a local, simulated record, not a blockchain. It verifies that entries are unaltered, not that they are correct.</li>
              </ul>

              <div className="ob__nav">
                <button className="primary" ref={(el) => { initial.current = el; }} onClick={() => setStep(2)}>Next: founding document</button>
                <button onClick={onClose}>Skip</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="ob__intro">
              <h1 id="ob-title" className="ob__h2" style={{ margin: 0 }}>Founding document</h1>
              <p className="small" style={{ margin: "2px 0 0" }}>
                The founding text of the Office, first published on Substack on 23 August 2025, is reproduced below for reference. It remains available under <b>Archive</b>.
              </p>
            </div>
            <div className="sw__scroll sw--reader" tabIndex={0} role="region" aria-label={`Original post: ${article.title}`}>
              <ArticleContent article={article} titleId="ob-article-title" />
            </div>
            <div className="ob__nav ob__nav--foot">
              <button onClick={() => setStep(1)}>Back</button>
              <button className="primary" ref={(el) => { initial.current = el; }} onClick={onClose}>Continue to the Registry</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
