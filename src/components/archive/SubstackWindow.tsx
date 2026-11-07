import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { articleBlocks, type ArticleMeta } from "../../services/articleService";

/** **bold** and *italic* only. Everything else is rendered as plain text (no HTML injection). */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SubstackWindow({ article, onClose }: { article: ArticleMeta; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const blocks = articleBlocks(article);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key !== "Tab" || !box.current) return;
      const items = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="sw-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`sw sw--${article.style}`} role="dialog" aria-modal="true" aria-labelledby="sw-title" ref={box}>
        <div className="sw__bar">
          {article.style === "reader" ? (
            <>
              <button ref={closeBtn} className="sw__x sw__x--box" onClick={onClose} aria-label="Close article">✕</button>
              <span className="sw__avatar sw__avatar--sm" aria-hidden="true" />
              <span className="sw__dots" aria-hidden="true">•••</span>
            </>
          ) : (
            <>
              <span className="sw__wintitle">{article.publication}</span>
              <button ref={closeBtn} className="sw__x" onClick={onClose} aria-label="Close article">✕</button>
            </>
          )}
        </div>

        <div className="sw__scroll" tabIndex={0} role="region" aria-label={`Article text: ${article.title}`}>
          <article className="sw__article">
            <div className="sw__section">{article.section}</div>
            <h1 id="sw-title" className="sw__title">{article.title}</h1>
            <p className="sw__subtitle">{article.subtitle}</p>
            <div className="sw__byline">
              {article.style === "reader" && <span className="sw__avatar" aria-hidden="true" />}
              <div>
                {article.style === "reader" && <div className="sw__author">{article.author}</div>}
                <div className="sw__date">
                  {article.style === "editorial" ? `${article.author} · ${article.date}` : article.date}
                </div>
              </div>
            </div>
            <hr className="sw__rule" />

            <div className="sw__body">
              {blocks.map((b, i) =>
                b.kind === "hr" ? <hr key={i} className="sw__rule" />
                : b.kind === "h" ? <h2 key={i}>{b.text}</h2>
                : b.kind === "quote" ? <blockquote key={i}>{inline(b.text)}</blockquote>
                : <p key={i}>{inline(b.text)}</p>,
              )}
              {!article.complete && (
                <p className="sw__pending" role="note">
                  [Full text pending. This replica currently shows only the opening passage.]
                </p>
              )}
            </div>
            <p className="sw__replica">
              Replica of the original post, reproduced by the artist. {article.url && (
                <a href={article.url} target="_blank" rel="noopener noreferrer">View original on Substack<span className="sr-only"> (opens in a new tab)</span></a>
              )}
            </p>
          </article>
        </div>

        {article.style === "reader" && (
          <div className="sw__actions" aria-hidden="true">
            <span>♡ {article.likes || ""}</span><span>▢</span><span>⟳</span><span>⇪</span>
          </div>
        )}
      </div>
    </div>
  );
}
