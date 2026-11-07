import { useEffect, useState } from "react";
import { articles, type ArticleMeta } from "../../services/articleService";

function SubstackIcon() {
  // Generic bookmark glyph on an orange tile (not the Substack logo).
  return (
    <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="10" fill="#f26d28" />
      <path d="M15 12h18v5H15zM15 20h18v5H15zM15 28h18v10l-9-5.5L15 38z" fill="#fff" />
    </svg>
  );
}

function Clock() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 15000); return () => clearInterval(i); }, []);
  return <span>{t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}</span>;
}

export function ArchiveDesktop({ onOpen }: { onOpen: (a: ArticleMeta) => void }) {
  return (
    <div className="desk" aria-label="Archive desktop">
      <ul className="desk__icons">
        {articles.map((a) => (
          <li key={a.slug}>
            <button className="desk__icon" onClick={() => onOpen(a)} aria-label={`Open Substack article: ${a.title}`}>
              <SubstackIcon />
              <span className="desk__label">Substack<small>{a.publication}</small></span>
            </button>
          </li>
        ))}
      </ul>
      <div className="desk__task" aria-hidden="true">
        <span className="desk__start">▦</span>
        <span className="desk__clock"><Clock /></span>
      </div>
    </div>
  );
}
