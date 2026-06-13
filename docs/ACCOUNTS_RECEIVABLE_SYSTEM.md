# SmartBill — Accounts Receivable & Collection Management System

> A complete automated receivables management system. Not just reminders — a full engine for tracking, following up, escalating, and recovering outstanding payments.

---

## 1. System Purpose

Most billing software stops at generating an invoice. SmartBill's AR system picks up where the invoice ends — it actively tracks every rupee owed, reminds at the right time, escalates when ignored, and gives the owner complete visibility into cash flow risk.

**A shop owner's question the AR system must always be able to answer:**
- "Who owes me money, how much, and for how long?"
- "What has been done to collect it?"
- "What needs my attention today?"
- "What is my risk of not collecting this week?"

---

## 2. Core Concepts

### Invoice States in the AR Pipeline

```
DRAFT → PENDING → PARTIAL → PAID
                         ↓
                    OVERDUE (flag on PENDING/PARTIAL)
                         ↓
               WRITTEN_OFF (bad debt decision)
```

### Collection Status (separate from Invoice Status)

An invoice can be PENDING and also have a collection status that tracks the human follow-up state:

| Collection Status | Meaning |
|---|---|
| `NORMAL` | Within due date, no action needed |
| `FOLLOWING_UP` | Active outreach in progress |
| `PROMISED` | Customer has committed to a payment date |
| `DISPUTED` | Invoice is under dispute |
| `ESCALATED` | Manager/owner has been notified |
| `WRITTEN_OFF` | Declared bad debt |

---

## 3. Data Models

### Extension to Invoice (Phase 1.5 migration)

```prisma
model Invoice {
  // ... existing fields ...
  // ... Phase 1 additions (dueDate, paymentTerms, isOverdue) ...

  // AR module additions
  collectionStatus      CollectionStatus  @default(NORMAL)
  lastReminderSentAt    DateTime?         // When last reminder was sent
  reminderCount         Int               @default(0) // Total reminders sent
  assignedToEmployeeId  String?           // Who is responsible for collecting
  assignedTo            Employee?         @relation("InvoiceAssignedTo", fields: [assignedToEmployeeId], references: [id])
  promisedPaymentDate   DateTime?         // When customer promised to pay
  writeOffReason        String?           // Reason for write-off if applicable

  collectionNotes       CollectionNote[]
  collectionActivities  CollectionActivity[]

  @@index([shopId, isOverdue, collectionStatus])
  @@index([shopId, dueDate, status])
  @@index([assignedToEmployeeId, collectionStatus])
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

### ReminderConfig (one per org)

```prisma
model ReminderConfig {
  id                       String   @id @default(cuid())
  orgId                    String   @unique

  // Before due date
  remind7DaysBefore        Boolean  @default(true)
  remind3DaysBefore        Boolean  @default(true)
  remind1DayBefore         Boolean  @default(true)

  // On due date
  remindOnDueDate          Boolean  @default(true)

  // After due date (overdue)
  remind1DayOverdue        Boolean  @default(true)
  remind3DaysOverdue       Boolean  @default(true)
  remind7DaysOverdue       Boolean  @default(true)
  remind15DaysOverdue      Boolean  @default(true)
  remind30DaysOverdue      Boolean  @default(true)

  // Channels
  sendEmailToCustomer      Boolean  @default(false)  // Requires customer email
  sendEmailToOwner         Boolean  @default(true)   // Owner gets daily digest
  sendEmailToAssignee      Boolean  @default(true)   // Assigned employee notified

  // Thresholds — only send reminder if outstanding exceeds this
  minimumAmountToRemind    Float    @default(0)      // 0 = all amounts

  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt

  org                      Organization @relation(fields: [orgId], references: [id])
}
```

### CollectionNote

```prisma
model CollectionNote {
  id              String          @id @default(cuid())
  content         String                             // "Customer promised payment by Friday"
  noteType        CollectionNoteType @default(NOTE)
  followUpDate    DateTime?                          // Next follow-up scheduled

  invoiceId       String
  invoice         Invoice         @relation(fields: [invoiceId], references: [id])
  customerId      String                             // Denormalized for faster customer view
  employeeId      String
  employee        Employee        @relation(fields: [employeeId], references: [id])
  orgId           String

  createdAt       DateTime        @default(now())

  @@index([invoiceId, createdAt])
  @@index([orgId, followUpDate])    // For "follow up today" queries
  @@index([customerId, createdAt])
}

enum CollectionNoteType {
  NOTE         // General note
  PROMISE      // Customer promised a payment date
  DISPUTE      // Customer disputes the invoice
  ESCALATION   // Escalated to higher authority
  RESOLUTION   // Issue resolved
}
```

### CollectionActivity

A complete audit trail of every collection action — automated or manual.

```prisma
model CollectionActivity {
  id              String                  @id @default(cuid())
  type            CollectionActivityType
  channel         String?                 // "EMAIL", "WHATSAPP", "IN_APP", "PHONE", "SYSTEM"
  details         String?                 // Human-readable: "Email sent to ravi@example.com"
  isAutomated     Boolean                 @default(false)  // Was this triggered by cron?

  invoiceId       String
  invoice         Invoice                 @relation(fields: [invoiceId], references: [id])
  customerId      String                  // Denormalized
  employeeId      String?                 // null if automated
  employee        Employee?               @relation(fields: [employeeId], references: [id])
  orgId           String

  createdAt       DateTime                @default(now())

  @@index([invoiceId, createdAt])
  @@index([orgId, createdAt])
  @@index([customerId, createdAt])
}

enum CollectionActivityType {
  REMINDER_SENT         // Automated or manual reminder triggered
  EMAIL_SENT            // Email dispatched via Resend
  WHATSAPP_LINK_OPENED  // User clicked "Send WhatsApp" (wa.me link generated)
  PAYMENT_RECORDED      // A payment was recorded against this invoice
  NOTE_ADDED            // A collection note was written
  STATUS_CHANGED        // collectionStatus changed (e.g. NORMAL → FOLLOWING_UP)
  INVOICE_ASSIGNED      // Invoice assigned to an employee for collection
  ESCALATED             // Escalated to manager/owner
  PROMISED              // Customer set a promise date
  DISPUTED              // Customer raised a dispute
  WRITTEN_OFF           // Invoice declared bad debt
}
```

### EscalationRule

```prisma
model EscalationRule {
  id                String   @id @default(cuid())
  orgId             String
  daysOverdue       Int                           // Trigger when invoice is this many days overdue
  minimumAmount     Float    @default(0)          // Only escalate if outstanding >= this amount
  action            EscalationAction
  notifyEmployeeId  String?                       // Which employee to notify
  addHighPriorityFlag Boolean @default(false)     // Visually flag in pending payments table
  isActive          Boolean  @default(true)

  org               Organization @relation(fields: [orgId], references: [id])
  notifyEmployee    Employee? @relation(fields: [notifyEmployeeId], references: [id])
  createdAt         DateTime @default(now())

  @@index([orgId, daysOverdue])
}

enum EscalationAction {
  NOTIFY_MANAGER     // Send in-app notification to manager
  NOTIFY_OWNER       // Send in-app + email notification to owner
  HIGH_PRIORITY_FLAG // Flag invoice in pending payments UI
  ALL                // All of the above
}
```

---

## 4. Reminder Engine (Automated)

### Architecture

```
Vercel Cron Job
  → GET /api/cron/ar-reminder-engine
  → Runs daily at 09:00 IST (03:30 UTC)
  → Protected by CRON_SECRET header
```

### Algorithm

```typescript
// /api/cron/ar-reminder-engine/route.ts

export async function GET(req: Request) {
  // 1. Auth check
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = startOfDay(new Date());

  // 2. Fetch all outstanding invoices with a due date
  const invoices = await db.invoice.findMany({
    where: {
      status: { in: ['PENDING', 'PARTIAL'] },
      dueDate: { not: null },
      collectionStatus: { notIn: ['WRITTEN_OFF', 'DISPUTED'] },
    },
    include: {
      customer: true,
      shop: { include: { reminderConfig: true } },
      assignedTo: true,
    },
  });

  for (const invoice of invoices) {
    const config = invoice.shop.reminderConfig;
    const dueDate = startOfDay(invoice.dueDate!);
    const daysUntilDue = differenceInDays(dueDate, today);   // negative = overdue
    const daysOverdue = daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0;
    const outstanding = invoice.grandTotal - invoice.amountPaid;

    // Skip if below minimum amount threshold
    if (config && outstanding < config.minimumAmountToRemind) continue;

    // 3. Determine if a reminder is due today
    const shouldRemind = checkReminderSchedule(daysUntilDue, config);
    if (!shouldRemind) continue;

    // 4. Skip if already reminded today
    if (invoice.lastReminderSentAt && isToday(invoice.lastReminderSentAt)) continue;

    // 5. Create in-app notifications
    await createOverdueNotifications(invoice, daysOverdue, outstanding);

    // 6. Send email if configured
    if (config?.sendEmailToCustomer && invoice.customer.email) {
      await sendReminderEmail(invoice, 'CUSTOMER', daysOverdue);
    }
    if (config?.sendEmailToAssignee && invoice.assignedTo?.email) {
      await sendReminderEmail(invoice, 'ASSIGNEE', daysOverdue);
    }

    // 7. Update invoice
    await db.invoice.update({
      where: { id: invoice.id },
      data: {
        isOverdue: daysOverdue > 0,
        lastReminderSentAt: new Date(),
        reminderCount: { increment: 1 },
        collectionStatus: daysOverdue > 0 ? 'FOLLOWING_UP' : invoice.collectionStatus,
      },
    });

    // 8. Log the activity
    await db.collectionActivity.create({
      data: {
        type: 'REMINDER_SENT',
        channel: 'IN_APP',
        details: daysOverdue > 0
          ? `Automated reminder — ${daysOverdue} days overdue`
          : `Automated reminder — due in ${daysUntilDue} days`,
        isAutomated: true,
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        orgId: invoice.shop.orgId ?? invoice.shopId,
      },
    });
  }

  // 9. Run escalation checks
  await runEscalationEngine(today);

  return Response.json({ success: true, processed: invoices.length });
}

function checkReminderSchedule(daysUntilDue: number, config: ReminderConfig | null): boolean {
  const c = config;
  if (daysUntilDue === 7)   return c?.remind7DaysBefore ?? true;
  if (daysUntilDue === 3)   return c?.remind3DaysBefore ?? true;
  if (daysUntilDue === 1)   return c?.remind1DayBefore ?? true;
  if (daysUntilDue === 0)   return c?.remindOnDueDate ?? true;
  if (daysUntilDue === -1)  return c?.remind1DayOverdue ?? true;
  if (daysUntilDue === -3)  return c?.remind3DaysOverdue ?? true;
  if (daysUntilDue === -7)  return c?.remind7DaysOverdue ?? true;
  if (daysUntilDue === -15) return c?.remind15DaysOverdue ?? true;
  if (daysUntilDue === -30) return c?.remind30DaysOverdue ?? true;
  return false;
}
```

### Vercel Cron Config

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/ar-reminder-engine",
      "schedule": "30 3 * * *"
    }
  ]
}
```

---

## 5. Pending Payments Module

### Page: `/pending-payments`

This is one of the highest-priority pages in the platform. A shop owner should open this every morning to see their receivables health.

### Priority Sort Algorithm

Every outstanding invoice gets a priority score:

```typescript
function getPriorityScore(invoice: Invoice): number {
  const daysOverdue = getDaysOverdue(invoice.dueDate);
  const outstanding = invoice.grandTotal - invoice.amountPaid;
  const amountFactor = Math.min(outstanding / 1000, 100); // cap at 100 to prevent domination

  if (daysOverdue > 0) {
    // Overdue: highest priority, sorted by days overdue then amount
    return 1000 + (daysOverdue * 10) + amountFactor;
  }

  const daysUntilDue = getDaysUntilDue(invoice.dueDate);

  if (daysUntilDue === 0) return 900 + amountFactor;   // Due today
  if (daysUntilDue <= 3)  return 800 + amountFactor;   // Due in 1–3 days
  if (daysUntilDue <= 7)  return 700 + amountFactor;   // Due in 4–7 days
  return amountFactor;                                  // Not urgent yet
}
```

### Table Columns

| Column | Description |
|---|---|
| Priority | 🔴 Overdue / 🟠 Due Today / 🟡 Due Soon / ⚪ Upcoming |
| Customer | Name, phone number |
| Invoice | Invoice number, issue date |
| Original Amount | Grand total |
| Amount Paid | Sum of payments |
| Outstanding | Remaining balance |
| Due Date | Payment due date |
| Days | `+5 days left` or `-12 days overdue` |
| Collection Status | Badge: FOLLOWING_UP, PROMISED, etc. |
| Assigned To | Employee responsible |
| Last Action | Most recent collection activity |
| Actions | View / Pay / Remind / WhatsApp / Note |

### Filters & Views

```
Filters:
  - Status: All / Overdue / Due Today / Due This Week / Upcoming
  - Amount: > ₹1,000 / > ₹5,000 / > ₹10,000 / Custom
  - Assigned To: (employee dropdown, owner only)
  - Customer: (search)
  - Date Range: Due date range picker

Sort:
  - Default: Priority Score (highest first)
  - By Amount (highest first)
  - By Days Overdue (most overdue first)
  - By Customer Name

Views:
  - Table View (default)
  - Customer Summary View (one row per customer, aggregated)
  - Aging Buckets View (grouped by overdue bracket)
```

### Aging Buckets View

```
┌────────────────────────────────────────────────────────────┐
│  RECEIVABLES AGING SUMMARY                    Export CSV   │
├──────────────┬──────────┬──────────┬──────────┬──────────┤
│              │  Amount  │Invoices  │Customers │    %     │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Current      │ ₹84,000  │   18     │   12     │  41%     │
│ 1–7 days     │ ₹23,500  │    6     │    5     │  11%     │
│ 8–30 days    │ ₹52,000  │   11     │    9     │  25%     │
│ 31–60 days   │ ₹28,000  │    7     │    6     │  14%     │
│ 61–90 days   │ ₹12,000  │    4     │    3     │   6%     │
│ 90+ days     │  ₹8,000  │    2     │    2     │   4%     │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ TOTAL        │₹2,07,500 │   48     │   37     │ 100%     │
└──────────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## 6. Dashboard Widgets

Four AR widgets appear in the dashboard header row (permission-gated):

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Outstanding     │ │ Overdue         │ │ Due Today       │ │ Due This Week   │
│ Revenue         │ │ Payments        │ │                 │ │                 │
│ ₹2,07,500       │ │ ₹48,000         │ │ 12 Invoices     │ │ 28 Invoices     │
│ 48 invoices     │ │ 13 invoices     │ │ ₹1,24,000       │ │ ₹3,16,000       │
│                 │ │ 🔴 Action Needed│ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

Permission required: `collections:view`

---

## 7. Email Notification System

### Technology Stack

**Resend** (resend.com) for transactional email delivery.
**React Email** for template rendering.

```bash
npm install resend @react-email/components @react-email/render
```

### Template: Customer Payment Reminder

```tsx
// emails/PaymentReminderEmail.tsx
import {
  Body, Container, Head, Heading, Hr, Html, Img,
  Preview, Row, Column, Section, Text, Button
} from '@react-email/components';

interface PaymentReminderEmailProps {
  customerName: string;
  shopName: string;
  shopLogo?: string;
  invoiceNumber: string;
  originalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate: string;
  daysOverdue: number;       // 0 = not overdue, >0 = overdue
  daysRemaining: number;     // negative if overdue
  publicInvoiceUrl: string;  // Public link to view invoice
  ownerPhone: string;
}

export function PaymentReminderEmail(props: PaymentReminderEmailProps) {
  const isOverdue = props.daysOverdue > 0;
  const urgencyColor = isOverdue ? '#DC2626' : props.daysRemaining <= 3 ? '#D97706' : '#2563EB';
  const subjectLine = isOverdue
    ? `Payment Overdue — ${props.invoiceNumber} (${props.daysOverdue} days)`
    : `Payment Reminder — ${props.invoiceNumber} due ${props.daysRemaining === 0 ? 'today' : `in ${props.daysRemaining} days`}`;

  return (
    <Html>
      <Head />
      <Preview>{subjectLine}</Preview>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '40px auto', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden' }}>

          {/* Header */}
          <Section style={{ backgroundColor: urgencyColor, padding: '24px 32px' }}>
            {props.shopLogo && <Img src={props.shopLogo} height="40" alt={props.shopName} />}
            <Heading style={{ color: '#ffffff', margin: '8px 0 0', fontSize: '20px' }}>
              {isOverdue ? '⚠️ Payment Overdue' : '📋 Payment Reminder'}
            </Heading>
          </Section>

          {/* Greeting */}
          <Section style={{ padding: '24px 32px 0' }}>
            <Text style={{ fontSize: '16px', color: '#374151' }}>
              Dear {props.customerName},
            </Text>
            <Text style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
              {isOverdue
                ? `This is a reminder that your payment for invoice ${props.invoiceNumber} is now ${props.daysOverdue} day${props.daysOverdue > 1 ? 's' : ''} overdue. Please arrange payment at your earliest convenience to avoid further delays.`
                : `This is a friendly reminder that payment for invoice ${props.invoiceNumber} is due ${props.daysRemaining === 0 ? 'today' : `in ${props.daysRemaining} day${props.daysRemaining > 1 ? 's' : ''}`}.`
              }
            </Text>
          </Section>

          {/* Invoice Summary Table */}
          <Section style={{ padding: '16px 32px' }}>
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '6px', overflow: 'hidden' }}>
              <Row style={{ backgroundColor: '#F9FAFB', padding: '10px 16px' }}>
                <Column><Text style={{ fontWeight: 'bold', fontSize: '13px', color: '#374151' }}>Invoice</Text></Column>
                <Column><Text style={{ fontWeight: 'bold', fontSize: '13px', color: '#374151', textAlign: 'right' }}>{props.invoiceNumber}</Text></Column>
              </Row>
              <Row style={{ padding: '10px 16px' }}>
                <Column><Text style={{ fontSize: '13px', color: '#6B7280' }}>Original Amount</Text></Column>
                <Column><Text style={{ fontSize: '13px', color: '#374151', textAlign: 'right' }}>₹{props.originalAmount.toLocaleString('en-IN')}</Text></Column>
              </Row>
              <Row style={{ padding: '10px 16px', backgroundColor: '#F9FAFB' }}>
                <Column><Text style={{ fontSize: '13px', color: '#6B7280' }}>Amount Paid</Text></Column>
                <Column><Text style={{ fontSize: '13px', color: '#059669', textAlign: 'right' }}>₹{props.paidAmount.toLocaleString('en-IN')}</Text></Column>
              </Row>
              <Row style={{ padding: '12px 16px', borderTop: '2px solid #E5E7EB' }}>
                <Column><Text style={{ fontSize: '15px', fontWeight: 'bold', color: '#111827' }}>Outstanding Balance</Text></Column>
                <Column><Text style={{ fontSize: '15px', fontWeight: 'bold', color: urgencyColor, textAlign: 'right' }}>₹{props.outstandingAmount.toLocaleString('en-IN')}</Text></Column>
              </Row>
              <Row style={{ padding: '10px 16px', backgroundColor: '#FEF9C3' }}>
                <Column><Text style={{ fontSize: '13px', color: '#92400E' }}>Due Date</Text></Column>
                <Column><Text style={{ fontSize: '13px', color: '#92400E', textAlign: 'right' }}>{props.dueDate}{isOverdue ? ` (${props.daysOverdue} days overdue)` : ''}</Text></Column>
              </Row>
            </div>
          </Section>

          {/* CTA Button */}
          <Section style={{ padding: '8px 32px 24px', textAlign: 'center' }}>
            <Button href={props.publicInvoiceUrl} style={{ backgroundColor: urgencyColor, color: '#ffffff', padding: '12px 32px', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none' }}>
              View Invoice & Pay
            </Button>
          </Section>

          <Hr style={{ borderColor: '#E5E7EB', margin: '0 32px' }} />

          {/* Footer */}
          <Section style={{ padding: '16px 32px' }}>
            <Text style={{ fontSize: '12px', color: '#9CA3AF' }}>
              For any queries, contact us at {props.ownerPhone}.<br />
              This is an automated message from {props.shopName} via SmartBill.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
```

### Email Trigger Points

| Trigger | Recipients | Template |
|---|---|---|
| Automated cron reminder | Customer, Assignee | `PaymentReminderEmail` |
| Manual "Send Reminder" | Customer, Owner CC | `PaymentReminderEmail` |
| Payment received | Owner, Assignee | `PaymentReceivedEmail` |
| Escalation threshold hit | Manager / Owner | `EscalationAlertEmail` |
| Daily digest | Owner | `DailyARDigestEmail` |

### Daily AR Digest (owner only, 9 AM)

Sent to shop owner every morning:
- Total outstanding
- New overdue since yesterday
- Payments received yesterday
- Invoices due today
- Invoices needing follow-up (no activity in 7+ days)

---

## 8. In-App Notification Center

### Notification Bell (Header)

```
┌──────────────────────────────────┐
│  🔔 Notifications           [4] │
├──────────────────────────────────┤
│ 🔴 OVERDUE                       │
│ Ramesh Traders · INV-1047         │
│ ₹18,000 · 7 days overdue         │
│ 2 hours ago                       │
├──────────────────────────────────┤
│ 🟡 DUE TODAY                      │
│ Suresh Hardware · INV-1051        │
│ ₹5,400 due today                  │
│ 3 hours ago                       │
├──────────────────────────────────┤
│ 💰 PAYMENT RECEIVED               │
│ ABC Traders paid ₹12,000          │
│ INV-1038 · Now ₹3,000 remaining   │
│ Yesterday                          │
├──────────────────────────────────┤
│ ⚠️ ESCALATION                     │
│ Kumar & Sons · INV-1029           │
│ 30 days overdue — ₹45,000         │
│ Yesterday                          │
└──────────────────────────────────┘
```

### Notification Types for AR

| Type | Icon | When Created |
|---|---|---|
| `INVOICE_OVERDUE` | 🔴 | Cron detects invoice past due date |
| `PAYMENT_DUE_TODAY` | 🟡 | Cron detects invoice due today |
| `PAYMENT_DUE_SOON` | 📅 | Cron detects invoice due in 3 days |
| `PAYMENT_RECEIVED` | 💰 | Payment recorded against invoice |
| `ESCALATION_TRIGGERED` | ⚠️ | Escalation rule threshold hit |
| `FOLLOW_UP_DUE` | 📞 | Collection note follow-up date reached |
| `LARGE_OUTSTANDING` | 🚨 | Customer outstanding exceeds credit limit |

### Real-Time Delivery

Notifications are created in the `Notification` table. For near-real-time display:
- Use **SWR** with a 30-second revalidation interval on the notification bell
- Or use Vercel's built-in Server-Sent Events if millisecond latency is needed
- The bell icon badge count refreshes every 30 seconds automatically

---

## 9. WhatsApp Reminder Integration

### Message Generation

```typescript
// lib/whatsapp.ts

interface WhatsAppReminderParams {
  customerName: string;
  invoiceNumber: string;
  originalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate: string;
  shopName: string;
  daysOverdue?: number;
}

export function generateWhatsAppMessage(params: WhatsAppReminderParams): string {
  const {
    customerName, invoiceNumber, originalAmount, paidAmount,
    outstandingAmount, dueDate, shopName, daysOverdue
  } = params;

  const overdueText = daysOverdue && daysOverdue > 0
    ? `\n⚠️ This payment is *${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue*.`
    : '';

  return `Hello ${customerName},

This is a reminder regarding Invoice *${invoiceNumber}*.

📋 *Invoice Details*
Original Amount: ₹${originalAmount.toLocaleString('en-IN')}
Amount Paid: ₹${paidAmount.toLocaleString('en-IN')}
*Outstanding Amount: ₹${outstandingAmount.toLocaleString('en-IN')}*

📅 Due Date: ${dueDate}${overdueText}

Please arrange payment at your earliest convenience.

Thank you,
*${shopName}*`;
}

export function getWhatsAppUrl(phone: string, message: string): string {
  // Normalize Indian phone number
  const normalized = phone.replace(/\D/g, '').replace(/^0/, '').replace(/^91/, '');
  const withCountryCode = `91${normalized}`;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
```

### UI Component: WhatsApp Reminder Button

```tsx
// components/collection/WhatsAppReminderButton.tsx

interface Props {
  invoice: Invoice;
  customer: Customer;
  shop: Shop;
}

export function WhatsAppReminderButton({ invoice, customer, shop }: Props) {
  const hasPermission = usePermission('reminders:whatsapp');
  if (!hasPermission) return null;

  const outstanding = invoice.grandTotal - invoice.amountPaid;
  const message = generateWhatsAppMessage({
    customerName: customer.name,
    invoiceNumber: invoice.invoiceNum,
    originalAmount: invoice.grandTotal,
    paidAmount: invoice.amountPaid,
    outstandingAmount: outstanding,
    dueDate: formatDate(invoice.dueDate),
    shopName: shop.name,
    daysOverdue: getDaysOverdue(invoice.dueDate),
  });

  const whatsappUrl = getWhatsAppUrl(customer.phone, message);

  async function handleClick() {
    // Log the activity
    await fetch('/api/v1/collections/activity', {
      method: 'POST',
      body: JSON.stringify({
        invoiceId: invoice.id,
        type: 'WHATSAPP_LINK_OPENED',
        channel: 'WHATSAPP',
        details: `WhatsApp reminder link opened for ${customer.name}`,
      }),
    });

    // Open WhatsApp (web or app, browser decides)
    window.open(whatsappUrl, '_blank');
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="text-green-600 border-green-600 hover:bg-green-50"
    >
      <MessageSquare className="h-4 w-4 mr-1" />
      WhatsApp
    </Button>
  );
}
```

### Behavior by Device

| Platform | Behavior |
|---|---|
| Desktop Chrome | Opens WhatsApp Web in new tab |
| Desktop Safari | Opens WhatsApp Web in new tab |
| Android Chrome | Opens WhatsApp app directly |
| iOS Safari | Opens WhatsApp app directly |

No special handling needed — `wa.me` links handle this automatically.

---

## 10. Collection Actions Per Invoice

Each row in the Pending Payments table has an action dropdown:

```
┌──────────────────────────────────┐
│ ACTIONS                           │
├──────────────────────────────────┤
│ 👁️  View Invoice                 │
│ 💰  Record Payment               │
│ 📱  Send WhatsApp Reminder       │  ← permission: reminders:whatsapp
│ 📧  Send Email Reminder          │  ← permission: reminders:send
│ 📝  Add Collection Note          │  ← permission: collections:manage
│ 📋  View Customer Ledger         │
│ 👤  Assign to Employee           │  ← permission: collections:manage
│ ─────────────────────────────── │
│ ✅  Mark as Promised (set date)  │  ← permission: collections:manage
│ ⚠️  Escalate to Manager          │  ← permission: collections:manage
│ ❌  Write Off (bad debt)         │  ← permission: invoices:write_off
└──────────────────────────────────┘
```

---

## 11. Collection Notes UI

Shown on Invoice Detail page as a timeline:

```
COLLECTION HISTORY
─────────────────────────────────────────────────

  [Ravi Sharma] · Jun 12, 2026 at 2:45 PM          📝 NOTE
  ┌────────────────────────────────────────────────┐
  │ Called Mr. Ramesh. He said will pay ₹5,000     │
  │ by Friday June 14. Following up then.           │
  │ Follow-up date set: Jun 14                      │
  └────────────────────────────────────────────────┘

  [System - Automated] · Jun 10, 2026 at 9:00 AM   🔔 REMINDER SENT
  Automated reminder sent — 3 days overdue

  [Owner] · Jun 8, 2026 at 11:15 AM                📝 NOTE
  ┌────────────────────────────────────────────────┐
  │ Customer says he was out of town. Back on       │
  │ June 10. Will follow up then.                   │
  └────────────────────────────────────────────────┘

  [System - Automated] · Jun 7, 2026 at 9:00 AM    🔔 REMINDER SENT
  Automated reminder sent — 0 days (due today)

[+ Add Note]
```

### Add Note Form

```
┌──────────────────────────────────────────────────┐
│ Add Collection Note                               │
│                                                   │
│ Note Type: [Note ▾] [Promise] [Dispute]           │
│                                                   │
│ ┌──────────────────────────────────────────────┐ │
│ │ Customer promised to pay ₹6,000 on Friday... │ │
│ └──────────────────────────────────────────────┘ │
│                                                   │
│ Schedule Follow-up: [📅 Jun 14, 2026]             │
│                                                   │
│ [Cancel]                    [Save Note]           │
└──────────────────────────────────────────────────┘
```

---

## 12. Escalation Engine

### How It Runs

As part of the same daily cron, after the reminder engine:

```typescript
async function runEscalationEngine(today: Date) {
  const orgConfigs = await db.escalationRule.findMany({
    where: { isActive: true },
    include: { notifyEmployee: true },
  });

  for (const rule of orgConfigs) {
    const overdueSince = subDays(today, rule.daysOverdue);

    const invoices = await db.invoice.findMany({
      where: {
        shopId: { in: await getShopIdsForOrg(rule.orgId) },
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lte: overdueSince },
        collectionStatus: { notIn: ['ESCALATED', 'WRITTEN_OFF', 'DISPUTED'] },
        grandTotal: { gte: rule.minimumAmount },
      },
      include: { customer: true },
    });

    for (const invoice of invoices) {
      const outstanding = invoice.grandTotal - invoice.amountPaid;

      // Create escalation notification
      await db.notification.create({
        data: {
          type: 'ESCALATION_TRIGGERED',
          title: `Escalation: ${invoice.customer.name}`,
          body: `Invoice ${invoice.invoiceNum} is ${rule.daysOverdue}+ days overdue — ₹${outstanding.toLocaleString('en-IN')} outstanding`,
          employeeId: rule.notifyEmployeeId ?? await getOwnerId(rule.orgId),
          orgId: rule.orgId,
          entityType: 'Invoice',
          entityId: invoice.id,
          actionUrl: `/pending-payments?invoice=${invoice.id}`,
        },
      });

      // Update collection status
      await db.invoice.update({
        where: { id: invoice.id },
        data: { collectionStatus: 'ESCALATED' },
      });

      // Log activity
      await db.collectionActivity.create({
        data: {
          type: 'ESCALATED',
          isAutomated: true,
          details: `Escalation rule triggered — ${rule.daysOverdue} days overdue threshold`,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          orgId: rule.orgId,
        },
      });
    }
  }
}
```

---

## 13. Analytics Module

### `/reports/accounts-receivable` page

```
AR Analytics Dashboard
───────────────────────────────────────────────────────────

Collection Health Score: 72/100  🟡

┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Total           │ │ Overdue        │ │ Collection     │
│ Outstanding     │ │ Percentage     │ │ Success Rate   │
│ ₹2,07,500       │ │ 23%            │ │ 68% (30d)      │
│ 48 invoices     │ │ 11 invoices    │ │ 24 of 35 paid  │
└────────────────┘ └────────────────┘ └────────────────┘

Average Days to Pay: 18 days
Target: ≤ 15 days   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░  18/30

TOP OVERDUE CUSTOMERS
─────────────────────────────────
1. Kumar & Sons       ₹45,000   47 days overdue  ⚠️ ESCALATED
2. Ramesh Traders     ₹28,000   31 days overdue  🔴 HIGH RISK
3. ABC Hardware       ₹18,500   12 days overdue  🟡 FOLLOWING UP
4. Suresh Cement      ₹12,000    8 days overdue  📞 NOTE: Called Jun 10
5. Priya Suppliers    ₹ 9,800    5 days overdue  📅 PROMISED: Jun 15

TOP PAYING CUSTOMERS (Last 90 days)
─────────────────────────────────
1. Metro Traders      Average: 8 days  ✅ Excellent
2. Gupta Brothers     Average: 12 days ✅ Good
3. Shah Distributors  Average: 15 days ✅ On Time
```

### Analytics Computed from DB

| Metric | Computation |
|---|---|
| Total Outstanding | `SUM(grandTotal - amountPaid)` where status in [PENDING, PARTIAL] |
| Overdue Percentage | `COUNT(isOverdue=true) / COUNT(status in [PENDING,PARTIAL]) * 100` |
| Collection Success Rate (30d) | `COUNT(fully paid in last 30d) / COUNT(became due in last 30d) * 100` |
| Average Days to Pay | `AVG(payment.createdAt - invoice.issuedAt)` for PAID invoices |
| Average Days Overdue | `AVG(today - dueDate)` for overdue invoices |
| Collection Health Score | Composite: 40% overdue %, 30% avg days to pay, 30% collection rate |

---

## 14. Permission Keys (AR Module)

New permission keys added to the registry:

| Permission Key | Who needs it | What it controls |
|---|---|---|
| `collections:view` | All staff | See pending payments page, AR dashboard widgets |
| `collections:manage` | Senior Cashier, Manager, Owner | Add notes, assign invoices, update collection status |
| `payments:record` | Cashier+, Manager, Owner | Record a payment against an invoice |
| `reminders:send` | Manager, Owner | Send email reminders manually |
| `reminders:whatsapp` | Cashier+, Manager, Owner | Generate and send WhatsApp reminder links |
| `collections:export` | Accountant, Manager, Owner | Export outstanding report as CSV/Excel |
| `invoices:write_off` | Owner only | Write off an invoice as bad debt |
| `collections:escalate` | Manager, Owner | Manually escalate an invoice |
| `ar:analytics` | Manager, Owner | View collection analytics and health score |

**Permission resolution examples:**

| Scenario | Cashier | Senior Cashier | Manager | Owner |
|---|---|---|---|---|
| View pending payments | ❌ | ✅ | ✅ | ✅ |
| Record payment | ✅ | ✅ | ✅ | ✅ |
| Send WhatsApp reminder | ❌ | ✅ | ✅ | ✅ |
| Send email reminder | ❌ | ❌ | ✅ | ✅ |
| Add collection note | ❌ | ✅ | ✅ | ✅ |
| Export outstanding report | ❌ | ❌ | ✅ | ✅ |
| Write off bad debt | ❌ | ❌ | ❌ | ✅ |
| View AR analytics | ❌ | ❌ | ✅ | ✅ |

---

## 15. API Endpoints

```
GET  /api/v1/collections/pending          → Paginated pending payments list
GET  /api/v1/collections/aging            → Aging bucket summary
GET  /api/v1/collections/analytics        → AR metrics and health score
GET  /api/v1/collections/invoices/:id     → Invoice detail with collection history
POST /api/v1/collections/invoices/:id/notes → Add collection note
POST /api/v1/collections/invoices/:id/assign → Assign to employee
POST /api/v1/collections/invoices/:id/escalate → Manual escalation
POST /api/v1/collections/invoices/:id/write-off → Write off bad debt
POST /api/v1/collections/invoices/:id/promise → Set promise date
POST /api/v1/collections/activity        → Log collection activity (WhatsApp click, etc.)
POST /api/v1/collections/reminder/send   → Manual reminder trigger (email)
GET  /api/v1/collections/whatsapp-message/:invoiceId → Get prefilled WhatsApp message
GET  /api/cron/ar-reminder-engine        → Vercel Cron daily job (internal)

GET  /api/v1/settings/reminder-config    → Get org reminder config
PUT  /api/v1/settings/reminder-config    → Update reminder schedule
POST /api/v1/settings/escalation-rules   → Add escalation rule
PUT  /api/v1/settings/escalation-rules/:id → Update rule
DELETE /api/v1/settings/escalation-rules/:id → Delete rule
```

---

## 16. Settings UI

### Reminder Settings Page (`/settings/reminders`)

```
AUTOMATED REMINDERS
─────────────────────────────────────────────

Before Due Date                    [All On]
  ✅ 7 days before due date
  ✅ 3 days before due date
  ✅ 1 day before due date

On Due Date
  ✅ Send reminder on due date

After Due Date (Overdue)           [All On]
  ✅ 1 day overdue
  ✅ 3 days overdue
  ✅ 7 days overdue
  ✅ 15 days overdue
  ✅ 30 days overdue

Minimum Amount Threshold
  Only send reminders for invoices with outstanding ≥ [₹0    ▾]

Notification Channels
  ✅ In-App Notifications (always enabled)
  ✅ Email to Assigned Employee
  ⬜ Email to Customer  ← requires customer email on file

─────────────────────────────────────────────
ESCALATION RULES

  Days Overdue    Min Amount    Action              Notify
  ─────────────────────────────────────────────────────
  7 days          ₹5,000        High Priority Flag  —
  15 days         ₹10,000       Notify Manager      [Ravi Sharma ▾]
  30 days         ₹25,000       Notify Owner        [Kaustubh R. ▾]

  [+ Add Escalation Rule]
```

---

## 17. Customer Ledger — Collection Tab

The existing customer ledger page gets a new "Collections" tab showing the full collection history across all invoices for that customer:

```
Customer: Ramesh Traders
─────────────────────────────────────────────

[Overview] [Invoices] [Payments] [Collections] [Statement]

COLLECTIONS HISTORY

Showing: All collection activity for Ramesh Traders

─── Jun 12, 2026 ───────────────────────────────

  14:32  📱 WhatsApp Reminder Sent                  Ravi Sharma
         INV-1047 · ₹6,000 outstanding

  11:15  📝 Note Added                              Ravi Sharma
         "Will pay ₹3,000 on Friday, remaining on June 18"
         Follow-up: Jun 14

─── Jun 10, 2026 ───────────────────────────────

  09:00  🔔 Automated Reminder                      System
         3 days overdue · INV-1047

─── Jun 8, 2026 ────────────────────────────────

  09:00  🔔 Automated Reminder                      System
         1 day before due date · INV-1047

─── Jun 5, 2026 ────────────────────────────────

  17:22  💰 Payment Recorded                        Ravi Sharma
         ₹4,000 via UPI · INV-1047 · Outstanding: ₹6,000
```

---

## 18. Build Order for This Module

Aligned with Phase 2 of PRIORITY_ROADMAP.md — can be built in ~4 weeks:

### Week 1: Database + Core AR
- Migration: `add_ar_invoice_fields` (collectionStatus, lastReminderSentAt, reminderCount, assignedTo)
- Migration: `add_collection_note_activity` (CollectionNote, CollectionActivity)
- Migration: `add_reminder_config_escalation` (ReminderConfig, EscalationRule)
- Basic Pending Payments page (table view, priority sort)
- Payment recording from pending payments table

### Week 2: Automation Engine
- Vercel Cron: `ar-reminder-engine` route
- In-app notification creation
- Overdue flag update via cron
- Notification bell UI wiring (Phase 3 notification model must be ready)

### Week 3: Communication Layer
- WhatsApp reminder button + activity logging
- React Email templates
- Resend integration
- Manual "Send Reminder" action
- Collection notes UI

### Week 4: Analytics + Settings
- Aging buckets view
- AR analytics page
- Reminder settings UI
- Escalation rules config
- Dashboard AR widgets
- Customer collections tab

---

*Document Version: 1.0 | Last Updated: June 2026*
*Cross-references: [DATABASE_EVOLUTION_PLAN.md](DATABASE_EVOLUTION_PLAN.md) | [PRIORITY_ROADMAP.md](PRIORITY_ROADMAP.md) | [MODULE_ARCHITECTURE.md](MODULE_ARCHITECTURE.md) | [BUSINESS_WORKFLOWS.md](BUSINESS_WORKFLOWS.md)*
