"use server";

import { db } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function submitRegistration(formData) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("Not authenticated");
  }

  const businessName = formData.get("businessName");
  const taxId = formData.get("taxId");
  const phone = formData.get("phone");
  const address = formData.get("address");

  if (!businessName) {
    throw new Error("Business name is required");
  }

  // Ensure the user exists in our DB
  const user = await db.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (!user) {
    throw new Error("User record not found. Please log in again.");
  }

  // Check if they already have a request
  const existingReq = await db.registrationRequest.findUnique({
    where: { userId: user.id },
  });

  if (existingReq) {
    redirect("/pending-approval");
  }

  // Create registration request
  await db.registrationRequest.create({
    data: {
      userId: user.id,
      businessName,
      taxId,
      phone,
      address,
    },
  });

  redirect("/pending-approval");
}
