# SmartBill — Missing Implementations

> Every documented requirement with ZERO implementation, prioritized by business impact.
> A "missing" feature has no schema model, no API route, and no UI component.

---

## Priority 1 — Business Critical (Prevents Real Use)

These gaps prevent the app from being useful to any real business today.

### M-01: Overdue Detection & Aging Report

**Business Impact:** CRITICAL — Without this, shop owners cannot answer "who owes me money for how long?"

**What's missing:**
- `isOverdue` Boolean field on Invoice
- Daily cron job to mark invoices past due date as OVERDUE
- Aging buckets: Current / 1-7d / 8-30d / 31-60d / 61-90d / 90+ days
- `/pending-payments` page with priority sort
- Dashboard AR widgets (overdue count, due today, due this week)

**Blocked by:** `isOverdue` schema field, cron infrastructure

**Estimated effort:** 1 week

---

### M-02: Permission System & Employee Management

**Business Impact:** CRITICAL — Any business with 2+ employees cannot safely use SmartBill. A cashier can delete invoices, view profit margins, and change settings — nothing is restricted.

**What's missing:**
- Employee model (replacing User)
- Organization model
- CustomRole model with permission arrays
- EmployeePermission model for per-user overrides
- ~50 permission keys registry
- `hasPermission()` middleware function
- Permission check on every API route
- Permission-aware UI (PermissionGate component)
- Employee invite/manage UI
- Staff deactivation workflow

**Blocked by:** New schema models (Organization, Employee, CustomRole, EmployeePermission)

**Estimated effort:** 3-4 weeks

---

### M-03: Purchase Management (Supplier/PO/GRN)

**Business Impact:** CRITICAL — Every product-based business (hardware, pharmacy, grocery, wholesale) cannot track the buy side. They maintain a separate system.

**What's missing:**
- Supplier model, API, UI
- PurchaseOrder model, API, UI
- GoodsReceived (GRN) model, API, UI
- GRN auto-stock update
- Purchase invoice recording
- SupplierPayment model, API, UI
- Supplier ledger

**Blocked by:** 6 new schema models; no dependencies on org/permission system

**Estimated effort:** 3-4 weeks

---

### M-04: Expense Tracking & P&L Report

**Business Impact:** CRITICAL — Business owner cannot see actual profit. Revenue is tracked but expenses (rent, salaries, utilities) are invisible.

**What's missing:**
- Expense model
- ExpenseCategory model
- Expense CRUD API
- Expense recording UI
- P&L report: Revenue - COGS - Expenses = Net Profit
- Cash flow statement

**Blocked by:** Expense/ExpenseCategory schema models

**Estimated effort:** 2-3 weeks

---

### M-05: GST Reports (GSTR-1 / GSTR-3B)

**Business Impact:** CRITICAL — Every GST-registered business (mandatory above ₹40L annual turnover) must file returns. Today, they export data manually.

**What's missing:**
- `hsnCode` field on Product
- B2B sales grouping by customer GST number
- B2C sales aggregation
- HSN-wise tax summary report
- GSTR-1 formatted output (Tables 4, 5, 7, 12)
- GSTR-3B liability summary
- Quarterly/monthly filter on GST report
- CSV/Excel export for CA submission

**Blocked by:** hsnCode field addition + report API

**Estimated effort:** 2-3 weeks

---

## Priority 2 — High Business Impact (Significantly Limits Usefulness)

### M-06: Audit Log

**Business Impact:** HIGH — Businesses with multiple employees need accountability. Cannot investigate "who deleted that invoice?" or "who changed the stock count?"

**What's missing:**
- AuditLog model in schema
- Audit log writer called on every mutation
- Audit log viewer UI with filters (entity type, employee, date)
- Per-entity history timeline

**Estimated effort:** 1 week

---

### M-07: Stock Movement History

**Business Impact:** HIGH — Current system is a single number (stockCount) with no history. Employees can adjust stock with no trace. Cannot answer "who changed stock and when?"

**What's missing:**
- StockMovement model
- Movement records created on invoice create/delete
- Manual stock adjustment endpoint with reason
- Stock movement history UI per product
- Reorder level field (separate from lowStockAlert)

**Estimated effort:** 1 week

---

### M-08: Automated Collection Reminders

**Business Impact:** HIGH — Shop owners must manually follow up every customer. Automated reminders (the single biggest time-saver in collections) are absent.

**What's missing:**
- AR invoice fields: collectionStatus, lastReminderSentAt, reminderCount
- CollectionNote model
- CollectionActivity model
- ReminderConfig model
- EscalationRule model
- Daily cron: ar-reminder-engine
- In-app notification creation from cron
- Email reminders (Resend + React Email)
- Collection notes UI on invoice detail

**Estimated effort:** 3-4 weeks

---

### M-09: In-App Notification System

**Business Impact:** HIGH — No push notifications, no notification bell, no in-app alerts. System cannot inform users of overdue invoices, low stock, or approvals.

**What's missing:**
- Notification model
- Notification creation in business logic
- Bell icon with unread badge in header
- Notification slide-over panel
- Mark as read / mark all as read
- Click to navigate to entity

**Blocked by:** Employee model (notifications are per-employee)

**Estimated effort:** 1 week (after Employee model exists)

---

### M-10: Approval Workflows

**Business Impact:** HIGH — Owners cannot delegate billing to staff without risk. Large discounts, invoice cancellations, and stock adjustments have no approval gate.

**What's missing:**
- ApprovalRequest model
- Approval rules engine (configurable thresholds)
- Approval queue UI
- Discount threshold check in invoice creation
- Cancellation routing to manager
- Requestor notification on approval/rejection

**Blocked by:** Employee and Notification models

**Estimated effort:** 2-3 weeks

---

## Priority 3 — Important for Growth

### M-11: Credit Notes

**What's missing:**
- CreditNote model
- Credit note creation on customer return
- Credit note application to future invoice
- Overpayment handling (auto-create credit note for excess)
- Credit note listing UI

**Estimated effort:** 1-2 weeks

---

### M-12: Recurring Invoices

**What's missing:**
- RecurringInvoice model with templateData and schedule
- Daily cron: recurring-invoice-generator
- UI to set up recurring invoices (from existing customer + items)

**Estimated effort:** 1 week

---

### M-13: Command Palette (Cmd+K)

**What's missing:**
- cmdk library is installed but NO palette UI built
- Global search endpoint (/api/v1/search)
- Quick actions: New Invoice, New Customer, etc.
- Keyboard shortcut wiring (Ctrl+K)
- PostgreSQL tsvector full-text search

**Estimated effort:** 3-5 days

---

### M-14: Dark Mode Toggle

**What's missing:**
- next-themes is installed but NO toggle button in header
- ThemeProvider wrapping (may or may not be set up)
- Sun/Moon icon toggle in header

**Estimated effort:** 2-4 hours

---

### M-15: Advanced Reporting Pages

**What's missing:**
- Dedicated `/reports` page
- Date range filter
- Sales by customer/product/category
- Payment method breakdown
- Profitability by product (requires cost price)
- Staff performance report

**Estimated effort:** 2-3 weeks

---

### M-16: Server-Side Pagination

**What's missing:**
- All list endpoints return ALL records (no LIMIT/OFFSET)
- Invoice list with 10,000+ invoices would be slow
- No `page`, `pageSize`, `cursor` params on any endpoint
- No pagination UI on any table

**Estimated effort:** 1-2 days per endpoint (5-7 days total)

---

### M-17: Zod Input Validation

**What's missing:**
- All API routes do manual parsing without schema validation
- No Zod schemas for request bodies
- Missing validation allows malformed data to reach Prisma

**Estimated effort:** 3-5 days

---

### M-18: Rate Limiting

**What's missing:**
- No rate limiting on any endpoint
- Invoice creation could be spammed
- Login endpoints rely entirely on Clerk

**Estimated effort:** 1-2 days (using @vercel/edge or upstash/ratelimit)

---

## Priority 4 — Future/Advanced

### M-19: Organization & Multi-Branch
- No Organization model (Shop is current tenant root)
- No Branch model
- All data scoped to shopId; migration to orgId needed
- Consolidated reports across branches

### M-20: Mobile App (React Native + Expo)
- No mobile app
- No PWA manifest or service worker
- No offline queue
- No biometric auth
- No barcode scanner

### M-21: SaaS Monetization
- No Razorpay subscription integration
- No feature gating by plan
- No usage metering
- No white-labeling

### M-22: Email Delivery (Resend)
- No Resend integration
- No email templates
- No invoice delivery via email
- No payment reminder emails

### M-23: Cloudflare R2 / File Storage
- All images stored as base64 in PostgreSQL Text columns
- No R2/S3 integration
- Logo > 1MB rejected; product images stored inefficiently

### M-24: Public API & Webhooks
- No API key management
- No versioned public REST API
- No webhook system
- No Tally export

### M-25: Migration History
- Using `prisma db push` (no migration files)
- No rollback capability
- No audit of schema changes

---

## Missing Features by Count

| Priority | Count | Features |
|---|---|---|
| P1 — Business Critical | 5 | Overdue, Permissions, Purchase, Expenses, GST |
| P2 — High Impact | 5 | Audit Log, Stock History, Reminders, Notifications, Approvals |
| P3 — Important | 8 | Credit Notes, Recurring, Command Palette, Dark Mode, Reports, Pagination, Validation, Rate Limiting |
| P4 — Future/Advanced | 7 | Org/Branch, Mobile, SaaS, Email, File Storage, API, Migrations |
| **Total** | **25 missing feature groups** | — |

*Generated: June 2026*
