export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function GET(req) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  const { user } = ctx;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const isPurchaseStr = searchParams.get('isPurchase');
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let whereClause = {
      shopId: user.shopId,
      OR: [
        { companyName: { contains: search, mode: 'insensitive' } },
        { productsBought: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { remarks: { contains: search, mode: 'insensitive' } },
      ]
    };

    if (isPurchaseStr === 'true') {
      whereClause.isPurchase = true;
    } else if (isPurchaseStr === 'false') {
      whereClause.isPurchase = false;
    }

    const [notes, totalCount] = await Promise.all([
      db.purchaseNote.findMany({
        where: whereClause,
        orderBy: { noteDate: 'desc' },
        skip,
        take: limit,
      }),
      db.purchaseNote.count({ where: whereClause })
    ]);

    return NextResponse.json({
      notes,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  const ctx = await requireAuth();
  if (ctx instanceof NextResponse) return ctx;
  const { user } = ctx;

  try {
    const body = await req.json();
    const { companyName, productsBought, quantityBought, totalAmount, amountPaid, amountRemaining, noteDate, remarks, isPurchase, title, gstNumber } = body;

    if (isPurchase) {
      if (!companyName || !productsBought) {
        return NextResponse.json({ error: 'Company Name and Products Bought are required for purchase records' }, { status: 400 });
      }
    } else {
      if (!title || !remarks) {
        return NextResponse.json({ error: 'Title and content remarks are required for general notes' }, { status: 400 });
      }
    }

    const note = await db.purchaseNote.create({
      data: {
        companyName: companyName || '',
        productsBought: productsBought || '',
        quantityBought: quantityBought || '',
        totalAmount: totalAmount !== undefined ? parseFloat(totalAmount) : 0,
        amountPaid: amountPaid !== undefined ? parseFloat(amountPaid) : 0,
        amountRemaining: amountRemaining !== undefined ? parseFloat(amountRemaining) : 0,
        noteDate: noteDate ? new Date(noteDate) : new Date(),
        remarks: remarks || '',
        isPurchase: isPurchase === true,
        title: title || '',
        shopId: user.shopId,
        gstNumber: gstNumber || null,
      }
    });

    await logActivity({
      shopId: user.shopId,
      userId: user.id,
      action: 'CREATE_NOTE',
      details: {
        noteId: note.id,
        isPurchase: note.isPurchase,
        titleOrCompany: note.isPurchase ? note.companyName : note.title
      }
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
