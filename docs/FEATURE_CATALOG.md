# SmartBill — Feature Catalog

> Complete inventory of all features, grouped by maturity tier and business domain.

---

## How to Read This Document

Each feature is tagged with:
- **Tier**: Core / Advanced / Enterprise / Future SaaS
- **Domain**: The business module it belongs to
- **Status**: Exists (in current codebase) / Planned / Future

---

## TIER 1 — CORE FEATURES

These features are the minimum for a shop owner to replace their current system (Vyapar, Tally, paper ledger) with SmartBill.

### Sales & Billing

| Feature | Description | Status |
|---|---|---|
| Invoice creation | Multi-step wizard: customer → items → payment | Exists |
| Invoice numbering | Auto-generated with configurable prefix/format | Exists |
| Line items | Products/services with quantity, unit price, tax | Exists |
| Discount | Per-invoice discount percentage | Exists |
| GST calculation | Automatic tax per product at configured rate | Exists |
| Invoice status | PAID / PARTIAL / PENDING / DRAFT | Exists |
| Payment recording | Partial and full payments with method selection | Exists |
| Payment methods | Cash, UPI, Bank Transfer, Card | Exists |
| Cheque payments | Cheque number, date, bank name, cleared status | Planned |
| Due date | Configurable due date per invoice | Planned |
| Payment terms | Net-7, Net-15, Net-30, custom | Planned |
| Invoice notes | Customer-facing and internal notes per invoice | Planned |
| Credit limit enforcement | Block/warn when customer exceeds credit limit | Planned |
| Invoice edit | Modify draft invoices; lock paid invoices | Planned |
| Invoice cancel | Cancel with reason; audit trail preserved | Planned |
| Invoice print | Print-optimized layout with business branding | Exists |
| Invoice PDF | True PDF generation (not window.print) | Planned |
| Public invoice link | Shareable URL for customer to view invoice | Exists |
| WhatsApp sharing | Pre-filled message with invoice details and link | Exists |
| Recurring invoices | Auto-generate invoices on a schedule | Planned |
| Bulk invoice export | Export multiple invoices as CSV/Excel/PDF | Planned |

### Customer Management

| Feature | Description | Status |
|---|---|---|
| Customer CRUD | Create, view, edit, soft-delete customers | Exists |
| Customer ledger | Full transaction history per customer | Exists |
| Customer balance | Real-time outstanding balance display | Exists |
| Customer notes | Internal notes/observations | Exists |
| GST number | B2B customer GST tracking | Exists |
| Credit limit | Per-customer credit limit setting | Planned |
| Credit used | Real-time credit utilization tracking | Planned |
| Customer tags | Flexible tagging (e.g. "VIP", "Risky", "Wholesale") | Planned |
| Customer groups | Group customers for bulk pricing/credit policies | Planned |
| Customer risk level | Low / Medium / High risk indicator | Planned |
| Outstanding summary | Per-customer total billed, paid, outstanding | Exists |
| WhatsApp reminder | One-click reminder with outstanding details | Exists |
| Customer statement | Printable statement of account for a date range | Planned |
| Payment history | All payments by a customer across all invoices | Planned |
| Customer analytics | Purchase frequency, avg order value, lifetime value | Planned |

### Product & Inventory

| Feature | Description | Status |
|---|---|---|
| Product CRUD | Create, view, edit, delete products | Exists |
| Service items | Non-inventory service products | Exists |
| Categories | Hierarchical product categories | Exists (basic) |
| Tax rate per product | Individual GST rate per product | Exists |
| Inventory tracking | Track stock count per product | Exists |
| Low stock alerts | Alert when stock falls below threshold | Exists |
| Stock deduction | Auto-deduct stock on invoice creation | Exists |
| Stock refund | Auto-refund stock on invoice deletion | Exists |
| Units of measure | kg, pcs, box, litre, etc. | Exists |
| Cost price | Purchase cost for margin calculations | Planned |
| SKU | Unique identifier per product | Planned |
| Barcode | EAN/QR barcode per product | Planned |
| HSN code | GST HSN code for tax classification | Planned |
| Reorder level | Alert threshold for reordering | Planned |
| Stock movement history | Full log of every stock in/out event | Planned |
| Manual stock adjustment | Add/remove stock with reason | Planned |

### Organization & Staff

| Feature | Description | Status |
|---|---|---|
| Multi-user shop | Multiple staff under one shop | Exists (basic) |
| Staff invitation | Invite staff via email | Planned |
| Staff deactivation | Suspend/deactivate employee access | Planned |
| Custom roles | Create named roles with permission sets | Planned |
| Granular permissions | ~50 individual permission keys | Planned |
| Permission assignment | Assign permissions per employee | Planned |
| Permission override | Override role permissions per individual | Planned |
| Audit log | Log every significant action with user + timestamp | Planned |
| Activity feed | Timeline of recent actions across the org | Planned |

### Settings & Configuration

| Feature | Description | Status |
|---|---|---|
| Business profile | Name, logo, address, phone, email, GST | Exists |
| Banking details | Bank name, account, IFSC, UPI ID | Exists |
| Invoice configuration | Prefix, format, footer message, currency | Exists |
| Default tax rate | Shop-level default GST rate | Exists |
| Dark mode | Light/dark theme toggle | Planned |
| Language | English + Hindi (future) | Future |

---

## TIER 2 — ADVANCED FEATURES

These features take the platform from "better Vyapar" to a genuine business management system.

### Purchase Management

| Feature | Description | Status |
|---|---|---|
| Supplier CRUD | Create, edit, manage suppliers | Planned |
| Supplier contact | Phone, email, address, GST number | Planned |
| Supplier ledger | Outstanding payables per supplier | Planned |
| Purchase order | Create PO with items and quantities | Planned |
| PO status tracking | DRAFT → SENT → PARTIALLY_RECEIVED → RECEIVED | Planned |
| Goods received note | Record actual items received against a PO | Planned |
| GRN auto stock update | Stock automatically updated on GRN creation | Planned |
| Purchase invoice | Record supplier's invoice against a GRN | Planned |
| Supplier payment | Record payments to suppliers with method | Planned |
| Supplier payment history | Full payment log per supplier | Planned |
| Supplier analytics | On-time delivery rate, pricing trends | Future |

### Inventory Management

| Feature | Description | Status |
|---|---|---|
| Stock movement log | Every in/out/adjustment recorded with reason | Planned |
| Manual stock adjustment | Correction entries with reason code | Planned |
| Stock transfer | Move stock between branches/locations | Future |
| Physical stock audit | Record counted quantities vs system quantities | Future |
| Inventory valuation | FIFO / Weighted Average costing | Planned |
| Reorder recommendations | Auto-suggest PO when stock hits reorder level | Planned |
| Near-expiry alerts | Expiry date tracking (pharmacies, FMCG) | Future |
| Batch/lot tracking | Track goods by batch number | Future |

### Accounting & Expenses

| Feature | Description | Status |
|---|---|---|
| Expense recording | Record business expenses with category | Planned |
| Expense categories | Configurable categories (Rent, Salary, Utilities, etc.) | Planned |
| Recurring expenses | Auto-record monthly/weekly expenses | Planned |
| Expense receipts | Attach photo/file to expense records | Planned |
| Profit & Loss report | Revenue − COGS − Expenses = Net Profit | Planned |
| Cash flow statement | Cash in vs cash out by period | Planned |
| GST summary | GSTR-1 / GSTR-3B formatted reports | Planned |
| HSN-wise tax summary | Tax collected by HSN code | Planned |
| Bank reconciliation | Match recorded payments to bank statement | Planned |
| Income tracking | All revenue streams (sales, other income) | Planned |
| COGS tracking | Cost of goods sold per sale (requires cost price) | Planned |

### Credit & Collections

| Feature | Description | Status |
|---|---|---|
| Credit limit enforcement | Warn/block invoice if customer over credit limit | Planned |
| Overdue detection | Automatic identification of past-due invoices | Planned |
| Aging report | Outstanding grouped by 7d / 30d / 60d / 90d+ | Planned |
| Collection tracking | Log follow-up calls/messages per invoice | Planned |
| Bulk WhatsApp reminders | Send reminders to all overdue customers at once | Planned |
| Credit note | Issue credit note for returns/overpayments | Planned |
| Credit note application | Apply credit note to future invoice | Planned |
| Write-off | Mark irrecoverable debt as written off | Planned |
| Overpayment handling | Auto-create credit note for excess payment | Planned |

### Reporting

| Feature | Description | Status |
|---|---|---|
| Sales report | By product, customer, date range, payment method | Planned |
| Inventory report | Stock levels, movements, valuation | Planned |
| Customer report | Top customers, at-risk customers, LTV | Planned |
| Supplier report | Payables, purchase history | Planned |
| Payment report | Cash flow by payment method | Planned |
| Profitability report | Margin by product, category, customer | Planned |
| Tax report | GST collected and paid, net liability | Planned |
| Staff performance | Sales per employee, invoices created | Planned |
| Report filters | Date range, branch, customer, product, category | Planned |
| Saved report views | Save filter configurations for reuse | Planned |
| CSV export | Download any report as CSV | Planned |
| Excel export | Download formatted Excel reports | Planned |
| PDF export | Generate PDF report with branding | Planned |

### Notifications & Automation

| Feature | Description | Status |
|---|---|---|
| In-app notifications | System notifications with unread badge | Planned |
| Overdue auto-reminders | Scheduled WhatsApp/in-app reminders for overdue | Planned |
| Low stock auto-alerts | Notification when stock hits reorder level | Planned |
| Due date reminders | Alert N days before invoice due date | Planned |
| Supplier payment reminders | Alert when supplier payment is due | Planned |
| Pending approval alerts | Notify approver of pending approval requests | Planned |
| Business digest | Daily/weekly summary of key metrics | Future |
| Notification preferences | Per-user notification settings | Planned |

### UX & Navigation

| Feature | Description | Status |
|---|---|---|
| Sidebar navigation | Persistent sidebar with module grouping | Planned (component exists) |
| Command palette | Cmd+K global search and quick actions | Planned (cmdk installed) |
| Dark mode | Light/dark/system theme | Planned |
| Global search | Search customers, invoices, products, suppliers | Planned |
| Keyboard shortcuts | N=New Invoice, C=Customer, /=Search, etc. | Planned |
| Notification center | Slide-over panel with notification history | Planned |
| Activity center | Timeline of recent business events | Planned |
| Data table pagination | Server-side pagination for all lists | Planned |
| Table column visibility | Show/hide columns per preference | Planned |
| Bulk actions | Select multiple records for batch operations | Planned |
| Breadcrumb navigation | Context trail on nested pages | Planned |

---

## TIER 3 — ENTERPRISE FEATURES

Features for businesses with multiple branches, large teams, or compliance requirements.

### Organization & Branch Management

| Feature | Description | Status |
|---|---|---|
| Organization model | Top-level entity above shops/branches | Future |
| Multi-branch | Multiple locations under one organization | Future |
| Branch-level staff | Employees scoped to specific branches | Future |
| Branch reports | Revenue, inventory, staff performance per branch | Future |
| Consolidated reports | Roll-up reports across all branches | Future |
| Branch transfer | Stock transfer between branches | Future |
| Branch comparison | Side-by-side performance comparison | Future |
| Headquarters designation | Mark one branch as head office | Future |

### Advanced RBAC

| Feature | Description | Status |
|---|---|---|
| Department management | Group employees by department | Planned |
| Hierarchical roles | Role inheritance (Manager inherits Cashier perms) | Planned |
| IP restrictions | Lock employee access to specific IPs/locations | Future |
| Time-based access | Restrict access to working hours | Future |
| Two-factor enforcement | Require 2FA for sensitive operations | Future |

### Approval Workflows

| Feature | Description | Status |
|---|---|---|
| Approval rules engine | Configure what requires approval (threshold-based) | Planned |
| Invoice cancellation approval | Cancellations route to manager for approval | Planned |
| Large discount approval | Discounts above X% require approval | Planned |
| Stock adjustment approval | Manual adjustments above X units require approval | Planned |
| Large refund approval | Refunds above ₹X require approval | Planned |
| Approval delegation | Manager can delegate approval to another user | Future |
| Approval history | Full log of approved/rejected requests | Planned |
| SLA tracking | Alert if approval pending for >N hours | Future |

### Advanced Inventory

| Feature | Description | Status |
|---|---|---|
| Product variants | Size, color, weight variants under one parent | Future |
| Barcode generation | Print product barcodes/labels | Future |
| Barcode scanner | Camera-based scanning on mobile | Future |
| Serial number tracking | Track individual items by serial number | Future |
| Batch/expiry tracking | Batch number and expiry date per stock entry | Future |
| Warehouse locations | Bin/shelf location tracking | Future |
| Multi-warehouse | Separate inventory per warehouse | Future |

### Integration & API

| Feature | Description | Status |
|---|---|---|
| REST API | Public versioned API for integrations | Future |
| API keys | Per-organization API key management | Future |
| Webhooks | Event-driven notifications to external systems | Future |
| Tally export | Export data in Tally-compatible format | Future |
| GST portal sync | Direct GSTR filing from SmartBill | Future |
| Razorpay integration | Online payment collection and reconciliation | Future |
| WhatsApp Business API | Automated messages via official API | Future |
| Email delivery | Invoice/reminder delivery via email (SMTP/SES) | Planned |

---

## TIER 4 — FUTURE SAAS FEATURES

Features that enable SmartBill to operate as a multi-tenant SaaS product.

### SaaS Infrastructure

| Feature | Description |
|---|---|
| Subscription tiers | FREE / PRO / ENTERPRISE plan gating |
| Usage metering | Invoice count, storage, API calls |
| Razorpay Subscriptions | Automated recurring billing for SmartBill itself |
| Plan upgrade/downgrade | Self-serve plan management |
| Trial period | 30-day PRO trial for new organizations |
| Billing portal | Manage SmartBill subscription and invoices |

### White-Labeling

| Feature | Description |
|---|---|
| Custom domain | Organization-specific domain (bills.acmetraders.com) |
| Custom branding | Logo, colors, invoice template per organization |
| Branded customer portal | Customer views invoices on branded domain |
| Custom email sender | Emails sent from organization's domain |
| Reseller program | Allow CA firms / ERP resellers to sell SmartBill |

### Accountant Portal

| Feature | Description |
|---|---|
| CA firm account | One CA manages multiple client organizations |
| Cross-client reporting | View financials across all clients |
| Client access delegation | Business owner grants read-only CA access |
| Accountant-specific views | P&L, trial balance, GST reports focused UI |

### Mobile Applications

| Feature | Description |
|---|---|
| React Native app | iOS + Android native app |
| Offline billing | Create invoices without internet |
| Barcode scanning | Camera-based product lookup |
| Biometric auth | Face ID / fingerprint |
| Push notifications | Overdue alerts, low stock, approvals |
| Mobile dashboard | KPI widgets optimized for phone |

### Future Enterprise

| Feature | Description |
|---|---|
| Attendance integration | Track employee attendance |
| Payroll integration | Calculate salaries based on attendance/performance |
| Shift management | Define and assign work shifts |
| Task assignment | Assign tasks to employees |
| Employee targets | Set and track sales/collection targets |
| Performance dashboard | Employee KPI scorecards |
| Holding company | Single login for multiple businesses under one owner |

---

*Document Version: 1.0 | Last Updated: June 2026*
*Cross-references: [PRODUCT_VISION.md](PRODUCT_VISION.md) | [PRIORITY_ROADMAP.md](PRIORITY_ROADMAP.md) | [DATABASE_EVOLUTION_PLAN.md](DATABASE_EVOLUTION_PLAN.md)*
