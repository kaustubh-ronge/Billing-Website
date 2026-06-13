# SmartBill — Production Readiness Gap Report

> Security gaps, data integrity risks, critical missing features, performance bottlenecks,
> and deployment readiness assessment. Score: 0-100.

---

## Executive Summary

**Production Readiness Score: 31 / 100**

SmartBill has a solid, well-engineered invoicing core. The invoice creation, payment recording, and customer ledger workflows are carefully implemented with atomic transactions and concurrent-safe guards. However, the application is not production-safe for multi-user shops due to zero permission enforcement, has data integrity bugs that cause customer credit balances to drift, and loads entire invoice history into memory for every dashboard request — a pattern that will cause outages as the business grows.

| Category | Score | Max |
|---|---|---|
| Security & Authentication | 8 | 20 |
| Data Integrity | 7 | 20 |
| Critical Business Features | 6 | 20 |
| Performance & Scalability | 5 | 20 |
| Code Quality & Maintainability | 5 | 20 |
| **Total** | **31** | **100** |

---

## Category 1: Security & Authentication (8 / 20)

### PASS — Authentication Enforced (3/3)
- Every API route calls `getSessionUser()` before any operation
- Unauthenticated requests return 401
- All database queries filter by `shopId` (multi-tenant isolation)

### FAIL — No Permission System (0/5)
**Severity: CRITICAL**

The `role` field on the User model (OWNER/MANAGER/CASHIER) is stored but never read anywhere in the codebase. Every authenticated user has full access to every operation regardless of their role.

**Consequences:**
- A cashier can delete any invoice (permanent, with no audit trail)
- A cashier can change the business GST number in Settings
- A cashier can see all customer credit limits and profit data
- A new employee on day 1 has identical access to the owner

**Files:** No permission check exists in any file under `app/api/`

### FAIL — Client-Supplied Unit Prices Accepted (0/3)
**Severity: HIGH**

```js
// app/api/invoices/route.js
const unitPrice = parseFloat(item.unitPrice || prod.price);
```

The server accepts `unitPrice` from the request body. A staff member who calls the API directly (or via a browser console) can create an invoice at ₹0 for any product.

### FAIL — No Rate Limiting (0/3)
**Severity: MEDIUM**

All endpoints are rate-unlimited. Invoice creation could be spammed to exhaust stock counters or create thousands of records.

### PARTIAL — Error Messages Leak Internal Info (2/3 deducted)
**Severity: LOW**

Several API routes return `details: error.message` in 500 responses. This exposes raw Prisma error messages (including table names and constraint names) to any API consumer.

```js
// app/api/products/[id]/route.js
return NextResponse.json({ error: 'Failed to delete', details: error.message }, { status: 500 });
```

---

## Category 2: Data Integrity (7 / 20)

### PASS — Invoice Number Atomicity (3/3)
Atomic counter increment via `UPDATE Shop SET nextInvoiceNumber = nextInvoiceNumber + 1` prevents duplicate invoice numbers under concurrent requests.

### PASS — Payment Concurrent Safety (3/3)
Payment recording uses `WHERE amountPaid + amount <= grandTotal + 0.01` guard preventing overpayment.

### FAIL — creditUsed Drift on Invoice Delete (0/5)
**Severity: CRITICAL**

Deleting an unpaid invoice does not decrement the customer's `creditUsed`. The credit counter is permanently inflated. There is no reconciliation job to fix drift.

**Impact:** Customers who had invoices deleted may be permanently blocked from credit sales with no explanation. CREDIT_LIMIT_EXCEEDED will fire even though no actual outstanding debt exists.

**File:** `app/api/invoices/[id]/route.js` — DELETE handler

### FAIL — Stock Refund Uses Stale Read (0/4)
**Severity: MEDIUM**

Invoice delete reads product stock counts BEFORE the transaction begins, then writes the stale value + quantity back inside the transaction. Concurrent invoice deletions or sales happening between the read and write will corrupt stock counts.

```js
// Reads stockCount outside transaction, overwrites inside:
data: { stockCount: item.product.stockCount + item.quantity }
// Should be:
data: { stockCount: { increment: item.quantity } }
```

### FAIL — No Database Migration History (0/5)
**Severity: HIGH**

The project uses `prisma db push` instead of `prisma migrate dev`. This means:
- No migration history files exist
- No way to roll back a schema change
- If a `db push` fails midway, the schema is in an unknown state
- Cannot track when each schema change was made
- CI/CD deployment cannot safely run `prisma migrate deploy`

---

## Category 3: Critical Business Features (6 / 20)

### PASS — Invoice Creation Core (4/4)
Multi-step invoice creation with stock deduction, credit limit check, auto due-date, and atomic number increment is solid.

### FAIL — No Overdue Detection (0/4)
**Severity: CRITICAL**

There is no `isOverdue` flag, no cron job, and no aging report. Every business with any credit sales cannot answer "who owes me money?" without manually checking each invoice.

### FAIL — No GST Compliance Reporting (0/4)
**Severity: CRITICAL for GST-registered businesses**

Products have no `hsnCode` field. There is no GSTR-1 or GSTR-3B report. Any Indian business with revenue above ₹40 lakh must file GST returns. Currently they would need to export raw data and manually process it.

### FAIL — No Permission System (0/4)
Documented separately under Security. Included here because it's also a business requirement — the app cannot be sold to any business with employees until this is implemented.

### PARTIAL — Invoice Delete Instead of Cancel (2/4)
The only way to reverse an invoice is to hard-delete it. The CANCELLED and WRITTEN_OFF statuses documented in the evolution plan are absent. This prevents proper audit trails and historical reporting.

---

## Category 4: Performance & Scalability (5 / 20)

### FAIL — Reports Full Table Scan (0/8)
**Severity: HIGH**

The dashboard loads ALL invoices for the shop into Node.js memory for every page view:

```js
// app/api/reports/route.js
const invoices = await db.invoice.findMany({
  where: { shopId: user.shopId },
  include: { customer: true, items: { include: { product: true } } }
});
```

For a shop with 2 years of data (realistic: 3,000-5,000 invoices), this query loads:
- 5,000 Invoice rows
- 5,000 Customer rows
- 15,000 InvoiceItem rows
- 5,000 Product rows via include

The JSON response payload can exceed 5MB. The `groupBy` aggregations run in JavaScript, not SQL. This will time out on Vercel's 10-second function limit.

**Threshold:** Expect visible slowdown at ~500 invoices; timeouts at ~3,000 invoices.

### FAIL — No Pagination on Any Endpoint (0/6)
**Severity: HIGH**

All list endpoints (`/api/invoices`, `/api/customers`, `/api/products`) return ALL records with no LIMIT/OFFSET. The invoice list loads every invoice the shop has ever created.

### PASS — Database Indexes Exist (5/6)
The schema has compound indexes on `[shopId, status]` and `[shopId, dueDate]` for Invoice, which will make per-status queries fast. Customer and Product have indexes on `shopId`. This is good practice.

---

## Category 5: Code Quality & Maintainability (5 / 20)

### PASS — Consistent Error Handling Pattern (3/3)
All API routes use try/catch and return appropriate HTTP status codes (401, 404, 422, 500).

### FAIL — No Input Validation (Zod) (0/5)
**Severity: MEDIUM**

All API routes do manual parsing without schema validation:
```js
const { name, phone, email } = await req.json();
// No validation — name could be undefined, null, 10000 chars, etc.
```

Malformed or missing fields reach Prisma and cause 500 errors with raw database messages. A Zod schema would provide clear validation errors (400 Bad Request) instead.

### FAIL — No Database Migration Strategy (0/4)
Already counted under Data Integrity. Impacts code quality and CI/CD.

### PARTIAL — No API Tests (1/4)
No test files found anywhere in the codebase. The business-critical invoice creation logic (atomic transactions, credit checks, stock deduction) has no automated regression tests.

### PARTIAL — Inline Business Logic in API Routes (1/4)
All business logic lives directly in `route.js` files. There are no service layer functions (e.g., `InvoiceService.create()`). This makes testing individual business rules impossible without an HTTP server and makes the files long and hard to reason about.

---

## Top 10 Issues by Risk

| # | Issue | Risk | Fix Effort |
|---|---|---|---|
| 1 | Zero permission enforcement (any user can do anything) | CRITICAL | 3-4 weeks |
| 2 | creditUsed drift on invoice delete | CRITICAL | 2 hours |
| 3 | Reports full table scan (timeout at scale) | HIGH | 1 week |
| 4 | No CANCELLED invoice status (hard delete only) | HIGH | 2 days |
| 5 | No migration history (no rollback) | HIGH | 1 day |
| 6 | Client-supplied unit prices accepted by server | HIGH | 1 hour |
| 7 | No pagination on list endpoints | HIGH | 1 week |
| 8 | Stale stock read in delete transaction | MEDIUM | 30 min |
| 9 | Internal errors (Prisma messages) exposed to clients | MEDIUM | 1 day |
| 10 | No input validation (Zod) | MEDIUM | 3-5 days |

---

## Deployment Readiness Checklist

| Check | Status |
|---|---|
| Authentication on all routes | ✅ Done |
| Multi-tenant data isolation (shopId filter) | ✅ Done |
| Atomic concurrent operations | ✅ Done |
| Permission enforcement | ❌ Not done |
| Input validation | ❌ Not done |
| Rate limiting | ❌ Not done |
| Error message sanitization | ❌ Not done |
| Database migration files | ❌ Not done |
| Server-side pagination | ❌ Not done |
| Environment variable documentation | ❌ No .env.example |
| Basic test coverage | ❌ No tests |
| Performance testing / load testing | ❌ Not done |

**Deployment verdict:** Suitable for a single-user shop owner who is the sole employee. Not suitable for any multi-employee business without permission enforcement. Will degrade noticeably past ~500 invoices without pagination and aggregated reporting.

---

## Scoring Detail

| Category | Score | Notes |
|---|---|---|
| Security & Authentication | 8 / 20 | Auth done; permissions 0; client prices accepted; raw errors exposed |
| Data Integrity | 7 / 20 | Atomic ops good; creditUsed drift bug; stale stock read; no migrations |
| Critical Business Features | 6 / 20 | Invoice core done; no overdue; no GST; no cancel |
| Performance & Scalability | 5 / 20 | Indexes good; full table scan; no pagination |
| Code Quality & Maintainability | 5 / 20 | Consistent patterns; no tests; no Zod; inline business logic |
| **Total** | **31 / 100** | |

*Generated: June 2026*
