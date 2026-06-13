# SmartBill — Documentation Inconsistencies

> Conflicts between documentation files, outdated specs, duplicate definitions,
> and promises not reflected anywhere in the codebase.

---

## DI-01: Payment Terms Enum — Three Different Definitions

**Files:** `docs/BUSINESS_WORKFLOWS.md`, `docs/DATABASE_EVOLUTION_PLAN.md`, `prisma/schema.prisma`

**Conflict:**
- `docs/BUSINESS_WORKFLOWS.md` lists payment terms as: IMMEDIATE, NET_7, NET_15, NET_30, CUSTOM
- `docs/DATABASE_EVOLUTION_PLAN.md` Phase 1 adds NET_45 to the enum
- `prisma/schema.prisma` already has: IMMEDIATE, NET_7, NET_15, NET_30, NET_45, CUSTOM

The schema is ahead of some documentation. `docs/BUSINESS_WORKFLOWS.md` still lists only 5 options, omitting NET_45.

**Impact:** Minor confusion for developers reading the workflow doc.

---

## DI-02: InvoiceStatus Enum — Differing Values

**Files:** `docs/DATABASE_EVOLUTION_PLAN.md`, `prisma/schema.prisma`

**Conflict:**
- `docs/DATABASE_EVOLUTION_PLAN.md` documents InvoiceStatus as: PENDING, PARTIAL, PAID, OVERDUE, CANCELLED, WRITTEN_OFF
- `prisma/schema.prisma` only has: PENDING, PARTIAL, PAID

The OVERDUE, CANCELLED, and WRITTEN_OFF statuses are documented in the evolution plan as Phase 1 additions, but Phase 1 was supposedly completed when the current schema was committed. The schema does not include them.

**Impact:** Overdue detection (the most important AR feature) depends on the OVERDUE status. WRITTEN_OFF is needed for the bad-debt workflow. Both are documented as Phase 1 but not implemented.

---

## DI-03: CollectionStatus — Documented in AR System but Not in Evolution Plan

**Files:** `docs/ACCOUNTS_RECEIVABLE_SYSTEM.md`, `docs/DATABASE_EVOLUTION_PLAN.md`

**Conflict:**
`docs/ACCOUNTS_RECEIVABLE_SYSTEM.md` defines a new `CollectionStatus` enum:
```
CURRENT, WATCHLIST, AT_RISK, DELINQUENT, ESCALATED, LEGAL
```
and says this field should be added to the Invoice model.

`docs/DATABASE_EVOLUTION_PLAN.md` Phase 3 mentions collection fields but uses different terminology and does not list this enum. The AR document was added later without updating the evolution plan.

**Impact:** Two specs exist for the same field with no reconciled definition. A developer implementing this would not know which to follow.

---

## DI-04: Payment Model Fields — AR System vs Current Schema

**Files:** `docs/ACCOUNTS_RECEIVABLE_SYSTEM.md`, `prisma/schema.prisma`

**Conflict:**
`docs/ACCOUNTS_RECEIVABLE_SYSTEM.md` specifies additional Payment model fields:
```
chequeNumber    String?
chequeDate      DateTime?
bankName        String?
chequeCleared   Boolean @default(false)
chequeClearedAt DateTime?
reconciled      Boolean @default(false)
```

These are NOT in `prisma/schema.prisma`. The Payment model only has `referenceNumber String?`.

`docs/BUSINESS_WORKFLOWS.md` also mentions cheque bounce handling as a workflow that requires these fields.

**Impact:** Three documents (AR System, Business Workflows, DB Evolution Plan) all imply cheque tracking, but schema is 5 fields behind.

---

## DI-05: Customer Model — riskLevel Field Discrepancy

**Files:** `docs/ACCOUNTS_RECEIVABLE_SYSTEM.md`, `docs/DATABASE_EVOLUTION_PLAN.md`, `prisma/schema.prisma`

**Conflict:**
- `docs/ACCOUNTS_RECEIVABLE_SYSTEM.md` specifies `riskLevel RiskLevel @default(NORMAL)` with enum `LOW, NORMAL, MEDIUM, HIGH, CRITICAL`
- `docs/DATABASE_EVOLUTION_PLAN.md` Phase 3 mentions `riskLevel` with values `LOW, MEDIUM, HIGH`
- `prisma/schema.prisma` has neither `riskLevel` field nor `RiskLevel` enum

Two documents define the same field with incompatible enum values (one has NORMAL and CRITICAL; the other does not).

---

## DI-06: API URL Pattern — Documented as /api/v1/ but Implemented as /api/

**Files:** `docs/MODULE_ARCHITECTURE.md`, all API route files

**Conflict:**
`docs/MODULE_ARCHITECTURE.md` specifies:
> "All API routes follow the pattern `/api/v1/{resource}`"
> Examples: `/api/v1/invoices`, `/api/v1/customers`, `/api/v1/products`

Actual implementation uses `/api/invoices`, `/api/customers`, `/api/products` — no version prefix.

**Impact:** The versioning standard documented in the architecture guide is not followed. Adding `/v1/` later would be a breaking change for any external callers (future webhooks or public API).

---

## DI-07: Feature Status Tags vs Reality

**Files:** `docs/FEATURE_CATALOG.md`

**Conflict:**
`docs/FEATURE_CATALOG.md` tags many features as "Exists" that do not exist in the codebase:

| Feature | Tag in Catalog | Actual Status |
|---|---|---|
| Product HSN code | "Exists" | ❌ Not in schema |
| Invoice edit | "Planned" | ❌ No API or UI |
| Invoice cancel | "Planned" | ❌ No endpoint, no status enum value |
| Cheque tracking | "Exists" | ⚠️ Only referenceNumber field |
| Customer risk level | "Planned" | ❌ Not in schema |
| Pending payments page | "Planned" | ❌ No route or page |
| Expense tracking | "Planned" | ❌ No model, no API, no UI |
| GST reports | "Planned" | ❌ Zero implementation |
| Audit log | "Planned" | ❌ No model, no API |
| Notifications | "Planned" | ❌ No model, no UI |

The feature catalog is aspirational, not descriptive. It does not clearly distinguish between "exists in production" vs "exists in planning document."

---

## DI-08: Role vs Employee Naming

**Files:** `docs/DATABASE_EVOLUTION_PLAN.md`, `docs/MODULE_ARCHITECTURE.md`, `prisma/schema.prisma`

**Conflict:**
- `prisma/schema.prisma` has a `User` model with a `role` enum (OWNER/MANAGER/CASHIER)
- `docs/DATABASE_EVOLUTION_PLAN.md` Phase 2 renames `User` → `Employee` and adds a new `CustomRole` model, making the simple `role` enum obsolete
- `docs/MODULE_ARCHITECTURE.md` refers to "employees" throughout but the schema still uses "users"
- `docs/PRIORITY_ROADMAP.md` Phase 3 "Permission System" says "replace User model with Employee model"

The naming inconsistency between User/Employee and Role/CustomRole spans all planning documents and the schema without a single source of truth for which model will remain.

---

## DI-09: SaaS Evolution Plan vs Priority Roadmap Phase Numbers

**Files:** `docs/SAAS_EVOLUTION_PLAN.md`, `docs/PRIORITY_ROADMAP.md`

**Conflict:**
- `docs/SAAS_EVOLUTION_PLAN.md` defines 7 phases: Phase 1 (Core SaaS), Phase 2 (Multi-tenant), Phase 3 (White-label), etc.
- `docs/PRIORITY_ROADMAP.md` defines 8 phases: Phase 1 (Foundation/UX), Phase 2 (AR), Phase 3 (Permissions), Phase 4 (Purchase), etc., with SaaS only at Phase 8

The phase numbers in both documents describe completely different things. "Phase 3" in the SaaS doc means white-labeling; "Phase 3" in the Priority Roadmap means permissions. A developer cross-referencing these would be confused.

**Impact:** Makes planning conversations ambiguous ("we're in Phase 3" means nothing without specifying which document).

---

## DI-10: Organization Model — Two Different Designs

**Files:** `docs/DATABASE_EVOLUTION_PLAN.md`, `docs/SAAS_EVOLUTION_PLAN.md`

**Conflict:**
- `docs/DATABASE_EVOLUTION_PLAN.md` Phase 2 defines Organization with fields: `id`, `name`, `domain`, `plan`, `ownerId`, and says `Shop` becomes `Branch`
- `docs/SAAS_EVOLUTION_PLAN.md` defines an Organization model with different fields including `logoUrl`, `primaryColor`, `customDomain`, `trialEndsAt`, `billingEmail`

The two documents define different shapes for the Organization model. The DB Evolution Plan focuses on the data hierarchy (Org → Branch → Employee). The SaaS Evolution Plan focuses on white-labeling. Neither references the other, and combining them would require a merge that neither document does.

---

## DI-11: AR System Cron Endpoint Name

**Files:** `docs/ACCOUNTS_RECEIVABLE_SYSTEM.md`, `docs/MODULE_ARCHITECTURE.md`

**Conflict:**
- `docs/ACCOUNTS_RECEIVABLE_SYSTEM.md` specifies the cron endpoint as `/api/cron/ar-reminder-engine`
- `docs/MODULE_ARCHITECTURE.md` lists 6 cron jobs including: `overdue-detector`, `reminder-sender`, `recurring-invoices`, `stock-alerts`, `analytics-cache`, `subscription-check`

The AR doc specifies a single combined engine (`ar-reminder-engine`) while the Architecture doc splits this into `overdue-detector` + `reminder-sender`. The trigger interval also differs:
- AR doc: "runs daily at 9AM"
- Architecture doc: `overdue-detector` runs daily; `reminder-sender` runs every 6 hours

---

## DI-12: Real World Gap Analysis vs Feature Catalog Status

**Files:** `docs/REAL_WORLD_GAP_ANALYSIS.md`, `docs/FEATURE_CATALOG.md`

**Conflict:**
`docs/FEATURE_CATALOG.md` marks several features as "Exists" or "Tier 1":
- "Multi-user support" → FEATURE_CATALOG: Tier 1 / "Exists"
- `docs/REAL_WORLD_GAP_ANALYSIS.md` explicitly says: "Permissions are 🔴 RED" and "A cashier sees the same thing as the owner. Role field stored, never checked."

`FEATURE_CATALOG.md` appears to have been written optimistically or was not updated after the gap analysis. The gap analysis is more accurate.

---

## DI-13: Documented Invoice Edit Workflow — No Implementation, No Plan

**Files:** `docs/BUSINESS_WORKFLOWS.md`

**Issue:**
`docs/BUSINESS_WORKFLOWS.md` describes an "Invoice Edit" workflow that requires:
- Re-validating stock on edit
- Adjusting inventory if quantities change
- Re-computing credit used if customer changes
- Audit trail of changes

None of the other 10 documents mention this workflow as a priority or include it in a sprint plan. There is no P1/P2/P3 classification in `docs/MISSING_IMPLEMENTATIONS.md` for Invoice Edit. It may be a documented requirement without a priority.

---

## Summary

| ID | Files Involved | Type | Severity |
|---|---|---|---|
| DI-01 | BUSINESS_WORKFLOWS + schema | Missing enum value in doc | Low |
| DI-02 | DB_EVOLUTION_PLAN + schema | Phase 1 items not in schema | HIGH |
| DI-03 | AR_SYSTEM + DB_EVOLUTION_PLAN | Two separate specs not reconciled | Medium |
| DI-04 | AR_SYSTEM + schema | 6 fields documented but absent | HIGH |
| DI-05 | AR_SYSTEM + DB_EVOLUTION + schema | riskLevel enum conflict | Medium |
| DI-06 | MODULE_ARCHITECTURE + all API files | /api/v1/ vs /api/ | Medium |
| DI-07 | FEATURE_CATALOG | "Exists" tags for non-existent features | HIGH |
| DI-08 | All docs + schema | User vs Employee naming | Medium |
| DI-09 | SAAS_PLAN + PRIORITY_ROADMAP | Phase numbers mean different things | Low |
| DI-10 | DB_EVOLUTION + SAAS_PLAN | Two different Org model shapes | Medium |
| DI-11 | AR_SYSTEM + MODULE_ARCHITECTURE | Cron endpoint name and frequency conflict | Low |
| DI-12 | FEATURE_CATALOG + GAP_ANALYSIS | "Exists" vs "🔴 RED" for same feature | HIGH |
| DI-13 | BUSINESS_WORKFLOWS only | Documented workflow with no implementation plan | Medium |

**4 HIGH severity inconsistencies** that could mislead developers implementing new features.

*Generated: June 2026*
