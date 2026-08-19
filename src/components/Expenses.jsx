import React, { useState } from "react";
import { Plus, Trash2, Pencil, Check, Paperclip, Tag } from "lucide-react";
import { Card, Modal, ExportMenu, EmptyState } from "./ui.jsx";
import { uid, todayStr, fmtMoney, fmtDate, CURRENCIES, EXPENSE_CATEGORIES, PAYMENT_METHODS, fileToBase64 } from "../lib/utils.js";
import { exportRows } from "../lib/exporters.js";

function ExpenseForm({ initial, clients, projects, onSave, onCancel, defaultCurrency }) {
  const [form, setForm] = useState(() => initial || {
    id: uid(), date: todayStr(), vendor: "", category: EXPENSE_CATEGORIES[0], amount: "",
    currency: defaultCurrency || "USD", paymentMethod: PAYMENT_METHODS[0],
    billable: false, clientId: "", projectId: "", taxDeductible: true, receiptName: "", receiptData: "", notes: "",
  });
  const canSave = form.vendor.trim() && Number(form.amount) > 0;

  const onReceipt = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Please choose a receipt smaller than 2MB."); return; }
    const b64 = await fileToBase64(file);
    setForm({ ...form, receiptName: file.name, receiptData: b64 });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Vendor</label>
        <input className="input" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Adobe, Delta Airlines" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="label">Amount</label>
          <input className="input mono" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div>
          <label className="label">Currency</label>
          <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Payment method</label>
        <select className="input" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
          {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Project (optional)</label>
        <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
          <option value="">No project</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
          <input type="checkbox" className="checkbox" checked={form.billable} onChange={(e) => setForm({ ...form, billable: e.target.checked })} /> Billable to client
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
          <input type="checkbox" className="checkbox" checked={form.taxDeductible} onChange={(e) => setForm({ ...form, taxDeductible: e.target.checked })} /> Tax deductible
        </label>
      </div>
      {form.billable && (
        <div>
          <label className="label">Client</label>
          <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
            <option value="">Select client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="label">Receipt</label>
        <label className="btn btn-ghost" style={{ cursor: "pointer", width: "fit-content" }}>
          <Paperclip size={13} /> {form.receiptName || "Attach receipt"}
          <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={onReceipt} />
        </label>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
        <button onClick={() => canSave && onSave(form)} className="btn btn-primary" style={{ opacity: canSave ? 1 : 0.5, cursor: canSave ? "pointer" : "not-allowed" }}>
          <Check size={14} /> Save expense
        </button>
      </div>
    </div>
  );
}

export default function Expenses({ data, currency, saveExpense, deleteExpense, search }) {
  const [modal, setModal] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { expenses, clients, projects } = data;

  const filtered = expenses.filter((e) => {
    const matchesCat = categoryFilter === "all" || e.category === categoryFilter;
    const q = (search || "").toLowerCase();
    const matchesSearch = !q || e.vendor.toLowerCase().includes(q) || (e.notes || "").toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const exportExpensesFn = (fmt) => exportRows(expenses.map((e) => ({
    date: e.date, vendor: e.vendor, category: e.category, amount: e.amount, currency: e.currency,
    paymentMethod: e.paymentMethod, billable: e.billable, taxDeductible: e.taxDeductible,
  })), "expenses", fmt);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>Expenses</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <ExportMenu onExport={exportExpensesFn} />
          <button className="btn btn-primary" onClick={() => setModal({ data: null })}><Plus size={14} /> New expense</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <select className="input" style={{ width: 180 }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      {filtered.length === 0 ? <EmptyState text="No expenses match." /> : (
        <div className="scrollbar" style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr>{["Date", "Vendor", "Category", "Method", "Amount", "Flags", "Receipt", ""].map((h) => <th key={h} className="label" style={{ marginBottom: 0 }}>{h}</th>)}</tr></thead>
            <tbody>
              {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
                <tr key={e.id}>
                  <td>{fmtDate(e.date)}</td>
                  <td>{e.vendor}</td>
                  <td><span className="pill" style={{ color: "var(--warning)", background: "var(--warning-bg)" }}><Tag size={10} />{e.category}</span></td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{e.paymentMethod}</td>
                  <td className="mono">{fmtMoney(e.amount, e.currency)}</td>
                  <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{e.billable && "Billable "}{e.taxDeductible && "\u00b7 Deductible"}</td>
                  <td>{e.receiptName ? <a href={e.receiptData} download={e.receiptName} style={{ color: "var(--accent)", fontSize: 12 }}>{e.receiptName.slice(0, 14)}</a> : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>&mdash;</span>}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button onClick={() => setModal({ data: e })} className="btn btn-ghost btn-icon" aria-label="Edit expense"><Pencil size={13} /></button>
                    <button onClick={() => deleteExpense(e.id)} className="btn btn-ghost btn-icon" aria-label="Delete expense"><Trash2 size={13} color="var(--danger)" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <Modal title={modal.data ? "Edit expense" : "New expense"} onClose={() => setModal(null)}>
          <ExpenseForm initial={modal.data} clients={clients} projects={projects} defaultCurrency={currency}
            onSave={(exp) => { saveExpense(exp); setModal(null); }} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
