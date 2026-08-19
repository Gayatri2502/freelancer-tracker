import React, { useState } from "react";
import { Plus, Trash2, Pencil, Check, Mail, Phone, Building2 } from "lucide-react";
import { Card, Modal, EmptyState } from "./ui.jsx";
import { uid, fmtMoney, CURRENCIES, invoiceTotal, invoicePaid } from "../lib/utils.js";

function ClientForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial || { id: uid(), name: "", email: "", company: "", phone: "", address: "", currency: "USD", rate: "", notes: "" });
  const canSave = form.name.trim();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label className="label">Name</label>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="label">Email</label>
          <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Company</label>
        <input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
      </div>
      <div>
        <label className="label">Address</label>
        <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="label">Preferred currency</label>
          <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Default hourly rate</label>
          <input className="input mono" type="number" min="0" step="0.01" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
        <button onClick={() => canSave && onSave(form)} className="btn btn-primary" style={{ opacity: canSave ? 1 : 0.5, cursor: canSave ? "pointer" : "not-allowed" }}>
          <Check size={14} /> Save client
        </button>
      </div>
    </div>
  );
}

export default function Clients({ data, saveClient, deleteClient, search }) {
  const [modal, setModal] = useState(null);
  const { clients, invoices, payments, projects } = data;

  const filtered = clients.filter((c) => {
    const q = (search || "").toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.company || "").toLowerCase().includes(q);
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>Clients</h2>
        <button className="btn btn-primary" onClick={() => setModal({ data: null })}><Plus size={14} /> New client</button>
      </div>
      {filtered.length === 0 ? <EmptyState text="No clients yet." /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {filtered.map((c) => {
            const clientInvoices = invoices.filter((i) => i.clientId === c.id);
            const revenue = clientInvoices.reduce((s, i) => s + invoicePaid(i, payments), 0);
            const projectCount = projects.filter((p) => p.clientId === c.id).length;
            return (
              <Card key={c.id} hover style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{c.name}</div>
                    {c.company && <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}><Building2 size={12} />{c.company}</div>}
                    {c.email && <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}><Mail size={12} />{c.email}</div>}
                    {c.phone && <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}><Phone size={12} />{c.phone}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={() => setModal({ data: c })} className="btn btn-ghost btn-icon" aria-label="Edit client"><Pencil size={13} /></button>
                    <button onClick={() => deleteClient(c.id)} className="btn btn-ghost btn-icon" aria-label="Delete client"><Trash2 size={13} color="var(--danger)" /></button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Revenue</div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--success)" }}>{fmtMoney(revenue, c.currency)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Invoices</div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{clientInvoices.length}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Projects</div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{projectCount}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {modal && (
        <Modal title={modal.data ? "Edit client" : "New client"} onClose={() => setModal(null)}>
          <ClientForm initial={modal.data} onSave={(cl) => { saveClient(cl); setModal(null); }} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
