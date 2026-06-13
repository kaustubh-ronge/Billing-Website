# SmartBill — Module Architecture

> Technical architecture of every module: responsibilities, API design, data flow, and cross-module relationships.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  Web App (Next.js)   Mobile App (React Native)   API Client │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   API GATEWAY LAYER                         │
│  Auth Middleware → Permission Check → Rate Limiting         │
│  Audit Logger → Request Validator → Response Formatter      │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                  BUSINESS LOGIC MODULES                     │
│                                                             │
│  Sales    Purchase   Inventory   Accounting   CRM           │
│  RBAC     Reports    Notifications  Settings  Auth          │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   DATA LAYER                                │
│  Prisma ORM → PostgreSQL (Neon)                             │
│  File Storage: Cloudflare R2 / S3                           │
│  Search: PostgreSQL tsvector                                │
│  Background Jobs: Cron / Queue                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Module Map

| Module | Responsibility | Key Entities |
|---|---|---|
| **Auth** | Identity, sessions, user-to-org linking | User, Session (Clerk) |
| **Organization** | Org/branch/department structure | Organization, Branch, Department |
| **RBAC** | Permissions, roles, enforcement | CustomRole, EmployeePermission |
| **Employee** | Staff lifecycle, profiles | Employee |
| **Audit** | Immutable action log | AuditLog |
| **Sales** | Invoices, payments, credit notes | Invoice, InvoiceItem, Payment, CreditNote |
| **CRM** | Customers, groups, communication | Customer, CustomerGroup |
| **Purchase** | Procurement from suppliers | Supplier, PurchaseOrder, GRN, SupplierPayment |
| **Inventory** | Stock levels, movements | Product, StockMovement |
| **Accounting** | Expenses, P&L, tax | Expense, ExpenseCategory |
| **Approval** | Workflow approvals | ApprovalRequest |
| **Notifications** | In-app and external alerts | Notification |
| **Reports** | Analytics and exports | (aggregated from all modules) |
| **Settings** | Business configuration | Shop/Organization config |
| **Search** | Global full-text search | tsvector indexes |

---

## 3. API Design

### Base Structure

All API routes follow the pattern:
```
/api/v1/{module}/{resource}
```

Examples:
```
GET    /api/v1/sales/invoices
POST   /api/v1/sales/invoices
GET    /api/v1/sales/invoices/:id
PUT    /api/v1/sales/invoices/:id
DELETE /api/v1/sales/invoices/:id

POST   /api/v1/sales/invoices/:id/payments
GET    /api/v1/sales/invoices/:id/payments

GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id/ledger
GET    /api/v1/customers/:id/statement

GET    /api/v1/inventory/products
POST   /api/v1/inventory/adjustments
GET    /api/v1/inventory/movements?productId=&from=&to=

GET    /api/v1/purchase/orders
POST   /api/v1/purchase/orders
POST   /api/v1/purchase/orders/:id/grn
POST   /api/v1/purchase/orders/:id/payments

GET    /api/v1/org/employees
POST   /api/v1/org/employees/invite
PUT    /api/v1/org/employees/:id/permissions
PUT    /api/v1/org/employees/:id/status

GET    /api/v1/reports/sales?from=&to=&groupBy=
GET    /api/v1/reports/outstanding?agingBucket=
GET    /api/v1/reports/inventory
GET    /api/v1/reports/pl?from=&to=
```

### Response Envelope

All responses use a consistent envelope:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 142,
    "cursor": "abc123"
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "CREDIT_LIMIT_EXCEEDED",
    "message": "Customer credit limit of ₹50,000 would be exceeded",
    "details": { "currentUsage": 48000, "limit": 50000, "invoiceAmount": 5000 }
  }
}
```

### Pagination

All list endpoints support:
- `page` + `pageSize` for offset-based pagination (simple UI)
- `cursor` for cursor-based pagination (infinite scroll, mobile)
- Default page size: 25
- Max page size: 100

---

## 4. Permission Middleware

Every API route that modifies data or reads sensitive information runs through the permission middleware.

### Middleware Chain

```
Request
  → verifyClerkSession()           // Is user logged in?
  → resolveEmployee()              // Which employee is this?
  → resolveOrganization()          // Which org/branch?
  → checkPermission(perm, orgId)   // Does employee have this permission?
  → auditLog(action, before)       // Record intent (async)
  → routeHandler()                 // Execute business logic
  → auditLog(action, after)        // Record result (async)
  → Response
```

### Permission Resolution Order

```
1. EmployeePermission (per-user overrides) — highest priority
2. CustomRole permissions (role assigned to employee)
3. Default permissions for legacy role (OWNER/MANAGER/CASHIER)
4. Deny — if nothing grants access
```

### hasPermission() Function

```typescript
// lib/permissions.ts
async function hasPermission(
  employeeId: string,
  orgId: string,
  permission: PermissionKey
): Promise<boolean> {
  // 1. Check employee-level override
  const override = await db.employeePermission.findFirst({
    where: { employeeId, permission }
  });
  if (override) return override.granted;

  // 2. Check custom role
  const employee = await db.employee.findUnique({
    where: { id: employeeId },
    include: { customRole: true }
  });
  if (employee?.customRole?.permissions.includes(permission)) return true;

  // 3. Check legacy role defaults
  return DEFAULT_PERMISSIONS[employee.legacyRole]?.includes(permission) ?? false;
}
```

### Permission Registry (~50 keys)

```typescript
// lib/permissionKeys.ts
export const PERMISSIONS = {
  // Invoices
  INVOICES_VIEW:    'invoices:view',
  INVOICES_CREATE:  'invoices:create',
  INVOICES_EDIT:    'invoices:edit',
  INVOICES_CANCEL:  'invoices:cancel',
  INVOICES_DELETE:  'invoices:delete',

  // Customers
  CUSTOMERS_VIEW:   'customers:view',
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_EDIT:   'customers:edit',
  CUSTOMERS_DELETE: 'customers:delete',

  // Suppliers
  SUPPLIERS_VIEW:   'suppliers:view',
  SUPPLIERS_CREATE: 'suppliers:create',
  SUPPLIERS_EDIT:   'suppliers:edit',
  SUPPLIERS_DELETE: 'suppliers:delete',

  // Inventory
  INVENTORY_VIEW:   'inventory:view',
  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_ADJUST: 'inventory:adjust',
  INVENTORY_DELETE: 'inventory:delete',

  // Purchases
  PURCHASES_VIEW:   'purchases:view',
  PURCHASES_CREATE: 'purchases:create',
  PURCHASES_APPROVE:'purchases:approve',

  // Reports
  REPORTS_VIEW:     'reports:view',
  REPORTS_EXPORT:   'reports:export',

  // Financial (sensitive)
  REVENUE_VIEW:     'revenue:view',
  PROFIT_VIEW:      'profit:view',
  EXPENSES_VIEW:    'expenses:view',
  EXPENSES_CREATE:  'expenses:create',
  EXPENSES_MANAGE:  'expenses:manage',

  // Employees
  EMPLOYEES_INVITE: 'employees:invite',
  EMPLOYEES_MANAGE: 'employees:manage',
  EMPLOYEES_PERMISSIONS: 'employees:permissions',

  // Audit
  AUDIT_VIEW:       'audit:view',

  // Settings
  SETTINGS_MANAGE:  'settings:manage',
  ORG_MANAGE:       'org:manage',

  // Approvals
  APPROVALS_VIEW:   'approvals:view',
  APPROVALS_MANAGE: 'approvals:manage',
} as const;
```

---

## 5. Audit Log System

Every mutation in the system must create an audit log entry. This is done asynchronously so it never blocks the main response.

### Audit Log Schema

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  action      String   // "INVOICE_CREATED", "STOCK_ADJUSTED", "EMPLOYEE_DEACTIVATED"
  entityType  String   // "Invoice", "Product", "Employee"
  entityId    String
  oldValue    Json?    // Snapshot before change
  newValue    Json?    // Snapshot after change
  metadata    Json?    // Extra context (IP, user agent, etc.)
  employeeId  String
  employee    Employee @relation(fields: [employeeId], references: [id])
  orgId       String
  branchId    String?
  createdAt   DateTime @default(now())
}
```

### Audit Log Writer

```typescript
// lib/audit.ts
async function writeAuditLog(params: {
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: object;
  newValue?: object;
  employeeId: string;
  orgId: string;
}) {
  // Fire-and-forget — never awaited in the main request path
  db.auditLog.create({ data: params }).catch(console.error);
}
```

### Actions to Audit (minimum)

| Entity | Actions |
|---|---|
| Invoice | CREATED, EDITED, CANCELLED, DELETED, PAYMENT_RECORDED |
| Customer | CREATED, EDITED, DELETED, CREDIT_LIMIT_CHANGED |
| Product | CREATED, EDITED, DELETED |
| Stock | ADJUSTED, TRANSFERRED, AUDIT_COMPLETED |
| Employee | INVITED, ACTIVATED, DEACTIVATED, SUSPENDED, PERMISSIONS_CHANGED |
| Expense | CREATED, EDITED, DELETED |
| PurchaseOrder | CREATED, SENT, GRN_CREATED, COMPLETED |
| Settings | CHANGED |
| ApprovalRequest | CREATED, APPROVED, REJECTED |

---

## 6. Event System

All significant business events flow through a lightweight event bus. This decouples the main business logic from side effects (notifications, audit logs, webhooks).

```
Invoice created
  → event: INVOICE_CREATED
     → AuditLog.write()
     → Notification.create() if relevant
     → StockMovement.create() for each item
     → Customer.updateCreditUsed()
     → future: Webhook.deliver() if configured

Payment recorded
  → event: PAYMENT_RECORDED
     → AuditLog.write()
     → Invoice.updateStatus()
     → Customer.updateCreditUsed()
     → Notification.create() ("Payment of ₹5,000 received from Ramesh Traders")

Stock falls below reorder level
  → event: STOCK_BELOW_REORDER
     → Notification.create() for Inventory Manager
     → Dashboard alert shown
     → future: Auto-draft PO
```

Implementation: Start with direct function calls in-process. Migrate to a queue (BullMQ + Redis) when scale demands it.

---

## 7. Search Architecture

### Full-Text Search via PostgreSQL

No external search service needed at this scale. Use PostgreSQL's built-in `tsvector` with GIN indexes.

```sql
-- Add to customers table
ALTER TABLE customers ADD COLUMN search_vector tsvector;
CREATE INDEX idx_customers_search ON customers USING GIN(search_vector);

-- Update trigger
CREATE TRIGGER customers_search_update
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', name, phone, email);
```

### Global Search API

```
GET /api/v1/search?q=ramesh&types=customers,invoices,products
```

Returns:
```json
{
  "results": {
    "customers": [...],
    "invoices": [...],
    "products": [...]
  }
}
```

### Command Palette Integration

The existing `cmdk` library is wired to this search endpoint. Debounced after 200ms of no typing. Results rendered in grouped sections.

Additional command palette actions (no API call):
- "New Invoice" → navigate to /invoices/new
- "New Customer" → open customer creation modal
- "Record Payment" → open payment sheet (if invoice selected)

---

## 8. Background Jobs

### Cron Jobs Required

| Job | Schedule | Purpose |
|---|---|---|
| `overdue-detector` | Every day at 8 AM | Mark invoices past due date as OVERDUE |
| `reminder-sender` | Every day at 9 AM | Send WhatsApp/in-app reminders for overdue invoices |
| `recurring-invoice-generator` | Every day at 7 AM | Create invoices from RecurringInvoice templates |
| `recurring-expense-generator` | Every day at 7 AM | Record expenses from RecurringExpense templates |
| `low-stock-checker` | Every day at 7 AM | Check and alert for items below reorder level |
| `report-digest` | Weekly Monday 8 AM | Send weekly business digest to owner |

Implementation: Vercel Cron Jobs (free tier supports daily cron). Each cron calls a protected internal API route.

---

## 9. File Storage

### Current Problem
Currently stores images as base64 in PostgreSQL `text` columns. This is inefficient (3x size), slow, and not scalable.

### Migration Plan

1. Move to **Cloudflare R2** (free egress, S3-compatible API)
2. Upload from Next.js API route using `@aws-sdk/client-s3`
3. Store only the R2 object key in the database
4. Generate signed URLs on demand for display

```typescript
// File path pattern
`orgs/{orgId}/products/{productId}/image.jpg`
`orgs/{orgId}/receipts/{expenseId}/receipt.jpg`
`orgs/{orgId}/logos/business-logo.png`
```

---

## 10. State Management (Frontend)

### Current State
All data fetched via direct `fetch()` in `useEffect`. No caching, no deduplication, no optimistic updates.

### Recommendation: SWR

```typescript
// Example: Customer ledger
const { data, isLoading, mutate } = useSWR(
  `/api/v1/customers/${customerId}/ledger`,
  fetcher
);

// After recording payment:
await fetch('/api/v1/sales/invoices/:id/payments', { method: 'POST', ... });
mutate(); // Re-fetch ledger — simple and effective
```

SWR benefits for SmartBill:
- Automatic cache invalidation
- Background revalidation (data stays fresh)
- Deduplication of identical requests
- Works well with Next.js App Router

---

## 11. Module Dependency Graph

```
Auth ──────────────────────────────────→ All Modules
Organization ─────────────────────────→ RBAC, Employee, Reports
RBAC ─────────────────────────────────→ All protected routes
Employee ─────────────────────────────→ Sales, Purchase, Inventory, Audit
Audit ← ─────────────────────────────── All mutating modules

Sales ─────────────────────────────────→ Inventory (stock deduction)
Sales ─────────────────────────────────→ CRM (customer balance update)
Sales ─────────────────────────────────→ Notifications (payment received)
Sales ─────────────────────────────────→ Accounting (revenue entry)

Purchase ──────────────────────────────→ Inventory (GRN stock update)
Purchase ──────────────────────────────→ Accounting (payables entry)
Purchase ──────────────────────────────→ Notifications (PO status)

Inventory ─────────────────────────────→ Notifications (low stock alert)
Inventory ─────────────────────────────→ Audit (every movement)

Accounting ────────────────────────────→ Reports (P&L, cash flow)
CRM ────────────────────────────────────→ Sales (credit limit)
CRM ────────────────────────────────────→ Notifications (overdue)
Approval ──────────────────────────────→ Sales, Purchase, Inventory
Approval ──────────────────────────────→ Notifications
```

---

## 12. Technology Decisions

| Concern | Current | Recommended |
|---|---|---|
| Framework | Next.js 16, App Router | Keep — well-chosen |
| Database | Neon PostgreSQL via Prisma | Keep — good foundation |
| Auth | Clerk | Keep — handles multi-tenant well |
| ORM | Prisma 7 | Keep — migrate to `prisma migrate dev` |
| Migrations | `db push` (no history) | Switch to `prisma migrate dev` immediately |
| UI | shadcn/ui + Tailwind v4 | Keep |
| Charts | Recharts | Keep |
| Icons | Lucide React | Keep |
| Notifications | (none) | Build on Notification model |
| Search | (none) | PostgreSQL tsvector + cmdk |
| File storage | base64 in DB | Cloudflare R2 |
| State mgmt | raw fetch/useEffect | SWR |
| Background jobs | (none) | Vercel Cron Jobs |
| PDF generation | window.print() | @react-pdf/renderer |
| Email | (none) | Resend (free tier) |

---

*Document Version: 1.0 | Last Updated: June 2026*
*Cross-references: [DATABASE_EVOLUTION_PLAN.md](DATABASE_EVOLUTION_PLAN.md) | [SAAS_EVOLUTION_PLAN.md](SAAS_EVOLUTION_PLAN.md) | [MOBILE_APP_PLAN.md](MOBILE_APP_PLAN.md)*
