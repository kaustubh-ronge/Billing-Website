import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { numberToWords } from '../utils';

// A4 printable width ≈ 505pt with 45pt horizontal padding on each side
// Column widths MUST sum to exactly 505
// Sr(20) + Item(160) + HSN(45) + Qty(35) + Rate(55) + Taxable(60) + GstBox(75) + Total(55) = 505
const COL = {
  sr: 20,
  item: 160,
  hsn: 45,
  qty: 35,
  rate: 55,
  taxable: 60,
  gst: 75,   // contains %25 + Amt50
  gstRate: 25,
  gstAmt: 50,
  total: 55,
};

const BORDER = '0.5pt solid #9ca3af';
const BORDER_DARK = '0.5pt solid #374151';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 45,
    backgroundColor: '#ffffff',
    color: '#1f2937',
  },

  // ── Header ────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: BORDER_DARK,
    paddingBottom: 8,
    marginBottom: 6,
  },
  headerLeft: { flex: 1, paddingRight: 10 },
  businessName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  taglineBanner: {
    backgroundColor: '#00a29a',
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  taglineText: {
    color: '#ffffff',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  businessDetail: {
    fontSize: 7.5,
    color: '#4b5563',
    marginBottom: 1.5,
    lineHeight: 1.3,
  },
  logoImg: {
    width: 58,
    height: 58,
    borderRadius: 4,
    objectFit: 'cover',
  },
  logoFallback: {
    width: 58,
    height: 58,
    backgroundColor: '#111827',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoFallbackText: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
  },

  // ── PAN / TAX INVOICE bar ─────────────────────────
  panTaxBanner: {
    borderTop: BORDER,
    borderBottom: BORDER,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    marginBottom: 6,
  },
  panText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#374151' },
  taxInvoiceTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    color: '#000000',
  },
  recipientText: { fontSize: 7, color: '#6b7280', textTransform: 'uppercase' },

  // ── 2-col Info Grid ───────────────────────────────
  grid2Col: {
    flexDirection: 'row',
    border: BORDER,
    borderRadius: 3,
    marginBottom: 8,
  },
  gridColLeft: {
    width: '50%',
    borderRight: BORDER,
    padding: 6,
  },
  gridColRight: { width: '50%', padding: 6 },
  metaSectionTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    borderBottom: '1pt solid #f3f4f6',
    paddingBottom: 2,
    marginBottom: 4,
  },
  metaRow: { flexDirection: 'row', marginBottom: 2.5 },
  metaLabel: {
    width: 72,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#4b5563',
  },
  metaValue: { flex: 1, fontSize: 7.5, color: '#111827' },
  metaValueBold: {
    flex: 1,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },

  // ── Table ─────────────────────────────────────────
  table: {
    border: BORDER,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  // Header row
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottom: BORDER_DARK,
    alignItems: 'stretch',
  },
  th: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  // Sub-header for GST split
  gstHeaderBox: {
    width: COL.gst,
    borderLeft: BORDER,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  gstHeaderTop: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textTransform: 'uppercase',
    textAlign: 'center',
    borderBottom: BORDER,
    paddingVertical: 2,
  },
  gstHeaderSub: { flexDirection: 'row', flex: 1 },
  gstHeaderSubRate: {
    width: COL.gstRate,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textAlign: 'center',
    borderRight: BORDER,
    paddingVertical: 2,
  },
  gstHeaderSubAmt: {
    width: COL.gstAmt,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    textAlign: 'center',
    paddingVertical: 2,
  },

  // Data rows
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #e5e7eb',
    alignItems: 'center',
    minHeight: 22,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    minHeight: 22,
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    minHeight: 22,
    borderTop: BORDER_DARK,
  },

  // Per-column cell widths
  colSr: {
    width: COL.sr,
    borderRight: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  colItem: {
    width: COL.item,
    borderRight: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 4,
    textAlign: 'left',
  },
  colHsn: {
    width: COL.hsn,
    borderRight: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  colQty: {
    width: COL.qty,
    borderRight: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  colRate: {
    width: COL.rate,
    borderRight: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 3,
    textAlign: 'right',
  },
  colTaxable: {
    width: COL.taxable,
    borderRight: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 3,
    textAlign: 'right',
  },
  colGstBox: {
    width: COL.gst,
    borderLeft: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
  },
  colGstRate: {
    width: COL.gstRate,
    borderRight: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 2,
    textAlign: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  colGstAmt: {
    width: COL.gstAmt,
    paddingVertical: 3,
    paddingHorizontal: 3,
    textAlign: 'right',
  },
  colTotal: {
    width: COL.total,
    paddingVertical: 3,
    paddingHorizontal: 3,
    textAlign: 'right',
  },

  // Cell text styles
  td: { fontSize: 7.5, color: '#374151' },
  tdBold: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#111827' },
  tdCenter: { fontSize: 7.5, color: '#374151', textAlign: 'center' },
  serviceTag: {
    fontSize: 6,
    color: '#4b5563',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 3,
    paddingVertical: 0.5,
    borderRadius: 2,
    marginTop: 1,
    alignSelf: 'flex-start',
  },

  // ── Bottom Grid ───────────────────────────────────
  bottomGrid: {
    flexDirection: 'row',
    border: BORDER,
    borderRadius: 3,
  },
  bottomLeft: {
    width: '55%',
    borderRight: BORDER,
    padding: 7,
    flexDirection: 'column',
  },
  bottomRight: {
    width: '45%',
    padding: 7,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  wordsBox: {
    backgroundColor: '#f9fafb',
    border: '0.5pt solid #e5e7eb',
    borderRadius: 2,
    padding: 4,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    lineHeight: 1.4,
    marginBottom: 6,
  },
  bankBox: {
    backgroundColor: '#f9fafb',
    border: '0.5pt solid #e5e7eb',
    borderRadius: 2,
    padding: 4,
    fontSize: 7.5,
    color: '#374151',
    lineHeight: 1.4,
    marginBottom: 4,
  },
  bankRow: { flexDirection: 'row', marginBottom: 1 },
  bankLabel: { width: 40, fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#4b5563' },
  bankValue: { flex: 1, fontSize: 7, color: '#111827' },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  qrImage: {
    width: 44,
    height: 44,
    border: '0.5pt solid #d1d5db',
    padding: 1,
    backgroundColor: '#ffffff',
  },
  qrCaption: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#1d4ed8', flex: 1 },
  termsText: { fontSize: 7, color: '#6b7280', lineHeight: 1.4, marginTop: 4 },
  custSigBox: {
    marginTop: 14,
    borderTop: '0.5pt solid #d1d5db',
    paddingTop: 3,
    width: 100,
  },
  custSigLabel: { fontSize: 7, color: '#9ca3af', fontFamily: 'Helvetica-Bold' },

  // Summary right panel
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  summaryLabel: { fontSize: 7.5, color: '#4b5563' },
  summaryValue: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#374151' },
  summaryValueRed: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#dc2626' },
  summaryValueGreen: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#16a34a' },
  summaryDivider: { borderTop: '0.5pt solid #9ca3af', marginVertical: 3 },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 3,
    marginBottom: 3,
  },
  summaryTotalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#000000' },
  summaryTotalValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#000000' },
  declarationText: { fontSize: 6, color: '#6b7280', lineHeight: 1.3, marginBottom: 6 },
  signBox: {
    alignItems: 'center',
    borderTop: '0.5pt solid #d1d5db',
    paddingTop: 3,
    marginTop: 4,
  },
  forShop: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#4b5563', marginBottom: 16 },
  sigLine: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937',
    borderTop: '0.5pt solid #9ca3af',
    paddingTop: 2,
    width: 110,
    textAlign: 'center',
  },
  noSigNote: {
    fontSize: 6,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginBottom: 2,
    textAlign: 'center',
  },
});

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function InvoicePDF({ invoice }) {
  const { customer, shop, items } = invoice;

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const discountAmt = subtotal * ((invoice.discountPercentage ?? 0) / 100);
  const balance = Math.max(0, invoice.grandTotal - invoice.amountPaid);

  const totalTaxable = items.reduce((sum, it) => {
    const rate = it.product?.taxRate ?? 0;
    return sum + (it.quantity * it.unitPrice) / (1 + rate / 100);
  }, 0);
  const totalGst = subtotal - totalTaxable;
  const totalQty = items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <Document
      title={`Invoice ${invoice.invoiceNum} — ${shop.businessName}`}
      author={shop.businessName}
      subject="Tax Invoice"
    >
      <Page size="A4" style={styles.page}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.businessName}>{shop.businessName}</Text>
            {shop.description && (
              <View style={styles.taglineBanner}>
                <Text style={styles.taglineText}>{shop.description}</Text>
              </View>
            )}
            {shop.address && <Text style={styles.businessDetail}>{shop.address}</Text>}
            <Text style={styles.businessDetail}>
              {[
                shop.phone ? `Tel: ${shop.phone}` : null,
                shop.email ? `Email: ${shop.email}` : null,
              ].filter(Boolean).join('  |  ')}
            </Text>
            {shop.taxId && (
              <Text style={styles.businessDetail}>GSTIN: {shop.taxId}</Text>
            )}
          </View>
          {/* Logo: use profile logoBase64 if available, else initials */}
          <View>
            {shop.logoBase64 ? (
              <Image style={styles.logoImg} src={shop.logoBase64} />
            ) : (
              <View style={styles.logoFallback}>
                <Text style={styles.logoFallbackText}>
                  {shop.businessName.substring(0, 2).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── PAN / TITLE BAR ── */}
        <View style={styles.panTaxBanner}>
          <Text style={styles.panText}>
            {shop.taxId ? `GSTIN: ${shop.taxId}` : 'GSTIN: N/A'}
          </Text>
          <Text style={styles.taxInvoiceTitle}>TAX INVOICE</Text>
          <Text style={styles.recipientText}>Original for Recipient</Text>
        </View>

        {/* ── 2-COL INFO GRID ── */}
        <View style={styles.grid2Col}>
          {/* Left: Customer */}
          <View style={styles.gridColLeft}>
            <Text style={styles.metaSectionTitle}>Customer Details</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>M/S</Text>
              <Text style={styles.metaValueBold}>{customer.name}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Address</Text>
              <Text style={styles.metaValue}>{customer.address || '—'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Phone</Text>
              <Text style={styles.metaValue}>{customer.phone}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>GSTIN</Text>
              <Text style={styles.metaValueBold}>{customer.gstNumber || '—'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Place of Supply</Text>
              <Text style={styles.metaValue}>
                {customer.address ? customer.address.split(',').pop().trim() : '—'}
              </Text>
            </View>
          </View>

          {/* Right: Invoice */}
          <View style={styles.gridColRight}>
            <Text style={styles.metaSectionTitle}>Invoice Details</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Invoice No.</Text>
              <Text style={styles.metaValueBold}>{invoice.invoiceNum}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Invoice Date</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.issuedAt)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Payment Terms</Text>
              <Text style={styles.metaValue}>{invoice.paymentTerms ?? '—'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={styles.metaValue}>
                {invoice.dueDate ? fmtDate(invoice.dueDate) : 'Immediate'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Status</Text>
              <Text style={styles.metaValueBold}>{invoice.status}</Text>
            </View>
          </View>
        </View>

        {/* ── ITEMS TABLE ── */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colSr]}>Sr.</Text>
            <Text style={[styles.th, styles.colItem]}>Name of Product / Service</Text>
            <Text style={[styles.th, styles.colHsn]}>HSN/SAC</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colRate]}>Rate (Excl.)</Text>
            <Text style={[styles.th, styles.colTaxable]}>Taxable Val</Text>
            {/* GST split header */}
            <View style={styles.gstHeaderBox}>
              <Text style={styles.gstHeaderTop}>GST</Text>
              <View style={styles.gstHeaderSub}>
                <Text style={styles.gstHeaderSubRate}>%</Text>
                <Text style={styles.gstHeaderSubAmt}>Amt</Text>
              </View>
            </View>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
          </View>

          {/* Data Rows */}
          {items.map((item, idx) => {
            const taxRate = item.product?.taxRate ?? 0;
            const lineTotal = item.quantity * item.unitPrice;
            const rateExcl = item.unitPrice / (1 + taxRate / 100);
            const taxableVal = item.quantity * rateExcl;
            const gstAmt = lineTotal - taxableVal;

            return (
              <View key={item.id ?? idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tdCenter, styles.colSr]}>{idx + 1}</Text>
                <View style={styles.colItem}>
                  <Text style={styles.tdBold}>{item.product?.name ?? 'Item'}</Text>
                  {item.product?.isService && <Text style={styles.serviceTag}>Service</Text>}
                </View>
                <Text style={[styles.tdCenter, styles.colHsn]}>
                  {item.product?.sku || '—'}
                </Text>
                <Text style={[styles.tdCenter, styles.colQty]}>
                  {item.quantity} {item.product?.unit || 'NOS'}
                </Text>
                <Text style={[styles.td, styles.colRate]}>{rateExcl.toFixed(2)}</Text>
                <Text style={[styles.td, styles.colTaxable]}>{taxableVal.toFixed(2)}</Text>
                <View style={styles.colGstBox}>
                  <View style={[styles.colGstRate, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={styles.tdCenter}>{taxRate}%</Text>
                  </View>
                  <Text style={[styles.td, styles.colGstAmt]}>{gstAmt.toFixed(2)}</Text>
                </View>
                <Text style={[styles.tdBold, styles.colTotal]}>{lineTotal.toFixed(2)}</Text>
              </View>
            );
          })}

          {/* Totals Row */}
          <View style={styles.tableTotalRow}>
            <Text style={[styles.tdBold, styles.colSr]}></Text>
            <Text style={[styles.tdBold, { ...styles.colItem, textAlign: 'right' }]}>Totals</Text>
            <Text style={[styles.tdBold, styles.colHsn]}></Text>
            <Text style={[styles.tdBold, styles.colQty, { textAlign: 'center' }]}>{totalQty}</Text>
            <Text style={[styles.tdBold, styles.colRate]}></Text>
            <Text style={[styles.tdBold, styles.colTaxable]}>{totalTaxable.toFixed(2)}</Text>
            <View style={styles.colGstBox}>
              <View style={[styles.colGstRate, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.tdBold}></Text>
              </View>
              <Text style={[styles.tdBold, styles.colGstAmt]}>{totalGst.toFixed(2)}</Text>
            </View>
            <Text style={[styles.tdBold, styles.colTotal]}>{subtotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* ── BOTTOM PANELS ── */}
        <View style={styles.bottomGrid}>
          {/* Left: Words + Bank + Terms */}
          <View style={styles.bottomLeft}>
            <Text style={styles.sectionLabel}>Total In Words</Text>
            <Text style={styles.wordsBox}>{numberToWords(invoice.grandTotal)}</Text>

            <Text style={styles.sectionLabel}>Bank Details</Text>
            {shop.bankName ? (
              <View style={styles.bankBox}>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Bank</Text>
                  <Text style={styles.bankValue}>{shop.bankName}</Text>
                </View>
                {shop.accountNum && (
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>A/c No.</Text>
                    <Text style={styles.bankValue}>{shop.accountNum}</Text>
                  </View>
                )}
                {shop.ifscCode && (
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>IFSC</Text>
                    <Text style={styles.bankValue}>{shop.ifscCode}</Text>
                  </View>
                )}
                {shop.upiId && (
                  <View style={styles.bankRow}>
                    <Text style={styles.bankLabel}>UPI</Text>
                    <Text style={styles.bankValue}>{shop.upiId}</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={[styles.termsText, { color: '#9ca3af', marginBottom: 4 }]}>
                No bank details configured.
              </Text>
            )}

            {shop.upiId && balance > 0 && (
              <View style={styles.qrRow}>
                <Image
                  style={styles.qrImage}
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                    `upi://pay?pa=${shop.upiId}&pn=${encodeURIComponent(shop.businessName)}&am=${balance.toFixed(2)}&cu=INR&tn=${encodeURIComponent(invoice.invoiceNum)}`
                  )}`}
                />
                <Text style={styles.qrCaption}>Scan to Pay{'\n'}Outstanding: ₹{balance.toFixed(2)}</Text>
              </View>
            )}

            <Text style={styles.termsText}>
              {shop.footerMessage || 'Thank you for your business! Goods once sold will not be returned.'}
            </Text>

            <View style={styles.custSigBox}>
              <Text style={styles.custSigLabel}>Customer Signature</Text>
            </View>
          </View>

          {/* Right: Totals + Signature */}
          <View style={styles.bottomRight}>
            {/* Summary */}
            <View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Taxable Amount</Text>
                <Text style={styles.summaryValue}>₹{totalTaxable.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Add: GST</Text>
                <Text style={styles.summaryValue}>₹{totalGst.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sub Total</Text>
                <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
              </View>
              {(invoice.discountPercentage ?? 0) > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Less: Discount ({invoice.discountPercentage}%)
                  </Text>
                  <Text style={styles.summaryValueRed}>-₹{discountAmt.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.summaryDivider} />
              <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Grand Total</Text>
                <Text style={styles.summaryTotalValue}>₹{Number(invoice.grandTotal).toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount Paid</Text>
                <Text style={styles.summaryValueGreen}>₹{Number(invoice.amountPaid).toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { fontFamily: 'Helvetica-Bold', color: '#dc2626' }]}>
                  Balance Due
                </Text>
                <Text style={styles.summaryValueRed}>₹{balance.toFixed(2)}</Text>
              </View>
            </View>

            {/* Declaration + Signatory */}
            <View>
              <Text style={styles.declarationText}>
                Declaration: Certified that the particulars given above are true and correct.
              </Text>
              <View style={styles.signBox}>
                <Text style={styles.forShop}>For {shop.businessName}</Text>
                <Text style={styles.noSigNote}>
                  Computer generated invoice — no signature required.
                </Text>
                <Text style={styles.sigLine}>Authorised Signatory</Text>
              </View>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  );
}
