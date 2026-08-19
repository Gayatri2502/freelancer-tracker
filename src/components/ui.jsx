import React, { useState, useRef, useEffect } from "react";
import { X, Download, ChevronDown, FileText, FileSpreadsheet, FileJson } from "lucide-react";

export function Card({ children, style, className = "", hover }) {
  return (
    <div className={`card ${hover ? "card-hover" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}

export function IconBadge({ icon: Icon, tone = "info" }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
      background: `var(--${tone}-bg)`, color: `var(--${tone})`, flexShrink: 0,
    }}>
      <Icon size={17} />
    </div>
  );
}

export function Metric({ label, value, sub, icon, tone = "info", trend }) {
  return (
    <Card style={{ padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div className="label" style={{ marginBottom: 0 }}>{label}</div>
        {icon && <IconBadge icon={icon} tone={tone} />}
      </div>
      <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

export const STATUS_TONE = { paid: "success", sent: "info", partial: "violet", overdue: "danger", draft: "warning" };
export function StatusPill({ status, label }) {
  const tone = STATUS_TONE[status] || "info";
  return <span className="pill" style={{ color: `var(--${tone})`, background: `var(--${tone}-bg)` }}>{label}</span>;
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="no-print"
      style={{ position: "fixed", inset: 0, background: "rgba(5,7,12,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 16px", zIndex: 50, overflowY: "auto" }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="card" style={{ width: "100%", maxWidth: wide ? 680 : 480, boxShadow: "var(--shadow)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close"><X size={16} /></button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

export function ExportMenu({ onExport, label = "Export" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button className="btn btn-ghost" onClick={() => setOpen((o) => !o)}>
        <Download size={14} /> {label} <ChevronDown size={13} />
      </button>
      {open && (
        <div className="card" style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", padding: 6, minWidth: 160, zIndex: 20, boxShadow: "var(--shadow)" }}>
          {[
            { key: "csv", icon: FileText, label: "CSV" },
            { key: "excel", icon: FileSpreadsheet, label: "Excel (.xlsx)" },
            { key: "json", icon: FileJson, label: "JSON" },
          ].map((opt) => (
            <button key={opt.key} onClick={() => { onExport(opt.key); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", background: "transparent", border: "none", color: "var(--text-primary)", fontSize: 13, cursor: "pointer", borderRadius: 6, textAlign: "left" }}
              className="btn-ghost">
              <opt.icon size={14} /> {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function EmptyState({ text }) {
  return <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "18px 4px" }}>{text}</div>;
}
