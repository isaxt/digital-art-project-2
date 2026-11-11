import { NavLink } from "react-router-dom";

const PRIMARY = [
  { to: "/", label: "Overview", end: true },
  { to: "/registry", label: "Registry" },
  { to: "/translate", label: "Translation Engine" },
  { to: "/certificates", label: "Certificates" },
  { to: "/ledger", label: "Public Ledger" },
  { to: "/explorer", label: "Explorer" },
  { to: "/contract", label: "Rules Contract" },
];

export function SiteNavigation() {
  return (
    <nav className="nav" aria-label="Primary">
      {PRIMARY.map((p) => (
        <NavLink key={p.to} to={p.to} end={p.end} className={({ isActive }) => (isActive ? "active" : "")}>
          {p.label}
        </NavLink>
      ))}
      <NavLink to="/archive" className={({ isActive }) => `secondary push ${isActive ? "active" : ""}`}>
        Archive
      </NavLink>
      <NavLink to="/methods" className={({ isActive }) => `secondary ${isActive ? "active" : ""}`}>
        Methodology &amp; Terms
      </NavLink>
    </nav>
  );
}
