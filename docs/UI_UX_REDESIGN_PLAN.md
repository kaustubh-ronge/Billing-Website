# SmartBill — UI/UX Redesign Plan

> A complete transformation from template-grade to production SaaS — inspired by Zoho Books, Vyapar, and modern B2B SaaS design.

---

## 1. Design Philosophy

### From Template to Platform

The current UI is functional but reads as a developer template. The goal is to make SmartBill feel like software that has been designed for the people who use it — not the people who built it.

**Principles:**
- **Density without clutter**: Business users work with data all day. Pack information meaningfully, not sparsely.
- **Permission-aware UI**: If a user can't do something, don't show the option. Don't show a disabled button — show nothing.
- **Speed over animation**: Reduce perceived latency. Optimistic updates everywhere. Framer Motion animations only for meaningful transitions, not decoration.
- **Mobile-first**: A shop owner in a Nashik hardware store runs their business from a Redmi phone. Every screen must work at 375px.
- **India-first**: ₹ currency, GST labels, WhatsApp as a communication channel, phone numbers as primary identifiers.

---

## 2. Navigation Redesign

### Current State
Top-nav header with 5 links. Works on desktop, collapses awkwardly on mobile. No hierarchy.

### Redesigned Navigation

**Desktop: Persistent Left Sidebar**

```
┌──────────┬─────────────────────────────────────┐
│          │  Header: Search bar + Notifications  │
│ SIDEBAR  │  + User menu                         │
│          ├─────────────────────────────────────┤
│  Logo    │                                     │
│          │                                     │
│ ─────    │       PAGE CONTENT                  │
│ Dashboard│                                     │
│          │                                     │
│ SALES    │                                     │
│  Invoices│                                     │
│  Payments│                                     │
│          │                                     │
│ CUSTOMERS│                                     │
│  All     │                                     │
│  Groups  │                                     │
│  Ledger  │                                     │
│          │                                     │
│ PURCHASE │                                     │
│  Suppliers│                                    │
│  Orders  │                                     │
│  GRNs    │                                     │
│          │                                     │
│ INVENTORY│                                     │
│  Products│                                     │
│  Stock   │                                     │
│  Audit   │                                     │
│          │                                     │
│ ACCOUNTS │                                     │
│  Expenses│                                     │
│  P&L     │                                     │
│  Cash Flow│                                    │
│          │                                     │
│ REPORTS  │                                     │
│          │                                     │
│ ─────    │                                     │
│ TEAM     │                                     │
│  Employees│                                    │
│  Roles   │                                     │
│  Activity│                                     │
│  Approvals│                                    │
│          │                                     │
│ ─────    │                                     │
│ Settings │                                     │
└──────────┴─────────────────────────────────────┘
```

The sidebar component is **already built** in `components/ui/Sidebar.jsx` — it just needs to be wired into the layout.

**Sidebar States:**
- Expanded (220px): Full labels visible — default on desktop
- Collapsed (60px): Icon-only — user can toggle
- Hidden: Mobile — replaced by bottom nav

**Mobile: Bottom Navigation**

```
┌─────────────────────────────────┐
│                                 │
│         PAGE CONTENT            │
│                                 │
├──────┬──────┬──────┬──────┬─────┤
│ Home │Bills │Cust. │Stock │ More │
│  🏠  │  📄  │  👥  │  📦  │  ⋮  │
└──────┴──────┴──────┴──────┴─────┘
```

"More" opens a bottom sheet with full navigation tree.

---

## 3. Dashboard Redesign

### Current State
4 metric cards + 2 charts + 2 lists. Functional but static. Feels like a generic analytics template.

### Redesigned Dashboard

**Layout: Responsive Widget Grid**

```
Row 1 — Key Metrics (5 cards, scrollable on mobile)
┌────────────┬────────────┬────────────┬────────────┬────────────┐
│ Today's    │ Month      │ Total      │ Cash       │ Pending    │
│ Revenue    │ Revenue    │ Outstanding│ Balance    │ Approvals  │
│ ₹32,000   │ ₹4.2L     │ ₹1.8L     │ ₹45,000   │ 3 items    │
│ ↑12% today│ ↑8% MoM   │ 23 invoices│            │            │
└────────────┴────────────┴────────────┴────────────┴────────────┘

Row 2 — Charts
┌─────────────────────────┬─────────────────────────┐
│   30-Day Sales Trend    │   Collection Efficiency  │
│   (Area Chart)          │   Collected vs. Billed   │
│                         │   (Gauge/Donut Chart)     │
└─────────────────────────┴─────────────────────────┘

Row 3 — Actionable Lists
┌─────────────────────────┬─────────────────────────┐
│  Top Overdue Accounts   │  Low Stock Alerts        │
│  (with WhatsApp button) │  (with reorder button)   │
│                         │                          │
│  Ramesh Traders  ₹32k  │  Cement 50kg → 12 bags  │
│  Suresh Bros     ₹18k  │  Rice 1kg → 5 bags      │
│  ABC Hardware    ₹14k  │  Sugar → 3 bags          │
└─────────────────────────┴─────────────────────────┘

Row 4 — Team & Activity (visible to Owner/Manager)
┌─────────────────────────┬─────────────────────────┐
│  Today's Team Activity  │  Best Performing Products│
│  Ravi: 12 invoices      │  (by revenue this month) │
│  Suresh: 8 invoices     │                          │
│  Priya: 3 payments      │                          │
└─────────────────────────┴─────────────────────────┘
```

**Permission-aware widgets**: Cashier sees sales widgets. Owner sees all. Inventory manager sees stock widgets. Financial widgets (Profit, Cash Balance) hidden unless user has `revenue:view` or `profit:view`.

---

## 4. Command Palette (Cmd+K)

The `cmdk` library is already installed. Wire it to:

### Quick Actions

```
> New Invoice           → navigate to /invoices/new
> New Customer          → open customer creation sheet
> New Expense           → open expense creation sheet
> Record Payment        → open payment recording sheet (if invoice in context)
> New Purchase Order    → navigate to /purchase/orders/new
> Adjust Stock          → open stock adjustment modal
```

### Global Search

```
> ra[mesh]              → 🔍 Customers: Ramesh Traders, Ramesh Kumar
                        → 📄 Invoices: INV-2025-087 (Ramesh Traders)
                        → 📦 Products: Ramesh Rice Brand

> INV-2025-08           → 📄 INV-2025-081, INV-2025-082 ... INV-2025-089
```

### Keyboard Trigger
- `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux)
- `/` when focused on a list page

---

## 5. Notification Center

### Bell Icon in Header

Shows unread count badge. Click opens a slide-over panel from the right.

```
┌─────────────────────────────┐
│ Notifications          ✕    │
│ ─────────────────────────── │
│ UNREAD (3)                  │
│                             │
│ 💰 Payment Received         │
│ Ramesh Traders paid ₹8,000  │
│ Invoice INV-2025-087        │
│ 2 minutes ago               │
│                             │
│ ⚠️ Overdue Invoice           │
│ ABC Hardware — ₹32,000      │
│ 45 days overdue             │
│ [Send Reminder]             │
│ 1 hour ago                  │
│                             │
│ 📦 Low Stock Alert          │
│ Cement 50kg — 12 bags       │
│ Reorder level: 50 bags      │
│ [Create PO]                 │
│ 2 hours ago                 │
│ ─────────────────────────── │
│ EARLIER                     │
│ ✅ Approval Granted          │
│ Invoice cancelled — approved│
│ Yesterday                   │
└─────────────────────────────┘
```

### Notification Types

| Type | Icon | Color | Who Sees |
|---|---|---|---|
| Payment received | 💰 | Green | Owner, Accountant |
| Overdue invoice | ⚠️ | Amber | Owner, Manager |
| Low stock | 📦 | Orange | Inventory Manager, Owner |
| Approval pending | 🔔 | Blue | Manager, Owner |
| Approval result | ✅/❌ | Green/Red | Requestor |
| Employee action | 👤 | Gray | Owner, Manager |
| System alert | ℹ️ | Blue | All |

---

## 6. Data Tables Redesign

### Current State
Basic table with inline actions. No pagination. No bulk actions. No column control.

### Redesigned Table Pattern

```
┌─ Toolbar ─────────────────────────────────────────────────────┐
│ [Search...] [Status ▾] [Date Range ▾] [Filter ▾]  [Export ▾]  │
│                                         X 2 selected [Delete] │
└───────────────────────────────────────────────────────────────┘
┌─ Table ───────────────────────────────────────────────────────┐
│ ☐ │ Invoice # │ Customer │ Date │ Status │ Total │ Paid │ Due  │
│ ─ │ ───────── │ ──────── │ ──── │ ────── │ ───── │ ──── │ ─── │
│ ☑ │ INV-087   │ Ramesh   │ Jun 1│ PARTIAL│ 23,600│8,000 │15,600│
│ ☐ │ INV-088   │ ABC Hard.│ Jun 2│ PENDING│ 45,000│  0   │45,000│
│ ☐ │ INV-089   │ Suresh   │ Jun 3│ PAID   │  5,000│5,000 │   0  │
└───────────────────────────────────────────────────────────────┘
┌─ Pagination ─────────────────────────────────────────────────┐
│ Showing 1–25 of 142   [<] [1] [2] [3] ... [6] [>]   25/page  │
└───────────────────────────────────────────────────────────────┘
```

### Table Features
- **Column visibility toggle**: Show/hide columns via a popover
- **Sticky header**: Header stays fixed when scrolling long lists
- **Row click**: Opens detail view (slide-over or navigate)
- **Bulk select**: Checkbox per row + header checkbox for select all
- **Bulk actions**: Delete, Export, Send Reminder (depends on context)
- **Export**: CSV, Excel, PDF — respects current filter
- **Sort**: Click column header to sort ascending/descending

---

## 7. Forms & Inputs

### Sheet (Slide-over) Pattern for All Forms

Replace modal dialogs with `Sheet` slide-overs for all complex forms. Modals are for simple confirmations only.

```
Sheet usage:
  - Create/Edit Customer
  - Record Payment
  - Add Expense
  - Stock Adjustment
  - Employee Permission Editor
  - Notification Detail

Modal usage (AlertDialog):
  - Delete confirmation
  - Deactivate employee
  - Cancel invoice
```

### Invoice Creation (Keep Multi-step Wizard)

The existing multi-step wizard (`/invoices/new`) is well-designed. Enhancements:

```
Step 1: Customer
  - Keep existing search
  - Add: Show customer's current outstanding balance + credit limit
  - Warning if credit limit will be exceeded

Step 2: Items
  - Add: Barcode scanner button (mobile: uses camera)
  - Add: Show cost price and margin to Owner (hidden for Cashier)
  - Add: Recent items shortcut (last 5 products for this customer)

Step 3: Discount & Payment
  - Add: Due date picker
  - Add: Payment terms selector (Net-7, Net-15, Net-30)
  - Add: Split payment option (multiple methods)
  - If discount > threshold: show "Requires approval" message

Step 4: Review
  - Add: Invoice preview rendering
  - Add: Send to customer option (WhatsApp / Email)
```

---

## 8. Customer Page Redesign

### Keep: Dual-panel layout (list + ledger)

This is a strong pattern — keep it.

### Enhance:

```
Left Panel (Customer List):
  - Add: Customer risk badge (🔴 High / 🟡 Medium / 🟢 Low)
  - Add: Credit utilization bar (visual %)
  - Add: Last activity date
  - Add: Tags display
  - Add: Group indicator

Right Panel (Ledger + Details):
  TABS: Ledger | Payments | Details | Notes | Activity

  Ledger Tab:
    - Running balance column (cumulative)
    - Color-coded rows (overdue = red background)
    - Aging buckets summary at top

  Details Tab:
    - Credit limit settings
    - Risk level
    - Tags management
    - Customer group assignment

  Notes Tab:
    - Time-stamped notes log
    - Add note with employee attribution

  Activity Tab:
    - Audit trail for this customer
    - "Who edited what" timeline
```

---

## 9. Dark Mode

`next-themes` is already installed. Add UI toggle:

**Location**: Header right side, before notification bell

**Button**: Sun/Moon icon toggle

**Implementation**:
```typescript
// In HeaderClient.jsx
import { useTheme } from "next-themes";
const { theme, setTheme } = useTheme();

<Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</Button>
```

Ensure all new UI components use semantic color tokens (bg-background, text-foreground, border-border) not hardcoded gray values.

---

## 10. Permission-Aware UI

### Rule: Never Show What Users Can't Access

```typescript
// components/PermissionGate.tsx
function PermissionGate({ 
  permission, 
  children, 
  fallback = null 
}) {
  const { permissions } = useCurrentEmployee();
  if (!permissions.includes(permission)) return fallback;
  return children;
}

// Usage
<PermissionGate permission="profit:view">
  <ProfitMarginColumn />
</PermissionGate>

<PermissionGate permission="invoices:delete">
  <DeleteButton />
</PermissionGate>
```

### Sidebar Navigation

Only show sidebar sections the user has permission to access. A Cashier's sidebar shows only Sales and Customers. An Inventory Manager sees Inventory and Purchase.

---

## 11. Team Management UI

### Employees Page

```
┌─────────────────────────────────────────────────────────────┐
│ Team Management                          [+ Invite Employee] │
│                                                             │
│ EMPLOYEES (8)                                               │
│                                                             │
│ Ravi Kumar          Billing Operator   🟢 Active            │
│ ravi@acme.com       Last seen: 2h ago  [Edit] [Deactivate]  │
│                                                             │
│ Priya Sharma        Manager            🟢 Active            │
│ priya@acme.com      Last seen: Now     [Edit] [Deactivate]  │
│                                                             │
│ Suresh Patel        Inventory          🟡 Invited           │
│ suresh@acme.com     Invite sent: Jun 10 [Resend] [Cancel]   │
└─────────────────────────────────────────────────────────────┘
```

### Permission Matrix Editor

When editing an employee's permissions, show a clean matrix:

```
Permissions for: Ravi Kumar (Billing Operator)

Based on role: Billing Operator    [Change Role]

SALES
  ✅ View Invoices
  ✅ Create Invoices
  ☐  Edit Invoices
  ☐  Cancel Invoices
  ☐  Delete Invoices

CUSTOMERS
  ✅ View Customers
  ✅ Create Customers
  ☐  Edit Customers
  ☐  Delete Customers

REPORTS
  ☐  View Reports           (locked — custom override)
  ☐  Export Reports

FINANCIAL (SENSITIVE)
  ☐  View Revenue
  ☐  View Profit
  ☐  View Expenses

[Save Permissions]
```

---

## 12. Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + K` | Open command palette |
| `N` | New Invoice (when on invoices page) |
| `C` | New Customer (when on customers page) |
| `/` | Focus search bar on any list page |
| `A` | Open approvals (Owner/Manager) |
| `Esc` | Close any open modal/sheet |
| `→` | Open detail view for selected row |
| `←` | Go back |
| `?` | Show keyboard shortcuts help |

Implement a `useKeyboardShortcuts()` hook that registers shortcuts per-page and a global shortcuts help modal.

---

## 13. Invoice Print / PDF Redesign

### Current State
`window.print()` on a hidden DOM element. Works but is fragile and produces inconsistent output.

### Redesigned PDF

Use `@react-pdf/renderer` to generate true PDFs.

**Invoice PDF Layout:**

```
┌─────────────────────────────────────────────┐
│ [Business Logo]          TAX INVOICE         │
│ ABC Traders                                  │
│ GST: 27ABCDE1234F1Z5                        │
│ 123 MG Road, Pune 411001                    │
│ Phone: 9876543210                           │
├─────────────────────────────────────────────┤
│ Bill To:              Invoice: INV-2025-087  │
│ Ramesh Traders        Date: June 15, 2025   │
│ GST: 27XYZAB1234G2H6  Due: June 30, 2025   │
│ Mumbai                                      │
├────┬───────────────┬─────┬────────┬─────────┤
│ #  │ Item          │ Qty │ Rate   │ Amount  │
├────┼───────────────┼─────┼────────┼─────────┤
│ 1  │ Cement 50kg   │ 50  │ 400.00 │ 20,000  │
│ 2  │ Sand (tonne)  │ 2   │ 2,500  │  5,000  │
├────┴───────────────┴─────┴────────┼─────────┤
│                         Subtotal: │ 25,000  │
│                    Discount (5%): │ -1,250  │
│                  GST @ 18% (est): │  4,275  │
│                       Total Due:  │ 28,025  │
│                    Amount Paid:   │  8,000  │
│                    Balance Due:   │ 20,025  │
└─────────────────────────────────────────────┤
│ Payment History:                            │
│ June 5 - ₹5,000 (Cash)                    │
│ June 12 - ₹3,000 (UPI)                    │
├─────────────────────────────────────────────┤
│ Bank: HDFC Bank | A/C: 1234567890 | IFSC: HDFC0001234 │
│ UPI: acme@upi                              │
│ Thank you for your business!               │
└─────────────────────────────────────────────┘
```

---

## 14. Empty States

Every empty list needs a purposeful empty state:

| Page | Empty State Message | CTA |
|---|---|---|
| Invoices | "No invoices yet. Create your first invoice." | [Create Invoice] |
| Customers | "Add your first customer to get started." | [Add Customer] |
| Suppliers | "No suppliers added. Start tracking your purchases." | [Add Supplier] |
| Notifications | "You're all caught up! No new notifications." | — |
| Approvals | "No pending approvals. Everything is up to date." | — |
| Expenses | "No expenses recorded this month." | [Add Expense] |

Use simple SVG illustrations (not photos) that match the brand style.

---

## 15. Mobile-Specific UX

### Quick Sale Flow (< 30 seconds)

Optimized for a cashier at a counter:

```
1. Tap "New Sale" (floating action button)
2. Customer: Type first 3 letters → auto-suggest from recent customers
3. Items: Scan barcode OR type product name
4. Quantities: +/- buttons (large tap targets)
5. Payment: Tap method icon (Cash / UPI / Card)
6. Save: Single large green button
```

### Swipe Actions on List Items

```
Invoice card:
  Swipe left →  [Record Payment] [Send Reminder]
  Swipe right → [View Details]

Customer card:
  Swipe left →  [Call] [WhatsApp]
  Swipe right → [View Ledger]
```

---

*Document Version: 1.0 | Last Updated: June 2026*
*Cross-references: [MODULE_ARCHITECTURE.md](MODULE_ARCHITECTURE.md) | [MOBILE_APP_PLAN.md](MOBILE_APP_PLAN.md) | [FEATURE_CATALOG.md](FEATURE_CATALOG.md)*
