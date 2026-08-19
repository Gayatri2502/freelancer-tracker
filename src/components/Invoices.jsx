import React, { useState, useMemo, useRef } from "react";
import { Plus, Trash2, Pencil, Check, Search, FileDown, Repeat, Printer } from "lucide-react";
import { Card, Modal, StatusPill, ExportMenu, EmptyState } from "./ui.jsx";
import {
  uid, todayStr, fmtMoney, fmtDate, CURRENCIES, PAYMENT_METHODS, PAYMENT_TERMS,
  RECURRING_INTERVALS, invoiceTotal, invoiceSubtotal, invoicePaid, invoiceBalance, effectiveStatus,
} from "../lib/utils.js";
import { exportRows, exportNodeAsPdf } from "../lib/exporters.js";

function InvoiceForm({ initial, clients, projects, onSave, onCancel, nextNumber, business }) {
  const [form, setForm] = useState(() => initial || {
    id: uid(), number: nextNumber, clientId: clients[0]?.id || "", projectId: "",
    issueDate: todayStr(), dueDate: todayStr(), status: "draft",
    taxRate: business?.defaultTaxRate || 0, discountPct: 0,
    currency: business?.defaultCurrency || "USD",
    paymentTerms: PAYMENT_TERMS[0], paymentMethod: PAYMENT_METHODS[0],
    recurring: "none", reference: "", notes: "",
    items: [{ id: uid(), desc: "", qty: 1, rate: 0 }],
  });
  const subtotal = useMemo(() => invoiceSubtotal(form), [form.items]);
  const discount = subtotal * ((Number(form.discountPct) || 0) / 100);
  const tax = (subtotal - discount) * ((Number(form.taxRate) || 0) / 100);
  const total = subtotal - discount + tax;

  const updateItem = (id, field, value) => setForm((f) => ({ ...f, items: f.items.map((it) => (it.id === id ? { ...it, [field]: value } : it)) }));
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { id: uid(), desc: "", qty: 1, rate: 0 }] }));
  const removeItem = (id) => setForm((f) => ({ ...f, items: f.items.filter((it) => it.id !== id) }));
  const canSave = form.clientId && form.items.some((it) => it.desc.trim());
  const clientProjects = projects.filter((p) => p.clientId === form.clientId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="label">Client</label>
          {clients.length === 0 ? <EmptyState text="Add a client first." /> : (
            <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value, projectId: "" })}>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className="label">Project (optional)</label>
          <select className="input" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            <option value="">No project</option>
            {clientProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Issue date</label>
          <input type="date" className="input" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
        </div>
        <div>
          <label className="label">Due date</label>
          <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <div>
          <label className="label">Currency</label>
          <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Payment terms</label>
          <select className="input" value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}>
            {PAYMENT_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Payment method</label>
          <select className="input" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Recurring</label>
          <select className="input" value={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.value })}>
            {RECURRING_INTERVALS.map((r) => <option key={r} value={r}>{r === "none" ? "One-time" : r}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Line items</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {form.items.map((it) => (
            <div key={it.id} style={{ display: "grid", gridTemplateColumns: "1fr 56px 90px 24px", gap: 6, alignItems: "center" }}>
              <input className="input" placeholder="Description" value={it.desc} onChange={(e) => updateItem(it.id, "desc", e.target.value)} />
              <input className="input mono" type="number" min="0" step="1" value={it.qty} onChange={(e) => updateItem(it.id, "qty", e.target.value)} />
              <input className="input mono" type="number" min="0" step="0.01" value={it.rate} onChange={(e) => updateItem(it.id, "rate", e.target.value)} />
              <button onClick={() => removeItem(it.id)} disabled={form.items.length === 1} style={{ background: "none", border: "none", cursor: form.items.length === 1 ? "not-allowed" : "pointer", opacity: form.items.length === 1 ? 0.3 : 1 }} aria-label="Remove item">
                <Trash2 size={15} color="var(--danger)" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addItem} className="btn btn-ghost" style={{ marginTop: 8, fontSize: 12, padding: "6px 12px" }}><Plus size={13} /> Add line</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label className="label">Discount (%)</label>
          <input className="input mono" type="number" min="0" step="0.1" value={form.discountPct} onChange={(e) => setForm({ ...form, discountPct: e.target.value })} />
        </div>
        <div>
          <label className="label">Tax / GST rate (%)</label>
          <input className="input mono" type="number" min="0" step="0.1" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
        </div>
      </div>

      <Card style={{ padding: "10px 14px" }} className="mono">
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "2px 0" }}><span>Subtotal</span><span>{fmtMoney(subtotal, form.currency)}</span></div>
        {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "2px 0", color: "var(--warning)" }}><span>Discount</span><span>-{fmtMoney(discount, form.currency)}</span></div>}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "2px 0" }}><span>Tax</span><span>{fmtMoney(tax, form.currency)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, padding: "4px 0 0", borderTop: "1px solid var(--border)", marginTop: 4 }}><span>Total</span><span>{fmtMoney(total, form.currency)}</span></div>
      </Card>

      <div>
        <label className="label">Notes & terms</label>
        <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
        </select>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
        <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
        <button onClick={() => canSave && onSave({ ...form, items: form.items.filter((it) => it.desc.trim()) })} className="btn btn-primary" style={{ opacity: canSave ? 1 : 0.5, cursor: canSave ? "pointer" : "not-allowed" }}>
          <Check size={14} /> Save invoice
        </button>
      </div>
    </div>
  );
}

function PrintableInvoice({ invoice, client, business, paid }) {
  const subtotal = invoiceSubtotal(invoice);
  const discount = subtotal * ((Number(invoice.discountPct) || 0) / 100);
  const tax = (subtotal - discount) * ((Number(invoice.taxRate) || 0) / 100);
  const total = subtotal - discount + tax;
  return (
    <div style={{ background: "white", color: "#111", padding: 32, fontFamily: "Inter, sans-serif", width: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{business?.name || "Your business"}</div>
          <div style={{ fontSize: 12, color: "#555" }}>{business?.email}</div>
          <div style={{ fontSize: 12, color: "#555" }}>{business?.address}</div>
          {business?.taxId && <div style={{ fontSize: 12, color: "#555" }}>Tax ID: {business.taxId}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Invoice #{invoice.number}</div>
          <div style={{ fontSize: 12, color: "#555" }}>Issued {fmtDate(invoice.issueDate)}</div>
          <div style={{ fontSize: 12, color: "#555" }}>Due {fmtDate(invoice.dueDate)}</div>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase" }}>Bill to</div>
        <div style={{ fontWeight: 600 }}>{client?.name}</div>
        <div style={{ fontSize: 12, color: "#555" }}>{client?.company}</div>
        <div style={{ fontSize: 12, color: "#555" }}>{client?.email}</div>
        <div style={{ fontSize: 12, color: "#555" }}>{client?.address}</div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <thead><tr style={{ borderBottom: "2px solid #111" }}>
          <th style={{ textAlign: "left", padding: "6px 4px", fontSize: 12 }}>Description</th>
          <th style={{ textAlign: "right", padding: "6px 4px", fontSize: 12 }}>Qty</th>
          <th style={{ textAlign: "right", padding: "6px 4px", fontSize: 12 }}>Rate</th>
          <th style={{ textAlign: "right", padding: "6px 4px", fontSize: 12 }}>Amount</th>
        </tr></thead>
        <tbody>
          {invoice.items.map((it) => (
            <tr key={it.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "6px 4px", fontSize: 13 }}>{it.desc}</td>
              <td style={{ padding: "6px 4px", fontSize: 13, textAlign: "right" }}>{it.qty}</td>
              <td style={{ padding: "6px 4px", fontSize: 13, textAlign: "right" }}>{fmtMoney(it.rate, invoice.currency)}</td>
              <td style={{ padding: "6px 4px", fontSize: 13, textAlign: "right" }}>{fmtMoney((Number(it.qty) || 0) * (Number(it.rate) || 0), invoice.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: 220 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}><span>Subtotal</span><span>{fmtMoney(subtotal, invoice.currency)}</span></div>
          {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}><span>Discount</span><span>-{fmtMoney(discount, invoice.currency)}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}><span>Tax</span><span>{fmtMoney(tax, invoice.currency)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, padding: "6px 0 0", borderTop: "2px solid #111", marginTop: 4 }}><span>Total</span><span>{fmtMoney(total, invoice.currency)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", color: "#555" }}><span>Paid</span><span>{fmtMoney(paid, invoice.currency)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, padding: "3px 0" }}><span>Balance due</span><span>{fmtMoney(Math.max(0, total - paid), invoice.currency)}</span></div>
        </div>
      </div>
      <div style={{ marginTop: 24, fontSize: 12, color: "#555" }}>
        <div>Payment terms: {invoice.paymentTerms} &middot; Method: {invoice.paymentMethod}</div>
        {business?.bankDetails && <div style={{ marginTop: 4 }}>{business.bankDetails}</div>}
        {invoice.notes && <div style={{ marginTop: 8 }}>{invoice.notes}</div>}
      </div>
    </div>
  );
}

export default function Invoices({ data, currency, saveInvoice, deleteInvoice, search }) {
  const [modal, setModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewId, setPreviewId] = useState(null);
  const printRef = useRef(null);
  const { invoices, clients, projects, payments, business } = data;
  const clientsById = Object.fromEntries(clients.map((c) => [c.id, c]));

  const filtered = invoices.filter((inv) => {
    const st = effectiveStatus(inv, payments);
    const matchesStatus = statusFilter === "all" || st === statusFilter;
    const q = (search || "").toLowerCase();
    const matchesSearch = !q || String(inv.number).includes(q) || (clientsById[inv.clientId]?.name || "").toLowerCase().includes(q) || (inv.reference || "").toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const exportInvoices = (fmt) => exportRows(invoices.map((inv) => ({
    number: inv.number, client: clientsById[inv.clientId]?.name || "", issueDate: inv.issueDate, dueDate: inv.dueDate,
    status: effectiveStatus(inv, payments), total: invoiceTotal(inv).toFixed(2), paid: invoicePaid(inv, payments).toFixed(2),
    balance: invoiceBalance(inv, payments).toFixed(2), currency: inv.currency,
  })), "invoices", fmt);

  const previewInvoice = invoices.find((i) => i.id === previewId);

  const handlePdf = async () => {
    if (!printRef.current) return;
    await exportNodeAsPdf(printRef.current, `invoice-${previewInvoice.number}.pdf`);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>Invoices</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <ExportMenu onExport={exportInvoices} />
          <button className="btn btn-primary" onClick={() => clients.length ? setModal({ data: null }) : alert("Add a client first from the Clients tab.")}>
            <Plus size={14} /> New invoice
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <select className="input" style={{ width: 170 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {filtered.length === 0 ? <EmptyState text="No invoices match." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...filtered].sort((a, b) => b.issueDate.localeCompare(a.issueDate)).map((inv) => (
            <Card key={inv.id} hover style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  #{inv.number} &middot; {clientsById[inv.clientId]?.name || "Unknown client"}
                  {inv.recurring !== "none" && <Repeat size={12} color="var(--text-muted)" title={`Recurring: ${inv.recurring}`} />}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  Issued {fmtDate(inv.issueDate)} &middot; Due {fmtDate(inv.dueDate)}{inv.reference ? ` \u00b7 ${inv.reference}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="mono" style={{ fontSize: 15, fontWeight: 700 }}>{fmtMoney(invoiceTotal(inv), inv.currency)}</span>
                <StatusPill status={effectiveStatus(inv, payments)} label={effectiveStatus(inv, payments)} />
                <button onClick={() => setPreviewId(inv.id)} className="btn btn-ghost btn-icon" aria-label="Preview & export PDF"><FileDown size={14} /></button>
                <button onClick={() => setModal({ data: inv })} className="btn btn-ghost btn-icon" aria-label="Edit invoice"><Pencil size={14} /></button>
                <button onClick={() => deleteInvoice(inv.id)} className="btn btn-ghost btn-icon" aria-label="Delete invoice"><Trash2 size={14} color="var(--danger)" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={modal.data ? "Edit invoice" : "New invoice"} onClose={() => setModal(null)} wide>
          <InvoiceForm initial={modal.data} clients={clients} projects={projects} nextNumber={data.invoiceSeq} business={business}
            onSave={(inv) => { saveInvoice(inv); setModal(null); }} onCancel={() => setModal(null)} />
        </Modal>
      )}

      {previewInvoice && (
        <Modal title={`Invoice #${previewInvoice.number}`} onClose={() => setPreviewId(null)} wide>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}>
            <button className="btn btn-primary" onClick={handlePdf}><Printer size={14} /> Download PDF</button>
          </div>
          <div className="scrollbar" style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 10 }}>
            <div ref={printRef}>
              <PrintableInvoice invoice={previewInvoice} client={clientsById[previewInvoice.clientId]} business={business} paid={invoicePaid(previewInvoice, payments)} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
