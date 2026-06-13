# SmartBill — Implementation Action Plan

> Sprint-by-sprint plan to close the gaps identified in the audit.
> Sprints are 1 week. Hour estimates are for a single developer.
> Phases group sprints by theme.

---

## Reading This Document

- Each sprint has a goal, task list, file(s) to create or modify, and hour estimates
- Total estimated hours per sprint shown at the end of each sprint
- Dependencies noted so sprints cannot be reordered without risk
- "Quick wins" marked with ⚡ — items under 2 hours with meaningful impact

---

## Phase 0 — Critical Bug Fixes (Before Any New Features)

**Goal:** Fix the data integrity bugs that corrupt live data.
**Duration:** 1 sprint (~1-2 days)
**Prerequisite for:** Everything

### Sprint 0.1 — Data Integrity Hotfixes

| # | Task | File | Hours |
|---|---|---|---|
| 0.1.1 | ⚡ Fix stale stock read on invoice delete: replace `{ stockCount: item.product.stockCount + item.quantity }` with `{ stockCount: { increment: item.quantity } }` | `app/api/invoices/[id]/route.js` | 0.5h |
| 0.1.2 | ⚡ Fix creditUsed not decremented on invoice delete: add `await tx.customer.update({ data: { creditUsed: { decrement: Math.max(0, inv.grandTotal - inv.amountPaid) } } })` inside DELETE transaction | `app/api/invoices/[id]/route.js` | 0.5h |
| 0.1.3 | ⚡ Fix client-supplied unit prices: remove `item.unitPrice` from invoice creation; always use `prod.price` from DB | `app/api/invoices/route.js` | 0.5h |
| 0.1.4 | ⚡ Sanitize 500 error responses: replace `details: error.message` with generic messages; log the real error server-side | `app/api/products/[id]/route.js`, `app/api/customers/[id]/route.js`, all route files | 1h |
| 0.1.5 | Add `/api/customers/[id]/reconcile` endpoint that recomputes creditUsed from DB (for fixing existing drift) | `app/api/customers/[id]/reconcile/route.js` | 1.5h |

**Sprint 0.1 total: ~4 hours**

---

## Phase 1 — Foundation: Schema + Database Migrations

**Goal:** Establish a proper migration-based workflow and add all pending schema fields before building features.
**Duration:** 1-2 sprints
**Prerequisite for:** Phase 2 (AR), Phase 3 (Permissions), Phase 4 (Purchase)

### Sprint 1.1 — Switch to Prisma Migrate

| # | Task | File | Hours |
|---|---|---|---|
| 1.1.1 | Create a baseline migration from current schema state: `prisma migrate dev --name baseline` | `prisma/migrations/` | 1h |
| 1.1.2 | Update `package.json` scripts: replace `prisma db push` with `prisma migrate dev` in dev; `prisma migrate deploy` in CI | `package.json` | 0.5h |
| 1.1.3 | Create `.env.example` with all required environment variable keys (no values) | `.env.example` | 0.5h |

**Sprint 1.1 total: ~2 hours**

### Sprint 1.2 — Phase 1 Schema Fields

| # | Task | File | Hours |
|---|---|---|---|
| 1.2.1 | Add InvoiceStatus enum values: OVERDUE, CANCELLED, WRITTEN_OFF | `prisma/schema.prisma` | 0.5h |
| 1.2.2 | Add Invoice fields: `isOverdue Boolean @default(false)`, `internalNotes String?`, `collectionStatus CollectionStatus @default(CURRENT)`, `lastReminderSentAt DateTime?`, `reminderCount Int @default(0)` | `prisma/schema.prisma` | 0.5h |
| 1.2.3 | Add CollectionStatus enum: CURRENT, WATCHLIST, AT_RISK, DELINQUENT, ESCALATED | `prisma/schema.prisma` | 0.25h |
| 1.2.4 | Add Customer fields: `riskLevel RiskLevel @default(NORMAL)`, `tags String[]` | `prisma/schema.prisma` | 0.25h |
| 1.2.5 | Add RiskLevel enum: LOW, NORMAL, MEDIUM, HIGH, CRITICAL | `prisma/schema.prisma` | 0.25h |
| 1.2.6 | Add Product fields: `hsnCode String?`, `reorderLevel Int?` | `prisma/schema.prisma` | 0.25h |
| 1.2.7 | Add Payment cheque fields: `chequeNumber String?`, `chequeDate DateTime?`, `bankName String?`, `chequeCleared Boolean @default(false)`, `chequeClearedAt DateTime?` | `prisma/schema.prisma` | 0.5h |
| 1.2.8 | Add StockMovement model: `id, shopId, productId, invoiceId?, type (SALE/RETURN/ADJUSTMENT/GRN), delta, balanceAfter, reason String?, createdBy, createdAt` | `prisma/schema.prisma` | 0.5h |
| 1.2.9 | Add AuditLog model: `id, shopId, actorId, action, entity, entityId, before Json?, after Json?, createdAt` | `prisma/schema.prisma` | 0.5h |
| 1.2.10 | Run migration and generate client: `prisma migrate dev --name phase1-schema-additions` | `prisma/migrations/` | 0.25h |

**Sprint 1.2 total: ~4 hours**

---

## Phase 2 — Overdue Detection & AR Foundation

**Goal:** Let the shop owner know who owes money and for how long.
**Duration:** 2 sprints
**Prerequisite for:** Phase 7 (Notifications)

### Sprint 2.1 — Overdue Detection Cron

| # | Task | File | Hours |
|---|---|---|---|
| 2.1.1 | Create `/api/cron/overdue-detector` route: query invoices where `dueDate < now AND status NOT IN [PAID, CANCELLED]`, batch-update `isOverdue = true`, status = OVERDUE | `app/api/cron/overdue-detector/route.js` | 2h |
| 2.1.2 | Add `CRON_SECRET` env var check on cron route (Bearer token validation) | `app/api/cron/overdue-detector/route.js` | 0.5h |
| 2.1.3 | Add overdue badge to invoice list UI: show "X days overdue" in red on OVERDUE invoices | `app/(app)/invoices/page.jsx` | 1.5h |
| 2.1.4 | Add "Due In" column to invoice list: `date-fns formatDistanceToNow` | `app/(app)/invoices/page.jsx` | 1h |
| 2.1.5 | Add StockMovement records on invoice creation (SALE type) and deletion (RETURN type) | `app/api/invoices/route.js`, `app/api/invoices/[id]/route.js` | 1.5h |

**Sprint 2.1 total: ~6.5 hours**

### Sprint 2.2 — Pending Payments Page

| # | Task | File | Hours |
|---|---|---|---|
| 2.2.1 | Create `/app/(app)/pending-payments/page.jsx`: list of PENDING + PARTIAL + OVERDUE invoices sorted by age | `app/(app)/pending-payments/page.jsx` | 3h |
| 2.2.2 | Add aging buckets display: Current / 1-7 / 8-30 / 31-60 / 61-90 / 90+ days columns | `app/(app)/pending-payments/page.jsx` | 2h |
| 2.2.3 | Add `/api/invoices` filter for `overdue=true` and `dueFrom`/`dueTo` date params | `app/api/invoices/route.js` | 1h |
| 2.2.4 | Add AR summary cards to dashboard: Overdue Count, Due Today, Due This Week, Total Outstanding | `app/(app)/dashboard/page.jsx` | 2h |
| 2.2.5 | Add "Pending Payments" link to sidebar | `components/layout/AppSidebar.jsx` | 0.25h |

**Sprint 2.2 total: ~8.25 hours**

---

## Phase 3 — Input Validation & API Hardening

**Goal:** Prevent malformed data and improve error quality without changing features.
**Duration:** 1 sprint
**Prerequisite for:** Phase 5 (Permissions) — clean APIs make permission checks easier to add

### Sprint 3.1 — Zod Validation

| # | Task | File | Hours |
|---|---|---|---|
| 3.1.1 | Install Zod: `npm install zod` | `package.json` | 0.25h |
| 3.1.2 | Create `lib/schemas/invoice.js`: Zod schema for invoice POST body | `lib/schemas/invoice.js` | 1h |
| 3.1.3 | Create `lib/schemas/customer.js`, `lib/schemas/product.js`, `lib/schemas/payment.js` | `lib/schemas/` | 1.5h |
| 3.1.4 | Apply schemas in each route: parse input, return 400 with Zod error messages on failure | All `app/api/*/route.js` files | 2h |
| 3.1.5 | Add pagination params to invoice, customer, product list endpoints (`page`, `pageSize`, max 100) | `app/api/invoices/route.js`, `app/api/customers/route.js`, `app/api/products/route.js` | 2h |
| 3.1.6 | Update list UIs to handle paginated responses (add page controls) | `app/(app)/invoices/page.jsx`, `app/(app)/customers/page.jsx`, `app/(app)/products/page.jsx` | 3h |

**Sprint 3.1 total: ~10 hours**

---

## Phase 4 — Reports Performance Fix

**Goal:** Fix the full-table-scan dashboard before it causes outages.
**Duration:** 1 sprint

### Sprint 4.1 — Aggregated Reports API

| # | Task | File | Hours |
|---|---|---|---|
| 4.1.1 | Rewrite `/api/reports` to use SQL aggregation: `groupBy issuedAt` for chart data; `_sum` for totals; `_count` for customer count | `app/api/reports/route.js` | 3h |
| 4.1.2 | Separate report endpoints: `/api/reports/summary` (KPIs), `/api/reports/charts` (30d/12m data), `/api/reports/top-customers`, `/api/reports/top-products` | `app/api/reports/` | 3h |
| 4.1.3 | Update dashboard to call the new endpoints in parallel | `app/(app)/dashboard/page.jsx` | 1.5h |
| 4.1.4 | Add date range filter to reports (from/to query params) | `app/api/reports/` | 1.5h |

**Sprint 4.1 total: ~9 hours**

---

## Phase 5 — Permission System

**Goal:** Make the app safe for multi-employee shops.
**Duration:** 3-4 sprints
**Prerequisite for:** Phase 7 (Approval Workflows)

### Sprint 5.1 — Permission Infrastructure

| # | Task | File | Hours |
|---|---|---|---|
| 5.1.1 | Define 30 permission keys as constants: INVOICE_CREATE, INVOICE_DELETE, CUSTOMER_EDIT, SETTINGS_EDIT, etc. | `lib/permissions.js` | 2h |
| 5.1.2 | Create `hasPermission(user, permKey)` function: check user.role against default role-permission map | `lib/permissions.js` | 2h |
| 5.1.3 | Define default permission map for OWNER (all), MANAGER (no settings/delete), CASHIER (create only) | `lib/permissions.js` | 1h |
| 5.1.4 | Add permission check to DELETE /api/invoices/[id]: require INVOICE_DELETE | `app/api/invoices/[id]/route.js` | 0.5h |
| 5.1.5 | Add permission check to DELETE /api/customers/[id]: require CUSTOMER_DELETE | `app/api/customers/[id]/route.js` | 0.5h |
| 5.1.6 | Add permission check to PUT /api/profile: require SETTINGS_EDIT | `app/api/profile/route.js` | 0.5h |
| 5.1.7 | Add permission check to DELETE /api/products/[id]: require PRODUCT_DELETE | `app/api/products/[id]/route.js` | 0.5h |

**Sprint 5.1 total: ~7 hours**

### Sprint 5.2 — Permission-Aware UI

| # | Task | File | Hours |
|---|---|---|---|
| 5.2.1 | Create `components/PermissionGate.jsx`: renders children if user has permission, else null or disabled | `components/PermissionGate.jsx` | 1h |
| 5.2.2 | Wrap Delete Invoice button in PermissionGate(INVOICE_DELETE) | `app/(app)/invoices/page.jsx` | 0.5h |
| 5.2.3 | Wrap Settings page content in PermissionGate(SETTINGS_EDIT) | `app/(app)/settings/page.jsx` | 0.5h |
| 5.2.4 | Hide profit margin data from CASHIER role in products list | `app/(app)/products/page.jsx` | 1h |
| 5.2.5 | Pass current user role to all page components via layout | `app/(app)/layout.jsx` | 1h |

**Sprint 5.2 total: ~4 hours**

### Sprint 5.3 — Employee Invitation UI

| # | Task | File | Hours |
|---|---|---|---|
| 5.3.1 | Create `/app/(app)/team/page.jsx`: list of users in shop with role badges | `app/(app)/team/page.jsx` | 3h |
| 5.3.2 | Add invite endpoint: POST `/api/team/invite` — create User with role, send Clerk invite | `app/api/team/invite/route.js` | 2h |
| 5.3.3 | Add role change endpoint: PUT `/api/team/[id]` — update User.role | `app/api/team/[id]/route.js` | 1h |
| 5.3.4 | Add deactivate user endpoint: sets a `isActive` flag (requires schema addition) | `app/api/team/[id]/route.js` | 1.5h |
| 5.3.5 | Add Team section to sidebar | `components/layout/AppSidebar.jsx` | 0.25h |

**Sprint 5.3 total: ~8 hours**

---

## Phase 6 — Invoice Improvements

**Goal:** Add cancel workflow, cheque payments, credit note groundwork.
**Duration:** 1-2 sprints

### Sprint 6.1 — Invoice Cancel & Cheque

| # | Task | File | Hours |
|---|---|---|---|
| 6.1.1 | Add POST `/api/invoices/[id]/cancel` endpoint: sets status=CANCELLED, refunds creditUsed and stock atomically | `app/api/invoices/[id]/cancel/route.js` | 2.5h |
| 6.1.2 | Add Cancel button to invoice list (replaces Delete for PENDING/PARTIAL) | `app/(app)/invoices/page.jsx` | 1h |
| 6.1.3 | Soft-delete option for products: add `isActive Boolean @default(true)` to Product schema, filter in GET | `prisma/schema.prisma`, `app/api/products/` | 1.5h |
| 6.1.4 | Add cheque fields to Payment recording dialog: show chequeNumber/chequeDate/bankName when CHEQUE selected | `app/(app)/invoices/page.jsx` | 2h |
| 6.1.5 | Add "Mark Cheque Cleared/Bounced" action on payment row in invoice detail | `app/(app)/invoices/page.jsx` | 1.5h |

**Sprint 6.1 total: ~8.5 hours**

---

## Phase 7 — GST Report

**Goal:** Give GST-registered businesses a way to extract filing data.
**Duration:** 1-2 sprints

### Sprint 7.1 — GST Data Foundation

| # | Task | File | Hours |
|---|---|---|---|
| 7.1.1 | Add hsnCode field to Product form UI (exposed in create/edit) | `app/(app)/products/page.jsx` | 1h |
| 7.1.2 | Create `/api/reports/gst` endpoint: accepts from/to; groups invoices by customer GST (B2B vs B2C); aggregates taxable value, tax per HSN | `app/api/reports/gst/route.js` | 4h |
| 7.1.3 | Create `/app/(app)/reports/gst/page.jsx`: date range selector, B2B table, B2C table, HSN summary | `app/(app)/reports/gst/page.jsx` | 4h |
| 7.1.4 | Add GST report CSV export (GSTR-1 compatible columns) | `app/(app)/reports/gst/page.jsx` | 2h |

**Sprint 7.1 total: ~11 hours**

---

## Phase 8 — Expense Tracking

**Goal:** Show the shop owner their actual profitability.
**Duration:** 2 sprints

### Sprint 8.1 — Expense Schema & API

| # | Task | File | Hours |
|---|---|---|---|
| 8.1.1 | Add Expense model and ExpenseCategory model to schema | `prisma/schema.prisma` | 1h |
| 8.1.2 | Create `/api/expenses` CRUD: GET (list with filters), POST (create) | `app/api/expenses/route.js` | 2h |
| 8.1.3 | Create `/api/expenses/[id]` CRUD: PUT, DELETE | `app/api/expenses/[id]/route.js` | 1.5h |

**Sprint 8.1 total: ~4.5 hours**

### Sprint 8.2 — Expense UI & P&L

| # | Task | File | Hours |
|---|---|---|---|
| 8.2.1 | Create `/app/(app)/expenses/page.jsx`: list + add expense form | `app/(app)/expenses/page.jsx` | 4h |
| 8.2.2 | Add P&L summary to `/api/reports/summary`: Revenue - COGS (costPrice * quantity) - Expenses = Gross Profit | `app/api/reports/summary/route.js` | 2h |
| 8.2.3 | Add P&L card to dashboard | `app/(app)/dashboard/page.jsx` | 1h |
| 8.2.4 | Add Expenses link to sidebar | `components/layout/AppSidebar.jsx` | 0.25h |

**Sprint 8.2 total: ~7.25 hours**

---

## Phase 9 — Quick Wins (Polish)

**Goal:** High-visibility improvements with low effort.
**Duration:** 1 sprint

### Sprint 9.1 — Quick Wins

| # | Task | File | Hours |
|---|---|---|---|
| 9.1.1 | ⚡ Dark mode: wrap layout with ThemeProvider from `next-themes`; add toggle button to header | `app/layout.jsx`, `components/layout/Header.jsx` | 2h |
| 9.1.2 | ⚡ Command palette: wire `cmdk` library; add Ctrl+K shortcut; implement basic navigation (New Invoice, Search Customer) | `components/CommandPalette.jsx` | 4h |
| 9.1.3 | ⚡ Expose SKU/barcode/costPrice in product form | `app/(app)/products/page.jsx` | 1.5h |
| 9.1.4 | ⚡ Add creditLimit field to customer create/edit form | `app/(app)/customers/page.jsx` | 1h |
| 9.1.5 | ⚡ Add date range filter to invoice list | `app/(app)/invoices/page.jsx` | 2h |
| 9.1.6 | Add customer statement date range filter + running balance column | `app/(app)/customers/page.jsx` | 2h |
| 9.1.7 | Update API URL pattern: add `/api/v1/` prefix or document the `/api/` choice as final | All routes OR `docs/MODULE_ARCHITECTURE.md` | 0.5h |

**Sprint 9.1 total: ~13 hours**

---

## Phase 10 — Automated Reminders (AR Module)

**Goal:** Automate WhatsApp/email follow-ups for overdue invoices.
**Duration:** 3-4 sprints
**Prerequisite:** Phase 1 (schema), Phase 2 (overdue detection)

### Sprint 10.1 — AR Schema & Config

| # | Task | File | Hours |
|---|---|---|---|
| 10.1.1 | Add CollectionNote, CollectionActivity, ReminderConfig, EscalationRule models to schema | `prisma/schema.prisma` | 1.5h |
| 10.1.2 | Add default ReminderConfig seed data (7-day, 14-day, 30-day intervals) | `prisma/seed.js` | 1h |
| 10.1.3 | Create GET/POST `/api/ar/collection-notes/[invoiceId]` | `app/api/ar/collection-notes/` | 2h |

**Sprint 10.1 total: ~4.5 hours**

### Sprint 10.2 — AR Cron Engine

| # | Task | File | Hours |
|---|---|---|---|
| 10.2.1 | Create `/api/cron/ar-reminder-engine`: score all overdue invoices by priority formula; generate WhatsApp URLs for staff | `app/api/cron/ar-reminder-engine/route.js` | 4h |
| 10.2.2 | Integrate Resend for email reminders: `npm install resend`, add `RESEND_API_KEY` env | `app/api/cron/ar-reminder-engine/route.js` | 3h |
| 10.2.3 | Create reminder email template (React Email) | `emails/OverdueReminder.jsx` | 2h |

**Sprint 10.2 total: ~9 hours**

### Sprint 10.3 — AR UI

| # | Task | File | Hours |
|---|---|---|---|
| 10.3.1 | Create `/app/(app)/pending-payments/page.jsx` with collection priority queue (extends Phase 2 overdue page) | `app/(app)/pending-payments/page.jsx` | 3h |
| 10.3.2 | Add collection notes panel to invoice detail | `app/(app)/invoices/page.jsx` | 2h |
| 10.3.3 | Add AR analytics section: aging chart, collection rate, average days to pay | `app/(app)/dashboard/page.jsx` | 3h |

**Sprint 10.3 total: ~8 hours**

---

## Summary: Phases and Total Effort

| Phase | Description | Sprints | Est. Hours | Priority |
|---|---|---|---|---|
| **Phase 0** | Critical bug fixes | 0.1 | 4h | IMMEDIATE |
| **Phase 1** | Schema migrations | 1.1, 1.2 | 6h | Week 1 |
| **Phase 2** | Overdue detection | 2.1, 2.2 | 15h | Week 1-2 |
| **Phase 3** | Input validation & pagination | 3.1 | 10h | Week 2 |
| **Phase 4** | Reports performance | 4.1 | 9h | Week 2-3 |
| **Phase 5** | Permission system | 5.1, 5.2, 5.3 | 19h | Week 3-4 |
| **Phase 6** | Invoice improvements | 6.1 | 8.5h | Week 4 |
| **Phase 7** | GST report | 7.1 | 11h | Week 5 |
| **Phase 8** | Expense tracking | 8.1, 8.2 | 12h | Week 5-6 |
| **Phase 9** | Quick wins / polish | 9.1 | 13h | Week 6 |
| **Phase 10** | Automated AR reminders | 10.1, 10.2, 10.3 | 22h | Week 7-8 |
| **Total** | | | **~130 hours** | 8 weeks |

---

## What Can Ship This Week (Phases 0 + 1 + Quick Wins)

Even before any new features are built, these fixes can ship in 1-2 days:

| Task | Time | Impact |
|---|---|---|
| Fix creditUsed drift on delete | 30 min | Prevents silent data corruption |
| Fix stale stock refund | 30 min | Prevents stock count corruption |
| Fix client-supplied unit prices | 30 min | Security fix |
| Sanitize 500 error messages | 1h | Security fix |
| Dark mode toggle | 2h | Visible polish |
| Expose creditLimit in customer form | 1h | Critical UX gap |
| Add overdue badge to invoice list | 1.5h | Immediate business value |

**Total for first day: ~7 hours. All are safe, self-contained changes.**

*Generated: June 2026*
