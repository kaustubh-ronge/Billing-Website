# SmartBill — SaaS Evolution Plan

> Roadmap to transform SmartBill from a single-shop billing app into a scalable multi-tenant SaaS platform.

---

## 1. Current Architecture Assessment

### What We Have
SmartBill uses a `Shop` model as the tenant root. Every query filters by `shopId`. This is the correct foundation for a multi-tenant application.

```
Clerk User ──→ User (role: OWNER/MANAGER/CASHIER) ──→ Shop
Invoice, Customer, Product all have shopId foreign keys.
```

### What This Enables
The `shopId` filtering pattern can scale directly to an `orgId` / `branchId` pattern with minimal data migration. The hardest architectural work is already done correctly.

### What This Doesn't Support
- Multiple branches under one organization
- Multiple users with different permissions at different branches
- Consolidated reporting across an organization
- Subscription management for SmartBill itself
- White-labeling for resellers

---

## 2. Evolution Phases

### Phase 1 — Current State (Single Shop)

```
Clerk ──→ User ──→ Shop
              (all data scoped to shopId)
```

**Supports:**
- Single business owner
- Multiple staff (OWNER/MANAGER/CASHIER) under one shop
- All data isolated per shop

**Limitation:** One Clerk account = one shop. No concept of branches or organization.

---

### Phase 2 — Organization + Branches

**Goal:** One organization can have multiple branches. Staff can be scoped to a branch or org-wide.

**Data model change:**

```
Organization (new top-level entity)
├── Branch A (Pune Main)
├── Branch B (Mumbai Retail)
└── Branch C (Nashik Warehouse)

Employee ──→ Organization + optional Branch
Invoice/Customer/Product ──→ Organization + optional Branch
```

**Database changes:**
- Add `Organization` model (replaces `Shop` as tenant root)
- Add `Branch` model
- Add `branchId` to Invoice, Customer, Product, Expense (optional)
- `Shop` model becomes a legacy alias for backward compatibility during migration

**Query pattern change:**
```typescript
// Before:
where: { shopId: shop.id }

// After (org-level):
where: { orgId: org.id }

// After (branch-level):
where: { orgId: org.id, branchId: branch.id }

// After (branch-level staff, all branches):
where: { orgId: org.id }  // No branch filter — sees everything
```

**Reports:**
- Branch-level: filtered by branchId
- Org-level: no branchId filter → consolidated view
- Branch comparison: side-by-side query per branch

---

### Phase 3 — Granular Permissions & Employee Management

(This is Phase 3 of the product roadmap but represents a critical SaaS foundation.)

**Goal:** Move from 3 hardcoded roles to a flexible permission system that scales to any team size.

**Implementation:**
- `CustomRole` model: owner creates "Billing Operator", "Inventory Manager" with specific permissions
- `EmployeePermission` model: per-user permission overrides
- Permission middleware on every API route
- Permission-aware UI: hide unauthorized elements

**SaaS implication:** This is what enables the platform to serve teams of 1 to 100+ without requiring architectural changes. The permission layer is the foundation of every enterprise tier feature.

---

### Phase 4 — White-Labeling

**Goal:** Allow resellers (CA firms, ERP distributors) and enterprise clients to brand SmartBill as their own.

**Features:**
- Custom domain per organization (bills.acmetraders.com → SmartBill)
- Custom logo, primary color, brand name in all UI
- Branded customer-facing pages (public invoice, customer statement)
- Branded email sender (bills@acmetraders.com)
- Custom invoice templates
- Remove all SmartBill branding from the interface

**Implementation:**

```typescript
// Domain-based tenant resolution
// middleware.ts
const hostname = req.headers.get('host');
const org = await db.organization.findFirst({
  where: { customDomain: hostname }
});
// Route to org-specific branded experience
```

Custom domain setup:
1. Organization adds custom domain in settings
2. SmartBill generates CNAME DNS record instructions
3. Organization adds CNAME to their DNS
4. Vercel/Cloudflare handles SSL automatically

**Branding config stored per org:**
```prisma
model OrganizationBranding {
  orgId         String  @unique
  primaryColor  String  @default("#2563EB")
  brandName     String?
  customDomain  String? @unique
  faviconUrl    String?
  loginBgUrl    String?
}
```

---

### Phase 5 — SaaS Monetization

**Goal:** SmartBill itself becomes a subscription product with tiered plans.

#### Plan Tiers

| Feature | FREE | PRO (₹999/mo) | ENTERPRISE (₹2,999/mo) |
|---|---|---|---|
| Monthly invoices | 50 | Unlimited | Unlimited |
| Staff accounts | 2 | 10 | Unlimited |
| Branches | 1 | 1 | Unlimited |
| Reports | Basic | Full | Full + Custom |
| Data export | CSV | CSV + Excel | All formats |
| API access | No | No | Yes |
| White-labeling | No | No | Yes |
| Priority support | No | Email | Phone + Email |

#### Subscription Infrastructure

**Razorpay Subscriptions** for Indian market:
- Auto-debit via UPI / Credit Card / Net Banking
- Automatic plan upgrade/downgrade
- Proration handling
- Failed payment retry with grace period

**Feature gating:**
```typescript
// lib/planGating.ts
async function requiresPlanFeature(orgId: string, feature: PlanFeature): Promise<void> {
  const org = await db.organization.findUnique({ where: { id: orgId } });
  if (!PLAN_FEATURES[org.plan].includes(feature)) {
    throw new PlanUpgradeRequiredError(feature, org.plan);
  }
}

// Usage in API route
await requiresPlanFeature(orgId, 'MULTI_BRANCH');
await requiresPlanFeature(orgId, 'API_ACCESS');
```

**Usage metering:**
```prisma
model UsageRecord {
  id        String   @id @default(cuid())
  orgId     String
  metric    String   // "INVOICES_CREATED", "API_CALLS"
  count     Int
  month     Int      // YYYYMM
  createdAt DateTime @default(now())

  @@unique([orgId, metric, month])
}
```

---

### Phase 6 — Public API & Integrations

**Goal:** Allow third-party tools (accountants, ERPs, e-commerce platforms) to integrate with SmartBill.

#### API Keys

```prisma
model ApiKey {
  id          String   @id @default(cuid())
  keyHash     String   @unique   // Bcrypt hash of actual key
  name        String             // Human label: "Tally Integration"
  lastUsedAt  DateTime?
  permissions String[]           // Scoped permission keys
  orgId       String
  expiresAt   DateTime?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

API key format: `sk_live_xxxxxxxxxxxxxxxxxxxx`

#### Webhook System

```prisma
model Webhook {
  id          String   @id @default(cuid())
  url         String
  events      String[] // ["invoice.created", "payment.received"]
  secret      String   // For HMAC signature verification
  isActive    Boolean  @default(true)
  orgId       String
  lastCalledAt DateTime?
  failureCount Int     @default(0)
}

model WebhookDelivery {
  id          String   @id @default(cuid())
  webhookId   String
  event       String
  payload     Json
  statusCode  Int?
  responseBody String?
  success     Boolean
  attemptedAt DateTime @default(now())
}
```

**Events to support:**
- `invoice.created`, `invoice.paid`, `invoice.cancelled`
- `payment.received`, `payment.refunded`
- `customer.created`, `customer.updated`
- `stock.low`, `stock.adjusted`
- `po.created`, `po.received`

#### GST Portal Sync (Future)

Direct GSTR-1 / GSTR-3B filing via NIC GST APIs. Eliminate the need for manual tax filing.

#### Tally Export

Export SmartBill data as XML/Excel in Tally-compatible format. Thousands of Indian businesses use Tally — this integration makes the switch seamless.

---

### Phase 7 — Accountant Portal

**Goal:** A CA firm managing 20 clients can log in once and manage all of them.

```
CA Firm (their own Organization)
├── Client A: ABC Traders (separate Organization)
├── Client B: Suresh Hardware (separate Organization)
└── Client C: Ramesh Pharmacy (separate Organization)
```

**Delegation model:**
1. Business owner invites CA as "Accountant" with read-only access
2. CA's SmartBill account gains a "Manage Clients" dashboard
3. One login → switch between all client accounts
4. CA can view P&L, run reports, export GST — but cannot modify invoices

---

## 3. Data Isolation Strategy

### Row-Level Security (Application Layer)

SmartBill uses application-level RLS: every query includes an `orgId` / `shopId` filter. This is enforced in:

1. **API middleware**: `resolveOrganization()` extracts orgId from JWT, attaches to request context
2. **Service layer**: All database queries take `orgId` as required parameter
3. **Prisma middleware**: (future) Add Prisma middleware as a safety net to verify orgId is always present

```typescript
// lib/prismaMiddleware.ts
prisma.$use(async (params, next) => {
  const writeOperations = ['create', 'update', 'upsert', 'delete'];
  
  // Warn in dev if a write happens without orgId context
  if (writeOperations.includes(params.action) && process.env.NODE_ENV === 'development') {
    const hasOrgContext = params.args?.data?.orgId || params.args?.where?.orgId;
    if (!hasOrgContext) {
      console.warn(`[Security] Write to ${params.model} without orgId context!`);
    }
  }
  
  return next(params);
});
```

### Schema-per-Tenant vs RLS

At SmartBill's target scale (thousands of organizations), schema-per-tenant is not practical. Row-level security via application filters (the current approach) is correct and can handle millions of rows with proper indexing.

Revisit if/when a single org has >10M rows (large enterprise) — PostgreSQL native RLS or sharding may be needed.

---

## 4. Infrastructure Scaling

| Scale | Architecture |
|---|---|
| 0–1,000 orgs | Single Neon PostgreSQL + Vercel (current) |
| 1,000–10,000 orgs | Neon read replicas + Vercel Edge Functions |
| 10,000–100,000 orgs | Dedicated Neon project per region + CDN |
| 100,000+ orgs | Evaluate managed PgBouncer, horizontal sharding |

**Current Neon + Vercel stack is sufficient for Phase 1–3.** No infrastructure changes needed until product-market fit is established.

---

## 5. SaaS Launch Checklist

Before SmartBill can launch as a commercial SaaS product:

- [ ] Organization onboarding flow (sign up → create org → invite team → configure business)
- [ ] Subscription plans and payment integration (Razorpay)
- [ ] Plan feature gating in API and UI
- [ ] Usage metering and billing alerts
- [ ] Terms of Service and Privacy Policy
- [ ] Data deletion / GDPR-equivalent compliance (right to erasure)
- [ ] Data export (full export of org data in JSON/CSV)
- [ ] Uptime monitoring and status page
- [ ] Support ticketing system
- [ ] Email delivery setup (welcome, invoice, reminder emails)
- [ ] Security audit of permission middleware
- [ ] Rate limiting on API routes
- [ ] Backup and disaster recovery procedures documented

---

*Document Version: 1.0 | Last Updated: June 2026*
*Cross-references: [MODULE_ARCHITECTURE.md](MODULE_ARCHITECTURE.md) | [DATABASE_EVOLUTION_PLAN.md](DATABASE_EVOLUTION_PLAN.md) | [MOBILE_APP_PLAN.md](MOBILE_APP_PLAN.md)*
