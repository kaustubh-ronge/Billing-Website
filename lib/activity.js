import { db } from '@/lib/prisma';

/**
 * Record an activity log entry. Fire-and-forget — never throws into the caller,
 * so a logging failure can't break a business operation.
 *
 * @param {object} p
 * @param {string} p.shopId
 * @param {string} [p.userId]
 * @param {string} p.action       e.g. "invoice.create"
 * @param {string} [p.entityType] e.g. "Invoice"
 * @param {string} [p.entityId]
 * @param {string} [p.description] human-readable summary
 * @param {object} [p.metadata]   extra JSON context
 */
export async function logActivity({ shopId, userId, action, entityType, entityId, description, metadata }) {
  if (!shopId || !action) return;
  try {
    await db.activityLog.create({
      data: {
        shopId,
        userId: userId ?? null,
        action,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
        description: description ?? null,
        metadata: metadata ?? undefined,
      },
    });
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
  }
}
