import { checkUser } from "@/lib/checkUser";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req) {
  const user = await checkUser();
  if (!user || user.systemRole !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const [shops, total] = await Promise.all([
      db.shop.findMany({
        orderBy: { createdAt: "desc" },
        include: { plan: true },
        skip,
        take: limit,
      }),
      db.shop.count(),
    ]);

    // Fetch alerts: active plans expiring in <= 10 days
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
    const now = new Date();

    const expiringShops = await db.shop.findMany({
      where: {
        planExpiresAt: {
          gte: now,
          lte: tenDaysFromNow,
        },
      },
      include: { plan: true },
      orderBy: { planExpiresAt: "asc" },
    });

    return NextResponse.json({
      shops,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      alerts: expiringShops,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await checkUser();
  if (!user || user.systemRole !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { shopId, planId, planExpiresAt, isActive } = await req.json();

    if (!shopId) {
      return NextResponse.json({ error: "Shop ID is required" }, { status: 400 });
    }

    const updateData = {};
    if (planId !== undefined) {
      updateData.planId = planId || null;
    }
    if (planExpiresAt !== undefined) {
      updateData.planExpiresAt = planExpiresAt ? new Date(planExpiresAt) : null;
    }
    if (isActive !== undefined) {
      updateData.isActive = !!isActive;
    }

    const updatedShop = await db.shop.update({
      where: { id: shopId },
      data: updateData,
      include: { plan: true },
    });

    return NextResponse.json({ shop: updatedShop });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
