# SmartBill — Documentation Requirement Inventory

> Complete numbered list of every documented requirement across all 11 docs files.
> Format: `R-NNN | Source Doc | Category | Requirement Description`

---

## Sales & Billing Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-001 | FEATURE_CATALOG | UI/Frontend | Invoice creation with multi-step wizard: customer → items → payment |
| R-002 | FEATURE_CATALOG | API | Auto-generated invoice numbers with configurable prefix/format |
| R-003 | FEATURE_CATALOG | UI/Frontend | Line items with products/services, quantity, unit price, tax |
| R-004 | FEATURE_CATALOG | Business Logic | Per-invoice discount percentage calculation |
| R-005 | FEATURE_CATALOG | Business Logic | Automatic GST calculation per product at configured rate |
| R-006 | FEATURE_CATALOG | DB/Schema | Invoice status: PAID / PARTIAL / PENDING / DRAFT |
| R-007 | FEATURE_CATALOG | Business Logic | Partial and full payment recording with method selection |
| R-008 | FEATURE_CATALOG | UI/Frontend | Payment methods: Cash, UPI, Bank Transfer, Card |
| R-009 | FEATURE_CATALOG | DB/Schema | Cheque payments: cheque number, date, bank name, cleared status |
| R-010 | FEATURE_CATALOG | DB/Schema | Configurable due date per invoice |
| R-011 | FEATURE_CATALOG | DB/Schema | Payment terms: Net-7, Net-15, Net-30, custom |
| R-012 | FEATURE_CATALOG | DB/Schema | Customer-facing and internal notes per invoice |
| R-013 | FEATURE_CATALOG | Business Logic | Credit limit enforcement: block/warn when customer exceeds credit limit |
| R-014 | FEATURE_CATALOG | UI/Frontend | Invoice edit: modify draft invoices; lock paid invoices |
| R-015 | FEATURE_CATALOG | Business Logic | Invoice cancel with reason and audit trail preserved |
| R-016 | FEATURE_CATALOG | UI/Frontend | Print-optimized layout with business branding |
| R-017 | FEATURE_CATALOG | UI/Frontend | True PDF generation (not window.print) via @react-pdf/renderer |
| R-018 | FEATURE_CATALOG | API | Shareable public URL for customer to view invoice |
| R-019 | FEATURE_CATALOG | UI/Frontend | WhatsApp sharing with pre-filled message and invoice link |
| R-020 | FEATURE_CATALOG | Notification/Cron | Recurring invoice auto-generation on schedule |
| R-021 | FEATURE_CATALOG | UI/Frontend | Bulk invoice export as CSV/Excel/PDF |

## Customer Management Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-022 | FEATURE_CATALOG | API | Customer CRUD: create, view, edit, soft-delete |
| R-023 | FEATURE_CATALOG | UI/Frontend | Customer ledger with full transaction history per customer |
| R-024 | FEATURE_CATALOG | Business Logic | Real-time outstanding balance display per customer |
| R-025 | FEATURE_CATALOG | DB/Schema | Customer internal notes/observations |
| R-026 | FEATURE_CATALOG | DB/Schema | B2B customer GST number tracking |
| R-027 | FEATURE_CATALOG | DB/Schema | Per-customer credit limit setting |
| R-028 | FEATURE_CATALOG | Business Logic | Real-time credit utilization tracking (creditUsed) |
| R-029 | FEATURE_CATALOG | DB/Schema | Customer tags (e.g. "VIP", "Risky", "Wholesale") |
| R-030 | FEATURE_CATALOG | DB/Schema | Customer groups for bulk pricing/credit policies |
| R-031 | FEATURE_CATALOG | DB/Schema | Customer risk level: Low / Medium / High |
| R-032 | FEATURE_CATALOG | UI/Frontend | Outstanding summary per customer: total billed, paid, outstanding |
| R-033 | FEATURE_CATALOG | UI/Frontend | One-click WhatsApp reminder with outstanding details |
| R-034 | FEATURE_CATALOG | UI/Frontend | Printable statement of account for a date range |
| R-035 | FEATURE_CATALOG | UI/Frontend | Payment history: all payments by customer across all invoices |
| R-036 | FEATURE_CATALOG | Business Logic | Customer analytics: purchase frequency, avg order value, lifetime value |

## Product & Inventory Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-037 | FEATURE_CATALOG | API | Product CRUD: create, view, edit, delete |
| R-038 | FEATURE_CATALOG | DB/Schema | Non-inventory service items |
| R-039 | FEATURE_CATALOG | DB/Schema | Hierarchical product categories |
| R-040 | FEATURE_CATALOG | DB/Schema | Individual GST rate per product |
| R-041 | FEATURE_CATALOG | Business Logic | Track stock count per product |
| R-042 | FEATURE_CATALOG | Business Logic | Alert when stock falls below threshold |
| R-043 | FEATURE_CATALOG | Business Logic | Auto-deduct stock on invoice creation |
| R-044 | FEATURE_CATALOG | Business Logic | Auto-refund stock on invoice deletion |
| R-045 | FEATURE_CATALOG | DB/Schema | Units of measure: kg, pcs, box, litre, etc. |
| R-046 | FEATURE_CATALOG | DB/Schema | Cost price for margin calculations |
| R-047 | FEATURE_CATALOG | DB/Schema | SKU (Stock Keeping Unit) per product |
| R-048 | FEATURE_CATALOG | DB/Schema | Barcode (EAN/QR) per product |
| R-049 | FEATURE_CATALOG | DB/Schema | HSN code for GST classification |
| R-050 | FEATURE_CATALOG | DB/Schema | Reorder level threshold for alerts |
| R-051 | FEATURE_CATALOG | DB/Schema | Full stock movement history log |
| R-052 | FEATURE_CATALOG | Business Logic | Manual stock adjustment with reason |

## Organization & Staff Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-053 | FEATURE_CATALOG | DB/Schema | Multi-user shop: multiple staff under one shop |
| R-054 | FEATURE_CATALOG | Business Logic | Staff invitation via email (Clerk invitation flow) |
| R-055 | FEATURE_CATALOG | Business Logic | Staff deactivation / suspension of employee access |
| R-056 | FEATURE_CATALOG | DB/Schema | Custom roles with named permission sets |
| R-057 | FEATURE_CATALOG | Permission | ~50 individual permission keys defined |
| R-058 | FEATURE_CATALOG | Permission | Permission assignment per employee |
| R-059 | FEATURE_CATALOG | Permission | Permission override: employee-level grants/denies |
| R-060 | FEATURE_CATALOG | DB/Schema | Audit log: every significant action with user + timestamp |
| R-061 | FEATURE_CATALOG | UI/Frontend | Activity feed: timeline of recent actions across the org |

## Settings & Configuration Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-062 | FEATURE_CATALOG | UI/Frontend | Business profile: name, logo, address, phone, email, GST |
| R-063 | FEATURE_CATALOG | UI/Frontend | Banking details: bank name, account, IFSC, UPI ID |
| R-064 | FEATURE_CATALOG | UI/Frontend | Invoice configuration: prefix, format, footer, currency |
| R-065 | FEATURE_CATALOG | UI/Frontend | Default tax rate (shop-level default GST rate) |
| R-066 | FEATURE_CATALOG | UI/Frontend | Dark mode: light/dark theme toggle |

## Purchase Management Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-067 | FEATURE_CATALOG | API | Supplier CRUD: create, edit, manage |
| R-068 | FEATURE_CATALOG | DB/Schema | Supplier contact: phone, email, address, GST number |
| R-069 | FEATURE_CATALOG | Business Logic | Supplier ledger: outstanding payables per supplier |
| R-070 | FEATURE_CATALOG | API | Purchase order creation with items and quantities |
| R-071 | FEATURE_CATALOG | DB/Schema | PO status tracking: DRAFT → SENT → PARTIALLY_RECEIVED → RECEIVED |
| R-072 | FEATURE_CATALOG | Business Logic | Goods received note (GRN) against a PO |
| R-073 | FEATURE_CATALOG | Business Logic | GRN auto stock update on creation |
| R-074 | FEATURE_CATALOG | DB/Schema | Purchase invoice: record supplier's invoice against GRN |
| R-075 | FEATURE_CATALOG | Business Logic | Record supplier payments with method |
| R-076 | FEATURE_CATALOG | UI/Frontend | Supplier payment history per supplier |

## Inventory Management Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-077 | FEATURE_CATALOG | DB/Schema | Stock movement log: every in/out/adjustment recorded with reason |
| R-078 | FEATURE_CATALOG | Business Logic | Manual stock adjustment with reason code |
| R-079 | FEATURE_CATALOG | Business Logic | Inventory valuation: FIFO / Weighted Average costing |
| R-080 | FEATURE_CATALOG | Business Logic | Reorder recommendations: auto-suggest PO when stock hits reorder level |

## Accounting & Expenses Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-081 | FEATURE_CATALOG | DB/Schema | Expense recording with category |
| R-082 | FEATURE_CATALOG | DB/Schema | Configurable expense categories |
| R-083 | FEATURE_CATALOG | Notification/Cron | Recurring expense auto-recording |
| R-084 | FEATURE_CATALOG | DB/Schema | Expense receipts: attach photo/file |
| R-085 | FEATURE_CATALOG | Business Logic | Profit & Loss report: Revenue − COGS − Expenses = Net Profit |
| R-086 | FEATURE_CATALOG | Business Logic | Cash flow statement: cash in vs cash out by period |
| R-087 | FEATURE_CATALOG | Business Logic | GST summary: GSTR-1 / GSTR-3B formatted reports |
| R-088 | FEATURE_CATALOG | Business Logic | HSN-wise tax summary |
| R-089 | FEATURE_CATALOG | Business Logic | Bank reconciliation |

## Credit & Collections Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-090 | FEATURE_CATALOG | Business Logic | Overdue detection: automatic identification of past-due invoices |
| R-091 | FEATURE_CATALOG | Business Logic | Aging report: outstanding grouped by 7d/30d/60d/90d+ |
| R-092 | FEATURE_CATALOG | Business Logic | Collection tracking: log follow-up calls/messages per invoice |
| R-093 | FEATURE_CATALOG | Notification/Cron | Bulk WhatsApp reminders: send to all overdue customers at once |
| R-094 | FEATURE_CATALOG | Business Logic | Credit note: issue for returns/overpayments |
| R-095 | FEATURE_CATALOG | Business Logic | Credit note application to future invoice |
| R-096 | FEATURE_CATALOG | Business Logic | Write-off: mark irrecoverable debt |
| R-097 | FEATURE_CATALOG | Business Logic | Overpayment handling: auto-create credit note |

## Reporting Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-098 | FEATURE_CATALOG | UI/Frontend | Sales report by product, customer, date range, payment method |
| R-099 | FEATURE_CATALOG | UI/Frontend | Inventory report: stock levels, movements, valuation |
| R-100 | FEATURE_CATALOG | UI/Frontend | Customer report: top customers, at-risk, LTV |
| R-101 | FEATURE_CATALOG | UI/Frontend | Supplier report: payables, purchase history |
| R-102 | FEATURE_CATALOG | UI/Frontend | Payment report: cash flow by payment method |
| R-103 | FEATURE_CATALOG | UI/Frontend | Profitability report: margin by product/category/customer |
| R-104 | FEATURE_CATALOG | UI/Frontend | Tax report: GST collected and paid, net liability |
| R-105 | FEATURE_CATALOG | UI/Frontend | Report filters: date range, branch, customer, product, category |
| R-106 | FEATURE_CATALOG | UI/Frontend | CSV export on all reports |
| R-107 | FEATURE_CATALOG | UI/Frontend | Excel export on all reports |
| R-108 | FEATURE_CATALOG | UI/Frontend | PDF export on all reports |

## Notifications & Automation Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-109 | FEATURE_CATALOG | Notification/Cron | In-app notifications with unread badge |
| R-110 | FEATURE_CATALOG | Notification/Cron | Overdue auto-reminders: scheduled WhatsApp/in-app for overdue |
| R-111 | FEATURE_CATALOG | Notification/Cron | Low stock auto-alerts when stock hits reorder level |
| R-112 | FEATURE_CATALOG | Notification/Cron | Due date reminders N days before invoice due date |
| R-113 | FEATURE_CATALOG | Notification/Cron | Supplier payment reminders when due |
| R-114 | FEATURE_CATALOG | Notification/Cron | Pending approval alerts to approver |
| R-115 | FEATURE_CATALOG | Notification/Cron | Notification preferences per user |

## UX & Navigation Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-116 | FEATURE_CATALOG / UI_UX | UI/Frontend | Persistent left sidebar navigation with module grouping |
| R-117 | FEATURE_CATALOG / UI_UX | UI/Frontend | Command palette (Cmd+K): global search and quick actions |
| R-118 | FEATURE_CATALOG / UI_UX | UI/Frontend | Dark mode: light/dark/system theme |
| R-119 | FEATURE_CATALOG / UI_UX | UI/Frontend | Global search: customers, invoices, products, suppliers |
| R-120 | FEATURE_CATALOG / UI_UX | UI/Frontend | Keyboard shortcuts: N=New Invoice, C=Customer, /=Search, etc. |
| R-121 | FEATURE_CATALOG / UI_UX | UI/Frontend | Notification center slide-over panel with notification history |
| R-122 | FEATURE_CATALOG / UI_UX | UI/Frontend | Server-side pagination on all list endpoints |
| R-123 | FEATURE_CATALOG / UI_UX | UI/Frontend | Table column visibility toggle |
| R-124 | FEATURE_CATALOG / UI_UX | UI/Frontend | Bulk actions on tables |
| R-125 | FEATURE_CATALOG / UI_UX | UI/Frontend | Mobile bottom navigation |

## Approval Workflow Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-126 | FEATURE_CATALOG | Business Logic | Approval rules engine: configure what requires approval |
| R-127 | BUSINESS_WORKFLOWS | Business Logic | Invoice cancellation approval routing |
| R-128 | BUSINESS_WORKFLOWS | Business Logic | Large discount approval (above configured threshold) |
| R-129 | BUSINESS_WORKFLOWS | Business Logic | Stock adjustment approval for large adjustments |
| R-130 | BUSINESS_WORKFLOWS | Business Logic | Approval history log of all approved/rejected requests |

## API Architecture Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-131 | MODULE_ARCHITECTURE | API | All API routes follow /api/v1/{module}/{resource} pattern |
| R-132 | MODULE_ARCHITECTURE | API | Consistent response envelope: {success, data, meta} |
| R-133 | MODULE_ARCHITECTURE | API | Pagination on all list endpoints (page + pageSize, cursor) |
| R-134 | MODULE_ARCHITECTURE | Permission | Permission middleware on every API route |
| R-135 | MODULE_ARCHITECTURE | Permission | hasPermission() function with 3-tier resolution |
| R-136 | MODULE_ARCHITECTURE | Business Logic | Audit log writer: fire-and-forget on every mutation |
| R-137 | MODULE_ARCHITECTURE | Business Logic | Event system: business events trigger side effects |

## Database Schema Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-138 | DATABASE_EVOLUTION | DB/Schema | Invoice: dueDate, paymentTerms, notes, internalNotes, isOverdue fields |
| R-139 | DATABASE_EVOLUTION | DB/Schema | Customer: creditLimit, creditUsed, riskLevel, tags fields |
| R-140 | DATABASE_EVOLUTION | DB/Schema | Product: sku, barcode, costPrice, reorderLevel, hsnCode, brand fields |
| R-141 | DATABASE_EVOLUTION | DB/Schema | Payment: referenceNumber, chequeNumber, chequeDate, bankName, chequeCleared fields |
| R-142 | DATABASE_EVOLUTION | DB/Schema | Invoice AR fields: collectionStatus, lastReminderSentAt, reminderCount, assignedToEmployeeId |
| R-143 | DATABASE_EVOLUTION | DB/Schema | CollectionNote model with noteType and followUpDate |
| R-144 | DATABASE_EVOLUTION | DB/Schema | CollectionActivity model for full audit trail |
| R-145 | DATABASE_EVOLUTION | DB/Schema | ReminderConfig model per org |
| R-146 | DATABASE_EVOLUTION | DB/Schema | EscalationRule model |
| R-147 | DATABASE_EVOLUTION | DB/Schema | Organization model as top-level tenant |
| R-148 | DATABASE_EVOLUTION | DB/Schema | Branch model under Organization |
| R-149 | DATABASE_EVOLUTION | DB/Schema | Department model |
| R-150 | DATABASE_EVOLUTION | DB/Schema | Employee model replacing User |
| R-151 | DATABASE_EVOLUTION | DB/Schema | CustomRole model |
| R-152 | DATABASE_EVOLUTION | DB/Schema | EmployeePermission model (per-user overrides) |
| R-153 | DATABASE_EVOLUTION | DB/Schema | AuditLog model |
| R-154 | DATABASE_EVOLUTION | DB/Schema | Notification model |
| R-155 | DATABASE_EVOLUTION | DB/Schema | ApprovalRequest model |
| R-156 | DATABASE_EVOLUTION | DB/Schema | Supplier model |
| R-157 | DATABASE_EVOLUTION | DB/Schema | PurchaseOrder model |
| R-158 | DATABASE_EVOLUTION | DB/Schema | PurchaseItem model |
| R-159 | DATABASE_EVOLUTION | DB/Schema | GoodsReceived (GRN) model |
| R-160 | DATABASE_EVOLUTION | DB/Schema | GRNItem model |
| R-161 | DATABASE_EVOLUTION | DB/Schema | SupplierPayment model |
| R-162 | DATABASE_EVOLUTION | DB/Schema | StockMovement model |
| R-163 | DATABASE_EVOLUTION | DB/Schema | Expense model |
| R-164 | DATABASE_EVOLUTION | DB/Schema | ExpenseCategory model |
| R-165 | DATABASE_EVOLUTION | DB/Schema | CustomerGroup model |
| R-166 | DATABASE_EVOLUTION | DB/Schema | CreditNote model |
| R-167 | DATABASE_EVOLUTION | DB/Schema | RecurringInvoice model |

## Background Jobs Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-168 | MODULE_ARCHITECTURE | Notification/Cron | overdue-detector cron: daily 8 AM, mark invoices OVERDUE |
| R-169 | MODULE_ARCHITECTURE | Notification/Cron | reminder-sender cron: daily 9 AM, send WhatsApp/in-app reminders |
| R-170 | MODULE_ARCHITECTURE | Notification/Cron | recurring-invoice-generator cron: daily 7 AM |
| R-171 | MODULE_ARCHITECTURE | Notification/Cron | recurring-expense-generator cron: daily 7 AM |
| R-172 | MODULE_ARCHITECTURE | Notification/Cron | low-stock-checker cron: daily 7 AM |
| R-173 | ACCOUNTS_RECEIVABLE | Notification/Cron | ar-reminder-engine cron: daily 9 AM IST, full AR automation |
| R-174 | ACCOUNTS_RECEIVABLE | Notification/Cron | Escalation engine: runs as part of daily AR cron |

## AR System Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-175 | ACCOUNTS_RECEIVABLE | UI/Frontend | Pending Payments module (/pending-payments) with priority sort |
| R-176 | ACCOUNTS_RECEIVABLE | UI/Frontend | Aging buckets view: Current/1-7d/8-30d/31-60d/61-90d/90+ |
| R-177 | ACCOUNTS_RECEIVABLE | Business Logic | Priority score algorithm for invoice ordering |
| R-178 | ACCOUNTS_RECEIVABLE | Business Logic | Collection status management (NORMAL/FOLLOWING_UP/PROMISED/DISPUTED/ESCALATED/WRITTEN_OFF) |
| R-179 | ACCOUNTS_RECEIVABLE | UI/Frontend | Collection notes timeline on invoice detail page |
| R-180 | ACCOUNTS_RECEIVABLE | UI/Frontend | Add note form with type and follow-up date |
| R-181 | ACCOUNTS_RECEIVABLE | UI/Frontend | AR Analytics page (/reports/accounts-receivable) |
| R-182 | ACCOUNTS_RECEIVABLE | Business Logic | Collection Health Score metric (0-100) |
| R-183 | ACCOUNTS_RECEIVABLE | UI/Frontend | Email reminder system using Resend + React Email |
| R-184 | ACCOUNTS_RECEIVABLE | UI/Frontend | Reminder settings page (/settings/reminders) |
| R-185 | ACCOUNTS_RECEIVABLE | Business Logic | Configurable escalation rules per org |
| R-186 | ACCOUNTS_RECEIVABLE | API | AR API endpoints (/api/v1/collections/*) |
| R-187 | ACCOUNTS_RECEIVABLE | Permission | AR permission keys: collections:view, collections:manage, reminders:send, reminders:whatsapp, invoices:write_off, ar:analytics |

## SaaS & Infrastructure Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-188 | SAAS_EVOLUTION | DB/Schema | Subscription tiers: FREE / PRO / ENTERPRISE plan gating |
| R-189 | SAAS_EVOLUTION | Business Logic | Feature gating by plan tier via requiresPlanFeature() |
| R-190 | SAAS_EVOLUTION | DB/Schema | UsageRecord model for metering |
| R-191 | SAAS_EVOLUTION | Business Logic | Razorpay Subscriptions for billing |
| R-192 | SAAS_EVOLUTION | DB/Schema | OrganizationBranding model for white-labeling |
| R-193 | SAAS_EVOLUTION | Business Logic | Domain-based tenant resolution |
| R-194 | SAAS_EVOLUTION | DB/Schema | ApiKey model with scoped permissions |
| R-195 | SAAS_EVOLUTION | DB/Schema | Webhook model and WebhookDelivery model |
| R-196 | SAAS_EVOLUTION | Business Logic | Prisma middleware: warn if write happens without orgId |

## Technical Architecture Requirements

| ID | Source Doc | Category | Requirement Description |
|---|---|---|---|
| R-197 | MODULE_ARCHITECTURE | Business Logic | Switch to prisma migrate dev (not db push) |
| R-198 | MODULE_ARCHITECTURE | Business Logic | Move base64 images to Cloudflare R2 |
| R-199 | MODULE_ARCHITECTURE | Business Logic | SWR for all data fetching (replace raw fetch/useEffect) |
| R-200 | MODULE_ARCHITECTURE | Business Logic | PostgreSQL tsvector full-text search with GIN indexes |
| R-201 | MODULE_ARCHITECTURE | Business Logic | Database indexes for high-traffic queries |
| R-202 | MODULE_ARCHITECTURE | Business Logic | Rate limiting on sensitive API endpoints |
| R-203 | MODULE_ARCHITECTURE | Business Logic | Zod input validation on all API routes |

---

**Total Requirements Documented: 203**

*Generated: June 2026 | Source: 11 documentation files audited*
