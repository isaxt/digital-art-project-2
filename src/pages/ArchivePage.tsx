import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ArchiveDesktop } from "../components/archive/ArchiveDesktop";
import { SubstackWindow } from "../components/archive/SubstackWindow";
import { articles, getArticle } from "../services/articleService";
import { openIntro } from "../components/archive/intro";

export default function ArchivePage() {
  const [sp, setSp] = useSearchParams();
  const open = getArticle(sp.get("open"));
  const close = useCallback(() => setSp({}, { replace: true }), [setSp]);

  return (
    <main className="main stack">
      <div className="pagehead"><h1>Archive</h1><span className="id">FOUNDING DOCUMENTS</span></div>
      <p className="intro">
        The Archive holds the Office&apos;s founding text, first published on Substack in August 2025. Open the file to read it.
      </p>
      <ArchiveDesktop onOpen={(a) => setSp({ open: a.slug })} />
      <p className="small muted">{articles.length} item. Reproduced from the original publication, with a link to the source. <button type="button" onClick={openIntro}>View orientation</button></p>
      {open && <SubstackWindow article={open} onClose={close} />}
    </main>
  );
}
