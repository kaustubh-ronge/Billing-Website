export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function GET(req) {
  const ctx = await requirePermission('invoices:view');
  if (ctx instanceof NextResponse) return ctx;
  const { user } = ctx;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const customerId = searchParams.get('customerId') || '';

    const whereClause = { shopId: user.shopId };

    if (status) whereClause.status = status;
    if (customerId) whereClause.customerId = customerId;

    if (search) {
      whereClause.OR = [
        { invoiceNum: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const invoices = await db.invoice.findMany({
      where: whereClause,
      include: {
        customer: true,
        items: { include: { product: true } },
        payments: true,
      },
      orderBy: { issuedAt: 'desc' },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  const ctx = await requirePermission('invoices:create');
  if (ctx instanceof NextResponse) return ctx;
  const { user } = ctx;

  try {
    const body = await req.json();
    const {
      customerId,
      items,
      discountPercentage,
      amountPaid,
      paymentMethod,
      notes,
      issuedAt,
      paymentTerms,
      dueDate,
      customDueDays,
    } = body;

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer ID and Invoice Items are required.' },
        { status: 400 }
      );
    }

    // Validate customer belongs to this shop
    const customer = await db.customer.findFirst({
      where: { id: customerId, shopId: user.shopId },
    });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    // Credit limit soft-check (warn but don't block unless over limit with no payment)
    // Hard enforcement: if creditLimit set and outstanding would exceed available credit, reject
    // Outstanding = grandTotal - amountPaid (computed later) â€” checked post-calculation below

    // Validate products and compute totals using DB values (never trust client prices)
    const dbProducts = await db.product.findMany({
      where: { id: { in: items.map((i) => i.productId) }, shopId: user.shopId },
    });
    const productsMap = new Map(dbProducts.map((p) => [p.id, p]));

    let calculatedTax = 0;
    let calculatedSubtotal = 0;
    const discountPercent = parseFloat(discountPercentage || 0);
    const invoiceItemsData = [];

    for (const item of items) {
      const prod = productsMap.get(item.productId);
      if (!prod) {
        return NextResponse.json(
          { error: `Product ID ${item.productId} not found in inventory.` },
          { status: 400 }
        );
      }

      const qty = parseInt(item.quantity);
      // Treat unitPrice as a tax-inclusive unit rate
      const clientPrice = item.unitPrice !== undefined ? parseFloat(item.unitPrice) : prod.price;
      const unitPrice = Math.min(clientPrice, prod.price);
      
      const itemSubtotal = qty * unitPrice; // Inclusive subtotal
      const itemDiscountedTotal = itemSubtotal * (1 - discountPercent / 100);
      const taxableAmount = itemDiscountedTotal / (1 + (prod.taxRate / 100));
      const itemTax = itemDiscountedTotal - taxableAmount;

      calculatedSubtotal += itemSubtotal;
      calculatedTax += itemTax;

      invoiceItemsData.push({ productId: prod.id, quantity: qty, unitPrice });
    }

    const discountAmount = calculatedSubtotal * (discountPercent / 100);
    const grandTotal = Math.round((calculatedSubtotal - discountAmount) * 100) / 100;
    const paidAmt = parseFloat(amountPaid || 0);

    let status = 'PENDING';
    if (paidAmt >= grandTotal) status = 'PAID';
    else if (paidAmt > 0) status = 'PARTIAL';

    // Credit limit enforcement: reject if adding the outstanding balance would exceed the limit
    const outstanding = grandTotal - paidAmt;
    if (
      customer.creditLimit > 0 &&
      outstanding > 0 &&
      customer.creditUsed + outstanding > customer.creditLimit
    ) {
      const available = Math.max(0, customer.creditLimit - customer.creditUsed);
      return NextResponse.json(
        {
          error: `Credit limit exceeded. ${customer.name} has \u20B9${available.toFixed(2)} available credit but this sale requires \u20B9${outstanding.toFixed(2)} on credit.`,
          code: 'CREDIT_LIMIT_EXCEEDED',
          available,
          required: outstanding,
        },
        { status: 422 }
      );
    }

    // Resolve due date from payment terms
    let resolvedDueDate = null;
    const terms = paymentTerms || 'IMMEDIATE';
    if (terms !== 'IMMEDIATE') {
      if (dueDate) {
        resolvedDueDate = new Date(dueDate);
      } else {
        const base = issuedAt ? new Date(issuedAt) : new Date();
        const daysMap = { NET_7: 7, NET_15: 15, NET_30: 30, NET_45: 45 };
        const days = daysMap[terms] ?? parseInt(customDueDays || 0);
        if (days > 0) {
          resolvedDueDate = new Date(base);
          resolvedDueDate.setDate(resolvedDueDate.getDate() + days);
        }
      }
    }

    // All mutations in a single transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Atomically claim the next invoice number (prevents race on concurrent requests)
      const updatedShop = await tx.shop.update({
        where: { id: user.shopId },
        data: { nextInvoiceNumber: { increment: 1 } },
        select: { nextInvoiceNumber: true, invoicePrefix: true },
      });

      const prefix = updatedShop.invoicePrefix || 'INV';
      const year = new Date(issuedAt || Date.now()).getFullYear();
      const invoiceNum = `${prefix}-${year}-${String(updatedShop.nextInvoiceNumber).padStart(4, '0')}`;

      // 2. Deduct stock atomically â€” conditional UPDATE prevents overselling
      for (const item of invoiceItemsData) {
        const prod = productsMap.get(item.productId);
        if (!prod.trackInventory || prod.stockCount === null) continue;

        const rowsUpdated = await tx.$executeRaw`
          UPDATE "Product"
          SET "stockCount" = "stockCount" - ${item.quantity}
          WHERE id = ${item.productId}
            AND "stockCount" >= ${item.quantity}
        `;

        if (rowsUpdated === 0) {
          throw new Error(
            `Insufficient stock for "${prod.name}". Available: ${prod.stockCount}, Requested: ${item.quantity}`
          );
        }
      }

      // 3. Create invoice
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNum,
          discountPercentage: discountPercent,
          totalTax: calculatedTax,
          grandTotal,
          amountPaid: paidAmt,
          status,
          paymentTerms: terms,
          dueDate: resolvedDueDate,
          customDueDays: terms === 'CUSTOM' ? parseInt(customDueDays || 0) : null,
          notes: notes || null,
          issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
          customerId,
          shopId: user.shopId,
          items: { create: invoiceItemsData },
        },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      // 4. Create initial payment record if any amount was paid
      let payment = null;
      if (paidAmt > 0) {
        payment = await tx.payment.create({
          data: {
            amount: paidAmt,
            paymentMethod: paymentMethod || 'CASH',
            notes: 'Initial payment',
            invoiceId: newInvoice.id,
            paymentDate: issuedAt ? new Date(issuedAt) : new Date(),
          },
        });
      }

      // 5. Update customer's creditUsed if there is an outstanding balance
      if (outstanding > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: { creditUsed: { increment: outstanding } },
        });
      }

      return { invoice: newInvoice, payment };
    });

    await logActivity({
      shopId: user.shopId, userId: user.id,
      action: 'invoice.create', entityType: 'Invoice', entityId: result.invoice.id,
      description: `Created invoice ${result.invoice.invoiceNum} (\u20B9${grandTotal.toFixed(2)})`,
    });

    return NextResponse.json({
      success: true,
      invoice: result.invoice,
      payment: result.payment,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);

    // Surface stock errors as 409 so the client can display them
    if (error.message?.startsWith('Insufficient stock')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

