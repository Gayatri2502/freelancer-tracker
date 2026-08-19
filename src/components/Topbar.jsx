import React from "react";
import { Search, Sun, Moon, Settings as SettingsIcon, Bell } from "lucide-react";

export default function Topbar({ theme, setTheme, search, setSearch, business, reminders }) {
  return (
    <div style={{ height: 60, borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", gap: 16, background: "var(--bg-soft)" }}>
      <div style={{ position: "relative", flex: 1, maxWidth: 380 }}>
        <Search size={15} style={{ position: "absolute", left: 11, top: 10, color: "var(--text-muted)" }} />
        <input className="input" style={{ paddingLeft: 32 }} placeholder="Search anything..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme" title="Toggle light / dark theme">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div style={{ position: "relative" }}>
          <button className="btn btn-ghost btn-icon" aria-label="Reminders" title="Upcoming reminders">
            <Bell size={16} />
          </button>
          {reminders > 0 && (
            <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%", background: "var(--danger)" }} />
          )}
        </div>
        <div style={{ width: 1, height: 22, background: "var(--border)" }} />
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-grad)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
          {(business.name || "F").slice(0, 1).toUpperCase()}
        </div>
      </div>
    </div>
  );
}
