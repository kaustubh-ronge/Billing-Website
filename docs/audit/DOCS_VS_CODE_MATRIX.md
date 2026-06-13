# SmartBill — Docs vs Code Matrix

> Matrix table: rows = requirement categories, columns = implementation layers.
> Mark each cell: ✅ Done / ⚠️ Partial / ❌ Missing

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Implemented and working |
| ⚠️ | Partially implemented — core exists, but key pieces missing |
| ❌ | Completely absent — zero implementation |

---

## Coverage Matrix

| Module / Category | DB Schema | API Routes | UI/Frontend | Business Logic | Cron/Jobs |
|---|---|---|---|---|---|
| **Invoice Creation** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Invoice Numbering** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Invoice Due Dates** | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| **Invoice Edit** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Invoice Cancel / Approval** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Invoice PDF Generation** | ❌ | ❌ | ⚠️ | ❌ | ❌ |
| **Public Invoice Link** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Recurring Invoices** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Payment Recording** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Cheque Payments** | ⚠️ | ⚠️ | ❌ | ❌ | ❌ |
| **Credit Limit Enforcement** | ✅ | ✅ | ⚠️ | ✅ | ❌ |
| **Overpayment Handling** | ❌ | ⚠️ | ❌ | ❌ | ❌ |
| **Customer CRUD** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Customer Ledger** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Customer Credit Fields** | ✅ | ✅ | ⚠️ | ✅ | ❌ |
| **Customer Tags/Groups** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Customer Risk Level** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Customer Statement** | ❌ | ❌ | ⚠️ | ❌ | ❌ |
| **Customer Analytics** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **WhatsApp Reminders** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Product CRUD** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Product SKU/Barcode** | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| **Product Cost Price** | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| **Product HSN Code** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Inventory Tracking** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Low Stock Alerts** | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| **Stock Movement History** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Manual Stock Adjustment** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Reorder Levels/Alerts** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Supplier Management** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Purchase Orders** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Goods Received Notes** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Supplier Payments** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Expense Tracking** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Expense Categories** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Recurring Expenses** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Profit & Loss Report** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Cash Flow Statement** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **GST Reports (GSTR-1/3B)** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Overdue Detection** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Aging Report** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Collection Notes** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Collection Status** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Automated Reminders** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Escalation Engine** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Credit Notes** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Write-Off Workflow** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Pending Payments Module** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **AR Analytics** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Email Reminders (Resend)** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Dashboard Metrics** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Sales Charts** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Advanced Reports** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Report Filters** | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ |
| **CSV Export** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Excel/PDF Export** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Multi-User Staff** | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| **Staff Invitation** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Permission System** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Custom Roles** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Audit Log** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Approval Workflows** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **In-App Notifications** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Organization/Branch** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Business Profile Settings** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Invoice Settings** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Dark Mode** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Sidebar Navigation** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Command Palette** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Global Search** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Pagination** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Bulk Actions** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **SaaS Plans/Gating** | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| **Razorpay Integration** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **API Keys / Webhooks** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Migration History** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Rate Limiting** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Input Validation (Zod)** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **SWR State Management** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Cloudflare R2 Storage** | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Coverage Score by Implementation Layer

| Layer | Implemented | Partial | Missing | Score |
|---|---|---|---|---|
| **DB Schema** | 14 | 6 | 60 | 17% |
| **API Routes** | 9 | 4 | 67 | 11% |
| **UI/Frontend** | 12 | 8 | 60 | 15% |
| **Business Logic** | 13 | 5 | 62 | 16% |
| **Cron/Jobs** | 0 | 0 | 80 | 0% |
| **Overall** | ~24% | ~8% | ~68% | **~24%** |

---

## Worst Coverage Areas (All Layers Missing)

1. Purchase Management (Supplier, PO, GRN) — 0% across all layers
2. Accounting & Expenses — 0% across all layers
3. AR System (Collection engine, aging) — 0% across all layers
4. Organization/Permission System — 0% across all layers
5. Notification/Cron System — 0% across all layers
6. GST Reporting — 0% across all layers
7. Approval Workflows — 0% across all layers
8. SaaS Infrastructure — ~5% (Plan enum only)

*Generated: June 2026*
