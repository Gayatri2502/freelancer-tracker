import React, { useState } from "react";
import { Plus, Trash2, Check, CreditCard } from "lucide-react";
import { Card, Modal, EmptyState } from "./ui.jsx";
import { uid, todayStr, fmtMoney, fmtDate, PAYMENT_METHODS, invoiceTotal, invoicePaid, invoiceBalance } from "../lib/utils.js";

function PaymentForm({ invoices, clientsById, payments, onSave, onCancel }) {
  const unpaidInvoices = invoices.filter((i) => i.status !== "draft" && invoiceBalance(i, payments) > 0.004);
  const [form, setForm] = useState({ id: uid(), invoiceId: unpaidInvoices[0]?.id || "", date: todayStr(), amount: "", method: PAYMENT_METHODS[0], notes: "" });
  const invoice = invoices.find((i) => i.id === form.invoiceId);
  const balance = invoice ? invoiceBalance(invoice, payments) : 0;
  const canSave = form.invoiceId && Number(form.amount) > 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <label className="label">Invoice</label>
        {unpaidInvoices.length === 0 ? <EmptyState text="No outstanding invoices." /> : (
          <select className="input" value={form.invoiceId} onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}>
            {unpaidInvoices.map((i) => <option key={i.id} value={i.id}>#{i.number} \u00b7 {clientsById[i.clientId]?.name} \u00b7 balance {fmtMoney(invoiceBalance(i, payments), i.currency)}</option>)}
          </select>
        )}
      </div>
      {invoice && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Balance due: <strong className="mono">{fmtMoney(balance, invoice.currency)}</strong></div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div>
          <label className="label">Amount</label>
          <input className="input mono" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Method</label>
        <select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
          {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
        <button onClick={() => canSave && onSave(form)} className="btn btn-primary" style={{ opacity: canSave ? 1 : 0.5, cursor: canSave ? "pointer" : "not-allowed" }}>
          <Check size={14} /> Record payment
        </button>
      </div>
    </div>
  );
}

export default function Payments({ data, currency, savePayment, deletePayment }) {
  const [modal, setModal] = useState(false);
  const { payments, invoices, clients } = data;
  const clientsById = Object.fromEntries(clients.map((c) => [c.id, c]));
  const invoicesById = Object.fromEntries(invoices.map((i) => [i.id, i]));
  const totalCollected = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>Payments</h2>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={14} /> Record payment</button>
      </div>
      <Card style={{ padding: "14px 16px", marginBottom: 18, maxWidth: 260 }}>
        <div className="label">Total collected</div>
        <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--success)" }}>{fmtMoney(totalCollected, currency)}</div>
      </Card>
      {payments.length === 0 ? <EmptyState text="No payments recorded yet." /> : (
        <div className="scrollbar" style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr>{["Date", "Invoice", "Client", "Method", "Amount", "Notes", ""].map((h) => <th key={h} className="label" style={{ marginBottom: 0 }}>{h}</th>)}</tr></thead>
            <tbody>
              {[...payments].sort((a, b) => b.date.localeCompare(a.date)).map((p) => {
                const inv = invoicesById[p.invoiceId];
                return (
                  <tr key={p.id}>
                    <td>{fmtDate(p.date)}</td>
                    <td>{inv ? `#${inv.number}` : "\u2014"}</td>
                    <td>{inv ? clientsById[inv.clientId]?.name : "\u2014"}</td>
                    <td style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}><CreditCard size={12} />{p.method}</td>
                    <td className="mono" style={{ color: "var(--success)" }}>{fmtMoney(p.amount, inv?.currency || currency)}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.notes}</td>
                    <td style={{ textAlign: "right" }}>
                      <button onClick={() => deletePayment(p.id)} className="btn btn-ghost btn-icon" aria-label="Delete payment"><Trash2 size={13} color="var(--danger)" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {modal && (
        <Modal title="Record payment" onClose={() => setModal(false)}>
          <PaymentForm invoices={invoices} clientsById={clientsById} payments={payments} onSave={(p) => { savePayment(p); setModal(false); }} onCancel={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
}
