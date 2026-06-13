import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { InvoicePDF } from '@/lib/pdf/InvoicePDF';
import { getSessionUser } from '@/lib/authHelper';
import { db } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const invoice = await db.invoice.findFirst({
      where: { id, shopId: user.shopId },
      include: {
        customer: true,
        shop: true,
        items: { include: { product: true } },
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const stream = await renderToStream(<InvoicePDF invoice={invoice} />);

    // Convert Node.js Readable to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });

    const filename = `${invoice.invoiceNum.replace(/\//g, '-')}.pdf`;

    return new Response(webStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    );
  }
}
