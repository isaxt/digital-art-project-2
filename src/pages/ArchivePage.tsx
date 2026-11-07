import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ArchiveDesktop } from "../components/archive/ArchiveDesktop";
import { SubstackWindow } from "../components/archive/SubstackWindow";
import { articles, getArticle } from "../services/articleService";

export default function ArchivePage() {
  const [sp, setSp] = useSearchParams();
  const open = getArticle(sp.get("open"));
  const close = useCallback(() => setSp({}, { replace: true }), [setSp]);

  return (
    <main className="main stack">
      <div className="pagehead"><h1>Archive</h1><span className="id">HISTORICAL / CULTURAL — LAYER 5</span></div>
      <p className="intro">
        Before the Registry there was a post. The Office began as a thought written out on Substack. Open a file on the desktop below to read the original text.
      </p>
      <ArchiveDesktop onOpen={(a) => setSp({ open: a.slug })} />
      <p className="small muted">{articles.length} items. Texts are replicas of the artist&apos;s own posts; links to the originals appear when set.</p>
      {open && <SubstackWindow article={open} onClose={close} />}
    </main>
  );
}
