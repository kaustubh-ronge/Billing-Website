import React from "react";
import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import { CheckCircle, AlertCircle, HelpCircle, Calendar, ShieldCheck, FileText, FileDown } from "lucide-react";
import { numberToWords } from "@/lib/utils";

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
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 overflow-x-auto">
      {/* Top action bar - Hidden during print */}
      <div className="mx-auto max-w-4xl min-w-[800px] mb-6 flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-150 shadow-sm no-print">
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
          <div className="text-right">
            <span className="text-xs text-gray-400 font-bold block">Balance Due</span>
            <span className="text-sm font-black text-rose-600">{"\u20B9"}{balance.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/public/invoices/${invoice.id}/pdf`}
              download
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors no-print"
            >
              <FileDown className="h-4 w-4" /> Download PDF
            </a>
            <PrintButton />
          </div>
        </div>
      </div>

      {/* Main Invoice Card - Rigid fixed-width container to look exactly like the printed page */}
      <div className="mx-auto w-[800px] bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden p-10 print-area font-sans text-xs text-gray-800">
        {/* Top header row */}
        <div className="flex justify-between items-start mb-6 gap-4 border-b border-gray-200 pb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-1 uppercase">{shop.businessName}</h1>
            {/* cyan background banner for description/tagline */}
            <div className="bg-[#00a29a] text-white font-bold text-[10px] px-3 py-1.5 rounded uppercase tracking-wider inline-block mb-3">
              Manufacturing & Supply of Precision Press Tool & Room Component
            </div>
            <div className="text-[10px] text-gray-500 leading-relaxed max-w-md">
              {shop.address && <p>{shop.address}</p>}
              <p className="mt-1">
                {shop.phone && <span>Tel : {shop.phone} </span>}
                {shop.email && <span>| Web : {shop.email}</span>}
              </p>
              {shop.showGst !== false && shop.taxId && (
                <p className="mt-1 font-semibold text-gray-700">GSTIN : {shop.taxId}</p>
              )}
              {shop.showLicense !== false && (
                <div className="mt-1 space-y-0.5">
                  {shop.licenseNum && <p><span className="font-semibold">Lic No:</span> {shop.licenseNum}</p>}
                  {(shop.businessType === 'Agro Store' || shop.businessType?.toLowerCase().includes('agro') || shop.businessType?.toLowerCase().includes('krishi')) && (
                    <>
                      {shop.aushadhLicenseNum && <p><span className="font-semibold">Aushadh Lic:</span> {shop.aushadhLicenseNum}</p>}
                      {shop.khateLicenseNum && <p><span className="font-semibold">Khate Lic:</span> {shop.khateLicenseNum}</p>}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end">
            {shop.logoBase64 ? (
              <img src={shop.logoBase64} alt="Shop Logo" className="h-16 w-auto object-contain rounded-lg mb-2" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white font-black text-sm mb-2">
                {shop.businessName.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* PAN, TAX INVOICE banner line */}
        <div className="border-t border-b border-gray-300 py-1.5 my-3 grid grid-cols-3 items-center text-[10px] font-bold text-gray-850">
          <div>
            {shop.showGst !== false && shop.taxId ? `PAN : ${shop.taxId.substring(2, 12).toUpperCase()}` : ""}
          </div>
          <div className="text-center text-sm font-black tracking-widest text-black">TAX INVOICE</div>
          <div className="text-right text-[8px] text-gray-500 uppercase">Original for Recipient</div>
        </div>

        {/* 2-Column Info Grid: Customer Details vs Invoice Details */}
        <div className="grid grid-cols-2 border border-gray-300 rounded overflow-hidden mb-6 text-[10px]">
          {/* Left Column: Customer Details */}
          <div className="p-3 border-r border-gray-300 space-y-1">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-200 mb-1.5">Customer Detail</div>
            <div className="flex"><span className="w-24 font-bold shrink-0">M/S</span><span className="text-gray-900 font-bold">{customer.name}</span></div>
            <div className="flex"><span className="w-24 font-bold shrink-0">Address</span><span className="text-gray-600 leading-relaxed">{customer.address || "N/A"}</span></div>
            <div className="flex"><span className="w-24 font-bold shrink-0">Phone</span><span className="text-gray-600">{customer.phone}</span></div>
            <div className="flex"><span className="w-24 font-bold shrink-0">GSTIN</span><span className="text-gray-950 font-bold">{customer.gstNumber || "N/A"}</span></div>
            <div className="flex"><span className="w-24 font-bold shrink-0">Place of Supply</span><span className="text-gray-600">{customer.address ? customer.address.split(',').pop().trim() : "N/A"}</span></div>
          </div>
          
          {/* Right Column: Invoice Details */}
          <div className="p-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
            <div className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-200 mb-1.5">Invoice Details</div>
            <div><span className="font-bold text-gray-500 block">Invoice No.</span><span className="font-bold text-gray-900">{invoice.invoiceNum}</span></div>
            <div><span className="font-bold text-gray-500 block">Invoice Date</span><span className="font-bold text-gray-900">{new Date(invoice.issuedAt).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}</span></div>
            {shop.showPaymentTerms !== false && (
              <>
                <div><span className="font-bold text-gray-500 block">Payment Terms</span><span className="text-gray-700">{invoice.paymentTerms}</span></div>
                <div><span className="font-bold text-gray-500 block">Due Date</span><span className="text-gray-700">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : "Immediate"}</span></div>
              </>
            )}
            <div className="col-span-2"><span className="font-bold text-gray-500 block">Status</span><span className="mt-0.5 inline-block">{getStatusBadge(invoice.status)}</span></div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6 border border-gray-300 rounded">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-300 font-bold text-gray-700 text-center">
                <th className="border-r border-gray-300 py-2 px-1 w-10">Sr. No.</th>
                <th className="border-r border-gray-300 py-2 px-2 text-left">Name of Product / Service</th>
                <th className="border-r border-gray-300 py-2 px-1 w-20">HSN / SAC</th>
                <th className="border-r border-gray-300 py-2 px-1 w-12">Qty</th>
                <th className="border-r border-gray-300 py-2 px-1 w-12">Unit</th>
                <th className="border-r border-gray-300 py-2 px-2 text-right w-20">Rate</th>
                <th className="border-r border-gray-300 py-2 px-2 text-right w-24">Taxable Value</th>
                <th className="border-r border-gray-300 p-0 w-28">
                  <div className="border-b border-gray-300 py-1 font-bold">GST</div>
                  <div className="flex text-[8px] font-bold">
                    <span className="w-1/2 border-r border-gray-300 py-0.5">%</span>
                    <span className="w-1/2 py-0.5">Amount</span>
                  </div>
                </th>
                <th className="py-2 px-2 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300">
              {items.map((item, idx) => {
                const itemTaxRate = item.product?.taxRate ?? 0;
                const lineTotal = item.quantity * item.unitPrice;
                const rateExclusive = item.unitPrice / (1 + itemTaxRate / 100);
                const taxableValue = item.quantity * rateExclusive;
                const gstAmount = lineTotal - taxableValue;
                
                return (
                  <tr key={idx} className="hover:bg-gray-50/20 text-center">
                    <td className="border-r border-gray-300 py-2 px-1 font-medium">{idx + 1}</td>
                    <td className="border-r border-gray-300 py-2 px-2 text-left font-bold text-gray-900">
                      {item.product?.name || "Unnamed Item"} {item.product?.actualValue ? `(${item.product.actualValue}${item.product.unit || ''})` : ''}
                      {item.product?.isService && (
                        <span className="ml-1.5 text-[8px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-normal">Service</span>
                      )}
                    </td>
                    <td className="border-r border-gray-300 py-2 px-1 text-gray-600">{item.product?.hsnSac || item.product?.sku || item.product?.category || "—"}</td>
                    <td className="border-r border-gray-300 py-2 px-1 font-bold text-gray-900">{item.quantity}</td>
                    <td className="border-r border-gray-300 py-2 px-1 text-gray-650">{item.product?.unit || "NOS"}</td>
                    <td className="border-r border-gray-300 py-2 px-2 text-right text-gray-700">{"\u20B9"}{rateExclusive.toFixed(2)}</td>
                    <td className="border-r border-gray-300 py-2 px-2 text-right text-gray-700 font-medium">{"\u20B9"}{taxableValue.toFixed(2)}</td>
                    <td className="border-r border-gray-300 p-0 text-gray-750">
                      <div className="flex h-full items-stretch">
                        <span className="w-1/2 border-r border-gray-300 py-2 px-1 flex items-center justify-center font-medium">{itemTaxRate}%</span>
                        <span className="w-1/2 py-2 px-1 flex items-center justify-end font-medium">{"\u20B9"}{gstAmount.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-black text-gray-900">{"\u20B9"}{lineTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
              
              {/* Table Total Row */}
              <tr className="bg-gray-50 font-black text-gray-950 border-t border-gray-300 text-center">
                <td className="border-r border-gray-300 py-2 px-2 text-right" colSpan={3}>Total</td>
                <td className="border-r border-gray-300 py-2 px-1">{items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td className="border-r border-gray-300 py-2 px-1"></td>
                <td className="border-r border-gray-300 py-2 px-2"></td>
                <td className="border-r border-gray-300 py-2 px-2 text-right">
                  {"\u20B9"}{items.reduce((sum, item) => {
                    const itemTaxRate = item.product?.taxRate ?? 0;
                    const rateExclusive = item.unitPrice / (1 + itemTaxRate / 100);
                    return sum + (item.quantity * rateExclusive);
                  }, 0).toFixed(2)}
                </td>
                <td className="border-r border-gray-300 p-0">
                  <div className="flex h-full items-stretch">
                    <span className="w-1/2 border-r border-gray-300"></span>
                    <span className="w-1/2 py-2 px-1 text-right">
                      {"\u20B9"}{items.reduce((sum, item) => {
                        const itemTaxRate = item.product?.taxRate ?? 0;
                        const lineTotal = item.quantity * item.unitPrice;
                        const rateExclusive = item.unitPrice / (1 + itemTaxRate / 100);
                        return sum + (lineTotal - (item.quantity * rateExclusive));
                      }, 0).toFixed(2)}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-2 text-right">{"\u20B9"}{subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Details Area */}
        <div className="grid grid-cols-2 border border-gray-300 rounded overflow-hidden text-[10px]">
          {/* Left Column: Word Total, Bank Details, Terms, Customer Signature */}
          <div className="p-3 border-r border-gray-300 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div>
                <span className="font-bold text-gray-500 block uppercase text-[8px] tracking-wider mb-1">Total In Words</span>
                <p className="font-bold text-gray-900 bg-gray-50 border border-gray-200 p-2 rounded leading-relaxed">{numberToWords(invoice.grandTotal)}</p>
              </div>
              
              <div className="flex gap-4">
                {shop.showBankDetails !== false && (
                  <div className="flex-1 space-y-1">
                    <span className="font-bold text-gray-500 block uppercase text-[8px] tracking-wider mb-1">Bank Details</span>
                    {shop.bankName ? (
                      <div className="bg-gray-50 border border-gray-200 p-2 rounded space-y-0.5 text-[9px]">
                        <p><span className="font-semibold text-gray-600">Bank:</span> {shop.bankName}</p>
                        {shop.accountNum && <p><span className="font-semibold text-gray-600">A/c No:</span> {shop.accountNum}</p>}
                        {shop.ifscCode && <p><span className="font-semibold text-gray-600">IFSC:</span> {shop.ifscCode}</p>}
                        {shop.upiId && <p><span className="font-semibold text-gray-600">UPI ID:</span> {shop.upiId}</p>}
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">No bank details configured.</p>
                    )}
                  </div>
                )}
                {shop.showQrCode !== false && shop.upiId && balance > 0 && (
                  <div className="shrink-0 text-center bg-gray-50 border border-gray-200 p-2 rounded flex flex-col items-center justify-center">
                    <span className="text-[8px] font-black text-blue-700 uppercase tracking-wider block mb-1">Pay using UPI</span>
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`upi://pay?pa=${shop.upiId}&pn=${encodeURIComponent(shop.businessName)}&am=${balance.toFixed(2)}&cu=INR&tn=${encodeURIComponent(invoice.invoiceNum)}`)}`} 
                      alt="UPI QR Code" 
                      className="h-16 w-16 object-contain bg-white border border-gray-200 p-0.5 rounded"
                    />
                  </div>
                )}
              </div>

              {shop.showFooterMessage !== false && (
                <div>
                  <span className="font-bold text-gray-500 block uppercase text-[8px] tracking-wider mb-1">Terms & Conditions</span>
                  <p className="text-[9px] text-gray-500 leading-relaxed italic border-t border-gray-200 pt-1.5">{shop.footerMessage}</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-200 w-40 text-center">
              <p className="font-bold text-gray-400">Customer Signature</p>
            </div>
          </div>

          {/* Right Column: Calculation Summary, Declaration, Authorized Signatory */}
          <div className="p-3 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {/* Summary Calculations */}
              <div className="space-y-1.5 bg-gray-50/50 p-3 rounded border border-gray-200 text-[10px]">
                <div className="flex justify-between text-gray-600">
                  <span>Taxable Amount</span>
                  <span className="font-semibold text-gray-900">{"\u20B9"}{(invoice.grandTotal - invoice.totalTax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Add : GST Tax</span>
                  <span className="font-semibold text-gray-900">{"\u20B9"}{invoice.totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
                  <span>Total Tax</span>
                  <span>{"\u20B9"}{invoice.totalTax.toFixed(2)}</span>
                </div>
                
                {invoice.discountPercentage > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Less: Discount ({invoice.discountPercentage}%)</span>
                    <span>-{"\u20B9"}{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-black text-gray-950 border-t-2 border-gray-900 pt-2 text-xs">
                  <span>Total Amount After Tax</span>
                  <span>{"\u20B9"}{invoice.grandTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-green-600 font-bold pt-1">
                  <span>Amount Paid</span>
                  <span>{"\u20B9"}{invoice.amountPaid.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-rose-600 font-black border-t border-gray-200 pt-1.5">
                  <span>Balance Due</span>
                  <span>{"\u20B9"}{balance.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-[8px] text-gray-500 leading-tight space-y-1">
                <p className="font-bold text-gray-650 uppercase">Declaration</p>
                <p>Certified that the particulars given above are true and correct.</p>
              </div>
            </div>

            <div className="mt-8 pt-4 flex flex-col items-center border-t border-gray-200 text-center">
              <p className="text-[8px] font-bold text-gray-500 mb-8">For {shop.businessName}</p>
              <p className="text-[7px] text-gray-400 italic mb-2">This is a computer generated invoice no signature required.</p>
              <p className="font-bold text-gray-800 text-[9px] border-t border-gray-300 pt-1.5 w-32">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
