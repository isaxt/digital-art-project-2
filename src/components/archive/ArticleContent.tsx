import { Fragment, type ReactNode } from "react";
import { articleBlocks, type ArticleMeta } from "../../services/articleService";

/** **bold** and *italic* only. Everything else is plain text (no HTML injection). */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** The Substack-reader replica: header, byline, body, pending note, replica credit. Used by the Archive window and onboarding. */
export function ArticleContent({ article, titleId }: { article: ArticleMeta; titleId: string }) {
  const blocks = articleBlocks(article);
  return (
    <article className="sw__article">
      <div className="sw__section">{article.section}</div>
      <h1 id={titleId} className="sw__title">{article.title}</h1>
      <p className="sw__subtitle">{article.subtitle}</p>
      <div className="sw__byline">
        <span className="sw__avatar" aria-hidden="true" />
        <div>
          <div className="sw__author">{article.author}</div>
          <div className="sw__date">{article.date}</div>
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
          <p className="sw__pending" role="note">[Full text pending. This replica currently shows only the opening passage.]</p>
        )}
      </div>
      <p className="sw__replica">
        Replica of the original post, reproduced by the artist.{" "}
        {article.url && (
          <a href={article.url} target="_blank" rel="noopener noreferrer">View original on Substack<span className="sr-only"> (opens in a new tab)</span></a>
        )}
      </p>
    </article>
  );
}
