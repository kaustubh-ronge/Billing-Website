/**
 * Permission registry — the single source of truth for access control.
 *
 * Permissions are the PRIMARY access primitive. Roles are just reusable
 * bundles of these keys. The owner (isOwner) implicitly holds every permission.
 *
 * Key format: "<module>:<action>"
 */

export const PERMISSION_GROUPS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Home overview and analytics',
    permissions: [
      { key: 'dashboard:view', label: 'View Dashboard', description: 'See the home dashboard' },
    ],
  },
  {
    key: 'invoices',
    label: 'Billing & Invoices',
    description: 'Sales invoices and payment collection',
    permissions: [
      { key: 'invoices:view', label: 'View Invoices', description: 'Browse and open invoices' },
      { key: 'invoices:create', label: 'Create Invoices', description: 'Generate new bills' },
      { key: 'invoices:edit', label: 'Edit Invoices', description: 'Modify existing invoices' },
      { key: 'invoices:delete', label: 'Delete Invoices', description: 'Remove invoices (refunds stock)' },
      { key: 'payments:record', label: 'Record Payments', description: 'Log customer payments' },
      { key: 'reminders:send', label: 'Send Reminders', description: 'Send WhatsApp payment reminders' },
    ],
  },
  {
    key: 'customers',
    label: 'Customers',
    description: 'Customer directory and ledgers',
    permissions: [
      { key: 'customers:view', label: 'View Customers', description: 'Browse the customer directory' },
      { key: 'customers:create', label: 'Add Customers', description: 'Create new customer records' },
      { key: 'customers:edit', label: 'Edit Customers', description: 'Update customer details' },
      { key: 'customers:delete', label: 'Delete Customers', description: 'Remove customers' },
    ],
  },
  {
    key: 'products',
    label: 'Products & Inventory',
    description: 'Catalog and stock management',
    permissions: [
      { key: 'products:view', label: 'View Products', description: 'Browse the product catalog' },
      { key: 'products:create', label: 'Add Products', description: 'Add catalog items' },
      { key: 'products:edit', label: 'Edit Products', description: 'Update catalog items' },
      { key: 'products:delete', label: 'Delete Products', description: 'Remove catalog items' },
      { key: 'inventory:adjust', label: 'Adjust Stock', description: 'Manually change stock levels' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports & Finance',
    description: 'Revenue, outstanding, and exports',
    permissions: [
      { key: 'reports:view', label: 'View Reports', description: 'Open analytics and reports' },
      { key: 'reports:export', label: 'Export Reports', description: 'Download CSV / data exports' },
      { key: 'revenue:view', label: 'View Revenue', description: 'See sales revenue figures' },
      { key: 'outstanding:view', label: 'View Outstanding', description: 'See pending collections' },
    ],
  },
  {
    key: 'organization',
    label: 'Organization & Team',
    description: 'Employees, roles, structure, and audit',
    permissions: [
      { key: 'employees:view', label: 'View Employees', description: 'See the team roster' },
      { key: 'employees:invite', label: 'Invite Employees', description: 'Create employee invitations' },
      { key: 'employees:manage', label: 'Manage Employees', description: 'Edit, suspend, or remove employees' },
      { key: 'roles:manage', label: 'Manage Roles', description: 'Create and edit roles & permissions' },
      { key: 'org:manage', label: 'Manage Structure', description: 'Branches, departments, and teams' },
      { key: 'settings:manage', label: 'Manage Settings', description: 'Business profile, banking, invoicing' },
      { key: 'audit:view', label: 'View Activity Log', description: 'See the org-wide activity trail' },
    ],
  },
];

// Flat list of every permission key.
export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));

// key -> { label, description, group } lookup.
export const PERMISSION_META = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((g) =>
    g.permissions.map((p) => [p.key, { ...p, group: g.label, groupKey: g.key }])
  )
);

/**
 * Module access map — which permission(s) gate each navigable module.
 * A module is visible if the user holds AT LEAST ONE of the listed permissions.
 */
export const MODULE_ACCESS = {
  dashboard: ['dashboard:view'],
  invoices: ['invoices:view'],
  customers: ['customers:view'],
  products: ['products:view'],
  organization: ['employees:view', 'roles:manage', 'org:manage', 'audit:view'],
  settings: ['settings:manage'],
};

/**
 * Default seeded role templates. These are created per-shop the first time the
 * Roles page is opened (isSystem=true). They are starting points the owner can
 * clone or edit — NOT a fixed hierarchy.
 */
export const DEFAULT_ROLES = [
  {
    name: 'Billing Executive',
    description: 'Creates invoices and manages customers, no financial visibility',
    permissions: [
      'dashboard:view',
      'invoices:view', 'invoices:create', 'invoices:edit',
      'payments:record', 'reminders:send',
      'customers:view', 'customers:create', 'customers:edit',
      'products:view',
    ],
  },
  {
    name: 'Inventory Manager',
    description: 'Full control over products and stock levels',
    permissions: [
      'dashboard:view',
      'products:view', 'products:create', 'products:edit', 'products:delete',
      'inventory:adjust',
      'reports:view',
    ],
  },
  {
    name: 'Accountant',
    description: 'Financial visibility — revenue, outstanding, and reports',
    permissions: [
      'dashboard:view',
      'invoices:view', 'payments:record',
      'reports:view', 'reports:export',
      'revenue:view', 'outstanding:view',
      'customers:view',
    ],
  },
  {
    name: 'Collection Officer',
    description: 'Chases outstanding payments and sends reminders',
    permissions: [
      'dashboard:view',
      'customers:view',
      'invoices:view',
      'outstanding:view',
      'reminders:send',
      'payments:record',
    ],
  },
  {
    name: 'Store Manager',
    description: 'Runs day-to-day operations across sales and inventory',
    permissions: [
      'dashboard:view',
      'invoices:view', 'invoices:create', 'invoices:edit', 'invoices:delete',
      'payments:record', 'reminders:send',
      'customers:view', 'customers:create', 'customers:edit',
      'products:view', 'products:create', 'products:edit', 'inventory:adjust',
      'reports:view', 'revenue:view', 'outstanding:view',
    ],
  },
];

/** Validate that an array contains only known permission keys. */
export function sanitizePermissions(keys) {
  if (!Array.isArray(keys)) return [];
  const valid = new Set(ALL_PERMISSIONS);
  return [...new Set(keys.filter((k) => valid.has(k)))];
}
