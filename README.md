# Freelance. — Invoice & Expense Tracker

A full freelancer invoice, expense, project, and time-tracking app built with React + Vite. Runs entirely in your browser, no backend required.

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

To build for production / static hosting:

```bash
npm run build
npm run preview
```

The `dist/` folder can be deployed to any static host (Netlify, Vercel, GitHub Pages, S3, etc).

## What's included

- **Dashboard** — income, expenses, profit, outstanding balances, cash flow chart, expense breakdown donut, recent invoices, top expenses, upcoming due-date reminders
- **Invoices** — multi-line items, tax/GST, discounts, multiple currencies, payment terms, recurring flag, project linking, partial payments, auto status (draft/sent/partial/paid/overdue), invoice preview + real PDF export
- **Expenses** — categories, payment method, receipt upload (stored as a data URL), billable-to-client flag, tax-deductible flag, search/filter
- **Clients** — directory with contact info, computed revenue and invoice history per client
- **Projects** — linked to clients, computed revenue/cost/profit from linked invoices and expenses
- **Time tracking** — log billable hours, convert unbilled time into a draft invoice automatically
- **Payments** — record payments against invoices (bank transfer, UPI, card, PayPal, wallet, cash, check), full payment history
- **Reports** — profit & loss, income, expense, client revenue, project profitability, and tax summary reports, each exportable
- **Calendar** — month view of invoice due dates
- **Settings** — business profile & logo, default currency/tax rate, bank details, business goals with progress bars, notification preferences, full JSON backup/restore, CSV/Excel/JSON export everywhere
- **Light / dark theme toggle** — dark is near-black, light is light blue & white (toggle in the top bar)
- **Global search** — filters invoices, expenses, and clients as you type

## Honest limitations

This is a static front-end app with `localStorage` persistence — there's no server. A few things from a full commercial product (FreshBooks/Zoho-style) genuinely need backend infrastructure and are **not** implemented here:

- Real online payments (UPI/card/wallet processing) — would need a payment gateway integration (Stripe, Razorpay, etc.)
- Cloud sync across devices — would need a database + auth backend
- User authentication / accounts / role-based access / team collaboration
- Real email or push notifications — notification preferences are saved but not wired to a sending service
- Receipt OCR / auto-scanning

If you want any of these, the natural next step is adding a backend (e.g. Supabase, Firebase, or a small Node/Express API) — happy to help scaffold that separately.

## Tech stack

React 18, Vite, Recharts (charts), Papaparse (CSV), SheetJS/xlsx (Excel), jsPDF + html2canvas (PDF export), Lucide (icons). No CSS framework — plain CSS with theme variables in `src/index.css`.
