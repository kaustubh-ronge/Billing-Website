export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function PUT(req, { params }) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  const { user } = ctx;
  const { id } = await params;

  try {
    const existing = await db.purchaseNote.findFirst({
      where: { id, shopId: user.shopId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    const body = await req.json();
    const { companyName, productsBought, quantityBought, totalAmount, amountPaid, amountRemaining, noteDate, remarks, isPurchase, title, gstNumber } = body;

    const note = await db.purchaseNote.update({
      where: { id },
      data: {
        companyName: companyName !== undefined ? companyName : existing.companyName,
        productsBought: productsBought !== undefined ? productsBought : existing.productsBought,
        quantityBought: quantityBought !== undefined ? quantityBought : existing.quantityBought,
        totalAmount: totalAmount !== undefined ? parseFloat(totalAmount) : existing.totalAmount,
        amountPaid: amountPaid !== undefined ? parseFloat(amountPaid) : existing.amountPaid,
        amountRemaining: amountRemaining !== undefined ? parseFloat(amountRemaining) : existing.amountRemaining,
        noteDate: noteDate ? new Date(noteDate) : existing.noteDate,
        remarks: remarks !== undefined ? remarks : existing.remarks,
        isPurchase: isPurchase !== undefined ? isPurchase === true : existing.isPurchase,
        title: title !== undefined ? title : existing.title,
        gstNumber: gstNumber !== undefined ? gstNumber : existing.gstNumber,
      }
    });

    await logActivity({
      shopId: user.shopId,
      userId: user.id,
      action: 'UPDATE_NOTE',
      details: {
        noteId: note.id,
        isPurchase: note.isPurchase,
        titleOrCompany: note.isPurchase ? note.companyName : note.title
      }
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  const { user } = ctx;
  const { id } = await params;

  try {
    const existing = await db.purchaseNote.findFirst({
      where: { id, shopId: user.shopId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await db.purchaseNote.delete({
      where: { id }
    });

    await logActivity({
      shopId: user.shopId,
      userId: user.id,
      action: 'DELETE_NOTE',
      details: {
        noteId: id,
        isPurchase: existing.isPurchase,
        titleOrCompany: existing.isPurchase ? existing.companyName : existing.title
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
