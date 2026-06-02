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
    const { amount, paymentMethod, notes, paymentDate } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    // Verify invoice ownership
    const invoice = await db.invoice.findFirst({
      where: { id, shopId: user.shopId }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Record the payment and update the invoice in a transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Create payment
      const payment = await tx.payment.create({
        data: {
          amount: parsedAmount,
          paymentMethod: paymentMethod || 'CASH',
          notes: notes || 'Invoice payment',
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          invoiceId: id
        }
      });

      // 2. Fetch all payments for this invoice
      const allPayments = await tx.payment.findMany({
        where: { invoiceId: id }
      });

      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);

      // 3. Determine new invoice status
      let status = 'PENDING';
      if (totalPaid >= invoice.grandTotal) {
        status = 'PAID';
      } else if (totalPaid > 0) {
        status = 'PARTIAL';
      }

      // 4. Update invoice details
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          amountPaid: totalPaid,
          status: status
        }
      });

      return { payment, invoice: updatedInvoice };
    });

    return NextResponse.json({ success: true, payment: result.payment, invoice: result.invoice });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
