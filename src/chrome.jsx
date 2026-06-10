// ─── SHARED CHROME ────────────────────────────────────────────────────────────
// Brand and section nav used by every section. Copy lives in copy.js.

import { useNavigate, useLocation } from "react-router-dom";
import { SECTIONS } from "./copy.js";

export function SidebarBrand() {
  const navigate = useNavigate();
  return (
    <div className="sidebar-brand">
      <h1 className="site-title" onClick={() => navigate("/")}>PROVEN EARTH</h1>
      <p className="site-desc">Independent, verifiable demonstrations of Earth's shape</p>
    </div>
  );
}

export function SectionNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeSection = location.pathname.slice(1) || "solar";
  return (
    <nav className="section-nav-overlay">
      <span className="nav-mini-brand" onClick={() => navigate("/")}>PROVEN EARTH</span>
      {SECTIONS.map(s => (
        <button key={s.id}
          className={`mode-btn${activeSection === s.id ? " active" : ""}`}
          onClick={() => navigate("/" + s.id)}>
          <span className="nav-icon">{s.icon}</span>{s.label}
        </button>
      ))}
    </nav>
  );
}
