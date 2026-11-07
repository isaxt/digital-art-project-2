import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CONFIG } from "../../config";
import { Emblem } from "../shared";
import { openIntro } from "../archive/intro";

export function InstitutionHeader() {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const go = (e: FormEvent) => {
    e.preventDefault();
    nav(`/registry${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  };
  return (
    <header className="hdr">
      <Emblem />
      <div>
        <div className="hdr__name"><Link to="/">{CONFIG.institutionName}</Link></div>
        <div className="hdr__tag">{CONFIG.tagline}</div>
      </div>
      <button type="button" className="hdr__intro" onClick={openIntro}>Orientation</button>
      <form className="hdr__search" role="search" onSubmit={go}>
        <div>
          <label htmlFor="hdr-q">Search registry</label>
          <input id="hdr-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="entity name" />
        </div>
        <button type="submit">Search</button>
      </form>
    </header>
  );
}
