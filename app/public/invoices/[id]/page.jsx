import React from "react";
import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import { CheckCircle, AlertCircle, HelpCircle, FileText, FileDown } from "lucide-react";
import InvoicePreviewHTML from "@/components/InvoicePreviewHTML";

export const revalidate = 0; // Disable static cache to reflect updates immediately

export default async function PublicInvoicePage({ params }) {
  const { id } = await params;

  const invoice = await db.invoice.findFirst({
    where: { id },
    include: {
      customer: true,
      shop: true,
      items: {
        include: {
          product: true
        }
      },
      payments: true
    }
  });

  if (!invoice) {
    notFound();
  }

  const { customer, shop, items } = invoice;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-green-50 text-green-700 border border-green-150">
            <CheckCircle className="h-3.5 w-3.5" /> PAID
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-150">
            <AlertCircle className="h-3.5 w-3.5" /> PARTIAL
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-150">
            <AlertCircle className="h-3.5 w-3.5" /> PENDING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gray-50 text-gray-700 border border-gray-150">
            <HelpCircle className="h-3.5 w-3.5" /> DRAFT
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Tax Invoice {invoice.invoiceNum}</h2>
            <p className="text-[11px] text-gray-500">Public view & download link</p>
          </div>
        </div>
        <div className="flex gap-2">
          <PrintButton />
          <a
            href={`/api/public/invoices/${id}/pdf`}
            download={`Invoice-${invoice.invoiceNum}.pdf`}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-black text-white hover:opacity-90 font-bold px-4 py-2 text-xs shadow-md transition-all duration-200"
          >
            <FileDown className="h-3.5 w-3.5" /> Download PDF
          </a>
        </div>
      </div>

      {/* Render the reusable layout component */}
      <InvoicePreviewHTML
        invoice={invoice}
        shop={shop}
        customer={customer}
        items={items}
        statusBadge={getStatusBadge(invoice.status)}
      />
    </div>
  );
}
