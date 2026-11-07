import type { ArticleMeta } from "../../services/articleService";
import { ArticleContent } from "./ArticleContent";
import { useModal } from "./useModal";

/** Archive reference window: the post as it appeared on Substack (reader style). */
export function SubstackWindow({ article, onClose }: { article: ArticleMeta; onClose: () => void }) {
  const { box, initial } = useModal(onClose, [onClose]);
  return (
    <div className="sw-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sw sw--reader" role="dialog" aria-modal="true" aria-labelledby="sw-title" ref={box}>
        <div className="sw__bar">
          <button ref={(el) => { initial.current = el; }} className="sw__x sw__x--box" onClick={onClose} aria-label="Close article">✕</button>
          <span className="sw__avatar sw__avatar--sm" aria-hidden="true" />
          <span className="sw__dots" aria-hidden="true">•••</span>
        </div>
        <div className="sw__scroll" tabIndex={0} role="region" aria-label={`Article text: ${article.title}`}>
          <ArticleContent article={article} titleId="sw-title" />
        </div>
        <div className="sw__actions" aria-hidden="true">
          <span>♡ {article.likes || ""}</span><span>▢</span><span>⟳</span><span>⇪</span>
        </div>
      </div>
    </div>
  );
}
