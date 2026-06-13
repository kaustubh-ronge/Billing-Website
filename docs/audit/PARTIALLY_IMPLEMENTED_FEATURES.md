# SmartBill — Partially Implemented Features

> Every partially implemented feature: what exists, what is missing, effort estimate.

---

## 1. Invoice Due Date & Payment Terms

**What exists:**
- `dueDate` (DateTime?) and `paymentTerms` (PaymentTerms enum) fields in schema (`prisma/schema.prisma:154-156`)
- PaymentTerms enum: IMMEDIATE, NET_7, NET_15, NET_30, NET_45, CUSTOM
- Auto-calculation of due date from payment terms in invoice creation API (`app/api/invoices/route.js:153-168`)
- Due date shown in invoices CSV export

**What is missing:**
- `isOverdue` flag (not in schema) — cannot detect overdue invoices
- `internalNotes` field separate from customer-facing `notes` (only one `notes` field exists)
- No overdue detection cron job
- Invoice list UI does not show due date column or overdue badge
- No "X days overdue" or "Due in X days" display anywhere

**Effort Estimate:** 2-3 days
- Add `isOverdue` Boolean field to schema: 30 min
- Add overdue badge to invoice list UI: 2 hours
- Create daily cron at `/api/cron/overdue-detector`: 3 hours
- Add `internalNotes` field: 1 hour

---

## 2. Cheque Payment Tracking

**What exists:**
- `referenceNumber` field on Payment model (`prisma/schema.prisma:194`)
- referenceNumber accepted in payment recording API

**What is missing:**
- No `chequeNumber`, `chequeDate`, `bankName`, `chequeCleared`, `chequeClearedAt`, `reconciled` fields
- No cheque-specific UI in Record Payment dialog
- No "Mark cheque as cleared" workflow
- No cheque bounce handling

**Effort Estimate:** 1-2 days
- Schema migration adding 5 cheque fields: 30 min
- Update payment dialog UI with conditional cheque fields: 3 hours
- Add "Mark Cleared/Bounced" action: 2 hours

---

## 3. Customer Credit Management

**What exists:**
- `creditLimit` (Float) and `creditUsed` (Float) fields in schema
- Credit limit check in invoice creation (returns 422 CREDIT_LIMIT_EXCEEDED)
- `creditUsed` incremented on outstanding invoice, decremented on payment

**What is missing:**
- Credit limit not editable in the customer create/edit form (UI does not expose it)
- No `riskLevel` field (documented as "LOW" / "MEDIUM" / "HIGH")
- No `tags` array field
- No credit limit warning UI in invoice creation Step 1 (only server-side 422)
- No credit utilization visual bar in customer list
- No customer groups

**Effort Estimate:** 2-3 days
- Add creditLimit field to customer edit form: 2 hours
- Add riskLevel and tags to schema: 30 min
- Show credit warning in invoice wizard Step 1: 3 hours
- Credit utilization bar in customer list: 2 hours

---

## 4. Product Extended Fields (SKU/Barcode/CostPrice)

**What exists:**
- `sku`, `barcode`, `costPrice` fields in Product schema (`prisma/schema.prisma:135-137`)
- Fields persisted to database

**What is missing:**
- No SKU, barcode, or cost price fields in the product create/edit form UI
- No barcode scanner integration
- No margin calculation or display anywhere
- No `hsnCode` field (not in schema)
- No `reorderLevel` field (only `lowStockAlert` exists — different concept)
- No `brand` field

**Effort Estimate:** 1-2 days (UI only for SKU/barcode/cost); 1 day (schema additions for HSN/reorder)
- Add SKU/barcode/costPrice to product form: 3 hours
- Add hsnCode and reorderLevel to schema: 30 min
- Show margin on product list (Owner view): 2 hours

---

## 5. Sidebar Navigation (Incomplete Sections)

**What exists:**
- `components/layout/AppSidebar.jsx` implemented and wired into layout
- Navigation items: Dashboard, Invoices, Customers, Products, Settings

**What is missing:**
- Purchase section (Suppliers, Orders, GRNs)
- Inventory section (Stock, Adjustments, Movements)
- Accounts section (Expenses, P&L, Cash Flow)
- Reports section
- Team section (Employees, Roles, Activity, Approvals)
- Collapsed icon-only mode toggle
- Mobile bottom navigation
- Permission-aware sidebar (hide sections user can't access)

**Effort Estimate:** 3-4 hours (adding nav items); Full sections require feature implementation
- Adding sidebar sections: 2 hours (just nav items without destination pages)
- Mobile bottom nav: 4 hours

---

## 6. Invoice Print / PDF

**What exists:**
- Print-optimized HTML layout in `app/(app)/invoices/page.jsx:499-611`
- `window.print()` triggered on print button click
- Full invoice layout including items, totals, business branding, payment history

**What is missing:**
- True PDF generation (@react-pdf/renderer not installed)
- PDF is just browser print (inconsistent across browsers)
- No standalone PDF download button
- No PDF for customer statements or purchase orders

**Effort Estimate:** 3-5 days
- Install @react-pdf/renderer and create PDF component: 2 days
- Generate PDF server-side or client-side: 1 day
- Customer statement PDF: 1 day

---

## 7. Dashboard Reporting

**What exists:**
- Today's Sales, Monthly Sales, Outstanding Due, Total Clients KPI cards
- 30-day area chart and 12-month bar chart
- Top 10 outstanding customers list
- Top 5 best-selling products
- Low stock alerts

**What is missing:**
- No AR widgets (overdue count, due today, due this week)
- No overdue invoice detection (no isOverdue flag)
- No pending approvals widget
- No cash balance widget
- No team activity (today's staff actions)
- No permission-aware widget visibility
- No best-performing staff widget
- No 1-minute auto-refresh

**Effort Estimate:** 2-3 days (AR widgets depend on AR module being built)
- AR widgets (4 cards): 4 hours after AR schema migration
- Permission-aware visibility: 3 hours after permission system built
- Auto-refresh: 1 hour

---

## 8. Plan / Subscription Tier

**What exists:**
- `subscriptionPlan` field on Shop model with Plan enum (FREE, PRO, ENTERPRISE)
- `prisma/schema.prisma:47`

**What is missing:**
- No feature gating logic anywhere in the codebase
- No `requiresPlanFeature()` function
- No plan upgrade/downgrade UI
- No Razorpay subscription integration
- No usage metering
- Plan field is a dead field — never checked at runtime

**Effort Estimate:** 3-4 weeks (full SaaS monetization is a major feature)
- Feature gating middleware: 2 days
- Usage metering: 3 days
- Razorpay integration: 1 week

---

## 9. Customer Statement Printing

**What exists:**
- `app/(app)/customers/page.jsx:476-532` — printable ledger view (print-only CSS)
- window.print() call
- Shows all invoices with date/status/amounts

**What is missing:**
- No date range filter on the statement
- No "Send to Customer" option (WhatsApp exists but not statement-specific)
- No PDF download
- Not a proper statement-of-account format with running balance column
- No customer statement for a specific date range

**Effort Estimate:** 2-3 days
- Date range filter for statement: 4 hours
- Running balance column: 2 hours
- Proper statement format with opening/closing balance: 4 hours

---

## 10. Stock Deduction/Refund (Without Movement History)

**What exists:**
- Stock deducted atomically on invoice creation via raw SQL
- Stock refunded on invoice deletion
- stockCount field on Product

**What is missing:**
- No StockMovement model to log each change
- No audit trail of who changed stock or when
- No reason tracking for stock changes
- Cannot reconstruct stock history
- No movement history UI

**Effort Estimate:** 2-3 days
- Add StockMovement model to schema: 1 hour
- Hook into invoice creation/deletion to write movement records: 3 hours
- Stock movement history UI: 4 hours

---

## 11. Invoice Search & Filtering

**What exists:**
- Search by invoice number and customer name/phone
- Status filter (ALL/PAID/PARTIAL/PENDING)

**What is missing:**
- No date range filter (from/to)
- No amount range filter
- No customer ID direct filter in UI (API supports it)
- No sorting options (only default: issuedAt desc)
- No server-side pagination (all records returned at once)

**Effort Estimate:** 1-2 days
- Date range picker: 3 hours
- Server-side pagination: 4 hours
- Sorting: 2 hours

---

## 12. User Role System (Without Enforcement)

**What exists:**
- `role` field on User model with Role enum: OWNER, MANAGER, CASHIER
- Role stored in DB

**What is missing:**
- Role is never checked in any API route
- No permission enforcement anywhere
- No UI that changes based on role
- No Employee model (User model used)
- No CustomRole, no EmployeePermission

**Effort Estimate:** 3-4 weeks (full permission system is a major architectural change)

---

## Summary Table

| Feature | % Done | Missing | Effort |
|---|---|---|---|
| Invoice Due Date & Terms | 60% | isOverdue flag, cron, UI indicators | 2-3 days |
| Cheque Payment Tracking | 15% | 5 schema fields, UI, workflow | 1-2 days |
| Customer Credit Management | 50% | UI form, riskLevel, tags, visual indicators | 2-3 days |
| Product SKU/Barcode/CostPrice | 30% | UI exposure, HSN, reorderLevel | 1-2 days |
| Sidebar Navigation | 40% | 5 missing sections, mobile, permission-aware | 3-4 hours + features |
| Invoice PDF | 30% | @react-pdf/renderer, download button | 3-5 days |
| Dashboard Reporting | 50% | AR widgets, overdue, permissions | 2-3 days |
| Subscription Plan | 5% | Gating logic, Razorpay, metering | 3-4 weeks |
| Customer Statement | 40% | Date range, running balance, PDF | 2-3 days |
| Stock Movement History | 30% | StockMovement model, audit trail | 2-3 days |
| Invoice Search/Filtering | 40% | Date range, pagination, sorting | 1-2 days |
| User Role System | 5% | Full permission architecture | 3-4 weeks |

*Generated: June 2026*
