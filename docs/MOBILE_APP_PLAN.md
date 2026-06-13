# SmartBill — Mobile App Plan

> Architecture and roadmap for extending SmartBill to React Native (iOS + Android) without duplicating business logic.

---

## 1. Architecture Principle: API-First

The most important architectural decision for the mobile app is already made: **all business logic lives in the Next.js API layer**.

The mobile app is a presentation layer that:
- Authenticates the user
- Calls the same `/api/v1/` endpoints the web app uses
- Renders the response in a mobile-optimized UI

```
┌───────────────────┐   ┌───────────────────┐
│   Web App         │   │  Mobile App        │
│  (Next.js)        │   │  (React Native)    │
└────────┬──────────┘   └────────┬──────────┘
         │                       │
         └──────────┬────────────┘
                    │ /api/v1/ endpoints
         ┌──────────▼────────────┐
         │   Business Logic      │
         │   (Next.js API Routes)│
         └──────────┬────────────┘
                    │
         ┌──────────▼────────────┐
         │   PostgreSQL (Neon)   │
         └───────────────────────┘
```

**This means:**
- No duplicated validation, calculation, or business rules
- Any bug fixed in the API is fixed for both web and mobile
- New features added to the API are immediately available to mobile
- Permission system enforced identically (server-side check, not mobile-side)

---

## 2. Technology Choice

### React Native + Expo

**Why Expo:**
- Team already knows React — 70–80% skills transfer
- Expo SDK handles the hard native integrations (camera, notifications, biometrics)
- Expo Go for rapid development (no Xcode/Android Studio required during development)
- EAS Build for production builds without managing native build infrastructure
- Clerk provides `@clerk/clerk-expo` — same auth as the web app

**Why not Flutter:**
- Team uses TypeScript/React — Flutter requires Dart (new language)
- Shared component logic with web is harder in Flutter
- React Native allows potential code sharing via a shared `types/` package

**Why not PWA only:**
- PWA does not support native camera for barcode scanning
- Push notifications are limited on iOS PWA
- PWA install rates are much lower than App Store/Play Store
- PWA is still a good bridge strategy while native app is built

---

## 3. PWA Bridge (Immediate — Before Native App)

Before investing in a native app, implement a Progressive Web App that improves the mobile web experience.

### PWA Implementation

Add to Next.js:

```json
// public/manifest.json
{
  "name": "SmartBill",
  "short_name": "SmartBill",
  "description": "Business Operating Platform",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563EB",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

PWA capabilities:
- **Install to home screen**: Users can install SmartBill like an app
- **Offline basic cache**: Service worker caches the dashboard for offline viewing
- **Push notifications**: Web Push API for payment reminders (limited iOS support)
- **Full-screen mode**: Looks like a native app when launched from home screen

PWA is a 1-2 day investment that immediately improves the mobile experience for existing users.

---

## 4. API Requirements for Mobile

The existing API routes need these additions before mobile can consume them cleanly:

### Pagination

Every list endpoint must support pagination:
```
GET /api/v1/sales/invoices?page=1&pageSize=25
GET /api/v1/sales/invoices?cursor=cldxxx&pageSize=25  (cursor-based for infinite scroll)
```

Response includes:
```json
{
  "data": [...],
  "meta": { "hasMore": true, "nextCursor": "cldyyy", "total": 142 }
}
```

### Optimized Mobile Endpoints

Mobile needs lean response shapes — don't return the full object graph when only a summary is needed:

```
GET /api/v1/dashboard/summary          → KPI numbers only (fast)
GET /api/v1/sales/invoices?fields=id,invoiceNum,customer.name,status,grandTotal,amountPaid
GET /api/v1/customers?fields=id,name,phone,creditUsed
```

### Offline-Supportive Design

Mobile operations that need to work offline:
- Create invoice (queue if offline, sync when online)
- Record payment (queue if offline)
- View dashboard (cached version)
- Customer lookup (cached list)

This requires responses to include stable IDs and sufficient data for offline display.

---

## 5. Authentication

Clerk provides `@clerk/clerk-expo` for React Native:

```bash
npx expo install @clerk/clerk-expo expo-secure-store
```

```typescript
// App.tsx
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

export default function App() {
  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_KEY}
      tokenCache={tokenCache}
    >
      <RootNavigator />
    </ClerkProvider>
  );
}
```

The same JWT tokens that authenticate the web app are used on mobile. No separate auth system.

---

## 6. Mobile App Screen Map

### Bottom Navigation (Main Tabs)

```
┌────┬────────┬──────────┬─────────┬──────┐
│ 🏠 │   📄   │    👥    │   📦   │  ⋯   │
│Home│  Sales │Customers │Inventory│ More │
└────┴────────┴──────────┴─────────┴──────┘
```

### Screen Inventory

**Home Tab:**
- Dashboard Screen: Revenue KPIs, quick action buttons, recent activity, alerts

**Sales Tab:**
- Invoice List Screen
- Invoice Detail Screen
- Create Invoice Screen (Quick Sale flow)
- Payment Recording Screen

**Customers Tab:**
- Customer List Screen
- Customer Detail Screen (with ledger, contact info)
- Customer Statement Screen

**Inventory Tab:**
- Product List Screen
- Product Detail + Stock History
- Stock Adjustment Screen
- Barcode Scanner Screen

**More Tab (drawer/menu):**
- Purchase Orders
- Suppliers
- Expenses
- Reports
- Approvals (Owner/Manager)
- Team Management (Owner)
- Settings
- Help & Support

---

## 7. Key Mobile-Specific Features

### Quick Sale (Priority #1)

The most-used flow for a cashier. Target: under 30 seconds from open to saved invoice.

```
1. Tap "New Sale" FAB (floating action button)
2. Customer: Recent customers shown as cards + search box
3. Items:
   a) [Scan Barcode] → camera opens → product found → added
   b) Search by name → select → quantity set
4. Amounts shown updating in real time
5. Payment: Large method buttons (Cash / UPI / Card / Credit)
6. [Save Invoice] — big green button
7. Success screen: Share on WhatsApp button
```

### Barcode Scanner

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';

function BarcodeScanner({ onScan }) {
  const [permission, requestPermission] = useCameraPermissions();

  return (
    <CameraView
      onBarcodeScanned={({ data }) => onScan(data)}
      barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr'] }}
    />
  );
}

// When barcode scanned:
const product = await fetch(`/api/v1/inventory/products?barcode=${barcode}`);
// Product auto-added to invoice
```

### Offline Billing

```typescript
// lib/offlineQueue.ts — simple MMKV-based queue
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export function queueInvoice(invoice: CreateInvoicePayload) {
  const queue = JSON.parse(storage.getString('invoiceQueue') ?? '[]');
  queue.push({ ...invoice, offlineId: Date.now(), queuedAt: new Date() });
  storage.set('invoiceQueue', JSON.stringify(queue));
}

export async function syncOfflineQueue() {
  const queue = JSON.parse(storage.getString('invoiceQueue') ?? '[]');
  for (const invoice of queue) {
    try {
      await createInvoice(invoice);
      // Remove from queue on success
    } catch (e) {
      // Leave in queue, retry next sync
    }
  }
}
```

Sync triggered when:
- App comes to foreground (via `AppState` event)
- Network connectivity restored (via `NetInfo`)
- Manual "Sync" button tapped

### Biometric Authentication

```typescript
import * as LocalAuthentication from 'expo-local-authentication';

async function biometricLogin() {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Verify your identity',
    fallbackLabel: 'Use PIN',
  });
  if (result.success) {
    // Restore Clerk session from secure store
  }
}
```

### Push Notifications (FCM + APNs)

```typescript
import * as Notifications from 'expo-notifications';

// Register device token
const token = await Notifications.getExpoPushTokenAsync();
await fetch('/api/v1/org/employees/push-token', {
  method: 'POST',
  body: JSON.stringify({ token: token.data })
});
```

Notification types sent to mobile:
- `PAYMENT_RECEIVED` → "Ramesh Traders paid ₹8,000"
- `INVOICE_OVERDUE` → "ABC Hardware invoice overdue — ₹32,000"
- `LOW_STOCK` → "Cement 50kg running low — 12 bags remaining"
- `APPROVAL_REQUIRED` → "Ravi requesting 20% discount on invoice"

---

## 8. Offline Data Strategy

### What to Cache Locally (MMKV)

| Data | Cache Strategy | Stale After |
|---|---|---|
| Customer list | Cache on fetch, refresh on focus | 5 minutes |
| Product list | Cache on fetch, refresh on focus | 5 minutes |
| Dashboard KPIs | Cache on fetch, background refresh | 1 minute |
| Recent invoices | Cache last 50 invoices | 15 minutes |
| Settings/config | Cache indefinitely, refresh on settings change | Never (until changed) |

### What NEVER to Cache

- Payment status (always real-time)
- Stock counts (always real-time to prevent over-selling)
- Approval status (always real-time)

### Conflict Resolution

When a record modified offline conflicts with a server change:
- Last-write-wins for non-financial data (customer notes, etc.)
- Server-wins for financial data (invoice amounts, payment status)
- Flag conflict for manual review if both sides changed critical fields

---

## 9. Development Roadmap

### Stage 1: PWA (2 weeks)
- Add manifest.json and service worker to existing Next.js app
- Optimize mobile viewport and touch targets
- Test all existing flows at 375px

### Stage 2: React Native Scaffold (2 weeks)
- Initialize Expo project
- Wire Clerk authentication
- Set up navigation (Expo Router)
- Connect to API with shared TypeScript types

### Stage 3: Core Billing Screens (4 weeks)
- Dashboard
- Invoice List + Detail
- Create Invoice (Quick Sale)
- Customer List + Ledger
- Record Payment

### Stage 4: Inventory Screens (2 weeks)
- Product List + Detail
- Barcode Scanner
- Stock Adjustment

### Stage 5: Native Features (2 weeks)
- Push Notifications
- Biometric Auth
- Offline Queue + Sync
- App Store / Play Store submission

### Stage 6: Advanced Features (ongoing)
- Expense Recording
- Purchase Order Management
- Team Management (Owner)
- Reports & Export

---

## 10. Shared Code Between Web and Mobile

| Layer | Sharing Approach |
|---|---|
| Types | `packages/types/` shared TypeScript types for API request/response |
| API Client | `packages/api-client/` shared fetch wrappers |
| Validation | `packages/validation/` shared Zod schemas |
| Business constants | `packages/constants/` permission keys, status enums |
| UI components | NOT shared — web uses shadcn/ui, mobile uses React Native Paper |
| Business logic | All on server (Next.js API) — not shared/duplicated |

---

*Document Version: 1.0 | Last Updated: June 2026*
*Cross-references: [SAAS_EVOLUTION_PLAN.md](SAAS_EVOLUTION_PLAN.md) | [MODULE_ARCHITECTURE.md](MODULE_ARCHITECTURE.md) | [FEATURE_CATALOG.md](FEATURE_CATALOG.md)*
