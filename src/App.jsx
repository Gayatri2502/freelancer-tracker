import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Invoices from "./components/Invoices.jsx";
import Expenses from "./components/Expenses.jsx";
import Clients from "./components/Clients.jsx";
import Projects from "./components/Projects.jsx";
import TimeTracking from "./components/TimeTracking.jsx";
import Payments from "./components/Payments.jsx";
import Reports from "./components/Reports.jsx";
import CalendarView from "./components/Calendar.jsx";
import Settings from "./components/Settings.jsx";
import { emptyData, uid, todayStr, effectiveStatus, invoiceBalance } from "./lib/utils.js";
import { exportRows } from "./lib/exporters.js";

const STORAGE_KEY = "freelance-tracker-data";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw);
    const base = emptyData();
    return {
      ...base, ...parsed,
      business: { ...base.business, ...(parsed.business || {}) },
      goals: { ...base.goals, ...(parsed.goals || {}) },
      notifPrefs: { ...base.notifPrefs, ...(parsed.notifPrefs || {}) },
    };
  } catch {
    return emptyData();
  }
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const update = useCallback((patch) => setData((d) => ({ ...d, ...(typeof patch === "function" ? patch(d) : patch) })), []);
  const setTheme = (theme) => update({ theme });

  const currency = data.business.defaultCurrency || "USD";

  const saveInvoice = (inv) => {
    const exists = data.invoices.some((i) => i.id === inv.id);
    update((d) => ({
      invoices: exists ? d.invoices.map((i) => (i.id === inv.id ? inv : i)) : [...d.invoices, inv],
      invoiceSeq: exists ? d.invoiceSeq : d.invoiceSeq + 1,
    }));
  };
  const deleteInvoice = (id) => update((d) => ({ invoices: d.invoices.filter((i) => i.id !== id), payments: d.payments.filter((p) => p.invoiceId !== id) }));

  const saveExpense = (exp) => {
    const exists = data.expenses.some((e) => e.id === exp.id);
    update((d) => ({ expenses: exists ? d.expenses.map((e) => (e.id === exp.id ? exp : e)) : [...d.expenses, exp] }));
  };
  const deleteExpense = (id) => update((d) => ({ expenses: d.expenses.filter((e) => e.id !== id) }));

  const saveClient = (cl) => {
    const exists = data.clients.some((c) => c.id === cl.id);
    update((d) => ({ clients: exists ? d.clients.map((c) => (c.id === cl.id ? cl : c)) : [...d.clients, cl] }));
  };
  const deleteClient = (id) => update((d) => ({ clients: d.clients.filter((c) => c.id !== id) }));

  const saveProject = (p) => {
    const exists = data.projects.some((x) => x.id === p.id);
    update((d) => ({ projects: exists ? d.projects.map((x) => (x.id === p.id ? p : x)) : [...d.projects, p] }));
  };
  const deleteProject = (id) => update((d) => ({ projects: d.projects.filter((p) => p.id !== id) }));

  const saveEntry = (t) => {
    const exists = data.timeEntries.some((x) => x.id === t.id);
    update((d) => ({ timeEntries: exists ? d.timeEntries.map((x) => (x.id === t.id ? t : x)) : [...d.timeEntries, t] }));
  };
  const deleteEntry = (id) => update((d) => ({ timeEntries: d.timeEntries.filter((t) => t.id !== id) }));

  const savePayment = (p) => update((d) => ({ payments: [...d.payments, p] }));
  const deletePayment = (id) => update((d) => ({ payments: d.payments.filter((p) => p.id !== id) }));

  const convertToInvoice = (clientId, entries) => {
    const items = entries.map((t) => ({ id: uid(), desc: t.description, qty: Number(t.hours) || 0, rate: Number(t.rate) || 0 }));
    const inv = {
      id: uid(), number: data.invoiceSeq, clientId, projectId: entries[0]?.projectId || "",
      issueDate: todayStr(), dueDate: todayStr(), status: "draft",
      taxRate: data.business.defaultTaxRate || 0, discountPct: 0, currency: data.business.defaultCurrency || "USD",
      paymentTerms: "Net 15", paymentMethod: "Bank transfer", recurring: "none", reference: "From tracked time", notes: "", items,
    };
    const entryIds = new Set(entries.map((t) => t.id));
    update((d) => ({
      invoices: [...d.invoices, inv],
      invoiceSeq: d.invoiceSeq + 1,
      timeEntries: d.timeEntries.map((t) => (entryIds.has(t.id) ? { ...t, invoiced: true } : t)),
    }));
    setTab("invoices");
  };

  const updateBusiness = (patch) => update((d) => ({ business: { ...d.business, ...patch } }));
  const updateGoals = (patch) => update((d) => ({ goals: { ...d.goals, ...patch } }));
  const updateNotifPrefs = (patch) => update((d) => ({ notifPrefs: { ...d.notifPrefs, ...patch } }));
  const replaceAllData = (imported) => setData({ ...emptyData(), ...imported });
  const resetAllData = () => setData(emptyData());

  const clientsById = Object.fromEntries(data.clients.map((c) => [c.id, c]));
  const exportAllInvoices = (fmt) => exportRows(data.invoices.map((inv) => ({
    number: inv.number, client: clientsById[inv.clientId]?.name || "", issueDate: inv.issueDate, dueDate: inv.dueDate,
    status: effectiveStatus(inv, data.payments), balance: invoiceBalance(inv, data.payments).toFixed(2), currency: inv.currency,
  })), "invoices", fmt);
  const exportAllExpenses = (fmt) => exportRows(data.expenses.map((e) => ({
    date: e.date, vendor: e.vendor, category: e.category, amount: e.amount, currency: e.currency,
  })), "expenses", fmt);

  const reminderCount = data.invoices.filter((i) => i.status !== "draft" && effectiveStatus(i, data.payments) !== "paid" && i.dueDate >= todayStr()).length;

  return (
    <div className="app" data-theme={data.theme}>
      <Sidebar tab={tab} setTab={setTab} businessName={data.business.name} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar theme={data.theme} setTheme={setTheme} search={search} setSearch={setSearch} business={data.business} reminders={reminderCount} />
        <div className="scrollbar" style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {tab === "dashboard" && <Dashboard data={data} currency={currency} />}
          {tab === "invoices" && <Invoices data={data} currency={currency} saveInvoice={saveInvoice} deleteInvoice={deleteInvoice} search={search} />}
          {tab === "expenses" && <Expenses data={data} currency={currency} saveExpense={saveExpense} deleteExpense={deleteExpense} search={search} />}
          {tab === "clients" && <Clients data={data} saveClient={saveClient} deleteClient={deleteClient} search={search} />}
          {tab === "projects" && <Projects data={data} currency={currency} saveProject={saveProject} deleteProject={deleteProject} search={search} />}
          {tab === "time" && <TimeTracking data={data} currency={currency} saveEntry={saveEntry} deleteEntry={deleteEntry} convertToInvoice={convertToInvoice} />}
          {tab === "payments" && <Payments data={data} currency={currency} savePayment={savePayment} deletePayment={deletePayment} />}
          {tab === "reports" && <Reports data={data} currency={currency} />}
          {tab === "calendar" && <CalendarView data={data} currency={currency} />}
          {tab === "settings" && (
            <Settings
              data={data} currency={currency}
              updateBusiness={updateBusiness} updateGoals={updateGoals} updateNotifPrefs={updateNotifPrefs}
              exportAllInvoices={exportAllInvoices} exportAllExpenses={exportAllExpenses}
              replaceAllData={replaceAllData} resetAllData={resetAllData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
