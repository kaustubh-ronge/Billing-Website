import React from "react";
import { numberToWords } from "@/lib/utils";

export default function InvoicePreviewHTML({ invoice, shop, customer, items, statusBadge }) {
  const template = shop?.invoiceTemplate || 'classic';

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountAmount = subtotal * ((invoice.discountPercentage || 0) / 100);
  const balance = Math.max(0, invoice.grandTotal - invoice.amountPaid);

  const totalTaxable = items.reduce((sum, item) => {
    const rate = item.product?.taxRate ?? 0;
    const rateExclusive = item.unitPrice / (1 + rate / 100);
    return sum + (item.quantity * rateExclusive);
  }, 0);
  const totalGst = subtotal - totalTaxable;

  // Dynamic CSS Container Class
  let containerClass = "mx-auto bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden p-6 sm:p-10 print:p-0 print:border-none print:shadow-none print-area font-sans text-xs text-gray-800";
  if (template === 'thermal') {
    containerClass = "mx-auto w-[320px] bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden p-4 print:p-0 print:border-none print:shadow-none print-area font-sans text-[9px] text-black leading-tight";
  } else if (template === 'retail') {
    containerClass = "mx-auto w-[800px] bg-[#fff3f5] border-2 border-[#800020] rounded-lg shadow-sm overflow-hidden p-6 sm:p-10 print:p-0 print:border-none print:shadow-none print-area font-sans text-xs text-black";
  } else if (template === 'minimal') {
    containerClass = "mx-auto w-[800px] bg-white shadow-sm overflow-hidden p-6 sm:p-10 print:p-0 print:shadow-none print-area font-sans text-xs text-slate-800";
  } else if (template === 'landscape') {
    containerClass = "mx-auto w-[800px] bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden p-6 sm:p-8 print:p-0 print:border-none print:shadow-none print-area font-sans text-[11px] text-gray-800";
  }

  // Calculate dynamic colspan for the totals row
  // Sr. No (1) + Product Name (1) + HSN (optional)
  const leftColSpan = 2 + (shop?.showColHsn !== false ? 1 : 0);

  return (
    <div className={containerClass}>
      
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. THERMAL RECEIPT SLIP TEMPLATE
          ───────────────────────────────────────────────────────────────────────────── */}
      {template === 'thermal' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center border-b border-dashed border-black pb-2">
            <h1 className="text-sm font-black uppercase tracking-tight">{shop?.businessName}</h1>
            {shop?.address && <p className="text-[8px] text-gray-600 mt-0.5">{shop.address}</p>}
            <p className="text-[8px] text-gray-600">
              {shop?.phone && <span>Tel: {shop.phone} </span>}
              {shop?.showGst !== false && shop?.taxId && <span>| GST: {shop.taxId}</span>}
            </p>
          </div>

          {/* Meta */}
          <div className="text-[8px] border-b border-dashed border-black pb-2 space-y-0.5">
            <div className="flex justify-between"><span>No: {invoice.invoiceNum}</span><span>Date: {new Date(invoice.issuedAt).toLocaleDateString('en-IN')}</span></div>
            <div><span className="font-bold">M/S: {customer.name}</span></div>
            {customer.phone && <div><span>Tel: {customer.phone}</span></div>}
          </div>

          {/* Table */}
          <table className="w-full border-collapse text-[8px]">
            <thead>
              <tr className="border-b border-black font-bold text-left">
                <th className="py-1 w-6">Sr</th>
                <th className="py-1">Description</th>
                {shop?.showColHsn !== false && <th className="py-1 w-10 text-center">HSN</th>}
                <th className="py-1 w-8 text-center">Qty</th>
                {shop?.showColUnit !== false && <th className="py-1 w-8 text-center">Unit</th>}
                {shop?.showColRate !== false && <th className="py-1 w-12 text-right">Rate</th>}
                {shop?.showColTaxable !== false && <th className="py-1 w-12 text-right">Taxable</th>}
                {shop?.showColGst !== false && <th className="py-1 w-12 text-right">GST</th>}
                <th className="py-1 w-12 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item, idx) => {
                const itemTaxRate = item.product?.taxRate ?? 0;
                const lineTotal = item.quantity * item.unitPrice;
                const rateExclusive = item.unitPrice / (1 + itemTaxRate / 100);
                const taxableValue = item.quantity * rateExclusive;
                const gstAmount = lineTotal - taxableValue;

                const isAgro = shop?.businessType === 'Agro Store' || shop?.businessType?.toLowerCase().includes('agro') || shop?.businessType?.toLowerCase().includes('krishi');
                const isMedical = shop?.businessType === 'Pharmacy / Medical' || shop?.businessType?.toLowerCase().includes('medical') || shop?.businessType?.toLowerCase().includes('pharmacy');
                const isWholesale = shop?.businessType?.toLowerCase().includes('wholesale') || shop?.businessType?.toLowerCase().includes('distributor');

                const metaParts = [];
                if (isAgro) {
                  if (shop?.showColExpiry !== false && item.product?.expiryDate) metaParts.push(`Exp: ${item.product.expiryDate}`);
                  if (shop?.showColCompany !== false && item.product?.companyName) metaParts.push(`Co: ${item.product.companyName}`);
                } else if (isMedical) {
                  if (shop?.showColExpiry !== false && item.product?.expiryDate) metaParts.push(`Exp: ${item.product.expiryDate}`);
                  if (shop?.showColBatch !== false && item.product?.batchNumber) metaParts.push(`Batch: ${item.product.batchNumber}`);
                  if (shop?.showColCompany !== false && item.product?.companyName) metaParts.push(`Mfg: ${item.product.companyName}`);
                } else if (isWholesale) {
                  if (shop?.showColMinOrder !== false && item.product?.minOrderQty) metaParts.push(`MOQ: ${item.product.minOrderQty}`);
                  if (shop?.showColBulkPrice !== false && item.product?.bulkPrice) metaParts.push(`Bulk: ₹${item.product.bulkPrice}`);
                }
                const metaText = metaParts.join(" · ");

                return (
                  <tr key={idx} className="py-1">
                    <td className="py-1 text-center">{idx + 1}</td>
                    <td className="py-1 font-bold text-left">
                      <div>
                        <span>{item.product?.name} {item.product?.actualValue ? `(${item.product.actualValue}${item.product.unit || ''})` : ''}</span>
                        {metaText && <p className="text-[7px] text-gray-500 font-normal mt-0.5">{metaText}</p>}
                      </div>
                    </td>
                    {shop?.showColHsn !== false && <td className="py-1 text-center">{item.product?.hsnSac || '—'}</td>}
                    <td className="py-1 text-center font-bold">{item.quantity}</td>
                    {shop?.showColUnit !== false && <td className="py-1 text-center">{item.product?.unit || 'NOS'}</td>}
                    {shop?.showColRate !== false && <td className="py-1 text-right">{"\u20B9"}{rateExclusive.toFixed(1)}</td>}
                    {shop?.showColTaxable !== false && <td className="py-1 text-right">{"\u20B9"}{taxableValue.toFixed(1)}</td>}
                    {shop?.showColGst !== false && <td className="py-1 text-right">{"\u20B9"}{gstAmount.toFixed(1)}</td>}
                    <td className="py-1 text-right font-bold">{"\u20B9"}{lineTotal.toFixed(1)}</td>
                  </tr>
                );
              })}
              <tr className="border-t border-black font-bold">
                <td colSpan={leftColSpan} className="py-1 text-right">Qty Total:</td>
                <td className="py-1 text-center">{items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                {shop?.showColUnit !== false && <td></td>}
                {shop?.showColRate !== false && <td></td>}
                {shop?.showColTaxable !== false && <td></td>}
                {shop?.showColGst !== false && <td></td>}
                <td className="py-1 text-right">{"\u20B9"}{subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Summary */}
          <div className="border-t border-dashed border-black pt-2 space-y-1 text-[8px]">
            <div className="flex justify-between"><span>Subtotal</span><span>{"\u20B9"}{subtotal.toFixed(2)}</span></div>
            {invoice.discountPercentage > 0 && <div className="flex justify-between text-red-650"><span>Discount ({invoice.discountPercentage}%)</span><span>-{"\u20B9"}{discountAmount.toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-[10px]"><span>Grand Total</span><span>{"\u20B9"}{invoice.grandTotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Paid Amount</span><span className="text-green-600 font-bold">{"\u20B9"}{invoice.amountPaid.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Balance Due</span><span className="text-red-600 font-bold">{"\u20B9"}{balance.toFixed(2)}</span></div>
          </div>

          {shop?.showFooterMessage !== false && (
            <div className="text-center text-[7px] text-gray-500 italic mt-4">{shop?.footerMessage}</div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. RETAIL GRID TEMPLATE (Pink Copy style)
          ───────────────────────────────────────────────────────────────────────────── */}
      {template === 'retail' && (
        <div className="border border-[#800020] p-4 flex flex-col min-h-[600px] justify-between bg-white rounded">
          <div>
            {/* Header */}
            <div className="text-center border-b border-[#800020] pb-3 mb-4 relative">
              <span className="text-[9px] font-bold text-[#800020] tracking-widest block mb-1">|| Cash / Credit Memo ||</span>
              <h1 className="text-2xl font-black text-[#800020] tracking-wider uppercase mb-1">{shop?.businessName}</h1>
              {shop?.address && <p className="text-[10px] text-gray-700 leading-normal max-w-lg mx-auto">{shop.address}</p>}
              
              <div className="flex justify-between items-end mt-3 text-[9px] text-gray-700">
                <div>
                  {shop?.showGst !== false && shop?.taxId && <p><span className="font-bold text-[#800020]">GSTIN:</span> {shop.taxId}</p>}
                  {shop?.showLicense !== false && shop?.licenseNum && <p><span className="font-bold text-[#800020]">Lic No:</span> {shop.licenseNum}</p>}
                </div>
                <div className="text-right">
                  {shop?.phone && <p><span className="font-bold text-[#800020]">Mob:</span> {shop.phone}</p>}
                  {shop?.email && <p><span className="font-bold text-[#800020]">Email:</span> {shop.email}</p>}
                </div>
              </div>

              {/* Prominent Red Bill Number */}
              <div className="absolute top-1 right-2 border border-red-500 rounded p-1 px-3 text-center bg-white shadow-sm">
                <span className="text-[8px] text-gray-500 block">No.</span>
                <span className="text-sm font-black text-red-600 block">{invoice.invoiceNum.replace(/^\D+/g, '') || invoice.invoiceNum}</span>
              </div>
            </div>

            {/* Customer Info Box */}
            <div className="grid grid-cols-2 border border-[#800020] rounded p-2 mb-4 bg-white text-[10px] text-gray-900 leading-relaxed">
              <div className="border-r border-[#800020] pr-3 space-y-0.5">
                <p><span className="font-bold text-[#800020] w-16 inline-block">Name:</span><span className="font-bold">{customer.name}</span></p>
                <p><span className="font-bold text-[#800020] w-16 inline-block">Address:</span>{customer.address || '—'}</p>
                <p><span className="font-bold text-[#800020] w-16 inline-block">Phone:</span>{customer.phone || '—'}</p>
              </div>
              <div className="pl-3 space-y-0.5">
                <p><span className="font-bold text-[#800020] w-16 inline-block">Bill No:</span><span className="font-bold">{invoice.invoiceNum}</span></p>
                <p><span className="font-bold text-[#800020] w-16 inline-block">Date:</span>{new Date(invoice.issuedAt).toLocaleDateString('en-IN')}</p>
                {shop?.showPaymentTerms !== false && invoice.dueDate && (
                  <p><span className="font-bold text-[#800020] w-16 inline-block">Due Date:</span><span className="font-bold text-red-600">{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</span></p>
                )}
              </div>
            </div>

            {/* Grid Table */}
            <div className="border border-black rounded overflow-hidden bg-white mb-4">
              <table className="w-full border-collapse text-[10px] text-black">
                <thead>
                  <tr className="bg-[#ffdbe2] border-b border-black font-bold text-center">
                    <th className="border-r border-black py-2 px-1 w-10">Sr.</th>
                    <th className="border-r border-black py-2 px-2 text-left">Particulars</th>
                    {shop?.showColHsn !== false && <th className="border-r border-black py-2 px-1 w-20">HSN/SAC</th>}
                    <th className="border-r border-black py-2 px-1 w-12">Qty</th>
                    {shop?.showColUnit !== false && <th className="border-r border-black py-2 px-1 w-12">Unit</th>}
                    {shop?.showColRate !== false && <th className="border-r border-black py-2 px-2 text-right w-20">Rate</th>}
                    {shop?.showColTaxable !== false && <th className="border-r border-black py-2 px-2 text-right w-24">Taxable</th>}
                    {shop?.showColGst !== false && (
                      <th className="border-r border-black p-0 w-28">
                        <div className="border-b border-black py-0.5">GST</div>
                        <div className="flex text-[8px]">
                          <span className="w-1/2 border-r border-black py-0.5">%</span>
                          <span className="w-1/2 py-0.5">Amt</span>
                        </div>
                      </th>
                    )}
                    <th className="py-2 px-2 text-right w-24">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {items.map((item, idx) => {
                    const itemTaxRate = item.product?.taxRate ?? 0;
                    const lineTotal = item.quantity * item.unitPrice;
                    const rateExclusive = item.unitPrice / (1 + itemTaxRate / 100);
                    const taxableValue = item.quantity * rateExclusive;
                    const gstAmount = lineTotal - taxableValue;

                    const isAgro = shop?.businessType === 'Agro Store' || shop?.businessType?.toLowerCase().includes('agro') || shop?.businessType?.toLowerCase().includes('krishi');
                    const isMedical = shop?.businessType === 'Pharmacy / Medical' || shop?.businessType?.toLowerCase().includes('medical') || shop?.businessType?.toLowerCase().includes('pharmacy');
                    const isWholesale = shop?.businessType?.toLowerCase().includes('wholesale') || shop?.businessType?.toLowerCase().includes('distributor');

                    const metaParts = [];
                    if (isAgro) {
                      if (shop?.showColExpiry !== false && item.product?.expiryDate) metaParts.push(`Exp: ${item.product.expiryDate}`);
                      if (shop?.showColCompany !== false && item.product?.companyName) metaParts.push(`Co: ${item.product.companyName}`);
                    } else if (isMedical) {
                      if (shop?.showColExpiry !== false && item.product?.expiryDate) metaParts.push(`Exp: ${item.product.expiryDate}`);
                      if (shop?.showColBatch !== false && item.product?.batchNumber) metaParts.push(`Batch: ${item.product.batchNumber}`);
                      if (shop?.showColCompany !== false && item.product?.companyName) metaParts.push(`Mfg: ${item.product.companyName}`);
                    } else if (isWholesale) {
                      if (shop?.showColMinOrder !== false && item.product?.minOrderQty) metaParts.push(`MOQ: ${item.product.minOrderQty}`);
                      if (shop?.showColBulkPrice !== false && item.product?.bulkPrice) metaParts.push(`Bulk: ₹${item.product.bulkPrice}`);
                    }
                    const metaText = metaParts.join(" · ");

                    return (
                      <tr key={idx} className="text-center align-middle">
                        <td className="border-r border-black py-2 px-1">{idx + 1}</td>
                        <td className="border-r border-black py-2 px-2 text-left font-bold">
                          <div>
                            <span>{item.product?.name} {item.product?.actualValue ? `(${item.product.actualValue}${item.product.unit || ''})` : ''}</span>
                            {metaText && <p className="text-[8px] text-gray-500 font-normal mt-0.5">{metaText}</p>}
                          </div>
                        </td>
                        {shop?.showColHsn !== false && <td className="border-r border-black py-2 px-1">{item.product?.hsnSac || '—'}</td>}
                        <td className="border-r border-black py-2 px-1 font-bold">{item.quantity}</td>
                        {shop?.showColUnit !== false && <td className="border-r border-black py-2 px-1">{item.product?.unit || 'NOS'}</td>}
                        {shop?.showColRate !== false && <td className="border-r border-black py-2 px-2 text-right">{"\u20B9"}{rateExclusive.toFixed(2)}</td>}
                        {shop?.showColTaxable !== false && <td className="border-r border-black py-2 px-2 text-right">{"\u20B9"}{taxableValue.toFixed(2)}</td>}
                        {shop?.showColGst !== false && (
                          <td className="border-r border-black p-0">
                            <div className="flex h-full items-stretch">
                              <span className="w-1/2 border-r border-black py-2 px-1 flex items-center justify-center font-medium">{itemTaxRate}%</span>
                              <span className="w-1/2 py-2 px-1 flex items-center justify-end font-medium">{"\u20B9"}{gstAmount.toFixed(2)}</span>
                            </div>
                          </td>
                        )}
                        <td className="py-2 px-2 text-right font-bold">{"\u20B9"}{lineTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-[#ffdbe2] font-bold border-t border-black text-center">
                    <td colSpan={leftColSpan} className="border-r border-black py-2 px-2 text-right">Totals</td>
                    <td className="border-r border-black py-2 px-1">{items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                    {shop?.showColUnit !== false && <td className="border-r border-black"></td>}
                    {shop?.showColRate !== false && <td className="border-r border-black"></td>}
                    {shop?.showColTaxable !== false && <td className="border-r border-black py-2 px-2 text-right">{"\u20B9"}{totalTaxable.toFixed(2)}</td>}
                    {shop?.showColGst !== false && (
                      <td className="border-r border-black p-0">
                        <div className="flex h-full items-stretch">
                          <span className="w-1/2 border-r border-black"></span>
                          <span className="w-1/2 py-2 px-1 text-right">{"\u20B9"}{totalGst.toFixed(2)}</span>
                        </div>
                      </td>
                    )}
                    <td className="py-2 px-2 text-right">{"\u20B9"}{subtotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border border-[#800020] rounded p-3 bg-white text-[10px] leading-relaxed">
              <div className="space-y-3 pr-4 border-r border-[#800020]">
                <div>
                  <span className="font-bold text-[#800020] block text-[8px] uppercase tracking-wider mb-1">Total In Words (अक्षरी रुपये)</span>
                  <p className="font-bold text-gray-900 bg-gray-50 border border-gray-200 p-2 rounded text-[9px] capitalize">{numberToWords(invoice.grandTotal)}</p>
                </div>
                {shop?.showBankDetails !== false && shop?.bankName && (
                  <div className="space-y-0.5 text-[9px] bg-gray-50 border border-gray-200 p-2 rounded">
                    <span className="font-bold text-[#800020] block text-[7px] uppercase tracking-wider mb-1">Bank Account</span>
                    <p><span className="font-semibold text-gray-600">Bank:</span> {shop.bankName}</p>
                    {shop?.accountNum && <p><span className="font-semibold text-gray-600">A/c No:</span> {shop.accountNum}</p>}
                    {shop?.ifscCode && <p><span className="font-semibold text-gray-600">IFSC:</span> {shop.ifscCode}</p>}
                  </div>
                )}
                {shop?.showFooterMessage !== false && (
                  <p className="text-[8px] text-gray-500 italic mt-2">{shop.footerMessage}</p>
                )}
              </div>
              <div className="pl-4 space-y-1.5 text-[10px]">
                <div className="flex justify-between text-gray-700"><span>Taxable Amount</span><span>{"\u20B9"}{totalTaxable.toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-700"><span>GST Amount</span><span>{"\u20B9"}{totalGst.toFixed(2)}</span></div>
                {invoice.discountPercentage > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold"><span>Less: Discount ({invoice.discountPercentage}%)</span><span>-{"\u20B9"}{discountAmount.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between font-black text-gray-950 border-t border-gray-400 pt-1 text-[11px]"><span>Grand Total (एकूण)</span><span>{"\u20B9"}{invoice.grandTotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-green-700 font-bold"><span>Amount Paid</span><span>{"\u20B9"}{invoice.amountPaid.toFixed(2)}</span></div>
                <div className="flex justify-between text-rose-700 font-black border-t border-dashed border-gray-300 pt-1"><span>Due</span><span>{"\u20B9"}{balance.toFixed(2)}</span></div>
              </div>
            </div>
          </div>

          {/* Signature Rows */}
          <div className="flex justify-between items-end mt-12 text-[10px] text-gray-800">
            <div className="text-center w-52">
              <div className="border-b border-black w-40 mx-auto pb-6"></div>
              <p className="font-bold mt-2">Customer Signature (माल घेणाराची सही)</p>
            </div>
            <div className="text-right w-72 flex flex-col items-end">
              <p className="font-bold text-[#800020] text-[11px] mb-8">For {shop?.businessName} ({shop?.businessName} करिता)</p>
              <p className="font-bold text-gray-800 text-[10px] border-t border-black pt-1 w-40 text-center">Authorised Signatory</p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. MODERN MINIMALIST TEMPLATE
          ───────────────────────────────────────────────────────────────────────────── */}
      {template === 'minimal' && (
        <div className="space-y-6">
          {/* Minimal Header */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">{shop?.businessName}</h1>
              {shop?.description && <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mt-1">{shop.description}</p>}
              <p className="text-[10px] text-slate-400 mt-2 max-w-sm">{shop?.address}</p>
              {shop?.showGst !== false && shop?.taxId && <p className="text-[10px] text-slate-400">GSTIN: {shop.taxId}</p>}
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest block">INVOICE</span>
              <span className="text-xl font-black text-slate-900 mt-1 block">{invoice.invoiceNum}</span>
              <span className="text-[10px] text-slate-400 mt-1.5 block">Issued: {new Date(invoice.issuedAt).toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          {/* Meta Details */}
          <div className="grid grid-cols-2 gap-8 text-[11px] border-b border-slate-100 pb-6">
            <div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Billed To</span>
              <p className="text-xs font-black text-slate-900">{customer.name}</p>
              <p className="text-slate-500 mt-1">{customer.address || "No Address Provided"}</p>
              <p className="text-slate-500 mt-0.5">Tel: {customer.phone || '—'}</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Invoice Summary</span>
              <p className="text-slate-700">Total Billed: <span className="font-bold text-slate-900">{"\u20B9"}{invoice.grandTotal.toFixed(2)}</span></p>
              <p className="text-slate-700 mt-1">Due Date: <span className="font-semibold text-slate-900">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'On Receipt'}</span></p>
            </div>
          </div>

          {/* Flat Table */}
          <table className="w-full text-[11px] text-slate-700">
            <thead>
              <tr className="border-b-2 border-slate-900 font-bold text-slate-900 text-center">
                <th className="py-2 px-1 w-10">Sr. No.</th>
                <th className="py-2 px-2 text-left">Item Name</th>
                {shop?.showColHsn !== false && <th className="py-2 px-1 w-20">HSN</th>}
                <th className="py-2 px-1 w-12">Qty</th>
                {shop?.showColUnit !== false && <th className="py-2 px-1 w-12">Unit</th>}
                {shop?.showColRate !== false && <th className="py-2 px-2 text-right w-20">Rate</th>}
                {shop?.showColTaxable !== false && <th className="py-2 px-2 text-right w-24">Taxable</th>}
                {shop?.showColGst !== false && <th className="py-2 px-2 text-right w-24">GST</th>}
                <th className="py-2 px-2 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => {
                const itemTaxRate = item.product?.taxRate ?? 0;
                const lineTotal = item.quantity * item.unitPrice;
                const rateExclusive = item.unitPrice / (1 + itemTaxRate / 100);
                const taxableValue = item.quantity * rateExclusive;
                const gstAmount = lineTotal - taxableValue;

                const isAgro = shop?.businessType === 'Agro Store' || shop?.businessType?.toLowerCase().includes('agro') || shop?.businessType?.toLowerCase().includes('krishi');
                const isMedical = shop?.businessType === 'Pharmacy / Medical' || shop?.businessType?.toLowerCase().includes('medical') || shop?.businessType?.toLowerCase().includes('pharmacy');
                const isWholesale = shop?.businessType?.toLowerCase().includes('wholesale') || shop?.businessType?.toLowerCase().includes('distributor');

                const metaParts = [];
                if (isAgro) {
                  if (shop?.showColExpiry !== false && item.product?.expiryDate) metaParts.push(`Exp: ${item.product.expiryDate}`);
                  if (shop?.showColCompany !== false && item.product?.companyName) metaParts.push(`Co: ${item.product.companyName}`);
                } else if (isMedical) {
                  if (shop?.showColExpiry !== false && item.product?.expiryDate) metaParts.push(`Exp: ${item.product.expiryDate}`);
                  if (shop?.showColBatch !== false && item.product?.batchNumber) metaParts.push(`Batch: ${item.product.batchNumber}`);
                  if (shop?.showColCompany !== false && item.product?.companyName) metaParts.push(`Mfg: ${item.product.companyName}`);
                } else if (isWholesale) {
                  if (shop?.showColMinOrder !== false && item.product?.minOrderQty) metaParts.push(`MOQ: ${item.product.minOrderQty}`);
                  if (shop?.showColBulkPrice !== false && item.product?.bulkPrice) metaParts.push(`Bulk: ₹${item.product.bulkPrice}`);
                }
                const metaText = metaParts.join(" · ");

                return (
                  <tr key={idx} className="text-center">
                    <td className="py-2.5 px-1 text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-2 text-left font-black text-slate-950 font-bold">
                      <div>
                        <span>{item.product?.name} {item.product?.actualValue ? `(${item.product.actualValue}${item.product.unit || ''})` : ''}</span>
                        {metaText && <p className="text-[8px] text-slate-500 font-normal mt-0.5">{metaText}</p>}
                      </div>
                    </td>
                    {shop?.showColHsn !== false && <td className="py-2.5 px-1">{item.product?.hsnSac || '—'}</td>}
                    <td className="py-2.5 px-1 font-bold text-slate-900">{item.quantity}</td>
                    {shop?.showColUnit !== false && <td className="py-2.5 px-1 text-slate-500">{item.product?.unit || 'NOS'}</td>}
                    {shop?.showColRate !== false && <td className="py-2.5 px-2 text-right">{"\u20B9"}{rateExclusive.toFixed(2)}</td>}
                    {shop?.showColTaxable !== false && <td className="py-2.5 px-2 text-right">{"\u20B9"}{taxableValue.toFixed(2)}</td>}
                    {shop?.showColGst !== false && <td className="py-2.5 px-2 text-right">{"\u20B9"}{gstAmount.toFixed(2)} ({itemTaxRate}%)</td>}
                    <td className="py-2.5 px-2 text-right font-black text-slate-955">{"\u20B9"}{lineTotal.toFixed(2)}</td>
                  </tr>
                );
              })}
              <tr className="font-bold border-t-2 border-slate-900 bg-slate-50/50">
                <td colSpan={leftColSpan} className="py-3 px-2 text-right text-slate-900">Totals</td>
                <td className="py-3 px-1 text-center text-slate-900">{items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                {shop?.showColUnit !== false && <td></td>}
                {shop?.showColRate !== false && <td></td>}
                {shop?.showColTaxable !== false && <td className="py-3 px-2 text-right text-slate-900">{"\u20B9"}{totalTaxable.toFixed(2)}</td>}
                {shop?.showColGst !== false && <td className="py-3 px-2 text-right text-slate-900">{"\u20B9"}{totalGst.toFixed(2)}</td>}
                <td className="py-3 px-2 text-right text-slate-900">{"\u20B9"}{subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Summary Section */}
          <div className="flex justify-end pt-4">
            <div className="w-72 space-y-2 text-[10px]">
              <div className="flex justify-between text-slate-500"><span>Taxable Amount</span><span>{"\u20B9"}{totalTaxable.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-500"><span>GST Tax</span><span>{"\u20B9"}{totalGst.toFixed(2)}</span></div>
              {invoice.discountPercentage > 0 && <div className="flex justify-between text-rose-600 font-semibold"><span>Discount ({invoice.discountPercentage}%)</span><span>-{"\u20B9"}{discountAmount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-slate-900 font-extrabold text-xs border-t border-slate-200 pt-2"><span>Grand Total</span><span>{"\u20B9"}{invoice.grandTotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-green-600 font-semibold"><span>Amount Paid</span><span>{"\u20B9"}{invoice.amountPaid.toFixed(2)}</span></div>
              <div className="flex justify-between text-rose-600 font-extrabold border-t border-slate-200 pt-1.5"><span>Balance Due</span><span>{"\u20B9"}{balance.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t border-slate-100 flex justify-between items-end text-[9px] text-slate-400">
            <div>
              {shop?.showFooterMessage !== false && <p className="italic">{shop?.footerMessage}</p>}
              <p className="mt-1">Computer generated document — no signature required.</p>
            </div>
            <div className="text-right font-black text-slate-700">For {shop?.businessName}</div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          4. COMPACT LANDSCAPE A5 TEMPLATE
          ───────────────────────────────────────────────────────────────────────────── */}
      {template === 'landscape' && (
        <div className="space-y-4 text-[10px]">
          {/* Landscape Header */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-2">
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">{shop?.businessName}</h1>
              {shop?.address && <p className="text-[9px] text-gray-500">{shop.address}</p>}
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black text-sky-700 uppercase tracking-widest block">TAX INVOICE</span>
              <span className="text-xs font-black text-gray-800 mt-0.5 block">{invoice.invoiceNum}</span>
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 bg-gray-50 border border-gray-200 p-2 rounded text-[10px]">
            <div>
              <span className="text-[7px] text-gray-400 block uppercase font-bold">Customer Details</span>
              <p className="font-bold text-gray-900">{customer.name}</p>
              <p className="text-gray-500">{customer.phone}</p>
            </div>
            <div className="text-right">
              <span className="text-[7px] text-gray-400 block uppercase font-bold">Invoice Details</span>
              <p className="text-gray-600">Date: {new Date(invoice.issuedAt).toLocaleDateString('en-IN')}</p>
              {invoice.dueDate && <p className="font-bold text-gray-700">Due: {new Date(invoice.dueDate).toLocaleDateString('en-IN')}</p>}
            </div>
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full border-collapse text-[9px] text-gray-800">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 font-bold text-center">
                  <th className="py-1.5 px-1 border-r border-gray-200">Sr.</th>
                  <th className="py-1.5 px-2 text-left border-r border-gray-200">Item</th>
                  {shop?.showColHsn !== false && <th className="py-1.5 px-1 border-r border-gray-200">HSN</th>}
                  <th className="py-1.5 px-1 border-r border-gray-200">Qty</th>
                  {shop?.showColUnit !== false && <th className="py-1.5 px-1 border-r border-gray-200">Unit</th>}
                  {shop?.showColRate !== false && <th className="py-1.5 px-2 text-right border-r border-gray-200">Rate</th>}
                  {shop?.showColTaxable !== false && <th className="py-1.5 px-2 text-right border-r border-gray-200">Taxable</th>}
                  {shop?.showColGst !== false && <th className="py-1.5 px-2 text-right border-r border-gray-200">GST</th>}
                  <th className="py-1.5 px-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item, idx) => {
                  const itemTaxRate = item.product?.taxRate ?? 0;
                  const lineTotal = item.quantity * item.unitPrice;
                  const rateExclusive = item.unitPrice / (1 + itemTaxRate / 100);
                  const taxableValue = item.quantity * rateExclusive;
                  const gstAmount = lineTotal - taxableValue;

                  const isAgro = shop?.businessType === 'Agro Store' || shop?.businessType?.toLowerCase().includes('agro') || shop?.businessType?.toLowerCase().includes('krishi');
                  const isMedical = shop?.businessType === 'Pharmacy / Medical' || shop?.businessType?.toLowerCase().includes('medical') || shop?.businessType?.toLowerCase().includes('pharmacy');
                  const isWholesale = shop?.businessType?.toLowerCase().includes('wholesale') || shop?.businessType?.toLowerCase().includes('distributor');

                  const metaParts = [];
                  if (isAgro) {
                    if (shop?.showColExpiry !== false && item.product?.expiryDate) metaParts.push(`Exp: ${item.product.expiryDate}`);
                    if (shop?.showColCompany !== false && item.product?.companyName) metaParts.push(`Co: ${item.product.companyName}`);
                  } else if (isMedical) {
                    if (shop?.showColExpiry !== false && item.product?.expiryDate) metaParts.push(`Exp: ${item.product.expiryDate}`);
                    if (shop?.showColBatch !== false && item.product?.batchNumber) metaParts.push(`Batch: ${item.product.batchNumber}`);
                    if (shop?.showColCompany !== false && item.product?.companyName) metaParts.push(`Mfg: ${item.product.companyName}`);
                  } else if (isWholesale) {
                    if (shop?.showColMinOrder !== false && item.product?.minOrderQty) metaParts.push(`MOQ: ${item.product.minOrderQty}`);
                    if (shop?.showColBulkPrice !== false && item.product?.bulkPrice) metaParts.push(`Bulk: ₹${item.product.bulkPrice}`);
                  }
                  const metaText = metaParts.join(" · ");

                  return (
                    <tr key={idx} className="text-center">
                      <td className="py-1 px-1 border-r border-gray-200">{idx + 1}</td>
                      <td className="py-1 px-2 text-left border-r border-gray-200 font-bold">
                        <div>
                          <span>{item.product?.name} {item.product?.actualValue ? `(${item.product.actualValue}${item.product.unit || ''})` : ''}</span>
                          {metaText && <p className="text-[7px] text-gray-500 font-normal mt-0.5">{metaText}</p>}
                        </div>
                      </td>
                      {shop?.showColHsn !== false && <td className="py-1 px-1 border-r border-gray-200">{item.product?.hsnSac || '—'}</td>}
                      <td className="py-1 px-1 border-r border-gray-200 font-bold">{item.quantity}</td>
                      {shop?.showColUnit !== false && <td className="py-1 px-1 border-r border-gray-200">{item.product?.unit || 'NOS'}</td>}
                      {shop?.showColRate !== false && <td className="py-1 px-2 text-right border-r border-gray-200">{"\u20B9"}{rateExclusive.toFixed(1)}</td>}
                      {shop?.showColTaxable !== false && <td className="py-1 px-2 text-right border-r border-gray-200">{"\u20B9"}{taxableValue.toFixed(1)}</td>}
                      {shop?.showColGst !== false && <td className="py-1 px-2 text-right border-r border-gray-200">{"\u20B9"}{gstAmount.toFixed(1)} ({itemTaxRate}%)</td>}
                      <td className="py-1 px-2 text-right font-bold">{"\u20B9"}{lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Small Footer Summary */}
          <div className="flex justify-between items-start pt-2 text-[9px]">
            <div className="w-[55%]">
              {shop?.showFooterMessage !== false && <p className="italic text-gray-500">{shop.footerMessage}</p>}
            </div>
            <div className="w-[40%] space-y-1">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{"\u20B9"}{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-gray-900"><span>Grand Total</span><span>{"\u20B9"}{invoice.grandTotal.toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          5. CLASSIC PREMIUM TEMPLATE (DEFAULT)
          ───────────────────────────────────────────────────────────────────────────── */}
      {template === 'classic' && (
        <>
          {/* Top header row */}
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4 border-b border-gray-200 pb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-1 uppercase">{shop?.businessName}</h1>
              {shop?.description && (
                <div className="bg-[#00a29a] text-white font-bold text-[10px] px-3 py-1.5 rounded uppercase tracking-wider inline-block mb-3">
                  {shop.description}
                </div>
              )}
              <div className="text-[10px] text-gray-500 leading-relaxed max-w-md">
                {shop?.address && <p>{shop.address}</p>}
                <p className="mt-1">
                  {shop?.phone && <span>Tel : {shop.phone} </span>}
                  {shop?.email && <span>| Web : {shop.email}</span>}
                </p>
                {shop?.showGst !== false && shop?.taxId && (
                  <p className="mt-1 font-semibold text-gray-700">GSTIN : {shop.taxId}</p>
                )}
                {shop?.showLicense !== false && (
                  <div className="mt-1 space-y-0.5">
                    {shop?.licenseNum && <p><span className="font-semibold">Lic No:</span> {shop.licenseNum}</p>}
                    {(shop?.businessType === 'Agro Store' || shop?.businessType?.toLowerCase().includes('agro') || shop?.businessType?.toLowerCase().includes('krishi')) && (
                      <>
                        {shop?.aushadhLicenseNum && <p><span className="font-semibold">Aushadh Lic:</span> {shop.aushadhLicenseNum}</p>}
                        {shop?.khateLicenseNum && <p><span className="font-semibold">Khate Lic:</span> {shop.khateLicenseNum}</p>}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end">
              {shop?.logoBase64 ? (
                <img src={shop.logoBase64} alt="Shop Logo" className="h-16 w-auto object-contain rounded-lg mb-2" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white font-black text-sm mb-2">
                  {shop?.businessName?.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* PAN, TAX INVOICE banner line */}
          <div className="border-t border-b border-gray-300 py-1.5 my-3 grid grid-cols-3 items-center text-[10px] font-bold text-gray-850">
            <div>
              {shop?.showGst !== false && shop?.taxId ? `PAN : ${shop.taxId.substring(2, 12).toUpperCase()}` : ""}
            </div>
            <div className="text-center text-sm font-black tracking-widest text-black">TAX INVOICE</div>
            <div className="text-right text-[8px] text-gray-500 uppercase">Original for Recipient</div>
          </div>

          {/* 2-Column Info Grid: Customer Details vs Invoice Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border border-gray-300 rounded overflow-hidden mb-6 text-[10px]">
            {/* Left Column: Customer Details */}
            <div className="p-3 border-r border-gray-300 space-y-1">
              <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-200 mb-1.5">Customer Detail</div>
              <div className="flex"><span className="w-24 font-bold shrink-0">M/S</span><span className="text-gray-900 font-bold">{customer.name}</span></div>
              <div className="flex"><span className="w-24 font-bold shrink-0">Address</span><span className="text-gray-600 leading-relaxed">{customer.address || "N/A"}</span></div>
              <div className="flex"><span className="w-24 font-bold shrink-0">Phone</span><span className="text-gray-600">{customer.phone}</span></div>
              {customer.taxId && <div className="flex"><span className="w-24 font-bold shrink-0">GSTIN</span><span className="text-gray-955 font-bold">{customer.taxId}</span></div>}
            </div>
            
            {/* Right Column: Invoice Details */}
            <div className="p-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
              <div className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-200 mb-1.5">Invoice Details</div>
              <div><span className="font-bold text-gray-500 block">Invoice No.</span><span className="font-bold text-gray-900">{invoice.invoiceNum}</span></div>
              <div><span className="font-bold text-gray-500 block">Invoice Date</span><span className="font-bold text-gray-900">{new Date(invoice.issuedAt).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}</span></div>
              {shop?.showPaymentTerms !== false && (
                <>
                  <div><span className="font-bold text-gray-500 block">Payment Terms</span><span className="text-gray-700">{invoice.paymentTerms}</span></div>
                  <div><span className="font-bold text-gray-500 block">Due Date</span><span className="text-gray-700">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : "Immediate"}</span></div>
                </>
              )}
              {statusBadge && <div className="col-span-2"><span className="font-bold text-gray-500 block">Status</span><span className="mt-0.5 inline-block">{statusBadge}</span></div>}
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-6 border border-gray-300 rounded">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300 font-bold text-gray-700 text-center">
                  <th className="border-r border-gray-300 py-2 px-1 w-10">Sr. No.</th>
                  <th className="border-r border-gray-300 py-2 px-2 text-left">Name of Product / Service</th>
                  {shop?.showColHsn !== false && <th className="border-r border-gray-300 py-2 px-1 w-20">HSN / SAC</th>}
                  <th className="border-r border-gray-300 py-2 px-1 w-12">Qty</th>
                  {shop?.showColUnit !== false && <th className="border-r border-gray-300 py-2 px-1 w-12">Unit</th>}
                  {shop?.showColRate !== false && <th className="border-r border-gray-300 py-2 px-2 text-right w-20">Rate</th>}
                  {shop?.showColTaxable !== false && <th className="border-r border-gray-300 py-2 px-2 text-right w-24">Taxable Value</th>}
                  {shop?.showColGst !== false && (
                    <th className="border-r border-gray-300 p-0 w-28">
                      <div className="border-b border-gray-300 py-1 font-bold">GST</div>
                      <div className="flex text-[8px] font-bold">
                        <span className="w-1/2 border-r border-gray-300 py-0.5">%</span>
                        <span className="w-1/2 py-0.5">Amount</span>
                      </div>
                    </th>
                  )}
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

                  const isAgro = shop?.businessType === 'Agro Store' || shop?.businessType?.toLowerCase().includes('agro') || shop?.businessType?.toLowerCase().includes('krishi');
                  const isMedical = shop?.businessType === 'Pharmacy / Medical' || shop?.businessType?.toLowerCase().includes('medical') || shop?.businessType?.toLowerCase().includes('pharmacy');
                  const isWholesale = shop?.businessType?.toLowerCase().includes('wholesale') || shop?.businessType?.toLowerCase().includes('distributor');

                  const metaParts = [];
                  if (isAgro) {
                    if (shop?.showColExpiry !== false && item.product?.expiryDate) metaParts.push(`Exp: ${item.product.expiryDate}`);
                    if (shop?.showColCompany !== false && item.product?.companyName) metaParts.push(`Co: ${item.product.companyName}`);
                  } else if (isMedical) {
                    if (shop?.showColExpiry !== false && item.product?.expiryDate) metaParts.push(`Exp: ${item.product.expiryDate}`);
                    if (shop?.showColBatch !== false && item.product?.batchNumber) metaParts.push(`Batch: ${item.product.batchNumber}`);
                    if (shop?.showColCompany !== false && item.product?.companyName) metaParts.push(`Mfg: ${item.product.companyName}`);
                  } else if (isWholesale) {
                    if (shop?.showColMinOrder !== false && item.product?.minOrderQty) metaParts.push(`MOQ: ${item.product.minOrderQty}`);
                    if (shop?.showColBulkPrice !== false && item.product?.bulkPrice) metaParts.push(`Bulk: ₹${item.product.bulkPrice}`);
                  }
                  const metaText = metaParts.join(" · ");
                  
                  return (
                    <tr key={idx} className="hover:bg-gray-50/20 text-center font-sans">
                      <td className="border-r border-gray-300 py-2 px-1 font-medium">{idx + 1}</td>
                      <td className="border-r border-gray-300 py-2 px-2 text-left font-bold text-gray-900">
                        <div>
                          <span>{item.product?.name || "Unnamed Item"} {item.product?.actualValue ? `(${item.product.actualValue}${item.product.unit || ''})` : ''}</span>
                          {item.product?.isService && (
                            <span className="ml-1.5 text-[8px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-normal">Service</span>
                          )}
                          {metaText && <p className="text-[8px] text-gray-500 font-normal mt-0.5">{metaText}</p>}
                        </div>
                      </td>
                      {shop?.showColHsn !== false && <td className="border-r border-gray-300 py-2 px-1 text-gray-650">{item.product?.hsnSac || '—'}</td>}
                      <td className="border-r border-gray-300 py-2 px-1 font-bold text-gray-900">{item.quantity}</td>
                      {shop?.showColUnit !== false && <td className="border-r border-gray-300 py-2 px-1 text-gray-650">{item.product?.unit || "NOS"}</td>}
                      {shop?.showColRate !== false && <td className="border-r border-gray-300 py-2 px-2 text-right text-gray-700">₹{rateExclusive.toFixed(2)}</td>}
                      {shop?.showColTaxable !== false && <td className="border-r border-gray-300 py-2 px-2 text-right text-gray-700 font-medium">₹{taxableValue.toFixed(2)}</td>}
                      {shop?.showColGst !== false && (
                        <td className="border-r border-gray-300 p-0 text-gray-750">
                          <div className="flex h-full items-stretch">
                            <span className="w-1/2 border-r border-gray-300 py-2 px-1 flex items-center justify-center font-medium">{itemTaxRate}%</span>
                            <span className="w-1/2 py-2 px-1 flex items-center justify-end font-medium">₹{gstAmount.toFixed(2)}</span>
                          </div>
                        </td>
                      )}
                      <td className="py-2 px-2 text-right font-black text-gray-900">₹{lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
                
                {/* Table Total Row */}
                <tr className="bg-gray-50 font-black text-gray-950 border-t border-gray-300 text-center">
                  <td className="border-r border-gray-300 py-2 px-2 text-right" colSpan={leftColSpan}>Total</td>
                  <td className="border-r border-gray-300 py-2 px-1">{items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  {shop?.showColUnit !== false && <td className="border-r border-gray-300 py-2 px-1"></td>}
                  {shop?.showColRate !== false && <td className="border-r border-gray-300 py-2 px-2"></td>}
                  {shop?.showColTaxable !== false && <td className="border-r border-gray-300 py-2 px-2 text-right">₹{totalTaxable.toFixed(2)}</td>}
                  {shop?.showColGst !== false && (
                    <td className="border-r border-gray-300 p-0">
                      <div className="flex h-full items-stretch">
                        <span className="w-1/2 border-r border-gray-300"></span>
                        <span className="w-1/2 py-2 px-1 text-right">₹{totalGst.toFixed(2)}</span>
                      </div>
                    </td>
                  )}
                  <td className="py-2 px-2 text-right">₹{subtotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Details Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 border border-gray-300 rounded overflow-hidden text-[10px]">
            {/* Left Column */}
            <div className="p-3 border-r border-gray-300 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div>
                  <span className="font-bold text-gray-500 block uppercase text-[8px] tracking-wider mb-1">Total In Words</span>
                  <p className="font-bold text-gray-900 bg-gray-50 border border-gray-200 p-2 rounded leading-relaxed text-[9px] capitalize">{numberToWords(invoice.grandTotal)}</p>
                </div>
                
                <div className="flex gap-4">
                  {shop?.showBankDetails !== false && (
                    <div className="flex-1 space-y-1">
                      <span className="font-bold text-gray-500 block uppercase text-[8px] tracking-wider mb-1">Bank Details</span>
                      {shop?.bankName ? (
                        <div className="bg-gray-50 border border-gray-200 p-2 rounded space-y-0.5 text-[9px]">
                          <p><span className="font-semibold text-gray-600">Bank:</span> {shop.bankName}</p>
                          {shop?.accountNum && <p><span className="font-semibold text-gray-600">A/c No:</span> {shop.accountNum}</p>}
                          {shop?.ifscCode && <p><span className="font-semibold text-gray-600">IFSC:</span> {shop.ifscCode}</p>}
                          {shop?.upiId && <p><span className="font-semibold text-gray-600">UPI ID:</span> {shop.upiId}</p>}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">No bank details configured.</p>
                      )}
                    </div>
                  )}
                  {shop?.showQrCode !== false && shop?.upiId && balance > 0 && (
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

                {shop?.showFooterMessage !== false && (
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

            {/* Right Column */}
            <div className="p-3 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="space-y-1.5 bg-gray-50/50 p-3 rounded border border-gray-200 text-[10px]">
                  <div className="flex justify-between text-gray-600"><span>Taxable Amount</span><span className="font-semibold text-gray-900">₹{totalTaxable.toFixed(2)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Add : GST Tax</span><span className="font-semibold text-gray-900">₹{totalGst.toFixed(2)}</span></div>
                  {invoice.discountPercentage > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold"><span>Less: Discount ({invoice.discountPercentage}%)</span><span>-₹{discountAmount.toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between font-black text-gray-955 border-t-2 border-gray-900 pt-2 text-xs"><span>Grand Total</span><span>₹{invoice.grandTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-green-600 font-bold pt-1"><span>Amount Paid</span><span>₹{invoice.amountPaid.toFixed(2)}</span></div>
                  <div className="flex justify-between text-rose-600 font-black border-t border-gray-200 pt-1.5"><span>Balance Due</span><span>₹{balance.toFixed(2)}</span></div>
                </div>

                <div className="text-[8px] text-gray-500 leading-tight space-y-1">
                  <p className="font-bold text-gray-650 uppercase">Declaration</p>
                  <p>Certified that the particulars given above are true and correct.</p>
                </div>
              </div>

              <div className="mt-8 pt-4 flex flex-col items-center border-t border-gray-200 text-center">
                <p className="text-[8px] font-bold text-gray-500 mb-8">For {shop?.businessName}</p>
                <p className="text-[7px] text-gray-400 italic mb-2">This is a computer generated invoice no signature required.</p>
                <p className="font-bold text-gray-800 text-[9px] border-t border-gray-300 pt-1.5 w-32">Authorised Signatory</p>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
