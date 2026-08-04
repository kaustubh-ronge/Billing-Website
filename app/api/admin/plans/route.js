import { checkUser } from "@/lib/checkUser";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await checkUser();
  if (!user || user.systemRole !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const plans = await db.subscriptionPlan.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ plans });
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
    const { name, durationDays, price } = await req.json();
    if (!name || !durationDays) {
      return NextResponse.json({ error: "Name and duration are required" }, { status: 400 });
    }

    const plan = await db.subscriptionPlan.create({
      data: {
        name,
        durationDays: parseInt(durationDays),
        price: parseFloat(price || 0)
      }
    });

    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const user = await checkUser();
  if (!user || user.systemRole !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { id, isActive, name, durationDays, price } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    const updateData = {};
    if (isActive !== undefined) {
      updateData.isActive = !!isActive;
    }
    if (name !== undefined) {
      updateData.name = name;
    }
    if (durationDays !== undefined) {
      updateData.durationDays = parseInt(durationDays);
    }
    if (price !== undefined) {
      updateData.price = parseFloat(price);
    }

    const updatedPlan = await db.subscriptionPlan.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ plan: updatedPlan });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
