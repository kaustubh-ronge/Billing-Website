# SmartBill — Business Workflows

> Complete step-by-step workflows for every major business process, including edge cases.

---

## 1. Credit Sales Workflow

### The Core Problem
A shop owner sells goods on credit. The customer pays partially or in installments. The owner needs to track exactly what is owed, by whom, and since when — without a physical khata book.

### Happy Path

```
Step 1: Create Invoice
  Customer: Ramesh Traders
  Items: 50 bags of cement @ ₹400 = ₹20,000
  GST (18%): ₹3,600
  Grand Total: ₹23,600
  Payment at time of sale: ₹0
  Status: PENDING
  Outstanding: ₹23,600
  Due Date: 15 days from today

Step 2: First Partial Payment (Day 5)
  Customer visits and pays ₹10,000 via Cash
  Record Payment → Amount: ₹10,000, Method: CASH
  Outstanding: ₹13,600
  Status: PARTIAL

Step 3: Second Partial Payment (Day 12)
  Customer pays ₹8,600 via UPI
  Outstanding: ₹5,000
  Status: PARTIAL

Step 4: Final Settlement (Day 20)
  Customer pays remaining ₹5,000 via Bank Transfer
  Outstanding: ₹0
  Status: PAID ✅
```

### Edge Case: Overpayment

```
Grand Total: ₹10,000
Customer pays: ₹11,000 (extra ₹1,000)

Action: System prompts — "Amount exceeds balance due by ₹1,000. Create credit note?"
Options:
  A) Create credit note for ₹1,000 → Apply to next invoice
  B) Record as ₹10,000 and return ₹1,000 cash
  C) Record full ₹11,000 (overpayment noted on ledger)
```

### Edge Case: Credit Limit Breach

```
Customer credit limit: ₹50,000
Customer current outstanding: ₹48,000
New invoice total: ₹5,000
Credit used after this invoice: ₹53,000 (over limit)

Action: System shows warning — "This invoice will exceed Ramesh Traders' credit limit of ₹50,000"
Options:
  A) Require upfront payment to bring within limit
  B) Send for manager approval → approval granted → invoice saved
  C) Cancel invoice creation
```

### Edge Case: Overdue Invoice

```
Invoice due date: June 1
Today: July 1 (30 days overdue)

Automatic Actions:
  - Invoice flagged as OVERDUE in system
  - Appears in overdue aging report (30-60 day bucket)
  - Automated reminder triggered (WhatsApp/in-app)
  - Dashboard alert shows to owner/manager
```

### Edge Case: Disputed Invoice

```
Customer disputes item quantities or prices.

Action:
  1. Owner creates internal note: "Customer disputes 5 bags — under verification"
  2. Invoice status remains PENDING
  3. Resolution:
     A) Issue credit note for disputed amount
     B) Confirm original and send explanation to customer
     C) Edit invoice (draft only) or cancel and re-issue
```

### Edge Case: Write-Off

```
Customer: 90+ days overdue, ₹3,000 outstanding
Decision: Write off as bad debt

Action:
  1. Mark invoice as WRITTEN_OFF
  2. System records write-off expense entry
  3. Outstanding balance removed from receivables
  4. Audit log: "Invoice #INV-2025-042 written off by [Owner] — Reason: Bad debt"
  5. Customer risk level updated to HIGH
```

---

## 2. Purchase Management Workflow

### The Core Problem
A shop buys goods from a supplier. The stock must be updated when goods arrive, the supplier must be paid, and all of this must be linked to the original purchase order.

### Happy Path

```
Step 1: Raise Purchase Order
  Supplier: Shri Cement Depot
  Items: 200 bags cement @ ₹380/bag
  Expected Delivery: 5 days
  PO Status: SENT

Step 2: Supplier Delivers (Partial)
  Received: 150 bags (supplier couldn't deliver remaining 50)
  Create GRN (Goods Received Note):
    GRN-001: 150 bags @ ₹380 = ₹57,000
  Stock updated: +150 bags
  PO Status: PARTIALLY_RECEIVED

Step 3: Remaining Delivery
  Received: 50 bags
  Create GRN-002: 50 bags @ ₹380 = ₹19,000
  Stock updated: +50 bags
  PO Status: RECEIVED ✅

Step 4: Record Purchase Invoice
  Supplier invoice number: SUP/2025/089
  Invoice amount: ₹76,000 (matches GRN total)
  Due date: 30 days

Step 5: Pay Supplier
  Payment 1: ₹40,000 via Bank Transfer (Day 15)
  Payment 2: ₹36,000 via Cheque (Day 28)
  Supplier balance: ₹0 ✅
```

### Edge Case: Quality Rejection

```
GRN created for 200 bags.
Quality check: 20 bags damaged.

Action:
  1. Record rejection in GRN notes
  2. Raise debit note for 20 bags × ₹380 = ₹7,600
  3. Adjust stock: only 180 bags added
  4. Notify supplier → arrange replacement or credit
```

### Edge Case: Price Discrepancy

```
PO raised at ₹380/bag
Supplier invoices ₹395/bag

Action:
  System flags: "Supplier invoice price ₹395 differs from PO price ₹380 for Cement"
  Options:
    A) Accept new price → update PO, adjust payable
    B) Reject → contact supplier to rectify invoice
    C) Accept partial (for N items at new price)
```

---

## 3. Inventory Management Workflow

### Stock In (Purchase-linked)

```
Goods Received Note created → Stock automatically incremented
StockMovement record created:
  type: IN
  quantity: +150
  reason: "Purchase GRN-001"
  referenceType: GRN
  referenceId: [GRN ID]
  balanceBefore: 50
  balanceAfter: 200
  employee: [Staff name]
  timestamp: [now]
```

### Stock Out (Sale-linked)

```
Invoice created with 10 units of Product X → Stock automatically decremented
StockMovement record created:
  type: OUT
  quantity: -10
  reason: "Sale INV-2025-087"
  referenceType: INVOICE
  referenceId: [Invoice ID]
  balanceBefore: 200
  balanceAfter: 190
```

### Manual Stock Adjustment

```
Scenario: Physical count reveals 5 fewer bags than system shows

Step 1: Inventory staff initiates adjustment
  Product: Cement 50kg
  System count: 190
  Physical count: 185
  Difference: -5
  Reason: "Breakage during storage"

Step 2 (if approval required for adjustments):
  Request sent to manager/owner
  Manager reviews → Approves with note: "Verified physically"

Step 3: Adjustment recorded
  StockMovement: type: ADJUSTMENT, quantity: -5, reason: "Breakage - approved by [Manager]"
  Stock updated: 185
```

### Reorder Alert Workflow

```
Product: Paracetamol 500mg (pharmacy example)
Reorder level: 100 strips
Current stock: 98 strips

Triggers:
  1. Dashboard alert: "⚠️ Paracetamol 500mg — stock below reorder level"
  2. In-app notification to Inventory Manager
  3. Optional: Auto-generate draft PO with supplier's last price
```

---

## 4. Payment Workflows

### Cash Payment

```
Invoice: ₹5,450
Customer tenders: ₹6,000
Change: ₹550

Record:
  Amount: ₹5,450 (or ₹6,000 with change noted)
  Method: CASH
  Notes: "Customer gave ₹6,000, returned ₹550 change"
  Invoice status: PAID
```

### UPI Payment

```
Customer pays via Google Pay / PhonePe
Record:
  Amount: ₹5,450
  Method: UPI
  Reference: "UPI Ref: 423891029384"
  Invoice status: PAID
```

### Cheque Payment

```
Customer pays by cheque
Record:
  Amount: ₹50,000
  Method: CHEQUE
  Cheque Number: 004521
  Bank: HDFC Bank
  Cheque Date: June 20, 2025
  Cleared: false (pending)

Later — when cheque clears:
  Mark cheque as cleared
  Cleared Date: June 23, 2025
  Invoice status: PAID ✅

Edge case — cheque bounces:
  Mark as BOUNCED
  Invoice reverts to PENDING/PARTIAL
  Customer risk level increases
  Owner notified
```

### Split Payment

```
Invoice: ₹15,000
Customer pays:
  ₹5,000 Cash
  ₹5,000 UPI
  ₹5,000 Credit (remaining on credit)

Two payment records created + ₹5,000 outstanding remaining
Invoice status: PARTIAL
```

---

## 5. Expense Workflow

```
Step 1: Record Expense
  Title: Monthly shop rent
  Amount: ₹25,000
  Category: Rent
  Payment Method: Bank Transfer
  Date: June 1, 2025
  Recurring: Yes — Every 1st of month

Step 2: Recurring Setup
  Frequency: Monthly
  Start: June 1, 2025
  Auto-record: Yes (or remind to record manually)

Step 3: P&L Impact
  Revenue (June): ₹4,50,000
  COGS (June): ₹3,20,000
  Gross Profit: ₹1,30,000
  Expenses (June): ₹45,000 (Rent ₹25k + Electricity ₹8k + Salaries ₹12k)
  Net Profit: ₹85,000
```

---

## 6. Collection Workflow

### Automated Reminders

```
Day 0:   Invoice created, due in 15 days
Day 10:  Reminder: "Your invoice of ₹23,600 is due in 5 days"
Day 15:  Due date — status updates to OVERDUE
Day 16:  First overdue reminder sent (WhatsApp/in-app)
Day 30:  Second reminder (more urgent tone)
Day 45:  Third reminder — owner/manager notified to call personally
Day 90:  Write-off prompt shown to owner
```

### Manual Collection Follow-Up

```
Owner calls customer → logs in SmartBill:
  Collection Note: "Spoke to Ramesh, promised payment by June 25"
  Next follow-up date: June 26

System reminder fires on June 26:
  "Follow-up required: Ramesh Traders — ₹13,600 outstanding. Promised payment on June 25"
```

### Bulk Reminder Campaign

```
Owner filters: All customers overdue > 30 days
List shows: 12 customers, total ₹1,48,000 outstanding

One-click action: "Send WhatsApp to All 12"
  System generates individual messages with each customer's details
  Opens WhatsApp Web with each message pre-composed
  OR sends via WhatsApp Business API if integrated
```

---

## 7. Return & Refund Workflow

### Customer Return (Goods Back to Inventory)

```
Invoice: INV-2025-102 — 20 units Product X @ ₹500 = ₹10,000
Customer returns 5 units (defective)

Step 1: Create Credit Note
  Credit Note: CN-2025-007
  Linked to: INV-2025-102
  Amount: ₹2,500 (5 units × ₹500)
  Reason: "Defective items returned"

Step 2: Stock Update
  5 units returned to inventory (or marked as damaged)

Step 3: Settlement Options
  A) Apply credit note to next purchase
  B) Cash refund: ₹2,500 paid back to customer
  C) Partial: ₹1,500 cash + ₹1,000 credited to account

Step 4: Audit Trail
  "Credit note CN-2025-007 issued by [Employee] for INV-2025-102 — 5 units returned"
```

---

## 8. Approval Workflow

### Large Discount Approval

```
Billing operator creates invoice.
Applies 18% discount (threshold configured at 15%).

System: "Discounts above 15% require manager approval"
  
Action:
  1. Invoice saved as DRAFT
  2. Approval request created → sent to Manager Priya
  3. Priya receives in-app notification
  4. Priya reviews: sees invoice details, customer, discount amount impact
  5. Options:
     A) Approve: Invoice becomes PENDING, billing operator notified
     B) Reject with comment: "Max 10% for this customer"
     C) Modify: Change discount to 12% and approve

Timeline:
  If not reviewed in 2 hours → owner escalation alert
```

### Invoice Cancellation Approval

```
Billing operator tries to cancel INV-2025-087 (₹45,000, partially paid)

System: "Cancellation of invoices over ₹10,000 requires approval"

Approval flow:
  1. Cancellation request created with reason
  2. Manager/owner receives notification
  3. Reviews and approves/rejects
  4. If approved: invoice cancelled, stock refunded, audit trail updated
```

---

## 9. Employee Onboarding Workflow

```
Step 1: Owner invites employee
  Name: Suresh Kumar
  Email: suresh@acmetraders.com
  Role: (optional — can assign later)

Step 2: Invitation email sent
  Contains: Invitation link + setup instructions
  Expiry: 48 hours

Step 3: Employee accepts
  Creates Clerk account with email
  Linked to organization automatically

Step 4: Owner assigns permissions
  Option A: Assign predefined custom role ("Billing Operator")
    → Inherits: invoices:view, invoices:create, customers:view, customers:create
    → Denied: reports:view, profit:view, inventory:adjust

  Option B: Custom permissions
    → Toggle individual permissions from the permission matrix

Step 5: Employee logs in
  Sees only the modules they have access to
  Unauthorized menu items hidden (not just disabled)
```

---

## 10. Employee Offboarding Workflow

```
Step 1: Owner deactivates employee
  Reason: "Resigned - last day June 30"

Step 2: Immediate effects
  All active sessions revoked (Clerk token invalidated)
  Employee cannot log in
  Employee status: INACTIVE

Step 3: Data preserved
  All invoices created by employee remain intact
  All audit logs preserved with employee reference
  Historical reports unaffected

Step 4: Access transfer (optional)
  If employee was an approver → re-assign pending approvals to another manager
  If employee had pending tasks → notify owner

Step 5: Audit trail
  "Employee Suresh Kumar deactivated by [Owner] on June 30, 2025. Reason: Resigned"
```

---

## 11. Branch Operations Workflow (Future)

```
Organization: ABC Traders
Branches: Pune Main, Nashik Warehouse, Mumbai Retail

Scenario: Mumbai Retail running low on Product X (20 units)
Nashik Warehouse has 500 units

Step 1: Mumbai manager creates Stock Transfer Request
  From: Nashik Warehouse
  To: Mumbai Retail
  Product: Product X
  Quantity: 100 units

Step 2: Nashik Warehouse approves and dispatches
  Transfer OUT recorded in Nashik inventory
  In-transit status shown

Step 3: Mumbai Retail confirms receipt
  Transfer IN recorded in Mumbai inventory
  Stock updated on both sides

Step 4: Reports
  Nashik stock history: shows transfer OUT
  Mumbai stock history: shows transfer IN
  Organization-level: no net change (internal transfer)
```

---

## 12. End-of-Day Workflow (Cashier)

```
Cashier's daily routine:

Morning:
  Log in to SmartBill
  View: Today's pending invoices, scheduled deliveries
  Check: Cash balance (opening cash from yesterday's close)

During Day:
  Create invoices for each sale
  Record payments as they come in
  Note any credit sales separately

End of Day:
  Run "Daily Cash Summary":
    Opening Balance: ₹5,000
    Cash Sales Today: ₹32,000
    Cash Payments Received: ₹8,500
    Cash Paid Out (expenses): ₹2,000
    Closing Balance (expected): ₹43,500
    Physical Count: ₹43,200 (₹300 discrepancy)

  Report submitted to manager
  Manager reviews and notes discrepancy
  Cashier explains: ₹300 given as change (unrecorded)
  Resolved and logged
```

---

*Document Version: 1.0 | Last Updated: June 2026*
*Cross-references: [FEATURE_CATALOG.md](FEATURE_CATALOG.md) | [DATABASE_EVOLUTION_PLAN.md](DATABASE_EVOLUTION_PLAN.md) | [MODULE_ARCHITECTURE.md](MODULE_ARCHITECTURE.md)*
