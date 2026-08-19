export const uid = () => Math.random().toString(36).slice(2, 10);
export const todayStr = () => new Date().toISOString().slice(0, 10);

export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD"];
export const CURRENCY_SYMBOLS = { USD: "$", EUR: "\u20AC", GBP: "\u00A3", INR: "\u20B9", CAD: "CA$", AUD: "A$" };
export const EXPENSE_CATEGORIES = ["Software", "Travel", "Office", "Meals", "Marketing", "Equipment", "Contractors", "Other"];
export const PAYMENT_METHODS = ["Bank transfer", "UPI", "Card", "PayPal", "Wallet", "Cash", "Check", "Other"];
export const PAYMENT_TERMS = ["Due on receipt", "Net 7", "Net 15", "Net 30", "Net 60"];
export const PROJECT_STATUSES = ["Active", "On hold", "Completed"];
export const RECURRING_INTERVALS = ["none", "weekly", "monthly", "quarterly", "yearly"];

export function fmtMoney(n, currency = "USD") {
  const v = Number(n) || 0;
  try {
    return v.toLocaleString(undefined, { style: "currency", currency, maximumFractionDigits: 2 });
  } catch {
    return `${CURRENCY_SYMBOLS[currency] || "$"}${v.toFixed(2)}`;
  }
}

export function fmtDate(d) {
  if (!d) return "\u2014";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function emptyData() {
  return {
    theme: "dark",
    business: {
      name: "Your Business", email: "", address: "", taxId: "", logo: "",
      bankDetails: "", defaultCurrency: "USD", defaultTaxRate: 0,
    },
    clients: [],
    projects: [],
    invoices: [],
    payments: [],
    expenses: [],
    timeEntries: [],
    goals: { monthlyRevenueGoal: 0, monthlyExpenseBudget: 0, savingsGoal: 0 },
    invoiceSeq: 1001,
    notifPrefs: { emailReminders: true, dueDateAlerts: true, weeklySummary: false },
  };
}

export function invoiceSubtotal(inv) {
  return inv.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
}
export function invoiceTotal(inv) {
  const subtotal = invoiceSubtotal(inv);
  const discounted = subtotal - subtotal * ((Number(inv.discountPct) || 0) / 100);
  return discounted * (1 + (Number(inv.taxRate) || 0) / 100);
}
export function invoicePaid(inv, payments) {
  return payments.filter((p) => p.invoiceId === inv.id).reduce((s, p) => s + (Number(p.amount) || 0), 0);
}
export function invoiceBalance(inv, payments) {
  return Math.max(0, invoiceTotal(inv) - invoicePaid(inv, payments));
}
export function effectiveStatus(inv, payments) {
  if (inv.status === "draft") return "draft";
  const bal = invoiceBalance(inv, payments);
  const paid = invoicePaid(inv, payments);
  if (bal <= 0.004) return "paid";
  if (inv.dueDate && inv.dueDate < todayStr() && bal > 0) return "overdue";
  if (paid > 0) return "partial";
  return "sent";
}

export const STATUS_META = {
  paid: { color: "success", label: "Paid" },
  sent: { color: "info", label: "Sent" },
  partial: { color: "violet", label: "Partial" },
  overdue: { color: "danger", label: "Overdue" },
  draft: { color: "warning", label: "Draft" },
};

export function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
