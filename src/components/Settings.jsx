import React, { useRef } from "react";
import { Upload, Download, FileJson, RotateCcw, Target, Info } from "lucide-react";
import { Card, ExportMenu } from "./ui.jsx";
import { CURRENCIES, downloadBlob, fileToBase64, fmtMoney, invoicePaid } from "../lib/utils.js";
import { exportRows } from "../lib/exporters.js";

export default function Settings({ data, currency, updateBusiness, updateGoals, updateNotifPrefs, exportAllInvoices, exportAllExpenses, replaceAllData, resetAllData }) {
  const importRef = useRef(null);
  const { business, goals, notifPrefs, invoices, payments } = data;

  const monthIncome = (() => {
    const now = new Date();
    return payments.filter((p) => {
      const d = new Date(p.date + "T00:00:00");
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  })();

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    updateBusiness({ logo: b64 });
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (confirm("This will replace all current data with the imported backup. Continue?")) {
        replaceAllData(parsed);
      }
    } catch {
      alert("Could not read that file. Make sure it's a valid backup JSON.");
    }
    e.target.value = "";
  };

  const revenueProgress = goals.monthlyRevenueGoal > 0 ? Math.min(100, (monthIncome / goals.monthlyRevenueGoal) * 100) : 0;

  return (
    <div style={{ maxWidth: 620, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 18, margin: "0 0 14px", fontWeight: 700 }}>Business profile</h2>
        <Card style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "var(--bg-soft)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {business.logo ? <img src={business.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text-muted)" }}>{(business.name || "F")[0]}</span>}
            </div>
            <label className="btn btn-ghost" style={{ cursor: "pointer" }}>
              <Upload size={13} /> Upload logo
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={onLogo} />
            </label>
          </div>
          <div>
            <label className="label">Business name</label>
            <input className="input" value={business.name} onChange={(e) => updateBusiness({ name: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="label">Email</label>
              <input className="input" value={business.email} onChange={(e) => updateBusiness({ email: e.target.value })} />
            </div>
            <div>
              <label className="label">Tax ID / GSTIN</label>
              <input className="input" value={business.taxId} onChange={(e) => updateBusiness({ taxId: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input" value={business.address} onChange={(e) => updateBusiness({ address: e.target.value })} />
          </div>
          <div>
            <label className="label">Bank details (shown on invoices)</label>
            <textarea className="input" rows={2} value={business.bankDetails} onChange={(e) => updateBusiness({ bankDetails: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="label">Default currency</label>
              <select className="input" value={business.defaultCurrency} onChange={(e) => updateBusiness({ defaultCurrency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Default tax / GST rate (%)</label>
              <input className="input mono" type="number" min="0" step="0.1" value={business.defaultTaxRate} onChange={(e) => updateBusiness({ defaultTaxRate: e.target.value })} />
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h2 style={{ fontSize: 18, margin: "0 0 14px", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><Target size={16} /> Business goals</h2>
        <Card style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="label">Monthly revenue goal</label>
              <input className="input mono" type="number" min="0" step="1" value={goals.monthlyRevenueGoal} onChange={(e) => updateGoals({ monthlyRevenueGoal: e.target.value })} />
            </div>
            <div>
              <label className="label">Monthly expense budget</label>
              <input className="input mono" type="number" min="0" step="1" value={goals.monthlyExpenseBudget} onChange={(e) => updateGoals({ monthlyExpenseBudget: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Savings goal</label>
            <input className="input mono" type="number" min="0" step="1" value={goals.savingsGoal} onChange={(e) => updateGoals({ savingsGoal: e.target.value })} />
          </div>
          {goals.monthlyRevenueGoal > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: "var(--text-muted)" }}>This month's progress</span>
                <span className="mono">{fmtMoney(monthIncome, currency)} / {fmtMoney(goals.monthlyRevenueGoal, currency)}</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: "var(--bg-soft)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${revenueProgress}%`, background: "var(--accent-grad)" }} />
              </div>
            </div>
          )}
        </Card>
      </div>

      <div>
        <h2 style={{ fontSize: 18, margin: "0 0 14px", fontWeight: 700 }}>Notification preferences</h2>
        <Card style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            ["emailReminders", "Email reminders for due invoices"],
            ["dueDateAlerts", "In-app alerts for approaching due dates"],
            ["weeklySummary", "Weekly summary digest"],
          ].map(([key, label]) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5 }}>
              <input type="checkbox" className="checkbox" checked={notifPrefs[key]} onChange={(e) => updateNotifPrefs({ [key]: e.target.checked })} /> {label}
            </label>
          ))}
          <div style={{ display: "flex", gap: 8, fontSize: 11.5, color: "var(--text-muted)", background: "var(--bg-soft)", padding: "8px 10px", borderRadius: 8, marginTop: 4 }}>
            <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            These preferences are saved, but this project runs entirely in your browser with no server, so it can't actually send emails or push notifications. Wire these into an email/notification service if you deploy a backend.
          </div>
        </Card>
      </div>

      <div>
        <h2 style={{ fontSize: 18, margin: "0 0 14px", fontWeight: 700 }}>Data management</h2>
        <Card style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ExportMenu label="All invoices" onExport={exportAllInvoices} />
            <ExportMenu label="All expenses" onExport={exportAllExpenses} />
            <button className="btn btn-ghost" onClick={() => downloadBlob(JSON.stringify(data, null, 2), "ledger-backup.json", "application/json")}>
              <FileJson size={14} /> Full backup (JSON)
            </button>
            <button className="btn btn-ghost" onClick={() => importRef.current?.click()}>
              <Upload size={14} /> Restore from backup
            </button>
            <input ref={importRef} type="file" accept="application/json" style={{ display: "none" }} onChange={onImport} />
          </div>
          <button className="btn btn-ghost" style={{ color: "var(--danger)", width: "fit-content" }} onClick={() => { if (confirm("This clears everything and can't be undone. Continue?")) resetAllData(); }}>
            <RotateCcw size={14} /> Reset all data
          </button>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", background: "var(--bg-soft)", padding: "8px 10px", borderRadius: 8 }}>
            Data is stored locally in this browser (localStorage). Backup and restore lets you move data between browsers or devices, since there's no cloud sync without a backend.
          </div>
        </Card>
      </div>
    </div>
  );
}
