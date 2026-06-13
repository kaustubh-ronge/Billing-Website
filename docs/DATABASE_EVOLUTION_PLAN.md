# SmartBill — Database Evolution Plan

> Complete Prisma schema evolution roadmap. Every new model, every field change, every migration phase.

---

## 1. Current Schema Summary

The existing schema has 7 models:

```
Shop           — Business profile + settings (current tenant root)
User           — Staff member (linked to Clerk)
Customer       — Client/buyer with soft delete
Product        — Product or service with inventory tracking
Invoice        — Sale with status tracking
InvoiceItem    — Line item on an invoice
Payment        — Payment transaction against an invoice
```

**Critical issues with current schema:**
- No supplier/purchase management models
- No stock movement history (only `stockCount` on Product)
- No expense tracking
- No organization/branch hierarchy
- No granular permissions (only a 3-value `Role` enum)
- No audit logging
- No notifications
- Invoice has no `dueDate` or `paymentTerms`
- Customer has no `creditLimit`
- Product has no `costPrice`, `sku`, `barcode`, `hsnCode`
- Payment has no cheque tracking fields or reconciliation flag

---

## 2. Migration Strategy

**Immediate change**: Switch from `prisma db push` to `prisma migrate dev`.

```bash
# One-time setup — create baseline migration from current pushed schema
npx prisma migrate dev --name "baseline_initial_schema"
```

Going forward, every schema change gets a named migration:
```bash
npx prisma migrate dev --name "add_due_date_to_invoice"
npx prisma migrate dev --name "add_organization_branch_models"
npx prisma migrate dev --name "add_supplier_purchase_models"
```

This gives a full, auditable history of every schema change.

---

## 3. Phase 1 Migrations — Foundation Fixes

### Migration: `add_invoice_fields`

Add missing critical fields to Invoice:

```prisma
model Invoice {
  // ... existing fields ...

  dueDate          DateTime?              // NEW: When payment is due
  paymentTerms     String?                // NEW: "Net-15", "Net-30", "Due on Receipt"
  notes            String?                // NEW: Customer-facing notes
  internalNotes    String?                // NEW: Internal staff notes (not on invoice PDF)
  isOverdue        Boolean  @default(false)  // NEW: Computed flag, set by cron job
}
```

### Migration: `add_customer_credit_fields`

```prisma
model Customer {
  // ... existing fields ...

  creditLimit      Float?                 // NEW: Max outstanding allowed (null = unlimited)
  creditUsed       Float    @default(0)   // NEW: Current outstanding (computed field, updated on invoice/payment)
  riskLevel        String?                // NEW: "LOW", "MEDIUM", "HIGH"
  tags             String[]               // NEW: Flexible tags array
}
```

### Migration: `add_product_business_fields`

```prisma
model Product {
  // ... existing fields ...

  sku              String?                // NEW: Stock Keeping Unit
  barcode          String?                // NEW: EAN/QR barcode
  costPrice        Float?                 // NEW: Purchase cost (for margin calculation)
  reorderLevel     Int?                   // NEW: Trigger reorder when stock falls to this
  reorderQuantity  Int?                   // NEW: How much to reorder
  hsnCode          String?                // NEW: GST HSN/SAC code
  brand            String?                // NEW: Brand name
}
```

### Migration: `add_payment_cheque_fields`

```prisma
model Payment {
  // ... existing fields ...

  referenceNumber  String?                // NEW: UPI ref / bank transfer ref
  chequeNumber     String?                // NEW: For cheque payments
  chequeDate       DateTime?              // NEW: Cheque date
  bankName         String?                // NEW: Issuing bank
  chequeCleared    Boolean?               // NEW: null=N/A, false=pending, true=cleared
  chequeClearedAt  DateTime?              // NEW: When cheque was marked cleared
  reconciled       Boolean  @default(false) // NEW: Matched to bank statement
}
```

---

## 4. Phase 1.5 Migrations — Accounts Receivable Engine

These migrations extend the Phase 1 invoice/customer fields to power the full AR system.
Run these before or alongside Phase 2 — they are independent of the org/permission system.

### Migration: `add_collection_status_to_invoice`

```prisma
model Invoice {
  // ... Phase 1 fields ...

  // AR / Collection fields
  collectionStatus      CollectionStatus  @default(NORMAL)
  lastReminderSentAt    DateTime?
  reminderCount         Int               @default(0)
  assignedToEmployeeId  String?           // nullable — references Employee after Phase 2
  promisedPaymentDate   DateTime?         // when customer promised to pay
  writeOffReason        String?

  collectionNotes       CollectionNote[]
  collectionActivities  CollectionActivity[]

  @@index([shopId, isOverdue, collectionStatus])
  @@index([shopId, dueDate, status])
}

enum CollectionStatus {
  NORMAL
  FOLLOWING_UP
  PROMISED
  DISPUTED
  ESCALATED
  WRITTEN_OFF
}
```

### Migration: `add_collection_note_activity`

```prisma
model CollectionNote {
  id              String             @id @default(cuid())
  content         String
  noteType        CollectionNoteType @default(NOTE)
  followUpDate    DateTime?

  invoiceId       String
  invoice         Invoice            @relation(fields: [invoiceId], references: [id])
  customerId      String             // Denormalized for customer history view
  createdByUserId String             // Uses User.id pre-Phase2, Employee.id post-Phase2
  orgId           String

  createdAt       DateTime           @default(now())

  @@index([invoiceId, createdAt])
  @@index([orgId, followUpDate])
  @@index([customerId, createdAt])
}

enum CollectionNoteType {
  NOTE
  PROMISE
  DISPUTE
  ESCALATION
  RESOLUTION
}

model CollectionActivity {
  id              String                 @id @default(cuid())
  type            CollectionActivityType
  channel         String?                // "EMAIL", "WHATSAPP", "IN_APP", "SYSTEM"
  details         String?
  isAutomated     Boolean                @default(false)

  invoiceId       String
  invoice         Invoice                @relation(fields: [invoiceId], references: [id])
  customerId      String
  createdByUserId String?                // null if automated cron
  orgId           String

  createdAt       DateTime               @default(now())

  @@index([invoiceId, createdAt])
  @@index([orgId, createdAt])
  @@index([customerId, createdAt])
}

enum CollectionActivityType {
  REMINDER_SENT
  EMAIL_SENT
  WHATSAPP_LINK_OPENED
  PAYMENT_RECORDED
  NOTE_ADDED
  STATUS_CHANGED
  INVOICE_ASSIGNED
  ESCALATED
  PROMISED
  DISPUTED
  WRITTEN_OFF
}
```

### Migration: `add_reminder_config_escalation_rules`

```prisma
model ReminderConfig {
  id                       String   @id @default(cuid())
  orgId                    String   @unique

  // Before due date
  remind7DaysBefore        Boolean  @default(true)
  remind3DaysBefore        Boolean  @default(true)
  remind1DayBefore         Boolean  @default(true)
  remindOnDueDate          Boolean  @default(true)

  // After due date (overdue)
  remind1DayOverdue        Boolean  @default(true)
  remind3DaysOverdue       Boolean  @default(true)
  remind7DaysOverdue       Boolean  @default(true)
  remind15DaysOverdue      Boolean  @default(true)
  remind30DaysOverdue      Boolean  @default(true)

  // Channels
  sendEmailToCustomer      Boolean  @default(false)
  sendEmailToOwner         Boolean  @default(true)
  sendEmailToAssignee      Boolean  @default(true)

  // Thresholds
  minimumAmountToRemind    Float    @default(0)

  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt
}

model EscalationRule {
  id                 String           @id @default(cuid())
  orgId              String
  daysOverdue        Int
  minimumAmount      Float            @default(0)
  action             EscalationAction
  notifyEmployeeId   String?          // references Employee after Phase 2
  addHighPriorityFlag Boolean         @default(false)
  isActive           Boolean          @default(true)

  createdAt          DateTime         @default(now())

  @@index([orgId, daysOverdue])
}

enum EscalationAction {
  NOTIFY_MANAGER
  NOTIFY_OWNER
  HIGH_PRIORITY_FLAG
  ALL
}
```

---

## 5. Phase 2 Migrations — Organization & Permissions

### Migration: `add_organization_branch_models`

```prisma
model Organization {
  id              String    @id @default(cuid())
  name            String
  plan            Plan      @default(FREE)
  logoBase64      String?   @db.Text
  taxId           String?
  phone           String?
  email           String?
  address         String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  branches        Branch[]
  departments     Department[]
  employees       Employee[]
  customRoles     CustomRole[]
  auditLogs       AuditLog[]
  notifications   Notification[]
  approvalRequests ApprovalRequest[]
}

model Branch {
  id              String    @id @default(cuid())
  name            String
  address         String?
  phone           String?
  isHeadquarters  Boolean   @default(false)
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])
  createdAt       DateTime  @default(now())

  employees       Employee[]
}

model Department {
  id              String    @id @default(cuid())
  name            String
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])

  employees       Employee[]
}
```

### Migration: `add_employee_model`

Replace/extend the existing `User` model:

```prisma
model Employee {
  id              String         @id @default(cuid())
  clerkId         String         @unique
  name            String
  email           String         @unique
  phone           String?
  status          EmployeeStatus @default(ACTIVE)
  joinDate        DateTime       @default(now())
  deactivatedAt   DateTime?
  deactivationReason String?

  // Organization
  orgId           String
  org             Organization   @relation(fields: [orgId], references: [id])
  branchId        String?
  branch          Branch?        @relation(fields: [branchId], references: [id])
  departmentId    String?
  department      Department?    @relation(fields: [departmentId], references: [id])

  // Role & Permissions
  legacyRole      LegacyRole     @default(CASHIER)  // Keep for backwards compat
  customRoleId    String?
  customRole      CustomRole?    @relation(fields: [customRoleId], references: [id])
  permissionOverrides EmployeePermission[]

  // Relations
  createdInvoices Invoice[]      @relation("InvoiceCreatedBy")
  auditLogs       AuditLog[]
  notifications   Notification[]
  createdAt       DateTime       @default(now())
}

enum EmployeeStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  INVITED
}

enum LegacyRole {
  OWNER
  MANAGER
  CASHIER
}
```

### Migration: `add_custom_role_permissions`

```prisma
model CustomRole {
  id              String    @id @default(cuid())
  name            String                         // "Billing Operator", "Inventory Manager"
  description     String?
  permissions     String[]                       // Array of permission keys
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])
  createdAt       DateTime  @default(now())

  employees       Employee[]

  @@unique([name, orgId])
}

model EmployeePermission {
  id              String    @id @default(cuid())
  employeeId      String
  employee        Employee  @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  permission      String                         // Permission key, e.g. "invoices:create"
  granted         Boolean                        // true = grant override, false = deny override

  @@unique([employeeId, permission])
}
```

### Migration: `add_audit_log`

```prisma
model AuditLog {
  id              String    @id @default(cuid())
  action          String                         // "INVOICE_CREATED", "STOCK_ADJUSTED"
  entityType      String                         // "Invoice", "Product", "Employee"
  entityId        String
  oldValue        Json?                          // State before change
  newValue        Json?                          // State after change
  metadata        Json?                          // IP address, user agent, etc.

  employeeId      String
  employee        Employee  @relation(fields: [employeeId], references: [id])
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])
  branchId        String?

  createdAt       DateTime  @default(now())

  @@index([orgId, createdAt])
  @@index([entityType, entityId])
}
```

### Migration: `add_notification_model`

```prisma
model Notification {
  id              String    @id @default(cuid())
  type            String                         // "PAYMENT_RECEIVED", "LOW_STOCK", "OVERDUE"
  title           String
  body            String
  isRead          Boolean   @default(false)
  entityType      String?                        // What this notification is about
  entityId        String?                        // ID of the entity
  actionUrl       String?                        // Where to navigate when clicked

  employeeId      String                         // Who receives this notification
  employee        Employee  @relation(fields: [employeeId], references: [id])
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])

  createdAt       DateTime  @default(now())

  @@index([employeeId, isRead])
  @@index([orgId, createdAt])
}
```

### Migration: `add_approval_request`

```prisma
model ApprovalRequest {
  id              String          @id @default(cuid())
  type            String                         // "INVOICE_CANCEL", "LARGE_DISCOUNT", "STOCK_ADJUST"
  status          ApprovalStatus  @default(PENDING)
  payload         Json                           // What is being approved (invoice ID, amount, etc.)
  reason          String?                        // Why approval is needed
  reviewComment   String?                        // Reviewer's note

  requestedById   String
  requestedBy     Employee        @relation("ApprovalRequester", fields: [requestedById], references: [id])
  reviewedById    String?
  reviewedBy      Employee?       @relation("ApprovalReviewer", fields: [reviewedById], references: [id])
  reviewedAt      DateTime?

  orgId           String
  org             Organization    @relation(fields: [orgId], references: [id])
  createdAt       DateTime        @default(now())

  @@index([orgId, status])
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}
```

---

## 5. Phase 3 Migrations — Purchase & Supplier Management

### Migration: `add_supplier_models`

```prisma
model Supplier {
  id              String    @id @default(cuid())
  name            String
  phone           String?
  email           String?
  address         String?
  gstNumber       String?
  paymentTerms    String?                        // "Net-30", "Immediate", etc.
  creditLimit     Float?                         // How much we can owe this supplier
  notes           String?
  isDeleted       Boolean   @default(false)

  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])
  branchId        String?

  purchaseOrders  PurchaseOrder[]
  payments        SupplierPayment[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model PurchaseOrder {
  id              String    @id @default(cuid())
  poNumber        String                         // Auto-generated: PO-2025-001
  status          POStatus  @default(DRAFT)
  orderDate       DateTime  @default(now())
  expectedDate    DateTime?
  totalAmount     Float     @default(0)
  notes           String?

  supplierId      String
  supplier        Supplier  @relation(fields: [supplierId], references: [id])
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])
  branchId        String?

  items           PurchaseItem[]
  grns            GoodsReceived[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

enum POStatus {
  DRAFT
  SENT
  PARTIALLY_RECEIVED
  RECEIVED
  CANCELLED
}

model PurchaseItem {
  id              String    @id @default(cuid())
  quantity        Int
  unitCost        Float
  receivedQty     Int       @default(0)

  productId       String
  product         Product   @relation(fields: [productId], references: [id])
  purchaseOrderId String
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
}

model GoodsReceived {
  id              String    @id @default(cuid())
  grnNumber       String                         // Auto-generated: GRN-2025-001
  receivedDate    DateTime  @default(now())
  notes           String?
  totalValue      Float     @default(0)

  purchaseOrderId String
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])

  items           GRNItem[]
  createdAt       DateTime  @default(now())
}

model GRNItem {
  id              String    @id @default(cuid())
  quantityReceived Int
  unitCost        Float
  isRejected      Boolean   @default(false)
  rejectionReason String?

  productId       String
  product         Product   @relation(fields: [productId], references: [id])
  grnId           String
  grn             GoodsReceived @relation(fields: [grnId], references: [id], onDelete: Cascade)
}

model SupplierPayment {
  id              String    @id @default(cuid())
  amount          Float
  paymentDate     DateTime  @default(now())
  paymentMethod   String
  referenceNumber String?
  notes           String?

  supplierId      String
  supplier        Supplier  @relation(fields: [supplierId], references: [id])
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])
  createdAt       DateTime  @default(now())
}
```

---

## 6. Phase 4 Migrations — Inventory Movements

### Migration: `add_stock_movement`

```prisma
model StockMovement {
  id              String          @id @default(cuid())
  type            MovementType
  quantity        Int                            // Positive for IN, negative for OUT
  reason          String?
  referenceType   String?                        // "INVOICE", "GRN", "ADJUSTMENT", "TRANSFER"
  referenceId     String?                        // ID of the referenced entity

  balanceBefore   Int                            // Stock count before this movement
  balanceAfter    Int                            // Stock count after this movement

  productId       String
  product         Product         @relation(fields: [productId], references: [id])
  employeeId      String
  employee        Employee        @relation(fields: [employeeId], references: [id])
  orgId           String
  org             Organization    @relation(fields: [orgId], references: [id])
  branchId        String?

  createdAt       DateTime        @default(now())

  @@index([productId, createdAt])
  @@index([orgId, createdAt])
}

enum MovementType {
  IN          // Stock received (purchase, manual add)
  OUT         // Stock sold (invoice) or consumed
  ADJUSTMENT  // Manual correction
  TRANSFER    // Move between branches (future)
  RETURN      // Customer return
  DAMAGE      // Written off as damaged
}
```

---

## 7. Phase 5 Migrations — Accounting & Expenses

### Migration: `add_expense_models`

```prisma
model ExpenseCategory {
  id              String    @id @default(cuid())
  name            String
  color           String    @default("#6B7280")   // For UI display
  icon            String?                          // Lucide icon name
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])

  expenses        Expense[]

  @@unique([name, orgId])
}

model Expense {
  id              String    @id @default(cuid())
  title           String
  amount          Float
  paymentMethod   String?
  expenseDate     DateTime  @default(now())
  notes           String?
  receiptUrl      String?                          // R2/S3 object key

  isRecurring     Boolean   @default(false)
  recurringPattern String?                         // "MONTHLY", "WEEKLY", "YEARLY"
  recurringDay    Int?                             // Day of month/week for recurring

  categoryId      String?
  category        ExpenseCategory? @relation(fields: [categoryId], references: [id])
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])
  branchId        String?
  createdByEmployeeId String?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

---

## 8. Phase 6 Migrations — CRM Extensions

### Migration: `add_customer_groups_credit_notes`

```prisma
model CustomerGroup {
  id              String    @id @default(cuid())
  name            String
  discountRate    Float     @default(0)           // Default discount % for this group
  creditLimit     Float?                          // Group-level credit limit override
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])

  customers       Customer[]

  @@unique([name, orgId])
}

model CreditNote {
  id              String     @id @default(cuid())
  creditNoteNum   String
  amount          Float
  reason          String
  status          CNStatus   @default(OPEN)
  appliedAmount   Float      @default(0)          // How much has been used

  customerId      String
  customer        Customer   @relation(fields: [customerId], references: [id])
  invoiceId       String?                         // Source invoice (if return-linked)
  invoice         Invoice?   @relation(fields: [invoiceId], references: [id])
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])

  createdAt       DateTime   @default(now())
}

enum CNStatus {
  OPEN          // Has remaining balance
  APPLIED       // Fully applied to invoices
  VOID          // Cancelled
}

model RecurringInvoice {
  id              String    @id @default(cuid())
  templateData    Json                            // Invoice template (customer, items, discount)
  frequency       String                          // "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"
  dayOfMonth      Int?                            // 1-28 (day of month for monthly)
  nextRunDate     DateTime
  lastRunDate     DateTime?
  isActive        Boolean   @default(true)

  customerId      String
  customer        Customer  @relation(fields: [customerId], references: [id])
  orgId           String
  org             Organization @relation(fields: [orgId], references: [id])

  createdAt       DateTime  @default(now())
}
```

---

## 9. Model Relationships Overview

```
Organization ──→ Branch (1:many)
Organization ──→ Department (1:many)
Organization ──→ Employee (1:many)
Organization ──→ CustomRole (1:many)

Employee ──→ CustomRole (many:1)
Employee ──→ EmployeePermission (1:many)

Invoice ──→ Employee (createdBy)
StockMovement ──→ Employee (who adjusted)
AuditLog ──→ Employee (who acted)

Customer ──→ CustomerGroup (many:1)
Customer ──→ CreditNote (1:many)
Customer ──→ RecurringInvoice (1:many)

Supplier ──→ PurchaseOrder (1:many)
Supplier ──→ SupplierPayment (1:many)
PurchaseOrder ──→ PurchaseItem (1:many)
PurchaseOrder ──→ GoodsReceived (1:many)
GoodsReceived ──→ GRNItem (1:many)
GRNItem ──→ StockMovement (1:1)

Product ──→ StockMovement (1:many)
Product ──→ PurchaseItem (1:many)
Product ──→ GRNItem (1:many)
```

---

## 10. Database Indexes to Add

Performance-critical indexes beyond what Prisma auto-creates:

```prisma
// Invoice lookups
@@index([shopId, status])
@@index([shopId, customerId])
@@index([shopId, issuedAt])
@@index([shopId, dueDate, isOverdue])

// Customer lookups
@@index([shopId, isDeleted])
@@index([orgId, creditUsed])  // For credit limit checks

// StockMovement lookups
@@index([productId, createdAt])
@@index([orgId, type, createdAt])

// AuditLog lookups
@@index([orgId, createdAt])
@@index([entityType, entityId])
@@index([employeeId, createdAt])

// Notification lookups
@@index([employeeId, isRead])

// PurchaseOrder lookups
@@index([orgId, status])
@@index([supplierId, status])
```

---

## 11. Migration Execution Order

| Phase | Migration Name | Key Additions |
|---|---|---|
| 0 | `baseline_initial_schema` | Capture current state |
| 1a | `add_invoice_fields` | dueDate, paymentTerms, notes |
| 1b | `add_customer_credit_fields` | creditLimit, creditUsed, tags, riskLevel |
| 1c | `add_product_business_fields` | sku, barcode, costPrice, hsnCode |
| 1d | `add_payment_cheque_fields` | chequeNumber, referenceNumber, reconciled |
| 1.5a | `add_collection_status_to_invoice` | collectionStatus, lastReminderSentAt, reminderCount |
| 1.5b | `add_collection_note_activity` | CollectionNote, CollectionActivity (with enums) |
| 1.5c | `add_reminder_config_escalation_rules` | ReminderConfig, EscalationRule |
| 2a | `add_organization_branch` | Organization, Branch, Department |
| 2b | `add_employee_model` | Employee (replacing User) |
| 2c | `add_custom_role_permissions` | CustomRole, EmployeePermission |
| 2d | `add_audit_log` | AuditLog |
| 2e | `add_notification_model` | Notification |
| 2f | `add_approval_request` | ApprovalRequest |
| 3a | `add_supplier_purchase` | Supplier, PurchaseOrder, PurchaseItem, GoodsReceived |
| 4a | `add_stock_movement` | StockMovement |
| 5a | `add_expense_models` | Expense, ExpenseCategory |
| 6a | `add_customer_groups_crn` | CustomerGroup, CreditNote, RecurringInvoice |

---

*Document Version: 1.0 | Last Updated: June 2026*
*Cross-references: [MODULE_ARCHITECTURE.md](MODULE_ARCHITECTURE.md) | [BUSINESS_WORKFLOWS.md](BUSINESS_WORKFLOWS.md) | [PRIORITY_ROADMAP.md](PRIORITY_ROADMAP.md)*
