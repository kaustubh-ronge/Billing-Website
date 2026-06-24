export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function POST(req, { params }) {
  const ctx = await requirePermission('payments:record');
  if (ctx instanceof NextResponse) return ctx;
  const { user } = ctx;

  try {
    const { id } = await params;
    const body = await req.json();
    const { amount, paymentMethod, notes, paymentDate, referenceNumber } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    // Verify ownership of the customer
    const customer = await db.customer.findFirst({
      where: { id, shopId: user.shopId, isDeleted: false },
    });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Fetch outstanding invoices sorted by issuedAt asc (oldest first)
    const invoices = await db.invoice.findMany({
      where: {
        customerId: id,
        shopId: user.shopId,
        status: { in: ['PENDING', 'PARTIAL'] },
      },
      orderBy: { issuedAt: 'asc' },
    });

    // Calculate total outstanding balance
    const totalOutstanding = invoices.reduce((sum, inv) => {
      const balance = inv.grandTotal - inv.amountPaid;
      return sum + balance;
    }, 0);
    const roundedOutstanding = Math.round(totalOutstanding * 100) / 100;

    if (parsedAmount > roundedOutstanding + 0.01) {
      return NextResponse.json(
        { error: `Payment amount (\u20B9${parsedAmount.toFixed(2)}) exceeds total outstanding balance of \u20B9${roundedOutstanding.toFixed(2)}.` },
        { status: 400 }
      );
    }

    // Execute atomic FIFO settlement in a transaction
    const transactionResult = await db.$transaction(async (tx) => {
      let remaining = parsedAmount;
      const settledInvoices = [];
      const paymentsCreated = [];

      for (const invoice of invoices) {
        if (remaining <= 0.005) break;

        const due = Math.max(0, Math.round((invoice.grandTotal - invoice.amountPaid) * 100) / 100);
        if (due <= 0) continue;

        const toApply = Math.round(Math.min(remaining, due) * 100) / 100;
        if (toApply <= 0) continue;

        const newAmountPaid = Math.round((invoice.amountPaid + toApply) * 100) / 100;
        const newStatus = newAmountPaid >= invoice.grandTotal - 0.01 ? 'PAID' : 'PARTIAL';

        const updatedInvoice = await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            amountPaid: newAmountPaid,
            status: newStatus,
          },
        });

        const payment = await tx.payment.create({
          data: {
            amount: toApply,
            paymentMethod: paymentMethod || 'CASH',
            notes: notes || `Settled payment for invoice ${invoice.invoiceNum}`,
            paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
            invoiceId: invoice.id,
            referenceNumber: referenceNumber || null,
          },
        });

        settledInvoices.push(updatedInvoice);
        paymentsCreated.push(payment);

        remaining = Math.round((remaining - toApply) * 100) / 100;
      }

      // Update customer credit limit usage
      await tx.$executeRaw`
        UPDATE "Customer"
        SET "creditUsed" = GREATEST(0, "creditUsed" - ${parsedAmount})
        WHERE id = ${id}
      `;

      return { settledInvoices, paymentsCreated };
    });

    // Fetch the updated customer record with invoices to return for UI refresh
    const updatedCustomer = await db.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          select: {
            grandTotal: true,
            amountPaid: true,
            status: true,
            issuedAt: true,
          },
        },
      },
    });

    let totalBills = updatedCustomer.invoices.length;
    let totalPaid = updatedCustomer.invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    let totalBilled = updatedCustomer.invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    let totalPending = totalBilled - totalPaid;
    
    let lastPurchaseDate = null;
    if (updatedCustomer.invoices.length > 0) {
      const sorted = [...updatedCustomer.invoices].sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
      lastPurchaseDate = sorted[0].issuedAt;
    }

    const formattedCustomer = {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      phone: updatedCustomer.phone,
      email: updatedCustomer.email,
      address: updatedCustomer.address,
      gstNumber: updatedCustomer.gstNumber,
      notes: updatedCustomer.notes,
      totalBills,
      totalPaid,
      totalPending,
      lastPurchaseDate,
    };

    // Log action to activity logs
    await logActivity({
      shopId: user.shopId,
      userId: user.id,
      action: 'payment.settle',
      entityType: 'Customer',
      entityId: id,
      description: `Settled \u20B9${parsedAmount.toFixed(2)} across outstanding invoices for customer ${customer.name}`,
    });

    return NextResponse.json({
      success: true,
      customer: formattedCustomer,
      settledInvoices: transactionResult.settledInvoices,
      paymentsCreated: transactionResult.paymentsCreated,
    });
  } catch (error) {
    console.error('Error settling customer payments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
