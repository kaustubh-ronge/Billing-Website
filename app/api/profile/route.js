export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function GET() {
  // Any active member can read the shop profile (used across invoice/customer pages).
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  return NextResponse.json({ shop: ctx.user.shop });
}

export async function PUT(req) {
  const ctx = await requirePermission('settings:manage');
  if (ctx instanceof NextResponse) return ctx;
  const { user } = ctx;

  try {
    const body = await req.json();
    
    // Whitelist the updateable shop fields
    const updatedShop = await db.shop.update({
      where: { id: user.shopId },
      data: {
        businessName: body.businessName || user.shop.businessName,
        taxId: body.taxId !== undefined ? body.taxId : user.shop.taxId,
        logoBase64: body.logoBase64 !== undefined ? body.logoBase64 : user.shop.logoBase64,
        ownerName: body.ownerName !== undefined ? body.ownerName : user.shop.ownerName,
        phone: body.phone !== undefined ? body.phone : user.shop.phone,
        email: body.email !== undefined ? body.email : user.shop.email,
        address: body.address !== undefined ? body.address : user.shop.address,
        bankName: body.bankName !== undefined ? body.bankName : user.shop.bankName,
        accountNum: body.accountNum !== undefined ? body.accountNum : user.shop.accountNum,
        ifscCode: body.ifscCode !== undefined ? body.ifscCode : user.shop.ifscCode,
        upiId: body.upiId !== undefined ? body.upiId : user.shop.upiId,
        invoicePrefix: body.invoicePrefix || user.shop.invoicePrefix,
        invoiceFormat: body.invoiceFormat || user.shop.invoiceFormat,
        currency: body.currency || user.shop.currency,
        footerMessage: body.footerMessage !== undefined ? body.footerMessage : user.shop.footerMessage,
        taxRate: body.taxRate !== undefined ? parseFloat(body.taxRate) : user.shop.taxRate,
      },
    });

    await logActivity({
      shopId: user.shopId, userId: user.id,
      action: 'settings.update', entityType: 'Shop', entityId: user.shopId,
      description: 'Updated business settings',
    });

    return NextResponse.json({ success: true, shop: updatedShop });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

