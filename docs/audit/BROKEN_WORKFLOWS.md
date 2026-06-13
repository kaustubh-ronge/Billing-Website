# SmartBill — Broken Workflows

> Workflows that exist in the code but have issues that prevent reliable end-to-end completion.

---

## BW-01: Invoice Delete Instead of Cancel

**Severity:** HIGH
**Status:** 🔴 Broken Workflow

**What exists:**
- `DELETE /api/invoices/{id}` — hard deletes the invoice and cascades to payments/items
- No cancel endpoint; no cancel status

**The Problem:**
1. Deleting a PAID or PARTIAL invoice removes payment records permanently
2. There is no audit trail of why the invoice was deleted
3. Stock is refunded on delete, but stock refund uses `item.product.stockCount + item.quantity` — this reads the product's CURRENT stock from the `invoice.items` include, not a fresh DB read. If stock was modified after invoice creation, the refund amount could be wrong.
4. The `creditUsed` on the Customer is NOT decremented when an invoice is deleted — it is only decremented when payments are recorded. Deleting an unpaid invoice leaves the customer's `creditUsed` inflated.

**Evidence:**
```js
// app/api/invoices/[id]/route.js:62-76
for (const item of invoice.items) {
  if (item.product.trackInventory && item.product.stockCount !== null) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stockCount: item.product.stockCount + item.quantity } // BUG: stale read
    });
  }
}
```

**Impact:** Customer creditUsed becomes permanently inflated after unpaid invoice deletion. Customer may be incorrectly blocked from future credit sales.

**Fix:** (1) Add cancel workflow with `status = CANCELLED`. (2) Decrement `creditUsed` by outstanding amount on delete. (3) Use atomic `increment` instead of stale read for stock refund.

---

## BW-02: Payment Overpayment Prevention Mismatch

**Severity:** MEDIUM
**Status:** ⚠️ Logic Inconsistency

**What exists:**
- The payment API correctly prevents overpayment server-side
- The payment dialog UI sets `max={selectedInvoice.grandTotal - selectedInvoice.amountPaid}` on the input

**The Problem:**
The payment dialog's `handleRecordPayment` validates `amt > balance` client-side and shows an error. However, the UI also only shows the Record Payment button when `bal > 0`. This means if two browser tabs simultaneously record payments that together exceed the balance, one will fail at the server but the user will see a misleading generic error instead of "Payment of ₹X exceeds remaining balance of ₹Y."

The actual server response for this case has `error.code === 'OVER_PAYMENT'` and `error.remaining` — but the UI at `app/(app)/invoices/page.jsx:130-134` does not read `error.code` and shows a generic `err.error` message.

**Evidence:**
```js
// app/(app)/invoices/page.jsx:130-134
if (res.ok) {
  toast.success('Payment recorded successfully!');
} else {
  const err = await res.json();
  toast.error(err.error || 'Failed to record payment'); // does not use err.remaining
}
```

**Impact:** Minor UX issue — user sees error message but without specific amount. Not a data corruption issue.

**Fix:** Parse `err.code === 'OVER_PAYMENT'` and show `toast.error(\`Max you can record: ₹\${err.remaining}\`)`

---

## BW-03: Customer creditUsed Drift

**Severity:** HIGH
**Status:** 🔴 Data Integrity Issue

**What exists:**
- `creditUsed` incremented on invoice creation (outstanding amount)
- `creditUsed` decremented on payment recording

**The Problem:**
1. **Invoice deletion bug (from BW-01):** Deleting an unpaid invoice does NOT decrement `creditUsed`. The outstanding debt is erased but the credit counter remains inflated.
2. **No reconciliation:** There is no scheduled job or endpoint to recompute `creditUsed` from actual invoice data. A bug, manual DB edit, or sequence of edge cases will leave `creditUsed` permanently wrong.
3. **Overpayment scenario:** If a payment of exactly `grandTotal` is recorded but `amountPaid` was already `> 0`, the `GREATEST(0, creditUsed - parsedAmount)` call may subtract more than the actual outstanding.

**Evidence:**
```js
// app/api/invoices/[id]/route.js (DELETE handler)
// creditUsed is NEVER adjusted here — only stock is refunded
await db.$transaction(async (tx) => {
  // refund stock...
  await tx.invoice.delete({ where: { id } });
  // creditUsed NOT touched — BUG
});
```

**Impact:** Customer credit limit enforcement becomes unreliable. A customer who had an invoice deleted may be permanently blocked from new credit sales due to inflated `creditUsed`.

**Fix:** In the DELETE handler, compute `outstanding = invoice.grandTotal - invoice.amountPaid` and decrement `creditUsed` by that amount (clamped to 0).

---

## BW-04: Stock Refund on Delete Uses Stale Data

**Severity:** MEDIUM
**Status:** 🔴 Race Condition Risk

**What exists:**
- Invoice delete refunds stock: reads `item.product.stockCount` from the `invoice.items` include
- Stock is refunded by `item.product.stockCount + item.quantity`

**The Problem:**
The `invoice.items` are loaded in a separate query BEFORE the transaction begins. Between the read and the transaction, another process might have changed `stockCount`. The refund then applies the wrong base value.

**Evidence:**
```js
// app/api/invoices/[id]/route.js:52-55
const invoice = await db.invoice.findFirst({ // reads outside tx
  where: { id, shopId: user.shopId },
  include: { items: { include: { product: true } } }
});
// ...
await db.$transaction(async (tx) => {
  for (const item of invoice.items) { // uses stale product.stockCount
    await tx.product.update({
      data: { stockCount: item.product.stockCount + item.quantity } // overwrite!
    });
  }
```

**Impact:** In a concurrent environment (unlikely but possible), the stock count could be set to the wrong value instead of incremented.

**Fix:** Use atomic increment inside the transaction: `data: { stockCount: { increment: item.quantity } }`

---

## BW-05: Reports API Full Table Scan

**Severity:** MEDIUM
**Status:** ⚠️ Performance Broken at Scale

**What exists:**
- `GET /api/reports` fetches ALL invoices for the shop with full includes (customer, items with product)
- Processes them in-memory in JavaScript

**The Problem:**
```js
// app/api/reports/route.js:24-33
const invoices = await db.invoice.findMany({
  where: { shopId: user.shopId },
  include: {
    customer: true,
    items: { include: { product: true } }
  },
  orderBy: { issuedAt: 'asc' }
});
```

For a shop with 5,000 invoices and 3 items each, this loads 15,000 InvoiceItem rows + 5,000 Customer rows + 5,000 Invoice rows in a single query. The response payload could be 5-10MB and take several seconds.

**Impact:** Dashboard will become unusably slow as the business grows. This is a confirmed performance time-bomb.

**Fix:** Use SQL aggregation queries instead of in-memory processing. Pre-aggregate metrics in the database.

---

## BW-06: No CSRF Protection on API Routes

**Severity:** HIGH
**Status:** 🔴 Security Risk

**What exists:**
- All API routes only check Clerk JWT (via `getSessionUser()`)

**The Problem:**
The API routes rely on Clerk cookie-based sessions. A malicious website could trigger state-changing requests (invoice creation, deletion) from a logged-in user's browser if the API does not verify the request origin.

Next.js App Router provides some CSRF protection via same-site cookie settings, but the application does not explicitly add CSRF tokens or check the `Origin` header.

**Impact:** Potential for CSRF attacks if Clerk's same-site cookie settings are not strict.

**Fix:** Verify `Origin` header or use Clerk's built-in CSRF protection mechanisms.

---

## BW-07: Invoice Creation Allows Prices Not in DB

**Severity:** LOW
**Status:** ⚠️ Partial Validation Gap

**What exists:**
- Server validates products belong to the shop
- Server uses product's taxRate from DB (not client)

**The Problem:**
```js
// app/api/invoices/route.js:113-114
const unitPrice = parseFloat(item.unitPrice || prod.price);
```

The server accepts `item.unitPrice` from the client and uses it if provided. This means a user who directly calls the API can set any unit price for any product. The invoice amount will be computed using the client-supplied price.

**Impact:** A technically sophisticated employee could create invoices at artificially low prices to benefit customers or commit fraud. This is a real risk for businesses with multiple staff.

**Fix:** Remove `item.unitPrice` from client input; always use `prod.price` from DB. Or add a separate "allowed price override" permission check.

---

## BW-08: Product Hard Delete With Invoice References

**Severity:** HIGH
**Status:** 🔴 Referential Integrity Risk

**What exists:**
- `DELETE /api/products/{id}` — hard deletes the product

**The Problem:**
InvoiceItem has a foreign key to Product (`productId String`). Deleting a product that has been invoiced will fail with a Prisma foreign key constraint error. The error is caught and returned as a 500 Internal Server Error with `details: error.message` — which exposes the raw Prisma error to clients.

The InvoiceItem relationship uses no cascade rule (not `onDelete: Cascade`), so if the constraint fails, the product is not deleted but the user sees a cryptic database error.

**Evidence:**
```js
// app/api/products/[id]/route.js:53-60
await db.product.delete({ where: { id } }); // will throw FK constraint error
// error caught as generic 500
```

**Impact:** Products referenced in historical invoices cannot be deleted. User sees a raw database error. No graceful soft-delete or "archive" product flow.

**Fix:** Add `isDeleted` soft-delete flag on Product (similar to Customer). Return a clear error message: "Cannot delete a product that has been used in invoices."

---

## BW-09: No Session Invalidation on Shop Change

**Severity:** LOW
**Status:** ⚠️ Edge Case

**What exists:**
- `getSessionUser()` fetches User from DB with shop included
- This runs on every request

**The Problem:**
If a user's `shopId` is changed directly in the database (e.g., by a DB admin), their next request will correctly pick up the new shop. However, there is no mechanism to force-expire sessions or clear any server-side cache if a user is moved between shops or deactivated.

**Impact:** Minor for a single-shop product. Becomes important when multi-org / Employee deactivation is implemented.

---

## Summary

| ID | Severity | Status | Description |
|---|---|---|---|
| BW-01 | HIGH | 🔴 | Delete instead of cancel; creditUsed not updated |
| BW-02 | MEDIUM | ⚠️ | Overpayment error message lacks specifics |
| BW-03 | HIGH | 🔴 | creditUsed drifts after invoice delete |
| BW-04 | MEDIUM | 🔴 | Stale product stock read in delete transaction |
| BW-05 | MEDIUM | ⚠️ | Reports full table scan; will break at scale |
| BW-06 | HIGH | 🔴 | No explicit CSRF protection |
| BW-07 | LOW | ⚠️ | Client-supplied unit prices accepted by server |
| BW-08 | HIGH | 🔴 | Product hard delete exposes FK error to client |
| BW-09 | LOW | ⚠️ | No session invalidation mechanism |

*Generated: June 2026*
