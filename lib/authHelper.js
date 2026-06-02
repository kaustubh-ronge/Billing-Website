import { auth } from '@clerk/nextjs/server';
import { db } from './prisma';

/**
 * Retrieves the currently logged-in user from Clerk and queries our database 
 * to return the user and their associated Shop details.
 * 
 * @returns {Promise<Object|null>} The database user object with `shop` included, or null if unauthenticated.
 */
export async function getSessionUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { shop: true }
    });

    return user;
  } catch (error) {
    console.error("Authentication helper error:", error);
    return null;
  }
}
