import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/authHelper';
import { db } from '@/lib/prisma';

export async function POST(req, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { amount, paymentMethod, notes, paymentDate, referenceNumber } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    // Verify ownership before entering transaction (fast path)
    const invoice = await db.invoice.findFirst({
      where: { id, shopId: user.shopId },
    });
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice is already fully paid' }, { status: 409 });
    }

    // Atomic update: increment amountPaid only if the result stays within grandTotal.
    // PostgreSQL READ COMMITTED re-evaluates WHERE on the latest committed value, so
    // two concurrent payments cannot both pass the guard simultaneously.
    const result = await db.$transaction(async (tx) => {
      const rowsUpdated = await tx.$executeRaw`
        UPDATE "Invoice"
        SET "amountPaid" = "amountPaid" + ${parsedAmount}
        WHERE id = ${id}
          AND "shopId" = ${user.shopId}
          AND "amountPaid" + ${parsedAmount} <= "grandTotal" + 0.01
      `;

      if (rowsUpdated === 0) {
        const current = await tx.invoice.findUnique({
          where: { id },
          select: { grandTotal: true, amountPaid: true },
        });
        const remaining = current
          ? Math.round((current.grandTotal - current.amountPaid) * 100) / 100
          : 0;
        throw Object.assign(
          new Error(`Payment of ₹${parsedAmount} exceeds remaining balance of ₹${remaining}`),
          { code: 'OVER_PAYMENT', remaining }
        );
      }

      // Fetch updated invoice to compute new status
      const updated = await tx.invoice.findUnique({
        where: { id },
        select: { amountPaid: true, grandTotal: true },
      });

      const newStatus =
        updated.amountPaid >= updated.grandTotal - 0.01
          ? 'PAID'
          : updated.amountPaid > 0
          ? 'PARTIAL'
          : 'PENDING';

      const finalInvoice = await tx.invoice.update({
        where: { id },
        data: { status: newStatus },
      });

      // Reduce customer's creditUsed by the payment amount (clamp to 0)
      await tx.$executeRaw`
        UPDATE "Customer"
        SET "creditUsed" = GREATEST(0, "creditUsed" - ${parsedAmount})
        WHERE id = ${invoice.customerId}
      `;

      const payment = await tx.payment.create({
        data: {
          amount: parsedAmount,
          paymentMethod: paymentMethod || 'CASH',
          notes: notes || 'Invoice payment',
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          invoiceId: id,
          referenceNumber: referenceNumber || null,
        },
      });

      return { payment, invoice: finalInvoice };
    });

    return NextResponse.json({
      success: true,
      payment: result.payment,
      invoice: result.invoice,
    });
  } catch (error) {
    console.error('Error recording payment:', error);

    if (error.code === 'OVER_PAYMENT') {
      return NextResponse.json(
        { error: error.message, remaining: error.remaining },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
