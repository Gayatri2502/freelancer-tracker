import React, { useMemo } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, AlertCircle, ArrowUpRight } from "lucide-react";
import { Card, Metric, StatusPill } from "./ui.jsx";
import { fmtMoney, fmtDate, invoiceTotal, invoicePaid, invoiceBalance, effectiveStatus, todayStr } from "../lib/utils.js";

const PIE_COLORS = ["#5B7CFA", "#F59E0B", "#22C55E", "#EF4444", "#A78BFA", "#38BDF8", "#EC4899", "#94A3B8"];

export default function Dashboard({ data, currency }) {
  const { invoices, expenses, payments, clients } = data;
  const clientsById = Object.fromEntries(clients.map((c) => [c.id, c]));

  const totals = useMemo(() => invoices.reduce((acc, inv) => {
    const t = invoiceTotal(inv);
    const st = effectiveStatus(inv, payments);
    acc.invoiced += t;
    if (st === "paid" || st === "partial") acc.received += invoicePaid(inv, payments);
    if (st !== "draft") acc.outstanding += invoiceBalance(inv, payments);
    return acc;
  }, { invoiced: 0, received: 0, outstanding: 0 }), [invoices, payments]);

  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const profit = totals.received - totalExpenses;

  const monthly = useMemo(() => {
    const map = {}; const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString(undefined, { month: "short" });
      map[key] = { month: key, income: 0, expenses: 0 };
    }
    payments.forEach((p) => {
      const key = new Date(p.date + "T00:00:00").toLocaleDateString(undefined, { month: "short" });
      if (map[key]) map[key].income += Number(p.amount) || 0;
    });
    expenses.forEach((e) => {
      const key = new Date(e.date + "T00:00:00").toLocaleDateString(undefined, { month: "short" });
      if (map[key]) map[key].expenses += Number(e.amount) || 0;
    });
    return Object.values(map);
  }, [payments, expenses]);

  const expenseByCategory = useMemo(() => {
    const map = {};
    expenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + (Number(e.amount) || 0); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const topExpenses = [...expenses].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0)).slice(0, 5);
  const recentInvoices = [...invoices].sort((a, b) => b.issueDate.localeCompare(a.issueDate)).slice(0, 5);
  const upcomingReminders = invoices
    .filter((inv) => effectiveStatus(inv, payments) !== "paid" && inv.status !== "draft" && inv.dueDate >= todayStr())
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <Metric label="Total income" value={fmtMoney(totals.received, currency)} icon={TrendingUp} tone="success" sub="Payments received" />
        <Metric label="Total expenses" value={fmtMoney(totalExpenses, currency)} icon={Wallet} tone="warning" sub={`${expenses.length} logged`} />
        <Metric label="Profit" value={fmtMoney(profit, currency)} icon={profit >= 0 ? TrendingUp : TrendingDown} tone={profit >= 0 ? "success" : "danger"} sub="Income minus expenses" />
        <Metric label="Outstanding" value={fmtMoney(totals.outstanding, currency)} icon={AlertCircle} tone="danger" sub={`${invoices.filter(i => effectiveStatus(i, payments) !== "paid" && i.status !== "draft").length} invoices pending`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, marginBottom: 20 }}>
        <Card style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <div className="label" style={{ marginBottom: 0 }}>Cash flow overview</div>
          </div>
          <div style={{ display: "flex", gap: 18, marginBottom: 8 }}>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--success)" }}>{fmtMoney(totals.received, currency)} <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>income</span></div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--danger)" }}>{fmtMoney(totalExpenses, currency)} <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>expenses</span></div>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--success)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--danger)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--danger)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--text-muted)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={46} />
                <Tooltip formatter={(v) => fmtMoney(v, currency)} contentStyle={{ fontSize: 12, borderRadius: 8, background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                <Area type="monotone" dataKey="income" stroke="var(--success)" fill="url(#inc)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" stroke="var(--danger)" fill="url(#exp)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ padding: "18px 20px" }}>
          <div className="label">Expense summary</div>
          {expenseByCategory.length === 0 ? <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 10 }}>No expenses yet.</div> : (
            <>
              <div style={{ height: 160, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseByCategory} dataKey="value" nameKey="name" innerRadius={45} outerRadius={68} paddingAngle={2}>
                      {expenseByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtMoney(v, currency)} contentStyle={{ fontSize: 12, borderRadius: 8, background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 700 }}>{fmtMoney(totalExpenses, currency)}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>total</div>
                </div>
              </div>
              <div style={{ marginTop: 6 }}>
                {expenseByCategory.slice(0, 5).map((c, i) => (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {c.name}
                    </span>
                    <span className="mono">{fmtMoney(c.value, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <Card style={{ padding: "16px 18px" }}>
          <div className="label" style={{ marginBottom: 10 }}>Recent invoices</div>
          {recentInvoices.length === 0 ? <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>No invoices yet.</div> : recentInvoices.map((inv) => (
            <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }}>
              <div>
                <div style={{ fontWeight: 600 }}>#{inv.number}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{clientsById[inv.clientId]?.name || "Unknown"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mono">{fmtMoney(invoiceTotal(inv), inv.currency)}</div>
                <StatusPill status={effectiveStatus(inv, payments)} label={effectiveStatus(inv, payments)} />
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ padding: "16px 18px" }}>
          <div className="label" style={{ marginBottom: 10 }}>Top expenses</div>
          {topExpenses.length === 0 ? <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>No expenses yet.</div> : topExpenses.map((e) => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{e.vendor}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 11 }}>{fmtDate(e.date)}</div>
              </div>
              <div className="mono">{fmtMoney(e.amount, e.currency)}</div>
            </div>
          ))}
        </Card>

        <Card style={{ padding: "16px 18px" }}>
          <div className="label" style={{ marginBottom: 10 }}>Upcoming reminders</div>
          {upcomingReminders.length === 0 ? <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>Nothing due soon.</div> : upcomingReminders.map((inv) => (
            <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }}>
              <div>
                <div style={{ fontWeight: 600 }}>Invoice #{inv.number}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 11 }}>Due {fmtDate(inv.dueDate)}</div>
              </div>
              <div className="mono" style={{ color: "var(--danger)" }}>{fmtMoney(invoiceBalance(inv, payments), inv.currency)}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
