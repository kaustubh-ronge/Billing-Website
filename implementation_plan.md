# Platform-Level Business Registration Approval System

This document outlines the architectural changes, database modifications, and UI additions required to transition the application into a managed SaaS platform with an approval workflow.

## User Review Required

> [!WARNING]
> This plan reflects your feedback to use a single `User` table, an Enum for the Admin role, and allow you to toggle admins directly in the database.
> - **Schema Change**: We will make `shopId` optional on the `User` table. This allows a User record to be created immediately upon sign-in *before* they have an approved business.
> - **Admin Workflow**: To make someone an admin, they just sign in with Clerk once. Then you go into your database and change their `systemRole` to `ADMIN`.
> - Please confirm if you want to use `npx prisma db push` to push these schema changes.

---

## Proposed Changes

### 1. Database Schema (`prisma/schema.prisma`)
We will introduce a `SystemRole` enum on the existing `User` table, make `shopId` optional, and add the `RegistrationRequest` model.

#### [MODIFY] `prisma/schema.prisma`
- **Update `User` Model**:
  ```prisma
  enum SystemRole {
    USER
    ADMIN
  }

  model User {
    id      String  @id @default(cuid())
    clerkId String  @unique
    name    String
    email   String  @unique
    // ... existing fields
    
    systemRole SystemRole @default(USER) // NEW: Toggle this to ADMIN in DB
    
    shopId String? // CHANGED: Made optional so users can exist before business approval
    shop   Shop?   @relation(fields: [shopId], references: [id], onDelete: Cascade)
    
    registrationRequest RegistrationRequest?
  }
  ```
- **Add `RegistrationRequest` Model**:
  ```prisma
  enum RegistrationStatus {
    PENDING
    APPROVED
    REJECTED
  }

  model RegistrationRequest {
    id           String   @id @default(cuid())
    businessName String
    taxId        String?
    phone        String?
    address      String?
    status       RegistrationStatus @default(PENDING)
    
    userId       String   @unique
    user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt
  }
  ```

---

### 2. User Synchronization (`lib/checkUser.js`)
We will simplify `checkUser` to instantly create a User record without a Shop.

#### [MODIFY] `lib/checkUser.js`
- **Step 1**: Check `User` (existing users). Return if found.
- **Step 2**: Check pending `Invitation`. If found, provision them as an employee (preserves existing behavior).
- **Step 3**: If brand-new user, **create the `User` record immediately** with `shopId = null`. (This allows you to see them in the DB to make them an ADMIN if you want).
- *We will also ensure `registrationRequest` is included when fetching the user.*

---

### 3. Route Protection (`app/(app)/layout.jsx`)
Enforce the new routing states from `checkUser`.

#### [MODIFY] `app/(app)/layout.jsx`
- Add redirect handlers for the new states:
  ```javascript
  if (user.systemRole === 'ADMIN') redirect('/admin');
  if (user.registrationRequest && user.registrationRequest.status === 'PENDING') redirect('/pending-approval');
  if (!user.shopId) redirect('/register-business');
  ```

---

### 4. New Onboarding Routes
Create a new route group `(onboarding)` that lives completely outside of the main `(app)` layout to avoid redirect loops and to provide a clean, unauthenticated-style shell.

#### [NEW] `app/(onboarding)/register-business/page.jsx`
- A premium, polished form collecting business details (Business Name, Tax ID, Phone, Address).
- Submitting this form calls a Server Action to create a `RegistrationRequest` linked to their `userId`.

#### [NEW] `app/(onboarding)/pending-approval/page.jsx`
- A professional waiting page indicating the request is under review by a platform administrator.

---

### 5. Platform Admin Dashboard
Create a highly isolated `(admin)` route group. Normal users will never be able to access this.

#### [NEW] `app/(admin)/admin/layout.jsx`
- Isolated layout with a distinct Sidebar (Overview, Registration Queue, Organizations).
- Layout level check: `if (user.systemRole !== 'ADMIN') redirect('/')`

#### [NEW] `app/(admin)/admin/page.jsx`
- Platform metrics: Total Orgs, Pending Approvals, Active Users.

#### [NEW] `app/(admin)/admin/requests/page.jsx`
- A data table showing all `PENDING` registration requests, newest first.

#### [NEW] `app/(admin)/admin/requests/[id]/page.jsx` (and Server Actions)
- Detail view for the administrator to review the application.
- **Approve Action**: Creates the `Shop`, updates the user's `shopId`, marks the request `APPROVED`, and makes the user `isOwner = true`.
- **Reject Action**: Marks request `REJECTED`.

---

## Verification Plan

### Automated/Code Verification
- Ensure `npm run dev` compiles successfully with the new route groups.
- Run `npx prisma db push` and `npx prisma generate` to verify schema compilation.

### Manual Verification
1. **Existing User**: Sign in with an existing account to ensure the dashboard loads normally.
2. **New User**: Sign up with a new Clerk account. Verify redirection to `/register-business`.
3. **Registration Flow**: Submit the form. Verify redirection to `/pending-approval`.
4. **Admin Flow**: Sign in with a different Clerk account. Go to the database, set `systemRole = ADMIN`. Refresh the page. Verify redirection to `/admin`.
5. **Approval Flow**: As the admin, approve the pending request from Step 3. 
6. **Activation**: Sign back in as the new user and verify access to the newly created Organization Dashboard.
