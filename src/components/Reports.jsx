import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, ExportMenu, EmptyState } from "./ui.jsx";
import { fmtMoney, invoiceTotal, invoicePaid, invoiceBalance, effectiveStatus } from "../lib/utils.js";
import { exportRows } from "../lib/exporters.js";

const REPORTS = [
  { id: "pl", label: "Profit & loss" },
  { id: "income", label: "Income report" },
  { id: "expense", label: "Expense report" },
  { id: "client", label: "Client revenue" },
  { id: "project", label: "Project profitability" },
  { id: "tax", label: "Tax summary" },
];

function monthKey(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

export default function Reports({ data, currency }) {
  const [type, setType] = useState("pl");
  const { invoices, expenses, payments, clients, projects } = data;
  const clientsById = Object.fromEntries(clients.map((c) => [c.id, c]));

  const monthlyPL = useMemo(() => {
    const map = {};
    payments.forEach((p) => { const k = monthKey(p.date); map[k] = map[k] || { month: k, income: 0, expenses: 0 }; map[k].income += Number(p.amount) || 0; });
    expenses.forEach((e) => { const k = monthKey(e.date); map[k] = map[k] || { month: k, income: 0, expenses: 0 }; map[k].expenses += Number(e.amount) || 0; });
    return Object.values(map).sort((a, b) => new Date(a.month) - new Date(b.month)).map((r) => ({ ...r, profit: r.income - r.expenses }));
  }, [payments, expenses]);

  const clientRevenue = useMemo(() => clients.map((c) => {
    const clientInvoices = invoices.filter((i) => i.clientId === c.id);
    const revenue = clientInvoices.reduce((s, i) => s + invoicePaid(i, payments), 0);
    const outstanding = clientInvoices.reduce((s, i) => s + invoiceBalance(i, payments), 0);
    return { client: c.name, revenue, outstanding, invoices: clientInvoices.length };
  }).sort((a, b) => b.revenue - a.revenue), [clients, invoices, payments]);

  const projectProfit = useMemo(() => projects.map((p) => {
    const revenue = invoices.filter((i) => i.projectId === p.id).reduce((s, i) => s + invoicePaid(i, payments), 0);
    const cost = expenses.filter((e) => e.projectId === p.id).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return { project: p.name, client: clientsById[p.clientId]?.name || "", revenue, cost, profit: revenue - cost };
  }).sort((a, b) => b.profit - a.profit), [projects, invoices, expenses, payments]);

  const taxSummary = useMemo(() => {
    const totalTax = invoices.reduce((s, inv) => {
      const subtotal = inv.items.reduce((s2, it) => s2 + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
      const discounted = subtotal - subtotal * ((Number(inv.discountPct) || 0) / 100);
      return s + discounted * ((Number(inv.taxRate) || 0) / 100);
    }, 0);
    const deductibleExpenses = expenses.filter((e) => e.taxDeductible).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return { totalTax, deductibleExpenses, nonDeductible: expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0) - deductibleExpenses };
  }, [invoices, expenses]);

  const totalIncome = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalExpense = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: 18, margin: 0, fontWeight: 700 }}>Reports</h2>
        <select className="input" style={{ width: 220 }} value={type} onChange={(e) => setType(e.target.value)}>
          {REPORTS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
      </div>

      {type === "pl" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 18 }}>
            <Card style={{ padding: 14 }}><div className="label">Total income</div><div className="mono" style={{ fontSize: 19, fontWeight: 700, color: "var(--success)" }}>{fmtMoney(totalIncome, currency)}</div></Card>
            <Card style={{ padding: 14 }}><div className="label">Total expenses</div><div className="mono" style={{ fontSize: 19, fontWeight: 700, color: "var(--danger)" }}>{fmtMoney(totalExpense, currency)}</div></Card>
            <Card style={{ padding: 14 }}><div className="label">Net profit</div><div className="mono" style={{ fontSize: 19, fontWeight: 700 }}>{fmtMoney(totalIncome - totalExpense, currency)}</div></Card>
          </div>
          {monthlyPL.length === 0 ? <EmptyState text="No data yet." /> : (
            <Card style={{ padding: "16px 18px" }}>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPL}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip formatter={(v) => fmtMoney(v, currency)} contentStyle={{ fontSize: 12, borderRadius: 8, background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="income" name="Income" fill="var(--success)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="var(--danger)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </>
      )}

      {type === "income" && (
        <ReportTable
          rows={payments.map((p) => ({ date: p.date, amount: p.amount, method: p.method }))}
          columns={[["date", "Date"], ["amount", "Amount"], ["method", "Method"]]}
          currency={currency} filename="income-report" moneyCols={["amount"]}
        />
      )}
      {type === "expense" && (
        <ReportTable
          rows={expenses.map((e) => ({ date: e.date, vendor: e.vendor, category: e.category, amount: e.amount }))}
          columns={[["date", "Date"], ["vendor", "Vendor"], ["category", "Category"], ["amount", "Amount"]]}
          currency={currency} filename="expense-report" moneyCols={["amount"]}
        />
      )}
      {type === "client" && (
        <ReportTable rows={clientRevenue} columns={[["client", "Client"], ["revenue", "Revenue"], ["outstanding", "Outstanding"], ["invoices", "Invoices"]]}
          currency={currency} filename="client-revenue" moneyCols={["revenue", "outstanding"]} />
      )}
      {type === "project" && (
        <ReportTable rows={projectProfit} columns={[["project", "Project"], ["client", "Client"], ["revenue", "Revenue"], ["cost", "Cost"], ["profit", "Profit"]]}
          currency={currency} filename="project-profitability" moneyCols={["revenue", "cost", "profit"]} />
      )}
      {type === "tax" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <Card style={{ padding: 14 }}><div className="label">Tax / GST collected</div><div className="mono" style={{ fontSize: 19, fontWeight: 700 }}>{fmtMoney(taxSummary.totalTax, currency)}</div></Card>
          <Card style={{ padding: 14 }}><div className="label">Deductible expenses</div><div className="mono" style={{ fontSize: 19, fontWeight: 700, color: "var(--success)" }}>{fmtMoney(taxSummary.deductibleExpenses, currency)}</div></Card>
          <Card style={{ padding: 14 }}><div className="label">Non-deductible expenses</div><div className="mono" style={{ fontSize: 19, fontWeight: 700, color: "var(--text-muted)" }}>{fmtMoney(taxSummary.nonDeductible, currency)}</div></Card>
        </div>
      )}
    </div>
  );
}

function ReportTable({ rows, columns, currency, filename, moneyCols = [] }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <ExportMenu onExport={(fmt) => exportRows(rows, filename, fmt)} />
      </div>
      {rows.length === 0 ? <EmptyState text="No data yet." /> : (
        <div className="scrollbar" style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr>{columns.map(([key, label]) => <th key={key} className="label" style={{ marginBottom: 0 }}>{label}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {columns.map(([key]) => (
                    <td key={key} className={moneyCols.includes(key) ? "mono" : ""}>
                      {moneyCols.includes(key) ? fmtMoney(r[key], currency) : String(r[key] ?? "\u2014")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
