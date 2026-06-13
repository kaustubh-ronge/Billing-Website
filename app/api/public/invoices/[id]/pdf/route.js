import { renderToStream } from '@react-pdf/renderer';
import { InvoicePDF } from '@/lib/pdf/InvoicePDF';
import { db } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const invoice = await db.invoice.findFirst({
      where: { id },
      include: {
        customer: true,
        shop: true,
        items: { include: { product: true } },
        payments: true,
      },
    });

    if (!invoice) {
      return new Response('Invoice not found', { status: 404 });
    }

    const stream = await renderToStream(<InvoicePDF invoice={invoice} />);

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
    console.error('Public PDF generation error:', error);
    return new Response('Failed to generate PDF', { status: 500 });
  }
}
