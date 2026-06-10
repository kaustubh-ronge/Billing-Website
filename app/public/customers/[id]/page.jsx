import React from "react";
import { db } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import { CheckCircle, AlertCircle, HelpCircle, Calendar, User, Mail, MapPin, Receipt, ShieldCheck } from "lucide-react";

export const revalidate = 0; // Disable static cache to reflect payment updates immediately

export default async function PublicCustomerLedgerPage({ params }) {
  const { id } = await params;

  // Retrieve customer along with shop details
  const customer = await db.customer.findFirst({
    where: { id },
    include: {
      shop: true
    }
  });

  if (!customer) {
    notFound();
  }

  const { shop } = customer;

  // Fetch all invoices for the customer
  const invoices = await db.invoice.findMany({
    where: { customerId: customer.id },
    orderBy: { issuedAt: "asc" }
  });

  // Calculate ledger metrics
  const totalBills = invoices.length;
  const totalBilledAmount = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalPending = Math.max(0, totalBilledAmount - totalPaid);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-green-50 text-green-700 border border-green-150">
            <CheckCircle className="h-3 w-3" /> PAID
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-150">
            <AlertCircle className="h-3 w-3" /> PARTIAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-150">
            <HelpCircle className="h-3 w-3" /> UNPAID
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
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Statement of Account</h2>
            <p className="text-xs text-gray-500">For {customer.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-gray-400 font-bold block">Total Outstanding</span>
            <span className="text-sm font-black text-rose-600">₹{totalPending.toFixed(2)}</span>
          </div>
          <PrintButton />
        </div>
      </div>

      {/* Main Ledger Card */}
      <div className="mx-auto max-w-4xl bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden p-8 sm:p-12 print-area">
        {/* Shop Header section */}
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
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Statement Report</h2>
            <p className="text-xl font-bold text-gray-900">Account Summary</p>
            <div className="flex items-center sm:justify-end gap-1.5 text-xs text-gray-500 font-medium">
              <Calendar className="h-3.5 w-3.5" />
              <span>Statement Date: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Customer Account Profile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 text-xs border-b border-gray-100 pb-8">
          <div>
            <h3 className="font-bold uppercase tracking-wider text-gray-400 mb-2.5">Customer details</h3>
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
            {shop.upiId && totalPending > 0 && (
              <div className="inline-block bg-blue-50/30 border border-blue-100 p-3 rounded-xl text-left space-y-1.5 max-w-[260px] sm:ml-auto">
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">Scan & Settle Outstanding</span>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=${shop.upiId}&pn=${encodeURIComponent(shop.businessName)}&am=${totalPending.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`LEDGER-${customer.name.substring(0, 5).toUpperCase()}`)}`)}`} 
                  alt="UPI QR Code" 
                  className="h-28 w-28 mx-auto object-contain bg-white border border-gray-150 p-1 rounded-lg"
                />
                <span className="text-[9px] text-gray-500 font-bold block text-center">Scan using GPay, Paytm, PhonePe</span>
              </div>
            )}
            {totalPending <= 0 && (
              <div className="inline-flex items-center gap-1 px-4 py-2 bg-green-50 text-green-700 rounded-xl font-bold border border-green-150 sm:ml-auto">
                <ShieldCheck className="h-4 w-4" /> Account Cleared
              </div>
            )}
          </div>
        </div>

        {/* Ledger Statistics Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-100 text-center">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Bills</p>
            <h3 className="text-xl font-black text-gray-900 mt-1">{totalBills}</h3>
          </div>
          <div className="border-x border-gray-200">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Paid</p>
            <h3 className="text-xl font-black text-green-600 mt-1">₹{totalPaid.toFixed(2)}</h3>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Outstanding Due</p>
            <h3 className={`text-xl font-black mt-1 ${totalPending > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              ₹{totalPending.toFixed(2)}
            </h3>
          </div>
        </div>

        {/* Statement of Transactions Table */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Receipt className="h-4 w-4" />
            Transaction Timeline
          </h4>
          <div className="overflow-x-auto border border-gray-150 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="py-3 px-3 font-bold text-gray-600">Invoice Num</th>
                  <th className="py-3 px-3 font-bold text-gray-600">Issued Date</th>
                  <th className="py-3 px-3 font-bold text-center text-gray-600">Status</th>
                  <th className="py-3 px-3 font-bold text-right text-gray-600">Billed Amt</th>
                  <th className="py-3 px-3 font-bold text-right text-gray-600">Paid Amt</th>
                  <th className="py-3 px-3 font-bold text-right text-gray-600">Due Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => {
                  const bal = inv.grandTotal - inv.amountPaid;
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/20 transition-colors">
                      <td className="py-3 px-3 font-semibold text-gray-900">{inv.invoiceNum}</td>
                      <td className="py-3 px-3 text-gray-650">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                      <td className="py-3 px-3 text-center">{getStatusBadge(inv.status)}</td>
                      <td className="py-3 px-3 text-right font-bold text-gray-900">₹{inv.grandTotal.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right text-green-600 font-semibold">₹{inv.amountPaid.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right text-rose-600 font-bold">₹{bal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer notes */}
        {shop.footerMessage && (
          <div className="mt-8 border-t border-gray-100 pt-6">
            <p className="text-[10px] text-gray-400 italic leading-relaxed text-center sm:text-left">
              {shop.footerMessage}
            </p>
          </div>
        )}

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
