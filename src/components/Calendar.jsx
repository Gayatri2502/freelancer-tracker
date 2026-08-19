import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, EmptyState } from "./ui.jsx";
import { fmtMoney, invoiceBalance, effectiveStatus } from "../lib/utils.js";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView({ data, currency }) {
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const { invoices, clients, payments } = data;
  const clientsById = Object.fromEntries(clients.map((c) => [c.id, c]));

  const dueByDate = useMemo(() => {
    const map = {};
    invoices.filter((i) => i.status !== "draft").forEach((inv) => {
      map[inv.dueDate] = map[inv.dueDate] || [];
      map[inv.dueDate].push(inv);
    });
    return map;
  }, [invoices]);

  const year = cursor.getFullYear(), month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayIso = new Date().toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isoFor = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>Calendar</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft size={15} /></button>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 120, textAlign: "center" }}>{firstDay.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
          <button className="btn btn-ghost btn-icon" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight size={15} /></button>
        </div>
      </div>

      <Card style={{ padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
          {WEEKDAYS.map((w) => <div key={w} style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{w}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const iso = isoFor(d);
            const items = dueByDate[iso] || [];
            const isToday = iso === todayIso;
            const isSelected = iso === selected;
            return (
              <button key={i} onClick={() => setSelected(iso)} style={{
                aspectRatio: "1", borderRadius: 8, border: isToday ? "1px solid var(--accent)" : "1px solid var(--border)",
                background: isSelected ? "var(--card-hover)" : "var(--bg-soft)", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: 2,
                color: "var(--text-primary)", fontFamily: "inherit",
              }}>
                <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500 }}>{d}</span>
                {items.length > 0 && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--danger)" }} />}
              </button>
            );
          })}
        </div>
      </Card>

      <div style={{ marginTop: 18 }}>
        <div className="label" style={{ marginBottom: 8 }}>{selected ? `Due on ${selected}` : "Select a date to see due invoices"}</div>
        {(!selected || !(dueByDate[selected] || []).length) ? <EmptyState text="Nothing due." /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dueByDate[selected].map((inv) => (
              <Card key={inv.id} style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13 }}>#{inv.number} &middot; {clientsById[inv.clientId]?.name}</span>
                <span className="mono" style={{ fontSize: 13, color: "var(--danger)" }}>{fmtMoney(invoiceBalance(inv, payments), inv.currency)}</span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
