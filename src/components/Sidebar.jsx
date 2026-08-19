import React from "react";
import {
  LayoutDashboard, FileText, Receipt, Users, FolderKanban, Clock, CreditCard,
  BarChart3, Calendar, Settings, Zap
} from "lucide-react";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "clients", label: "Clients", icon: Users },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "time", label: "Time tracking", icon: Clock },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ tab, setTab, businessName }) {
  return (
    <div style={{ width: 216, flexShrink: 0, background: "var(--sidebar)", borderRight: "1px solid var(--border)", padding: "18px 12px", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "0 6px 20px" }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent-grad)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Zap size={16} color="#fff" fill="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 16 }}>{businessName || "Freelance."}</span>
      </div>
      {NAV.map((n) => {
        const Icon = n.icon;
        return (
          <button key={n.id} onClick={() => setTab(n.id)} className={`sidebar-link ${tab === n.id ? "active" : ""}`}>
            <Icon size={16} /> {n.label}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
    </div>
  );
}
