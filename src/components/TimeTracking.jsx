import React, { useState, useMemo } from "react";
import { Plus, Trash2, Pencil, Check, Clock, FileOutput } from "lucide-react";
import { Card, Modal, EmptyState } from "./ui.jsx";
import { uid, todayStr, fmtMoney, fmtDate } from "../lib/utils.js";

function EntryForm({ initial, projects, clients, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial || {
    id: uid(), date: todayStr(), projectId: projects[0]?.id || "", description: "", hours: "", rate: "", invoiced: false,
  });
  const canSave = form.description.trim() && Number(form.hours) > 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div>
          <label className="label">Project</label>
          {projects.length === 0 ? <EmptyState text="Add a project first." /> : (
            <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>
      </div>
      <div>
        <label className="label">Description</label>
        <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Homepage design revisions" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="label">Hours</label>
          <input className="input mono" type="number" min="0" step="0.25" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
        </div>
        <div>
          <label className="label">Hourly rate</label>
          <input className="input mono" type="number" min="0" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
        <button onClick={() => canSave && onSave(form)} className="btn btn-primary" style={{ opacity: canSave ? 1 : 0.5, cursor: canSave ? "pointer" : "not-allowed" }}>
          <Check size={14} /> Save entry
        </button>
      </div>
    </div>
  );
}

export default function TimeTracking({ data, currency, saveEntry, deleteEntry, convertToInvoice }) {
  const [modal, setModal] = useState(null);
  const { timeEntries, projects, clients } = data;
  const projectsById = Object.fromEntries(projects.map((p) => [p.id, p]));

  const unbilledByClient = useMemo(() => {
    const map = {};
    timeEntries.filter((t) => !t.invoiced).forEach((t) => {
      const clientId = projectsById[t.projectId]?.clientId;
      if (!clientId) return;
      map[clientId] = map[clientId] || [];
      map[clientId].push(t);
    });
    return map;
  }, [timeEntries, projects]);

  const totalHours = timeEntries.reduce((s, t) => s + (Number(t.hours) || 0), 0);
  const totalValue = timeEntries.reduce((s, t) => s + (Number(t.hours) || 0) * (Number(t.rate) || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>Time tracking</h2>
        <button className="btn btn-primary" onClick={() => projects.length ? setModal({ data: null }) : alert("Add a project first.")}><Plus size={14} /> Log time</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 18 }}>
        <Card style={{ padding: "14px 16px" }}>
          <div className="label">Total hours logged</div>
          <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>{totalHours.toFixed(2)}h</div>
        </Card>
        <Card style={{ padding: "14px 16px" }}>
          <div className="label">Billable value</div>
          <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--success)" }}>{fmtMoney(totalValue, currency)}</div>
        </Card>
      </div>

      {Object.keys(unbilledByClient).length > 0 && (
        <Card style={{ padding: "14px 16px", marginBottom: 18 }}>
          <div className="label" style={{ marginBottom: 8 }}>Unbilled time by client</div>
          {Object.entries(unbilledByClient).map(([clientId, entries]) => {
            const client = clients.find((c) => c.id === clientId);
            const value = entries.reduce((s, t) => s + (Number(t.hours) || 0) * (Number(t.rate) || 0), 0);
            const hours = entries.reduce((s, t) => s + (Number(t.hours) || 0), 0);
            return (
              <div key={clientId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{client?.name || "Unknown client"}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{hours.toFixed(2)}h &middot; {entries.length} entries</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="mono" style={{ fontSize: 13 }}>{fmtMoney(value, currency)}</span>
                  <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={() => convertToInvoice(clientId, entries)}>
                    <FileOutput size={13} /> Create invoice
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <div className="label" style={{ marginBottom: 8 }}>All entries</div>
      {timeEntries.length === 0 ? <EmptyState text="No time logged yet." /> : (
        <div className="scrollbar" style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr>{["Date", "Project", "Description", "Hours", "Rate", "Value", "Status", ""].map((h) => <th key={h} className="label" style={{ marginBottom: 0 }}>{h}</th>)}</tr></thead>
            <tbody>
              {[...timeEntries].sort((a, b) => b.date.localeCompare(a.date)).map((t) => (
                <tr key={t.id}>
                  <td>{fmtDate(t.date)}</td>
                  <td>{projectsById[t.projectId]?.name || "\u2014"}</td>
                  <td>{t.description}</td>
                  <td className="mono">{Number(t.hours).toFixed(2)}</td>
                  <td className="mono">{fmtMoney(t.rate, currency)}</td>
                  <td className="mono">{fmtMoney((Number(t.hours) || 0) * (Number(t.rate) || 0), currency)}</td>
                  <td><span className="pill" style={{ color: t.invoiced ? "var(--success)" : "var(--text-muted)", background: t.invoiced ? "var(--success-bg)" : "var(--bg-soft)" }}>{t.invoiced ? "Invoiced" : "Unbilled"}</span></td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button onClick={() => setModal({ data: t })} className="btn btn-ghost btn-icon" aria-label="Edit entry"><Pencil size={13} /></button>
                    <button onClick={() => deleteEntry(t.id)} className="btn btn-ghost btn-icon" aria-label="Delete entry"><Trash2 size={13} color="var(--danger)" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <Modal title={modal.data ? "Edit time entry" : "Log time"} onClose={() => setModal(null)}>
          <EntryForm initial={modal.data} projects={projects} clients={clients} onSave={(t) => { saveEntry(t); setModal(null); }} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
