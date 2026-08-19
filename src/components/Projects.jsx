import React, { useState } from "react";
import { Plus, Trash2, Pencil, Check, FolderKanban } from "lucide-react";
import { Card, Modal, EmptyState, StatusPill } from "./ui.jsx";
import { uid, fmtMoney, PROJECT_STATUSES, invoicePaid } from "../lib/utils.js";

const STATUS_TONE = { "Active": "info", "On hold": "warning", "Completed": "success" };

function ProjectForm({ initial, clients, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial || { id: uid(), name: "", clientId: clients[0]?.id || "", status: "Active", budget: "", notes: "" });
  const canSave = form.name.trim();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label className="label">Project name</label>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="label">Client</label>
        {clients.length === 0 ? <EmptyState text="Add a client first." /> : (
          <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Budget</label>
          <input className="input mono" type="number" min="0" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
        <button onClick={() => canSave && onSave(form)} className="btn btn-primary" style={{ opacity: canSave ? 1 : 0.5, cursor: canSave ? "pointer" : "not-allowed" }}>
          <Check size={14} /> Save project
        </button>
      </div>
    </div>
  );
}

export default function Projects({ data, currency, saveProject, deleteProject, search }) {
  const [modal, setModal] = useState(null);
  const { projects, clients, invoices, expenses, payments } = data;
  const clientsById = Object.fromEntries(clients.map((c) => [c.id, c]));

  const filtered = projects.filter((p) => {
    const q = (search || "").toLowerCase();
    return !q || p.name.toLowerCase().includes(q);
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>Projects</h2>
        <button className="btn btn-primary" onClick={() => clients.length ? setModal({ data: null }) : alert("Add a client first.")}><Plus size={14} /> New project</button>
      </div>
      {filtered.length === 0 ? <EmptyState text="No projects yet." /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {filtered.map((p) => {
            const revenue = invoices.filter((i) => i.projectId === p.id).reduce((s, i) => s + invoicePaid(i, payments), 0);
            const cost = expenses.filter((e) => e.projectId === p.id).reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const profit = revenue - cost;
            return (
              <Card key={p.id} hover style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--info-bg)", color: "var(--info)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><FolderKanban size={16} /></div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{clientsById[p.clientId]?.name || "No client"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={() => setModal({ data: p })} className="btn btn-ghost btn-icon" aria-label="Edit project"><Pencil size={13} /></button>
                    <button onClick={() => deleteProject(p.id)} className="btn btn-ghost btn-icon" aria-label="Delete project"><Trash2 size={13} color="var(--danger)" /></button>
                  </div>
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                  <StatusPill status={p.status === "Active" ? "sent" : p.status === "Completed" ? "paid" : "draft"} label={p.status} />
                  {p.budget > 0 && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Budget {fmtMoney(p.budget, currency)}</span>}
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Revenue</div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--success)" }}>{fmtMoney(revenue, currency)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Costs</div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--danger)" }}>{fmtMoney(cost, currency)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Profit</div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: profit >= 0 ? "var(--success)" : "var(--danger)" }}>{fmtMoney(profit, currency)}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {modal && (
        <Modal title={modal.data ? "Edit project" : "New project"} onClose={() => setModal(null)}>
          <ProjectForm initial={modal.data} clients={clients} onSave={(p) => { saveProject(p); setModal(null); }} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
