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
              <p className="ob__eyebrow">Welcome</p>
              <h1 id="ob-title" className="ob__h1">{CONFIG.institutionName}</h1>
              <p className="ob__lede">
                A speculative institution, and a work of art. It registers artists, startups and creative projects, translates what is known about each into the other&apos;s language, and issues certificates of their anticipated potential.
              </p>

              <blockquote className="ob__q">
                If we can register potential, certify reputation, and record belief, have we made creativity more valuable, or merely made it easier to trade?
              </blockquote>

              <h2 className="ob__h2">Three systems</h2>
              <ol className="ob__list">
                <li><b>The Registry.</b> A small catalogue of artists, startups and institutions, built from cited public records.</li>
                <li><b>The Translation Engine.</b> Explicit rules that reframe one world&apos;s facts in the other&apos;s vocabulary: an exhibition becomes a “traction event”, a funding round becomes “patronage”. The analogies are deliberately imperfect, and every rule shows its limitation.</li>
                <li><b>The Cultural Capital Protocol.</b> A ledger of the Office&apos;s own actions, recording which sources and which rule produced each certificate.</li>
              </ol>

              <h2 className="ob__h2">How to read it</h2>
              <ul className="ob__list">
                <li><span className="origin source">Source fact</span> is taken from a cited page. <span className="origin office">Office interpretation</span> is authored by the Office and is not a fact.</li>
                <li>Missing information is shown as unknown, never as a low score.</li>
                <li>The ledger is a local simulation, not a blockchain, and it cannot show that anything it records is true.</li>
              </ul>

              <div className="ob__nav">
                <button className="primary" ref={(el) => { initial.current = el; }} onClick={() => setStep(2)}>Next: where this idea came from →</button>
                <button onClick={onClose}>Skip to the Office</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="ob__intro">
              <h1 id="ob-title" className="ob__h2" style={{ margin: 0 }}>Where this idea came from</h1>
              <p className="small" style={{ margin: "2px 0 0" }}>
                The project began as a note and a Substack post. The original text is reproduced below; scroll to read it. It stays available later under <b>Archive</b>.
              </p>
            </div>
            <div className="sw__scroll sw--reader" tabIndex={0} role="region" aria-label={`Original post: ${article.title}`}>
              <ArticleContent article={article} titleId="ob-article-title" />
            </div>
            <div className="ob__nav ob__nav--foot">
              <button onClick={() => setStep(1)}>← Back</button>
              <button className="primary" ref={(el) => { initial.current = el; }} onClick={onClose}>Enter the Office →</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
