import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma'; 

export const checkUser = async () => {
  try {
    const clerkUser = await currentUser();

    // 1. If not logged into Clerk, abort silently
    if (!clerkUser) return null;

    // 2. Check if user already exists in our DB
    const loggedInUser = await db.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: { shop: true } 
    });

    if (loggedInUser) return loggedInUser;

    // 3. IF NEW USER: Create Shop and User simultaneously
    const newUser = await db.$transaction(async (tx) => {
      // Create the default isolated Tenant (Shop)
      const newShop = await tx.shop.create({
        data: {
          businessName: `${clerkUser.firstName || 'My'}'s Business`,
          subscriptionPlan: "FREE",
        },
      });

      // Create the User and assign them as the OWNER of the new Shop
      const createdUser = await tx.user.create({
        data: {
          clerkId: clerkUser.id,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
          email: clerkUser.emailAddresses[0].emailAddress,
          role: "OWNER", 
          shopId: newShop.id,
        },
        include: { shop: true },
      });

      return createdUser;
    });

    return newUser;

  } catch (error) {
    if (error.message?.includes('Dynamic server usage') || error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    console.error("Critical Error Syncing User:", error);
    return null;
  }
}