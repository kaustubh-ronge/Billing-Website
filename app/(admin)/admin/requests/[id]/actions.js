"use server";

import { db } from "@/lib/prisma";
import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";

export async function approveRequest(requestId) {
  const user = await checkUser();
  if (!user || user.systemRole !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const req = await db.registrationRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });

  if (!req || req.status !== "PENDING") {
    throw new Error("Invalid request");
  }

  // Create the Shop and update User
  await db.$transaction(async (tx) => {
    // Find or create default 1 Month Trial plan
    let trialPlan = await tx.subscriptionPlan.findFirst({
      where: { name: "1 Month Trial" }
    });
    if (!trialPlan) {
      trialPlan = await tx.subscriptionPlan.create({
        data: {
          name: "1 Month Trial",
          durationDays: 30,
          price: 0,
        }
      });
    }

    const shop = await tx.shop.create({
      data: {
        businessName: req.businessName,
        taxId: req.taxId,
        phone: req.phone,
        address: req.address,
        ownerName: req.user.name,
        email: req.user.email,
        subscriptionPlan: "FREE",
        planId: trialPlan.id,
        planExpiresAt: null,
      },
    });

    await tx.user.update({
      where: { id: req.user.id },
      data: {
        shopId: shop.id,
        isOwner: true,
      },
    });

    await tx.registrationRequest.update({
      where: { id: req.id },
      data: { status: "APPROVED" },
    });
    
    // Log activity
    await tx.activityLog.create({
      data: {
        shopId: shop.id,
        userId: req.user.id,
        action: 'business.approved',
        entityType: 'Shop',
        entityId: shop.id,
        description: 'Business registration was approved by Platform Admin',
      },
    });
  });

  redirect("/admin/requests");
}

export async function rejectRequest(requestId) {
  const user = await checkUser();
  if (!user || user.systemRole !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await db.registrationRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED" },
  });

  redirect("/admin/requests");
}
