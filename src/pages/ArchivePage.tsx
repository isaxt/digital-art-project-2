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
      <div className="pagehead"><h1>Archive</h1><span className="id">HISTORICAL / CULTURAL — LAYER 5</span></div>
      <p className="intro">
        Before the Registry there was a post. The Office began as a thought written out on Substack, kept here as a point of reference. Open the file on the desktop to read it again.
      </p>
      <ArchiveDesktop onOpen={(a) => setSp({ open: a.slug })} />
      <p className="small muted">{articles.length} item. A replica of the artist&apos;s own post; a link to the original appears when set. <button type="button" onClick={openIntro}>Replay the orientation</button></p>
      {open && <SubstackWindow article={open} onClose={close} />}
    </main>
  );
}
