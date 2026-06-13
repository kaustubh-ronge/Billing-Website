# SmartBill — Priority Roadmap

> Phased implementation plan ordered by business impact. Each phase builds on the previous.

---

## Guiding Principles

1. **Business value first**: Every phase solves a real pain point a shop owner faces today
2. **Non-breaking additions**: New features don't break existing users
3. **Foundation before features**: Get the architecture right before adding surface area
4. **Quick wins early**: Phases 1–2 have high-impact, low-effort changes that can ship in 1–3 weeks

---

## Phase 1 — Foundation & UX Quick Wins
**Timeline: Weeks 1–3**
**Goal: Make the existing product feel production-grade and fix critical missing fields**

### 1.1 Navigation — Wire the Sidebar
**Impact: High | Effort: Low**

The sidebar component exists at `components/ui/Sidebar.jsx` but is not used. Add it to the layout:
- Replace the top-nav-only layout with a sidebar + top header layout
- Sidebar groups: Sales, Customers, Purchase, Inventory, Accounts, Reports, Team, Settings
- Collapsed icon-only mode with toggle button
- Mobile: hide sidebar, keep bottom-nav (add later)

### 1.2 Command Palette — Wire cmdk
**Impact: High | Effort: Low**

The `cmdk` library is already installed. Wire it:
- `Cmd+K` / `Ctrl+K` global shortcut
- Quick actions: New Invoice, New Customer, New Expense
- Global search: customers, invoices, products (call `/api/v1/search`)
- Navigate to any section by name

### 1.3 Dark Mode Toggle
**Impact: Medium | Effort: Very Low**

`next-themes` is already installed and the CSS variables support both themes. Just add the toggle button to the header.

### 1.4 Invoice — Add Due Date and Payment Terms
**Impact: High | Effort: Low**

Prisma migration: add `dueDate` and `paymentTerms` to Invoice.
UI: Add due date picker + payment terms selector (Net-7, Net-15, Net-30, Custom) in invoice creation Step 3.
Cron job: Daily check for overdue invoices, update `isOverdue` flag.

### 1.5 Customer — Add Credit Limit Field
**Impact: High | Effort: Low**

Prisma migration: add `creditLimit` and `creditUsed` to Customer.
UI: Add credit limit field in customer edit form.
Invoice creation: Show warning banner if new invoice would exceed credit limit.

### 1.6 CSV Export on All Tables
**Impact: Medium | Effort: Low**

Add "Export CSV" button to Invoice, Customer, and Product tables.
Client-side generation using current filtered data.

### 1.7 Switch to prisma migrate dev
**Impact: High (for future development) | Effort: Very Low**

```bash
npx prisma migrate dev --name "baseline_initial_schema"
```

This is a one-time setup. All future changes use migrations instead of `db push`.

**Phase 1 Deliverables:**
- [ ] Sidebar navigation wired
- [ ] Command palette working with global search
- [ ] Dark mode toggle
- [ ] Due date + overdue detection on invoices
- [ ] Credit limit on customers
- [ ] CSV export on all tables
- [ ] Migration history established

---

## Phase 2 — Accounts Receivable & Collection Management System
**Timeline: Weeks 4–7**
**Goal: Build a complete automated receivables engine — the most impactful module for Indian businesses**

See full specification: [ACCOUNTS_RECEIVABLE_SYSTEM.md](ACCOUNTS_RECEIVABLE_SYSTEM.md)

### 2.1 Database Migrations (Phase 1.5)

Run before building any AR UI:
- `add_collection_status_to_invoice` — collectionStatus enum, lastReminderSentAt, reminderCount, assignedTo, promisedPaymentDate
- `add_collection_note_activity` — CollectionNote model, CollectionActivity model
- `add_reminder_config_escalation_rules` — ReminderConfig (per-org settings), EscalationRule

### 2.2 Payment Due Date + Payment Terms

- Add `dueDate` and `paymentTerms` to Invoice creation Step 3
- Payment terms presets: Due on Receipt / Net-7 / Net-15 / Net-30 / Net-45 / Net-60 / Custom date
- Auto-calculate `dueDate` from `paymentTerms` when invoice is created
- Show "Due in X days" or "X days overdue" badge on invoice list
- `isOverdue` flag computed and stored by cron job

### 2.3 Pending Payments Module (`/pending-payments`)

The central AR workspace. This page becomes the most important page in the platform.

- Table view with all outstanding invoices (PENDING + PARTIAL)
- **Priority sort**: overdue (by severity) → due today → due in 3 days → due in 7 days → upcoming
- Columns: Customer, Invoice #, Original Amount, Paid, Outstanding, Due Date, Days, Collection Status, Assigned To, Last Action
- Filters: Status / Amount threshold / Assigned employee / Customer search / Date range
- **Aging Buckets View**: Current / 1–7d / 8–30d / 31–60d / 61–90d / 90+ day grouping with totals
- Per-row actions: View Invoice / Record Payment / WhatsApp Reminder / Email Reminder / Add Note / Assign / Escalate / Write Off

### 2.4 Automated Reminder Engine

Vercel Cron job at `/api/cron/ar-reminder-engine` — runs daily at 09:00 IST.

Reminder schedule (all configurable via Settings):
- Before due: 7 days / 3 days / 1 day before
- On due date
- After due: 1 / 3 / 7 / 15 / 30 days overdue

For each triggered reminder:
1. Create in-app `Notification` record for owner + assignee
2. Send `CollectionActivity` log entry (automated)
3. Update `lastReminderSentAt` and `reminderCount` on Invoice
4. Optionally send email to customer (if `sendEmailToCustomer = true`)

### 2.5 WhatsApp Reminder Integration

For each pending payment row, a "WhatsApp" button:
- Generates a pre-composed message with invoice number, amounts, due date
- Opens `wa.me/91{phone}?text=...` — WhatsApp Web on desktop, WhatsApp app on mobile
- Logs `WHATSAPP_LINK_OPENED` in `CollectionActivity`
- Permission-gated: `reminders:whatsapp`

### 2.6 Email Reminder System (Resend + React Email)

- Install: `resend` + `@react-email/components`
- Branded email template: shop logo, colors, invoice summary table, "View Invoice & Pay" button
- Triggered by: automated cron + manual "Send Email Reminder" action
- Recipients: customer (optional), assigned employee, owner CC

### 2.7 Collection Notes

- Add note per invoice with type: NOTE / PROMISE / DISPUTE / ESCALATION
- Set follow-up date — triggers reminder notification on that date
- Collection timeline displayed on Invoice Detail page
- Full customer-level history in Customer page → Collections tab

### 2.8 Collection Status Management

- Update collection status per invoice: NORMAL / FOLLOWING_UP / PROMISED / DISPUTED / ESCALATED / WRITTEN_OFF
- "Mark as Promised" — sets promise date + PROMISED status
- "Write Off" — requires `invoices:write_off` permission, adds reason, removes from active receivables
- All status changes logged in `CollectionActivity`

### 2.9 Escalation Engine

Runs as part of the daily cron. Configurable escalation rules per org:
- Example: 7 days overdue + ₹5,000 → High Priority Flag
- Example: 15 days overdue + ₹10,000 → Notify Manager (in-app notification)
- Example: 30 days overdue + ₹25,000 → Notify Owner (in-app + email)
- Status updated to ESCALATED, `CollectionActivity` record created

### 2.10 Dashboard AR Widgets

Four widgets added to dashboard (permission: `collections:view`):
- **Outstanding Revenue** — total unpaid across all invoices
- **Overdue Payments** — invoices past due date (red badge)
- **Due Today** — invoices due today with total amount
- **Due This Week** — invoices due in next 7 days

### 2.11 AR Analytics (`/reports/accounts-receivable`)

- Collection Health Score (composite metric 0–100)
- Total outstanding, overdue %, collection success rate (30d), average days to pay
- Aging buckets chart
- Top overdue customers table
- Top paying customers table
- Permission: `ar:analytics`

### 2.12 Reminder Settings UI (`/settings/reminders`)

- Toggle individual reminder intervals on/off
- Set minimum amount threshold
- Configure email channels (customer, assignee, owner)
- Create / edit / delete escalation rules

### 2.13 Customer Statement of Account

- All invoices, payments, credit notes in a date range
- Printable + exportable PDF
- "Send to Customer" via WhatsApp / Email

**Phase 2 Deliverables:**
- [ ] Phase 1.5 database migrations (3 migrations)
- [ ] Due date + payment terms on invoice creation
- [ ] Pending Payments module with priority sort
- [ ] Aging buckets view
- [ ] Automated reminder engine (Vercel Cron)
- [ ] WhatsApp reminder button + activity logging
- [ ] Email reminders via Resend + React Email templates
- [ ] Collection notes with follow-up dates
- [ ] Collection status management (PROMISED, DISPUTED, WRITTEN_OFF)
- [ ] Escalation engine (automated + configurable rules)
- [ ] Dashboard AR widgets (4 new widgets)
- [ ] AR analytics page
- [ ] Reminder settings UI
- [ ] Customer statement of account
- [ ] New permission keys: `collections:view`, `collections:manage`, `reminders:send`, `reminders:whatsapp`, `invoices:write_off`, `ar:analytics`

---

## Phase 3 — Organization & Permission System
**Timeline: Weeks 7–10**
**Goal: Enable multi-user teams with proper access control and full audit trail**

This is the most architecturally significant phase. Everything built here is foundational for future growth.

### 3.1 Database Migrations (Phase 2 of DB plan)
Run migrations:
- `add_organization_branch`
- `add_employee_model`
- `add_custom_role_permissions`
- `add_audit_log`
- `add_notification_model`
- `add_approval_request`

### 3.2 Employee Management
- Invite employee via email (Clerk invitation flow)
- Employee profiles: name, email, phone, department, branch, join date
- Status management: Active, Invited, Suspended, Inactive
- Employee list page with status badges
- Deactivate/Suspend/Reactivate actions
- Transfer employee to different branch

### 3.3 Permission System
- Permission registry: ~50 named permission keys
- Custom role builder: Owner creates "Billing Operator", "Inventory Manager", etc.
- Permission matrix editor: checkbox grid for each employee
- Permission resolution: Employee override → Custom Role → Legacy Role → Deny
- `hasPermission()` middleware on every API route

### 3.4 Permission-Aware UI
- `<PermissionGate>` component wrapping all sensitive UI elements
- Sidebar navigation shows only accessible sections
- Delete buttons hidden (not just disabled) for unauthorized users
- Financial columns (profit, cost) hidden unless user has `profit:view`

### 3.5 Audit Log
- Every create/update/delete recorded with employee + timestamp + before/after values
- Audit log viewer: filterable timeline by entity type, employee, date
- Per-entity history: view who changed what on a specific invoice or customer
- Owner/Manager always has `audit:view` permission

### 3.6 In-App Notification Center
- Bell icon in header with unread badge
- Notification types: payment received, overdue alert, low stock, pending approval
- Mark as read / mark all as read
- Click notification → navigate to relevant entity

### 3.7 Approval Workflows
- Configurable approval rules: "Require approval for discounts above X%"
- Triggers: large discount, invoice cancellation, stock adjustment above N units
- Approval queue UI: pending requests with approve/reject + comment
- Requestor gets notified of approval decision

**Phase 3 Deliverables:**
- [ ] Database schema with Organization/Employee/Permission models
- [ ] Employee invitation and management
- [ ] Custom role builder
- [ ] Permission matrix editor
- [ ] Permission middleware on all API routes
- [ ] Permission-aware UI (PermissionGate component)
- [ ] Audit log viewer
- [ ] In-app notification center
- [ ] Approval workflow engine

---

## Phase 4 — Purchase Management & Inventory
**Timeline: Weeks 11–14**
**Goal: Complete the buy side — from supplier to shelf**

### 4.1 Supplier Management
- Supplier CRUD: name, phone, email, address, GST number, payment terms
- Supplier ledger: all purchases, payments, outstanding payable
- Supplier search and filtering
- Soft delete

### 4.2 Purchase Orders
- Create PO: select supplier, add items with quantities and unit costs
- PO numbering: auto-generated PO-2025-001
- PO status workflow: Draft → Sent → Received/Partially Received → Closed
- Email/WhatsApp PO to supplier (PDF attachment)

### 4.3 Goods Received Note (GRN)
- Receive goods against a PO
- Record actual quantities received vs. ordered
- Mark items as rejected (quality failure) with reason
- GRN auto-updates product stock counts
- Stock Movement record created automatically

### 4.4 Purchase Invoice
- Record supplier's invoice against a GRN
- Flag discrepancies (price difference from PO)
- Link to GRN for traceability

### 4.5 Supplier Payments
- Record payments to suppliers: cash, bank transfer, cheque, UPI
- Outstanding payables dashboard
- Supplier payment history

### 4.6 Stock Movement History
- Every stock in/out/adjustment is now recorded in `StockMovement`
- Filter by product, date, movement type, employee
- Stock history per product: timeline view
- Identify who adjusted what and when

### 4.7 Manual Stock Adjustment
- Record stock corrections with reason (damaged, lost, counted)
- Optional approval required for adjustments above threshold
- Full audit trail

### 4.8 Reorder Alerts
- Dashboard widget: products below reorder level
- In-app notification when stock hits reorder threshold
- One-click: Create draft PO from reorder alert

**Phase 4 Deliverables:**
- [ ] Supplier CRUD and ledger
- [ ] Purchase Order creation and management
- [ ] GRN with automatic stock updates
- [ ] Supplier payment recording
- [ ] Stock Movement log on all inventory changes
- [ ] Manual stock adjustment with optional approval
- [ ] Reorder alert system

---

## Phase 5 — Accounting & Expenses
**Timeline: Weeks 15–17**
**Goal: Give owners a clear picture of where money is going**

### 5.1 Expense Tracking
- Record expenses: amount, category, date, payment method, notes
- Configurable expense categories (Rent, Salary, Utilities, Transport, Marketing, etc.)
- Receipt upload (photo → Cloudflare R2)
- Assign expenses to branches

### 5.2 Recurring Expenses
- Mark expenses as recurring: monthly, weekly, yearly
- Specify recurring day (1st of month, every Monday)
- Auto-record or remind to confirm
- Template expenses for common recurring costs

### 5.3 Profit & Loss Report
```
Revenue
  Sales Revenue:                 ₹4,50,000
  Other Income:                      ₹5,000
Total Revenue:                   ₹4,55,000

Cost of Goods Sold
  Opening Stock Value:           ₹2,10,000
  + Purchases:                   ₹1,80,000
  - Closing Stock Value:         ₹2,30,000
COGS:                            ₹1,60,000

Gross Profit:                    ₹2,95,000
Gross Margin:                         64.8%

Operating Expenses
  Rent:                             ₹25,000
  Salaries:                         ₹40,000
  Electricity:                       ₹8,000
  Transport:                         ₹5,000
Total Expenses:                   ₹78,000

Net Profit:                      ₹2,17,000
Net Margin:                           47.7%
```

### 5.4 Cash Flow Statement
- Cash inflows: invoice payments, other income
- Cash outflows: supplier payments, expenses
- Net cash position by day/week/month
- Opening and closing cash balance

### 5.5 GST Summary Report (GSTR-1 Format)
- B2B sales (with customer GST numbers): Table 4/5
- B2C sales (no GST number): Table 7
- HSN-wise summary: Table 12
- Tax collected by rate (5%, 12%, 18%, 28%)
- Exportable as Excel for CA/filing

### 5.6 Bank Account Tracking
- Record business bank accounts
- Tag payments to specific bank accounts
- Monthly reconciliation helper

**Phase 5 Deliverables:**
- [ ] Expense recording with categories
- [ ] Recurring expense automation
- [ ] Profit & Loss report
- [ ] Cash Flow report
- [ ] GST summary / GSTR-1 formatted report
- [ ] Bank account tracking

---

## Phase 6 — Advanced Reporting & Analytics
**Timeline: Weeks 18–20**
**Goal: Give owners the insights to make better business decisions**

### 6.1 Sales Analytics
- Sales by product category (trend over time)
- Sales by customer segment
- Sales by payment method
- Average order value trend
- Peak hours / peak days (for staffing)

### 6.2 Product Profitability
- Gross margin per product: (selling price − cost price) / selling price
- Revenue contribution per product
- Top 10 most profitable products
- Products with negative or low margins (flag for review)

### 6.3 Customer Analytics
- Customer lifetime value (total revenue per customer)
- Average days to pay per customer
- Customers at risk (high outstanding, declining order frequency)
- New vs. returning customer ratio

### 6.4 Supplier Performance
- On-time delivery rate per supplier
- Price trend per product per supplier
- Outstanding payables aging

### 6.5 Dashboard Redesign
- Widget-based layout (as designed in UI_UX_REDESIGN_PLAN.md)
- Owner sees all widgets
- Staff sees permission-scoped widgets
- Widget refresh rate: 1-minute auto-refresh for key KPIs

### 6.6 Saved Report Views
- Save filter configurations: "Monthly GST Report", "Top 20 Overdue Customers"
- Schedule report delivery via email (future)

**Phase 6 Deliverables:**
- [ ] Sales analytics with drill-down
- [ ] Product profitability report
- [ ] Customer analytics and risk scoring
- [ ] Dashboard widget redesign
- [ ] Saved report views
- [ ] Excel / PDF export on all reports

---

## Phase 7 — Product Polish & Scale Prep
**Timeline: Weeks 21–23**
**Goal: Production hardening, performance, and enterprise readiness**

### 7.1 Performance
- Implement SWR for all data fetching
- Server-side pagination on all list endpoints
- API response caching for dashboard queries
- Move base64 images to Cloudflare R2
- Add database indexes for all high-traffic queries

### 7.2 PDF Generation
- Replace `window.print()` with `@react-pdf/renderer`
- Invoice PDF with full business branding
- Customer statement PDF
- Purchase Order PDF (to send to suppliers)
- GST report PDF

### 7.3 Email Delivery
- Invoice delivery via email (Resend API)
- Payment reminder emails
- Welcome email on signup
- Weekly business digest (opt-in)

### 7.4 Mobile Optimization
- Bottom navigation for mobile
- Touch-optimized data tables (horizontal scroll, large tap targets)
- PWA manifest and service worker
- Test all flows at 375px

### 7.5 Security Audit
- Review all API routes for missing permission checks
- Rate limiting on sensitive endpoints
- Input validation with Zod on all routes
- SQL injection prevention review (Prisma handles this, but verify)

**Phase 7 Deliverables:**
- [ ] SWR state management
- [ ] Server-side pagination
- [ ] Cloudflare R2 file storage
- [ ] True PDF generation
- [ ] Email delivery
- [ ] Security audit passed

---

## Phase 8 — SaaS Foundation
**Timeline: Weeks 24+**
**Goal: Prepare for commercial launch**

- Multi-branch support (Organization + Branch models)
- Subscription plans + Razorpay billing
- Feature gating by plan tier
- Onboarding flow for new organizations
- Mobile PWA → React Native app development
- Public REST API + API keys (for enterprise tier)
- White-labeling (for resellers)

---

## Feature Priority Matrix

| Feature | Business Impact | Implementation Effort | Priority |
|---|---|---|---|
| Sidebar navigation | High | Very Low | P0 |
| Command palette | High | Low | P0 |
| Due date + overdue | High | Low | P0 |
| Aging report | Very High | Medium | P0 |
| Permission system | Very High | High | P0 |
| Audit log | High | Medium | P1 |
| Purchase management | Very High | High | P1 |
| Expense tracking | High | Medium | P1 |
| GST report | High | Medium | P1 |
| Stock movements | High | Medium | P1 |
| PDF generation | Medium | Medium | P2 |
| Customer analytics | Medium | Medium | P2 |
| Multi-branch | Medium | Very High | P3 |
| Mobile app | High | Very High | P3 |
| Public API | Medium | High | P3 |
| White-labeling | Low | High | P4 |

---

*Document Version: 1.0 | Last Updated: June 2026*
*Cross-references: [PRODUCT_VISION.md](PRODUCT_VISION.md) | [DATABASE_EVOLUTION_PLAN.md](DATABASE_EVOLUTION_PLAN.md) | [REAL_WORLD_GAP_ANALYSIS.md](REAL_WORLD_GAP_ANALYSIS.md)*
