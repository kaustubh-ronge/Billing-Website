# SmartBill — Documentation vs Implementation Audit

> For every requirement in the inventory: Status + Evidence.
> Format: `R-NNN | Status | Evidence (file:line or "Not found") | Gap Description`

**Status Key:**
- ✅ Fully Implemented
- ⚠️ Partially Implemented
- ❌ Missing
- 🔴 Broken

---

## Sales & Billing

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-001 | ✅ | `app/(app)/invoices/new/page.jsx:1-80` | Multi-step wizard fully implemented (Steps 1-4) |
| R-002 | ✅ | `app/api/invoices/route.js:173-181` | Invoice number auto-gen with atomic counter; prefix configurable |
| R-003 | ✅ | `app/(app)/invoices/new/page.jsx` | Line items with product selection, qty, unit price |
| R-004 | ✅ | `app/api/invoices/route.js:101-128` | Discount percentage calculated server-side |
| R-005 | ✅ | `app/api/invoices/route.js:118-121` | GST calculated from product taxRate server-side |
| R-006 | ✅ | `prisma/schema.prisma:24-29` | InvoiceStatus enum: PAID, PARTIAL, PENDING, DRAFT |
| R-007 | ✅ | `app/api/invoices/[id]/payments/route.js:1-117` | Partial payment with atomic update; concurrent-safe |
| R-008 | ✅ | `app/(app)/invoices/page.jsx:457-470` | CASH, UPI, BANK_TRANSFER, CARD in payment dialog |
| R-009 | ⚠️ | `prisma/schema.prisma:194` | referenceNumber stored but NO chequeNumber, chequeDate, bankName, chequeCleared fields |
| R-010 | ✅ | `prisma/schema.prisma:154-156` | dueDate field exists; paymentTerms enum added |
| R-011 | ✅ | `prisma/schema.prisma:37-43` | PaymentTerms enum: IMMEDIATE, NET_7, NET_15, NET_30, NET_45, CUSTOM |
| R-012 | ⚠️ | `prisma/schema.prisma:158` | `notes` field exists; NO `internalNotes` field separate from customer-facing |
| R-013 | ✅ | `app/api/invoices/route.js:134-151` | Credit limit checked; returns 422 with CREDIT_LIMIT_EXCEEDED code |
| R-014 | ❌ | Not found | No invoice edit endpoint or UI; only delete exists |
| R-015 | ❌ | Not found | No cancel workflow; only hard DELETE exists |
| R-016 | ✅ | `app/(app)/invoices/page.jsx:499-611` | Print-optimized layout embedded in page, uses window.print() |
| R-017 | ❌ | Not found | window.print() still used; @react-pdf/renderer not installed |
| R-018 | ✅ | `app/public/invoices/[id]/page.jsx` | Public invoice URL route exists |
| R-019 | ✅ | `app/(app)/invoices/page.jsx:162-213` | WhatsApp link generation with pre-composed message |
| R-020 | ❌ | Not found | No RecurringInvoice model or cron job |
| R-021 | ✅ | `app/(app)/invoices/page.jsx:248-267` | CSV export button implemented via lib/csv.js |

## Customer Management

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-022 | ✅ | `app/api/customers/route.js`, `app/api/customers/[id]/route.js` | Full CRUD with soft delete |
| R-023 | ✅ | `app/(app)/customers/page.jsx:85-102` | Customer ledger loaded from /api/invoices?customerId= |
| R-024 | ✅ | `app/(app)/customers/page.jsx:381-398` | Outstanding balance calculated and displayed |
| R-025 | ✅ | `prisma/schema.prisma:100` | notes field on Customer |
| R-026 | ✅ | `prisma/schema.prisma:98` | gstNumber field on Customer |
| R-027 | ✅ | `prisma/schema.prisma:104` | creditLimit field on Customer (default 0) |
| R-028 | ✅ | `prisma/schema.prisma:105` | creditUsed field; updated on invoice create/payment |
| R-029 | ❌ | Not found | No tags field on Customer model |
| R-030 | ❌ | Not found | No CustomerGroup model or functionality |
| R-031 | ❌ | Not found | No riskLevel field on Customer |
| R-032 | ✅ | `app/(app)/customers/page.jsx:381-398` | Total billed, paid, outstanding computed per customer |
| R-033 | ✅ | `app/(app)/customers/page.jsx:196-232` | WhatsApp ledger reminder link with full outstanding details |
| R-034 | ⚠️ | `app/(app)/customers/page.jsx:476-532` | Printable ledger exists but no date-range filter; uses window.print() |
| R-035 | ⚠️ | `app/(app)/customers/page.jsx:85-102` | Invoice history shown but no dedicated "Payments" tab showing only payments |
| R-036 | ❌ | Not found | No customer analytics (LTV, avg order value, frequency) |

## Product & Inventory

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-037 | ✅ | `app/api/products/route.js`, `app/api/products/[id]/route.js` | Full CRUD |
| R-038 | ✅ | `prisma/schema.prisma:126` | isService Boolean field; trackInventory false for services |
| R-039 | ✅ | `prisma/schema.prisma:127`, `app/(app)/products/page.jsx:17-47` | Category string field with predefined list |
| R-040 | ✅ | `prisma/schema.prisma:119` | taxRate field per product |
| R-041 | ✅ | `prisma/schema.prisma:121-122` | trackInventory and stockCount fields |
| R-042 | ✅ | `app/api/reports/route.js:155-171` | lowStockAlert threshold; dashboard shows alerts |
| R-043 | ✅ | `app/api/invoices/route.js:183-199` | Atomic stock deduction via raw SQL in transaction |
| R-044 | ✅ | `app/api/invoices/[id]/route.js:62-76` | Stock refunded on invoice delete |
| R-045 | ✅ | `prisma/schema.prisma:130` | unit field (pcs, kg, etc.) |
| R-046 | ✅ | `prisma/schema.prisma:137` | costPrice field exists in schema |
| R-047 | ✅ | `prisma/schema.prisma:135` | sku field exists in schema |
| R-048 | ✅ | `prisma/schema.prisma:136` | barcode field exists in schema |
| R-049 | ❌ | Not found | No hsnCode field on Product; DATABASE_EVOLUTION_PLAN specifies it |
| R-050 | ❌ | Not found | No reorderLevel field on Product; only lowStockAlert |
| R-051 | ❌ | Not found | No StockMovement model; movements not tracked |
| R-052 | ❌ | Not found | No manual stock adjustment endpoint or UI |

## Organization & Staff

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-053 | ⚠️ | `prisma/schema.prisma:80-91` | User model with Role enum but no enforcement |
| R-054 | ❌ | Not found | No staff invitation endpoint or Clerk invitation flow |
| R-055 | ❌ | Not found | No employee status management |
| R-056 | ❌ | Not found | No CustomRole model |
| R-057 | ❌ | Not found | No permission registry; Role enum is only OWNER/MANAGER/CASHIER |
| R-058 | ❌ | Not found | No EmployeePermission model or assignment |
| R-059 | ❌ | Not found | No per-user permission overrides |
| R-060 | ❌ | Not found | No AuditLog model; no audit logging |
| R-061 | ❌ | Not found | No activity feed UI or backend |

## Settings & Configuration

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-062 | ✅ | `app/(app)/settings/page.jsx:130-230` | Business profile form fully implemented |
| R-063 | ✅ | `app/(app)/settings/page.jsx:233-292` | Bank & UPI details form implemented |
| R-064 | ✅ | `app/(app)/settings/page.jsx:294-360` | Invoice configuration form implemented |
| R-065 | ✅ | `app/(app)/settings/page.jsx:320-330` | Default tax rate field |
| R-066 | ❌ | Not found | next-themes installed but no toggle button in UI |

## Purchase Management

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-067 | ❌ | Not found | No Supplier model, API, or UI |
| R-068 | ❌ | Not found | No Supplier model in schema |
| R-069 | ❌ | Not found | No supplier ledger |
| R-070 | ❌ | Not found | No PurchaseOrder model, API, or UI |
| R-071 | ❌ | Not found | No POStatus enum or workflow |
| R-072 | ❌ | Not found | No GoodsReceived model |
| R-073 | ❌ | Not found | No GRN stock update mechanism |
| R-074 | ❌ | Not found | No purchase invoice model |
| R-075 | ❌ | Not found | No SupplierPayment model |
| R-076 | ❌ | Not found | No supplier payment history |

## Inventory Management

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-077 | ❌ | Not found | No StockMovement model; no movement history |
| R-078 | ❌ | Not found | No manual adjustment endpoint |
| R-079 | ❌ | Not found | No inventory valuation logic |
| R-080 | ❌ | Not found | No reorder recommendation engine |

## Accounting & Expenses

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-081 | ❌ | Not found | No Expense model |
| R-082 | ❌ | Not found | No ExpenseCategory model |
| R-083 | ❌ | Not found | No recurring expense cron |
| R-084 | ❌ | Not found | No receipt upload functionality |
| R-085 | ❌ | Not found | No P&L report |
| R-086 | ❌ | Not found | No cash flow statement |
| R-087 | ❌ | Not found | No GST/GSTR-1/GSTR-3B report |
| R-088 | ❌ | Not found | No HSN-wise tax summary |
| R-089 | ❌ | Not found | No bank reconciliation |

## Credit & Collections

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-090 | ❌ | Not found | No isOverdue flag; no overdue detection cron |
| R-091 | ❌ | Not found | No aging report endpoint or UI |
| R-092 | ❌ | Not found | No collection notes model or UI |
| R-093 | ⚠️ | `app/(app)/invoices/page.jsx:162-187` | WhatsApp link per invoice exists but no bulk send |
| R-094 | ❌ | Not found | No CreditNote model |
| R-095 | ❌ | Not found | No credit note application logic |
| R-096 | ❌ | Not found | No write-off workflow |
| R-097 | ❌ | Not found | No overpayment handling (payment API rejects overpayment entirely) |

## Reporting

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-098 | ⚠️ | `app/api/reports/route.js:112-128` | Dashboard product/customer data; no dedicated reports page |
| R-099 | ❌ | Not found | No inventory report page |
| R-100 | ❌ | Not found | No dedicated customer analytics page |
| R-101 | ❌ | Not found | No supplier report (supplier module doesn't exist) |
| R-102 | ❌ | Not found | No payment method breakdown report |
| R-103 | ❌ | Not found | No profitability report (no cost prices used) |
| R-104 | ❌ | Not found | No GST tax report |
| R-105 | ⚠️ | `app/(app)/invoices/page.jsx:288-303` | Status filter exists; no date range, product, or category filters |
| R-106 | ✅ | `lib/csv.js`, invoices/customers/products pages | CSV export on invoices, customers, products pages |
| R-107 | ❌ | Not found | No Excel export |
| R-108 | ❌ | Not found | No PDF export via @react-pdf/renderer |

## Notifications & Automation

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-109 | ❌ | Not found | No Notification model; no notification bell |
| R-110 | ❌ | Not found | No overdue auto-reminder cron |
| R-111 | ⚠️ | `app/api/reports/route.js:155-171` | Low stock detected in reports API; no push notification sent |
| R-112 | ❌ | Not found | No due date reminder cron |
| R-113 | ❌ | Not found | No supplier payment reminder |
| R-114 | ❌ | Not found | No approval notification system |
| R-115 | ❌ | Not found | No notification preferences |

## UX & Navigation

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-116 | ✅ | `components/layout/AppSidebar.jsx` | Sidebar implemented and wired in layout (Dashboard, Invoices, Customers, Products, Settings only — missing Purchase, Inventory, Accounts, Reports, Team sections) |
| R-117 | ❌ | Not found | cmdk installed but no command palette UI wired |
| R-118 | ❌ | Not found | next-themes installed but no dark mode toggle button |
| R-119 | ❌ | Not found | No global search implementation |
| R-120 | ❌ | Not found | No keyboard shortcut hooks |
| R-121 | ❌ | Not found | No notification center UI |
| R-122 | ❌ | Not found | No pagination on any list endpoint (all records returned) |
| R-123 | ❌ | Not found | No column visibility toggle |
| R-124 | ❌ | Not found | No bulk actions on tables |
| R-125 | ❌ | Not found | No mobile bottom navigation |

## Approval Workflows

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-126 | ❌ | Not found | No ApprovalRequest model or rules engine |
| R-127 | ❌ | Not found | No cancellation approval routing |
| R-128 | ❌ | Not found | No discount approval threshold check |
| R-129 | ❌ | Not found | No stock adjustment approval |
| R-130 | ❌ | Not found | No approval history |

## API Architecture

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-131 | ❌ | `app/api/invoices/route.js` | Routes use /api/invoices not /api/v1/sales/invoices |
| R-132 | ❌ | `app/api/invoices/route.js:46-50` | No consistent {success, data, meta} envelope; different per route |
| R-133 | ❌ | Not found | No pagination params on any list endpoint |
| R-134 | ❌ | Not found | No permission middleware; only Clerk auth check |
| R-135 | ❌ | Not found | No hasPermission() function |
| R-136 | ❌ | Not found | No audit log writer |
| R-137 | ❌ | Not found | No event system |

## Database Schema

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-138 | ⚠️ | `prisma/schema.prisma:154-159` | dueDate, paymentTerms, notes exist; NO isOverdue, NO internalNotes |
| R-139 | ⚠️ | `prisma/schema.prisma:103-106` | creditLimit, creditUsed exist; NO riskLevel, NO tags |
| R-140 | ⚠️ | `prisma/schema.prisma:135-137` | sku, barcode, costPrice exist; NO reorderLevel, NO hsnCode, NO brand |
| R-141 | ⚠️ | `prisma/schema.prisma:194` | referenceNumber exists; NO chequeNumber, chequeDate, bankName, chequeCleared, reconciled |
| R-142 | ❌ | Not found | No collectionStatus, lastReminderSentAt, reminderCount, assignedToEmployeeId on Invoice |
| R-143 | ❌ | Not found | No CollectionNote model |
| R-144 | ❌ | Not found | No CollectionActivity model |
| R-145 | ❌ | Not found | No ReminderConfig model |
| R-146 | ❌ | Not found | No EscalationRule model |
| R-147 | ❌ | Not found | No Organization model; Shop is still root tenant |
| R-148 | ❌ | Not found | No Branch model |
| R-149 | ❌ | Not found | No Department model |
| R-150 | ❌ | Not found | Employee model not added; User model still used |
| R-151 | ❌ | Not found | No CustomRole model |
| R-152 | ❌ | Not found | No EmployeePermission model |
| R-153 | ❌ | Not found | No AuditLog model |
| R-154 | ❌ | Not found | No Notification model |
| R-155 | ❌ | Not found | No ApprovalRequest model |
| R-156 | ❌ | Not found | No Supplier model |
| R-157 | ❌ | Not found | No PurchaseOrder model |
| R-158 | ❌ | Not found | No PurchaseItem model |
| R-159 | ❌ | Not found | No GoodsReceived model |
| R-160 | ❌ | Not found | No GRNItem model |
| R-161 | ❌ | Not found | No SupplierPayment model |
| R-162 | ❌ | Not found | No StockMovement model |
| R-163 | ❌ | Not found | No Expense model |
| R-164 | ❌ | Not found | No ExpenseCategory model |
| R-165 | ❌ | Not found | No CustomerGroup model |
| R-166 | ❌ | Not found | No CreditNote model |
| R-167 | ❌ | Not found | No RecurringInvoice model |

## Background Jobs

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-168 | ❌ | Not found | No overdue-detector cron route |
| R-169 | ❌ | Not found | No reminder-sender cron route |
| R-170 | ❌ | Not found | No recurring-invoice-generator cron |
| R-171 | ❌ | Not found | No recurring-expense-generator cron |
| R-172 | ❌ | Not found | No low-stock-checker cron (detection only in reports GET) |
| R-173 | ❌ | Not found | No ar-reminder-engine cron route |
| R-174 | ❌ | Not found | No escalation engine |

## AR System

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-175 | ❌ | Not found | No /pending-payments page |
| R-176 | ❌ | Not found | No aging buckets view |
| R-177 | ❌ | Not found | No priority score algorithm |
| R-178 | ❌ | Not found | No collection status management |
| R-179 | ❌ | Not found | No collection notes UI |
| R-180 | ❌ | Not found | No add note form |
| R-181 | ❌ | Not found | No AR analytics page |
| R-182 | ❌ | Not found | No Collection Health Score |
| R-183 | ❌ | Not found | Resend not installed; no email reminder system |
| R-184 | ❌ | Not found | No reminder settings page |
| R-185 | ❌ | Not found | No escalation rules config |
| R-186 | ❌ | Not found | No /api/v1/collections/* endpoints |
| R-187 | ❌ | Not found | No AR permission keys defined |

## SaaS & Infrastructure

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-188 | ⚠️ | `prisma/schema.prisma:17-21` | Plan enum (FREE/PRO/ENTERPRISE) on Shop; no gating logic |
| R-189 | ❌ | Not found | No requiresPlanFeature() function |
| R-190 | ❌ | Not found | No UsageRecord model |
| R-191 | ❌ | Not found | No Razorpay integration |
| R-192 | ❌ | Not found | No OrganizationBranding model |
| R-193 | ❌ | Not found | No domain-based tenant resolution |
| R-194 | ❌ | Not found | No ApiKey model |
| R-195 | ❌ | Not found | No Webhook model |
| R-196 | ❌ | Not found | No Prisma middleware for orgId validation |

## Technical Architecture

| ID | Status | Evidence | Gap Description |
|---|---|---|---|
| R-197 | ❌ | `prisma.config.ts` | Schema pushed with db push; no migration history exists |
| R-198 | ❌ | `prisma/schema.prisma:125` | imageBase64 still stored as base64 Text in DB |
| R-199 | ❌ | Not found | Raw fetch/useEffect used; no SWR |
| R-200 | ❌ | Not found | No tsvector columns or GIN indexes |
| R-201 | ⚠️ | `prisma/schema.prisma:171-173` | Some indexes exist on Invoice; most are missing |
| R-202 | ❌ | Not found | No rate limiting on any endpoint |
| R-203 | ❌ | Not found | No Zod validation; manual parsing only |

---

## Summary Statistics

| Status | Count | Percentage |
|---|---|---|
| ✅ Fully Implemented | 39 | 19.2% |
| ⚠️ Partially Implemented | 16 | 7.9% |
| ❌ Missing | 146 | 72.0% |
| 🔴 Broken | 0 | 0.0% |
| **Total** | **203** | **100%** |

*Generated: June 2026*
