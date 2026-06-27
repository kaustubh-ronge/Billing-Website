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

  // Create the Shop and update User with strict concurrency control
  await db.$transaction(async (tx) => {
    // 1. Verify the request is still pending INSIDE the transaction to avoid race conditions
    const currentReq = await tx.registrationRequest.findUnique({
      where: { id: requestId },
    });

    if (!currentReq || currentReq.status !== "PENDING") {
      throw new Error("This request has already been processed by another admin.");
    }

    // 2. Create the Shop
    const shop = await tx.shop.create({
      data: {
        businessName: req.businessName,
        taxId: req.taxId,
        phone: req.phone,
        address: req.address,
        ownerName: req.user.name,
        email: req.user.email,
        subscriptionPlan: "FREE",
      },
    });

    // 3. Link the shop to the user and mark as owner
    await tx.user.update({
      where: { id: req.user.id },
      data: {
        shopId: shop.id,
        isOwner: true,
      },
    });

    // 4. Mark request as approved
    await tx.registrationRequest.update({
      where: { id: req.id },
      data: { status: "APPROVED" },
    });
    
    // 5. Log activity
    await tx.activityLog.create({
      data: {
        shopId: shop.id,
        userId: req.user.id,
        action: 'business.approved',
        entityType: 'Shop',
        entityId: shop.id,
        description: 'Business registration was approved by Platform Admin. Shop ID generated.',
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
