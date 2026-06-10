import React from "react";
import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import { CheckCircle, AlertCircle, HelpCircle, Calendar, ShieldCheck, FileText } from "lucide-react";

export const revalidate = 0; // Disable static cache to reflect payment updates immediately

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

  const { customer, shop, items, payments } = invoice;

  // Calculate accurate totals matching DB values
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountAmount = subtotal * (invoice.discountPercentage / 100);
  const balance = invoice.grandTotal - invoice.amountPaid;

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
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-150">
            <HelpCircle className="h-3.5 w-3.5" /> UNPAID
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Top action bar - Hidden during print */}
      <div className="mx-auto max-w-4xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-150 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Invoice {invoice.invoiceNum}</h2>
            <p className="text-xs text-gray-500">From {shop.businessName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-gray-400 font-bold block">Balance Due</span>
            <span className="text-sm font-black text-rose-600">₹{balance.toFixed(2)}</span>
          </div>
          <PrintButton />
        </div>
      </div>

      {/* Main Invoice Card */}
      <div className="mx-auto max-w-4xl bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden p-8 sm:p-12 print-area">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-100 pb-8 mb-8 gap-6">
          <div className="space-y-3">
            {shop.logoBase64 ? (
              <img src={shop.logoBase64} alt="Shop Logo" className="h-16 w-auto object-contain rounded-lg" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white font-black text-sm">
                {shop.businessName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{shop.businessName}</h1>
              {shop.ownerName && <p className="text-xs font-semibold text-gray-600 mt-1">Owner: {shop.ownerName}</p>}
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed max-w-xs">
                {shop.address && <>{shop.address}<br /></>}
                {shop.phone && <>Phone: {shop.phone} | </>}
                {shop.email && <>Email: {shop.email}</>}
              </p>
              {shop.taxId && (
                <p className="text-xs font-bold text-gray-900 mt-2 bg-gray-50 border border-gray-100 px-2 py-1 rounded inline-block">
                  GSTIN: {shop.taxId}
                </p>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right space-y-2 shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Tax Invoice</h2>
            <p className="text-2xl font-black text-gray-900">{invoice.invoiceNum}</p>
            <div className="flex items-center sm:justify-end gap-1.5 text-xs text-gray-500 font-medium">
              <Calendar className="h-3.5 w-3.5" />
              <span>Date: {new Date(invoice.issuedAt).toLocaleDateString()}</span>
            </div>
            <div className="pt-2">{getStatusBadge(invoice.status)}</div>
          </div>
        </div>

        {/* Customer & Payment details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 text-xs border-b border-gray-100 pb-8">
          <div>
            <h3 className="font-bold uppercase tracking-wider text-gray-400 mb-2.5">Bill To</h3>
            <div className="space-y-1 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <p className="font-bold text-sm text-gray-900">{customer.name}</p>
              <p className="text-gray-600">Phone: {customer.phone}</p>
              {customer.email && <p className="text-gray-600">Email: {customer.email}</p>}
              {customer.address && <p className="text-gray-600">Address: {customer.address}</p>}
              {customer.gstNumber && (
                <p className="font-bold text-gray-900 mt-1.5">GSTIN: {customer.gstNumber}</p>
              )}
            </div>
          </div>
          <div className="sm:text-right space-y-2">
            <h3 className="font-bold uppercase tracking-wider text-gray-400 mb-1">Payment Hub</h3>
            {shop.upiId && balance > 0 && (
              <div className="inline-block bg-blue-50/30 border border-blue-100 p-3 rounded-xl text-left space-y-1.5 max-w-[260px] sm:ml-auto">
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">Quick UPI QR Payment</span>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${shop.upiId}&pn=${encodeURIComponent(shop.businessName)}&am=${balance.toFixed(2)}&cu=INR&tn=${encodeURIComponent(invoice.invoiceNum)}`)}`} 
                  alt="UPI QR Code" 
                  className="h-28 w-28 mx-auto object-contain bg-white border border-gray-150 p-1 rounded-lg"
                />
                <span className="text-[9px] text-gray-500 font-bold block text-center">Scan with GPay, Paytm, PhonePe</span>
              </div>
            )}
            {balance <= 0 && (
              <div className="inline-flex items-center gap-1 px-4 py-2 bg-green-50 text-green-700 rounded-xl font-bold border border-green-150 sm:ml-auto">
                <ShieldCheck className="h-4 w-4" /> Paid in Full
              </div>
            )}
          </div>
        </div>

        {/* Invoice Item Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-2 font-bold text-gray-600">Item & Description</th>
                <th className="py-3 px-2 font-bold text-right text-gray-600">Unit Price</th>
                <th className="py-3 px-2 font-bold text-center text-gray-600 w-16">Qty</th>
                <th className="py-3 px-2 font-bold text-center text-gray-600 w-16">Tax (GST)</th>
                <th className="py-3 px-2 font-bold text-right text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                  <td className="py-3 px-2 font-semibold text-gray-900">
                    {item.product?.name || "Unnamed Item"}
                    {item.product?.isService && (
                      <span className="ml-1.5 text-[8px] px-1 bg-gray-100 rounded text-gray-500">Service</span>
                    )}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-600">₹{item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 px-2 text-center text-gray-700 font-medium">{item.quantity}</td>
                  <td className="py-3 px-2 text-center text-gray-500 font-semibold">{item.product?.taxRate ?? 0}%</td>
                  <td className="py-3 px-2 text-right font-bold text-gray-900">₹{(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Math Calculation Breakdowns */}
        <div className="flex flex-col sm:flex-row justify-between items-start text-xs border-t border-gray-100 pt-6 gap-6">
          <div className="max-w-xs">
            {shop.footerMessage && (
              <div className="pt-2">
                <p className="text-[10px] text-gray-400 italic leading-relaxed">{shop.footerMessage}</p>
              </div>
            )}
          </div>
          <div className="w-full sm:w-72 space-y-2 border-t border-gray-100 sm:border-t-0 pt-4 sm:pt-0">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal:</span>
              <span className="font-semibold text-gray-750">₹{subtotal.toFixed(2)}</span>
            </div>
            {invoice.discountPercentage > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Discount ({invoice.discountPercentage}%):</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>GST Tax:</span>
              <span className="font-semibold text-gray-750">₹{invoice.totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-gray-900 border-t border-gray-200 pt-2 text-sm">
              <span>Grand Total:</span>
              <span>₹{invoice.grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-green-600">
              <span>Amount Paid:</span>
              <span>₹{invoice.amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-rose-600 border-t border-gray-100 pt-2">
              <span>Balance Due:</span>
              <span>₹{balance.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Digital Signature Footer */}
        <div className="mt-16 flex justify-end text-xs">
          <div className="text-center w-52 border-t border-gray-300 pt-2">
            <p className="font-bold text-gray-800">{shop.businessName}</p>
            <p className="text-gray-400 text-[10px] mt-0.5">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
