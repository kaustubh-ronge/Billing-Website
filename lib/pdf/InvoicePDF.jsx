import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import { numberToWords } from '../utils';

// Helper to calculate column widths dynamically to sum to exactly totalWidth
const getColWidths = (shop, totalWidth = 505) => {
  const showHsn = shop?.showColHsn !== false;
  const showUnit = shop?.showColUnit !== false;
  const showRate = shop?.showColRate !== false;
  const showTaxable = shop?.showColTaxable !== false;
  const showGst = shop?.showColGst !== false;

  const scale = totalWidth / 505;

  const wHsn = showHsn ? Math.round(45 * scale) : 0;
  const wUnit = showUnit ? Math.round(25 * scale) : 0;
  const wRate = showRate ? Math.round(55 * scale) : 0;
  const wTaxable = showTaxable ? Math.round(60 * scale) : 0;
  const wGst = showGst ? Math.round(75 * scale) : 0;

  const wSr = Math.round(20 * scale);
  const wQty = Math.round(25 * scale);
  const wTotal = Math.round(55 * scale);

  const remaining = totalWidth - (wSr + wQty + wTotal + wHsn + wUnit + wRate + wTaxable + wGst);

  return {
    sr: wSr,
    qty: wQty,
    total: wTotal,
    hsn: wHsn,
    unit: wUnit,
    rate: wRate,
    taxable: wTaxable,
    gst: wGst,
    gstRate: Math.max(10, Math.round(25 * scale)),
    gstAmt: Math.max(10, Math.round(50 * scale)),
    item: remaining,
  };
};

const BORDER = '0.5pt solid #9ca3af';
const BORDER_DARK = '0.5pt solid #374151';

// Base styles for Classic, Minimal, Landscape, and general formatting
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
  table: {
    border: BORDER,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
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
  gstHeaderBox: {
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
  gstHeaderSub: { 
    flexDirection: 'row', 
    flex: 1, 
    alignItems: 'stretch' 
  },
  gstHeaderSubRate: {
    flex: 1,
    borderRight: BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gstHeaderSubAmt: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thLabel: { fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#374151' },
  tableRow: {
    flexDirection: 'row',
    borderBottom: BORDER,
    alignItems: 'stretch',
    minHeight: 20,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: BORDER,
    backgroundColor: '#f9fafb',
    alignItems: 'stretch',
    minHeight: 20,
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    minHeight: 22,
    borderTop: BORDER_DARK,
  },
  colSrCell: {
    borderRight: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  colItemCell: {
    borderRight: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 4,
    textAlign: 'left',
  },
  colHsnCell: {
    borderRight: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  colQtyCell: {
    borderRight: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  colUnitCell: {
    borderRight: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  colRateCell: {
    borderRight: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 4,
    textAlign: 'right',
  },
  colTaxableCell: {
    borderRight: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 4,
    textAlign: 'right',
  },
  colGstBoxCell: {
    borderRight: BORDER,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  colGstRateCell: {
    flex: 1,
    borderRight: BORDER,
    paddingVertical: 3,
    paddingHorizontal: 1,
    textAlign: 'center',
  },
  colGstAmtCell: {
    flex: 2,
    paddingVertical: 3,
    paddingHorizontal: 3,
    textAlign: 'right',
  },
  colTotalCell: {
    paddingVertical: 3,
    paddingHorizontal: 4,
    textAlign: 'right',
  },
  td: { fontSize: 7.5, color: '#374151' },
  tdBold: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#111827' },
  tdCenter: { fontSize: 7.5, color: '#374151', textAlign: 'center' },
  serviceTag: {
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0d9488',
    backgroundColor: '#ccfbf1',
    borderRadius: 1.5,
    paddingHorizontal: 3,
    paddingVertical: 0.5,
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  bottomGrid: { flexDirection: 'row', marginTop: 10 },
  bottomLeft: { width: '58%', paddingRight: 15 },
  bottomRight: { width: '42%' },
  sectionLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  wordsBox: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    padding: 4,
    borderRadius: 3,
    border: '0.5pt dashed #d1d5db',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  bankBox: {
    border: BORDER,
    borderRadius: 3,
    padding: 4,
    backgroundColor: '#f9fafb',
    marginBottom: 6,
  },
  bankRow: { flexDirection: 'row', marginBottom: 2 },
  bankLabel: { width: 45, fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#4b5563' },
  bankValue: { flex: 1, fontSize: 7, color: '#1f2937' },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    border: '0.5pt solid #bbf7d0',
    borderRadius: 3,
    padding: 5,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  qrImage: { width: 42, height: 42 },
  qrCaption: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#166534',
    marginLeft: 6,
    lineHeight: 1.2,
  },
  termsText: { fontSize: 6.5, color: '#6b7280', lineHeight: 1.2, marginBottom: 8 },
  custSigBox: {
    marginTop: 16,
    width: 100,
    borderTop: '0.5pt solid #d1d5db',
    paddingTop: 3,
  },
  custSigLabel: { fontSize: 6.5, color: '#4b5563', textAlign: 'center' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  summaryLabel: { fontSize: 7.5, color: '#4b5563' },
  summaryValue: { fontSize: 7.5, color: '#111827', textAlign: 'right' },
  summaryValueRed: { fontSize: 7.5, color: '#dc2626', fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  summaryValueGreen: { fontSize: 7.5, color: '#16a34a', fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  summaryDivider: { borderTop: BORDER, marginVertical: 3 },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 4,
    borderRadius: 2,
    marginBottom: 2,
  },
  summaryTotalLabel: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#000000' },
  summaryTotalValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#000000', textAlign: 'right' },
  declarationText: { fontSize: 6, color: '#6b7280', marginTop: 10, lineHeight: 1.2 },
  signBox: {
    marginTop: 8,
    border: BORDER,
    borderRadius: 3,
    padding: 6,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  forShop: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#111827', marginBottom: 20, textAlign: 'center' },
  noSigNote: { fontSize: 5.5, color: '#9ca3af', marginBottom: 2, textAlign: 'center' },
  sigLine: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#374151', borderTop: '0.5pt solid #9ca3af', width: '100%', paddingTop: 2, textAlign: 'center' },
});

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Entry point component
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

  const template = shop?.invoiceTemplate || 'classic';

  const commonProps = {
    invoice,
    shop,
    customer,
    items,
    subtotal,
    discountAmt,
    balance,
    totalTaxable,
    totalGst,
    totalQty,
  };

  if (template === 'retail') {
    return <InvoicePDFRetail {...commonProps} />;
  }
  if (template === 'thermal') {
    return <InvoicePDFThermal {...commonProps} />;
  }
  if (template === 'minimal') {
    return <InvoicePDFMinimal {...commonProps} />;
  }
  if (template === 'landscape') {
    return <InvoicePDFLandscape {...commonProps} />;
  }

  return <InvoicePDFClassic {...commonProps} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CLASSIC PREMIUM TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────
function InvoicePDFClassic({ invoice, shop, customer, items, subtotal, discountAmt, balance, totalTaxable, totalGst, totalQty }) {
  const COL_W = getColWidths(shop, 505);

  return (
    <Document title={`Invoice ${invoice.invoiceNum} — ${shop.businessName}`} author={shop.businessName} subject="Tax Invoice">
      <Page size="A4" style={styles.page}>
        {/* Header */}
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
              {[shop.phone ? `Tel: ${shop.phone}` : null, shop.email ? `Email: ${shop.email}` : null].filter(Boolean).join('  |  ')}
            </Text>
            {shop.showGst !== false && shop.taxId && <Text style={styles.businessDetail}>GSTIN: {shop.taxId}</Text>}
            {shop.showLicense !== false && (
              <>
                {shop.licenseNum && <Text style={styles.businessDetail}>License No: {shop.licenseNum}</Text>}
                {(shop.businessType === 'Agro Store' || shop.businessType?.toLowerCase().includes('agro') || shop.businessType?.toLowerCase().includes('krishi')) && (
                  <>
                    {shop.aushadhLicenseNum && <Text style={styles.businessDetail}>Aushadh License: {shop.aushadhLicenseNum}</Text>}
                    {shop.khateLicenseNum && <Text style={styles.businessDetail}>Khate License: {shop.khateLicenseNum}</Text>}
                  </>
                )}
              </>
            )}
          </View>
          <View>
            {shop.logoBase64 ? (
              <Image style={styles.logoImg} src={shop.logoBase64} />
            ) : (
              <View style={styles.logoFallback}>
                <Text style={styles.logoFallbackText}>{shop.businessName.substring(0, 2).toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Title Bar */}
        <View style={styles.panTaxBanner}>
          <Text style={styles.panText}>{shop.showGst !== false && shop.taxId ? `GSTIN: ${shop.taxId}` : ''}</Text>
          <Text style={styles.taxInvoiceTitle}>TAX INVOICE</Text>
          <Text style={styles.recipientText}>Original for Recipient</Text>
        </View>

        {/* 2-Col info grid */}
        <View style={styles.grid2Col}>
          <View style={styles.gridColLeft}>
            <Text style={styles.metaSectionTitle}>Customer Details</Text>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>M/S</Text><Text style={styles.metaValueBold}>{customer.name}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Address</Text><Text style={styles.metaValue}>{customer.address || '—'}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Phone</Text><Text style={styles.metaValue}>{customer.phone || '—'}</Text></View>
            {customer.taxId && <View style={styles.metaRow}><Text style={styles.metaLabel}>GSTIN</Text><Text style={styles.metaValue}>{customer.taxId}</Text></View>}
          </View>
          <View style={styles.gridColRight}>
            <Text style={styles.metaSectionTitle}>Invoice Details</Text>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Invoice No.</Text><Text style={styles.metaValueBold}>{invoice.invoiceNum}</Text></View>
            <View style={styles.metaRow}><Text style={styles.metaLabel}>Date Issued</Text><Text style={styles.metaValue}>{fmtDate(invoice.issuedAt)}</Text></View>
            {shop.showPaymentTerms !== false && (
              <>
                <View style={styles.metaRow}><Text style={styles.metaLabel}>Payment Terms</Text><Text style={styles.metaValue}>{invoice.paymentTerms ?? 'IMMEDIATE'}</Text></View>
                {invoice.dueDate && <View style={styles.metaRow}><Text style={styles.metaLabel}>Due Date</Text><Text style={styles.metaValueBold}>{fmtDate(invoice.dueDate)}</Text></View>}
              </>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: COL_W.sr }]}>Sr.</Text>
            <Text style={[styles.th, { width: COL_W.item, textAlign: 'left' }]}>Product / Service Name</Text>
            {shop.showColHsn !== false && <Text style={[styles.th, { width: COL_W.hsn }]}>HSN/SAC</Text>}
            <Text style={[styles.th, { width: COL_W.qty }]}>Qty</Text>
            {shop.showColUnit !== false && <Text style={[styles.th, { width: COL_W.unit }]}>Unit</Text>}
            {shop.showColRate !== false && <Text style={[styles.th, { width: COL_W.rate, textAlign: 'right' }]}>Rate</Text>}
            {shop.showColTaxable !== false && <Text style={[styles.th, { width: COL_W.taxable, textAlign: 'right' }]}>Taxable</Text>}
            {shop.showColGst !== false && (
              <View style={[styles.gstHeaderBox, { width: COL_W.gst }]}>
                <Text style={styles.gstHeaderTop}>GST</Text>
                <View style={styles.gstHeaderSub}>
                  <View style={[styles.gstHeaderSubRate, { width: COL_W.gstRate }]}><Text style={styles.thLabel}>%</Text></View>
                  <View style={[styles.gstHeaderSubAmt, { width: COL_W.gstAmt }]}><Text style={styles.thLabel}>Amt</Text></View>
                </View>
              </View>
            )}
            <Text style={[styles.th, { width: COL_W.total, textAlign: 'right' }]}>Total</Text>
          </View>
          {items.map((item, idx) => {
            const taxRate = item.product?.taxRate ?? 0;
            const lineTotal = item.quantity * item.unitPrice;
            const rateExcl = item.unitPrice / (1 + taxRate / 100);
            const taxableVal = item.quantity * rateExcl;
            const gstAmt = lineTotal - taxableVal;

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
              if (shop?.showColBulkPrice !== false && item.product?.bulkPrice) metaParts.push(`Bulk: Rs. ${item.product.bulkPrice}`);
            }
            const metaText = metaParts.join(" | ");

            return (
              <View key={item.id ?? idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tdCenter, styles.colSrCell, { width: COL_W.sr }]}>{idx + 1}</Text>
                <View style={[styles.colItemCell, { width: COL_W.item }]}>
                  <Text style={styles.tdBold}>
                    {item.product?.name ?? 'Item'}{item.product?.actualValue ? ` (${item.product.actualValue}${item.product.unit || ''})` : ''}
                  </Text>
                  {item.product?.isService && <Text style={styles.serviceTag}>Service</Text>}
                  {metaText ? <Text style={{ fontSize: 5.5, color: '#4b5563', marginTop: 1 }}>{metaText}</Text> : null}
                </View>
                {shop.showColHsn !== false && <Text style={[styles.tdCenter, styles.colHsnCell, { width: COL_W.hsn }]}>{item.product?.hsnSac || '—'}</Text>}
                <Text style={[styles.tdCenter, styles.colQtyCell, { width: COL_W.qty }]}>{item.quantity}</Text>
                {shop.showColUnit !== false && <Text style={[styles.tdCenter, styles.colUnitCell, { width: COL_W.unit }]}>{item.product?.unit || 'NOS'}</Text>}
                {shop.showColRate !== false && <Text style={[styles.td, styles.colRateCell, { width: COL_W.rate }]}>{rateExcl.toFixed(2)}</Text>}
                {shop.showColTaxable !== false && <Text style={[styles.td, styles.colTaxableCell, { width: COL_W.taxable }]}>{taxableVal.toFixed(2)}</Text>}
                {shop.showColGst !== false && (
                  <View style={[styles.colGstBoxCell, { width: COL_W.gst }]}>
                    <Text style={[styles.tdCenter, styles.colGstRateCell, { width: COL_W.gstRate }]}>{taxRate}%</Text>
                    <Text style={[styles.td, styles.colGstAmtCell, { width: COL_W.gstAmt }]}>{gstAmt.toFixed(2)}</Text>
                  </View>
                )}
                <Text style={[styles.tdBold, styles.colTotalCell, { width: COL_W.total }]}>{lineTotal.toFixed(2)}</Text>
              </View>
            );
          })}

          <View style={styles.tableTotalRow}>
            <Text style={[styles.tdBold, styles.colSrCell, { width: COL_W.sr }]}></Text>
            <Text style={[styles.tdBold, { width: COL_W.item, textAlign: 'right', paddingRight: 4 }]}>Totals</Text>
            {shop.showColHsn !== false && <Text style={[styles.tdBold, styles.colHsnCell, { width: COL_W.hsn }]}></Text>}
            <Text style={[styles.tdBold, styles.colQtyCell, { width: COL_W.qty, textAlign: 'center' }]}>{totalQty}</Text>
            {shop.showColUnit !== false && <Text style={[styles.tdBold, styles.colUnitCell, { width: COL_W.unit }]}></Text>}
            {shop.showColRate !== false && <Text style={[styles.tdBold, styles.colRateCell, { width: COL_W.rate }]}></Text>}
            {shop.showColTaxable !== false && <Text style={[styles.tdBold, styles.colTaxableCell, { width: COL_W.taxable }]}>{totalTaxable.toFixed(2)}</Text>}
            {shop.showColGst !== false && (
              <View style={[styles.colGstBoxCell, { width: COL_W.gst }]}>
                <Text style={[styles.tdBold, styles.colGstRateCell, { width: COL_W.gstRate }]}></Text>
                <Text style={[styles.tdBold, styles.colGstAmtCell, { width: COL_W.gstAmt }]}>{totalGst.toFixed(2)}</Text>
              </View>
            )}
            <Text style={[styles.tdBold, styles.colTotalCell, { width: COL_W.total }]}>{subtotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Bottom Panel */}
        <View style={styles.bottomGrid}>
          <View style={styles.bottomLeft}>
            <Text style={styles.sectionLabel}>Total In Words</Text>
            <Text style={styles.wordsBox}>{numberToWords(invoice.grandTotal)}</Text>

            {shop.showBankDetails !== false && (
              <>
                <Text style={styles.sectionLabel}>Bank Details</Text>
                {shop.bankName ? (
                  <View style={styles.bankBox}>
                    <View style={styles.bankRow}><Text style={styles.bankLabel}>Bank</Text><Text style={styles.bankValue}>{shop.bankName}</Text></View>
                    {shop.accountNum && <View style={styles.bankRow}><Text style={styles.bankLabel}>A/c No.</Text><Text style={styles.bankValue}>{shop.accountNum}</Text></View>}
                    {shop.ifscCode && <View style={styles.bankRow}><Text style={styles.bankLabel}>IFSC</Text><Text style={styles.bankValue}>{shop.ifscCode}</Text></View>}
                    {shop.upiId && <View style={styles.bankRow}><Text style={styles.bankLabel}>UPI ID</Text><Text style={styles.bankValue}>{shop.upiId}</Text></View>}
                  </View>
                ) : <Text style={[styles.termsText, { color: '#9ca3af', marginBottom: 4 }]}>No bank details configured.</Text>}
              </>
            )}

            {shop.showQrCode !== false && shop.upiId && balance > 0 && (
              <View style={styles.qrRow}>
                <Image style={styles.qrImage} src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${shop.upiId}&pn=${encodeURIComponent(shop.businessName)}&am=${balance.toFixed(2)}&cu=INR&tn=${encodeURIComponent(invoice.invoiceNum)}`)}`} />
                <Text style={styles.qrCaption}>Scan to Pay{'\n'}Outstanding: Rs. {balance.toFixed(2)}</Text>
              </View>
            )}

            {shop.showFooterMessage !== false && <Text style={styles.termsText}>{shop.footerMessage}</Text>}
            <View style={styles.custSigBox}><Text style={styles.custSigLabel}>Customer Signature</Text></View>
          </View>

          <View style={styles.bottomRight}>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Taxable Amount</Text><Text style={styles.summaryValue}>Rs. {totalTaxable.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>GST Amount</Text><Text style={styles.summaryValue}>Rs. {totalGst.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Sub Total</Text><Text style={styles.summaryValue}>Rs. {subtotal.toFixed(2)}</Text></View>
            {(invoice.discountPercentage ?? 0) > 0 && (
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Discount ({invoice.discountPercentage}%)</Text><Text style={styles.summaryValueRed}>-Rs. {discountAmt.toFixed(2)}</Text></View>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryTotalRow}><Text style={styles.summaryTotalLabel}>Grand Total</Text><Text style={styles.summaryTotalValue}>Rs. {invoice.grandTotal.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Amount Paid</Text><Text style={styles.summaryValueGreen}>Rs. {invoice.amountPaid.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: '#dc2626', fontFamily: 'Helvetica-Bold' }]}>Balance Due</Text><Text style={styles.summaryValueRed}>Rs. {balance.toFixed(2)}</Text></View>

            <View style={styles.declarationText}>
              <Text>Declaration: Certified that the particulars given above are true and correct.</Text>
            </View>
            <View style={styles.signBox}>
              <Text style={styles.forShop}>For {shop.businessName}</Text>
              <Text style={styles.noSigNote}>Computer generated invoice — no signature required.</Text>
              <Text style={styles.sigLine}>Authorised Signatory</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. RETAIL GRID TEMPLATE (Pink Copy Layout)
// ─────────────────────────────────────────────────────────────────────────────
function InvoicePDFRetail({ invoice, shop, customer, items, subtotal, discountAmt, balance, totalTaxable, totalGst, totalQty }) {
  const COL_W = getColWidths(shop, 525); // Slightly wider margins

  const rStyles = StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 8,
      padding: 30,
      backgroundColor: '#fff3f5', // Soft pink background sheet tint
      color: '#000000',
    },
    container: {
      border: '1.5pt solid #800020', // Maroon border around the invoice
      padding: 10,
      flex: 1,
    },
    header: {
      alignItems: 'center',
      borderBottom: '1pt solid #800020',
      paddingBottom: 6,
      marginBottom: 8,
    },
    subHeaderTitle: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: '#800020',
      marginBottom: 4,
    },
    shopName: {
      fontSize: 22,
      fontFamily: 'Helvetica-Bold',
      color: '#800020',
      textAlign: 'center',
      marginBottom: 2,
    },
    addressText: {
      fontSize: 7.5,
      textAlign: 'center',
      color: '#4b5563',
    },
    phoneLicenseBox: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 4,
      fontSize: 7,
      color: '#374151',
    },
    billNoBox: {
      position: 'absolute',
      top: 10,
      right: 15,
      border: '1.5pt solid #dc2626',
      borderRadius: 4,
      padding: 4,
      backgroundColor: '#ffffff',
      alignItems: 'center',
    },
    billNoText: { fontSize: 7, color: '#374151', fontFamily: 'Helvetica' },
    billNoVal: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#dc2626', marginTop: 1 },
    metaBlock: {
      border: '1pt solid #800020',
      borderRadius: 2,
      padding: 6,
      marginBottom: 8,
      backgroundColor: '#ffffff',
      flexDirection: 'row',
    },
    table: {
      border: '1pt solid #000000',
      marginBottom: 8,
      backgroundColor: '#ffffff',
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#ffdbe2', // Darker pink header
      borderBottom: '1pt solid #000000',
      alignItems: 'stretch',
    },
    th: {
      fontSize: 7.5,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
      textAlign: 'center',
      paddingVertical: 5,
      borderRight: '0.5pt solid #000000',
    },
    tr: {
      flexDirection: 'row',
      borderBottom: '0.5pt solid #000000',
      alignItems: 'stretch',
      minHeight: 22,
    },
    td: {
      fontSize: 7.5,
      paddingVertical: 4,
      paddingHorizontal: 3,
      borderRight: '0.5pt solid #000000',
    },
    footerGrid: {
      flexDirection: 'row',
      marginTop: 8,
    },
    receiverSigBox: {
      width: '45%',
      justifyContent: 'flex-end',
      paddingBottom: 5,
    },
    receiverSigText: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      borderBottom: '0.5pt solid #000000',
      width: 120,
      textAlign: 'center',
      paddingBottom: 2,
      marginBottom: 4,
    },
    ownerSigBox: {
      width: '55%',
      alignItems: 'flex-end',
    },
    ownerForText: {
      fontSize: 8.5,
      fontFamily: 'Helvetica-Bold',
      color: '#800020',
      marginBottom: 35,
    },
  });

  return (
    <Document title={`Invoice ${invoice.invoiceNum} — ${shop.businessName}`} author={shop.businessName} subject="Tax Invoice">
      <Page size="A4" style={rStyles.page}>
        <View style={rStyles.container}>
          {/* Header */}
          <View style={rStyles.header}>
            <Text style={rStyles.subHeaderTitle}>|| Cash / Credit Memo ||</Text>
            <Text style={rStyles.shopName}>{shop.businessName}</Text>
            {shop.address && <Text style={rStyles.addressText}>{shop.address}</Text>}
            <View style={rStyles.phoneLicenseBox}>
              <View>
                {shop.showGst !== false && shop.taxId && <Text>GSTIN: {shop.taxId}</Text>}
                {shop.showLicense !== false && shop.licenseNum && <Text>Lic No: {shop.licenseNum}</Text>}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {shop.phone && <Text>Mob: {shop.phone}</Text>}
                {shop.email && <Text>Email: {shop.email}</Text>}
              </View>
            </View>

            {/* Red bold Bill Number Box */}
            <View style={rStyles.billNoBox}>
              <Text style={rStyles.billNoText}>No.</Text>
              <Text style={rStyles.billNoVal}>{invoice.invoiceNum.replace(/^\D+/g, '') || invoice.invoiceNum}</Text>
            </View>
          </View>

          {/* Customer / Bill metadata */}
          <View style={rStyles.metaBlock}>
            <View style={{ width: '60%', borderRight: '0.5pt solid #800020', paddingRight: 8 }}>
              <View style={styles.metaRow}><Text style={[styles.metaLabel, { width: 55 }]}>Name:</Text><Text style={styles.metaValueBold}>{customer.name}</Text></View>
              <View style={styles.metaRow}><Text style={[styles.metaLabel, { width: 55 }]}>Address:</Text><Text style={styles.metaValue}>{customer.address || '—'}</Text></View>
              <View style={styles.metaRow}><Text style={[styles.metaLabel, { width: 55 }]}>Phone:</Text><Text style={styles.metaValue}>{customer.phone || '—'}</Text></View>
            </View>
            <View style={{ width: '40%', paddingLeft: 8 }}>
              <View style={styles.metaRow}><Text style={[styles.metaLabel, { width: 65 }]}>Bill No:</Text><Text style={styles.metaValueBold}>{invoice.invoiceNum}</Text></View>
              <View style={styles.metaRow}><Text style={[styles.metaLabel, { width: 65 }]}>Date:</Text><Text style={styles.metaValue}>{fmtDate(invoice.issuedAt)}</Text></View>
              {shop.showPaymentTerms !== false && invoice.dueDate && (
                <View style={styles.metaRow}><Text style={[styles.metaLabel, { width: 65 }]}>Due Date:</Text><Text style={styles.metaValueBold}>{fmtDate(invoice.dueDate)}</Text></View>
              )}
            </View>
          </View>

          {/* Grid table */}
          <View style={rStyles.table}>
            <View style={rStyles.tableHeader}>
              <Text style={[rStyles.th, { width: COL_W.sr }]}>Sr.</Text>
              <Text style={[rStyles.th, { width: COL_W.item, textAlign: 'left', paddingLeft: 4 }]}>Particulars</Text>
              {shop.showColHsn !== false && <Text style={[rStyles.th, { width: COL_W.hsn }]}>HSN/SAC</Text>}
              <Text style={[rStyles.th, { width: COL_W.qty }]}>Qty</Text>
              {shop.showColUnit !== false && <Text style={[rStyles.th, { width: COL_W.unit }]}>Unit</Text>}
              {shop.showColRate !== false && <Text style={[rStyles.th, { width: COL_W.rate, textAlign: 'right', paddingRight: 4 }]}>Rate</Text>}
              {shop.showColTaxable !== false && <Text style={[rStyles.th, { width: COL_W.taxable, textAlign: 'right', paddingRight: 4 }]}>Taxable</Text>}
              {shop.showColGst !== false && (
                <View style={[styles.gstHeaderBox, { width: COL_W.gst, borderLeft: '0.5pt solid #000000' }]}>
                  <Text style={[styles.gstHeaderTop, { borderBottom: '0.5pt solid #000000', color: '#000' }]}>GST</Text>
                  <View style={styles.gstHeaderSub}>
                    <View style={[styles.gstHeaderSubRate, { width: COL_W.gstRate, borderRight: '0.5pt solid #000000' }]}><Text style={[styles.thLabel, { color: '#000' }]}>%</Text></View>
                    <View style={[styles.gstHeaderSubAmt, { width: COL_W.gstAmt }]}><Text style={[styles.thLabel, { color: '#000' }]}>Amt</Text></View>
                  </View>
                </View>
              )}
              <Text style={[rStyles.th, { width: COL_W.total, textAlign: 'right', paddingRight: 4, borderRight: 'none' }]}>Amount</Text>
            </View>

            {items.map((item, idx) => {
              const taxRate = item.product?.taxRate ?? 0;
              const lineTotal = item.quantity * item.unitPrice;
              const rateExcl = item.unitPrice / (1 + taxRate / 100);
              const taxableVal = item.quantity * rateExcl;
              const gstAmt = lineTotal - taxableVal;

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
                if (shop?.showColBulkPrice !== false && item.product?.bulkPrice) metaParts.push(`Bulk: Rs. ${item.product.bulkPrice}`);
              }
              const metaText = metaParts.join(" | ");

              return (
                <View key={item.id ?? idx} style={rStyles.tr}>
                  <Text style={[rStyles.td, { width: COL_W.sr, textAlign: 'center' }]}>{idx + 1}</Text>
                  <View style={[rStyles.td, { width: COL_W.item, textAlign: 'left' }]}>
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                      {item.product?.name ?? 'Item'}{item.product?.actualValue ? ` (${item.product.actualValue}${item.product.unit || ''})` : ''}
                    </Text>
                    {metaText ? <Text style={{ fontSize: 5.5, color: '#4b5563', marginTop: 1 }}>{metaText}</Text> : null}
                  </View>
                  {shop.showColHsn !== false && <Text style={[rStyles.td, { width: COL_W.hsn, textAlign: 'center' }]}>{item.product?.hsnSac || '—'}</Text>}
                  <Text style={[rStyles.td, { width: COL_W.qty, textAlign: 'center' }]}>{item.quantity}</Text>
                  {shop.showColUnit !== false && <Text style={[rStyles.td, { width: COL_W.unit, textAlign: 'center' }]}>{item.product?.unit || 'NOS'}</Text>}
                  {shop.showColRate !== false && <Text style={[rStyles.td, { width: COL_W.rate, textAlign: 'right' }]}>{rateExcl.toFixed(2)}</Text>}
                  {shop.showColTaxable !== false && <Text style={[rStyles.td, { width: COL_W.taxable, textAlign: 'right' }]}>{taxableVal.toFixed(2)}</Text>}
                  {shop.showColGst !== false && (
                    <View style={[styles.colGstBoxCell, { width: COL_W.gst, borderRight: '0.5pt solid #000' }]}>
                      <Text style={[styles.colGstRateCell, { width: COL_W.gstRate, borderRight: '0.5pt solid #000', fontSize: 7.5, color: '#000' }]}>{taxRate}%</Text>
                      <Text style={[rStyles.td, { width: COL_W.gstAmt, textAlign: 'right', borderRight: 'none' }]}>{gstAmt.toFixed(2)}</Text>
                    </View>
                  )}
                  <Text style={[rStyles.td, { width: COL_W.total, textAlign: 'right', fontFamily: 'Helvetica-Bold', borderRight: 'none' }]}>{lineTotal.toFixed(2)}</Text>
                </View>
              );
            })}

            {/* Totals Row */}
            <View style={[rStyles.tr, { backgroundColor: '#ffdbe2', borderBottom: 'none' }]}>
              <Text style={[rStyles.td, { width: COL_W.sr }]}></Text>
              <Text style={[rStyles.td, { width: COL_W.item, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>Totals</Text>
              {shop.showColHsn !== false && <Text style={[rStyles.td, { width: COL_W.hsn }]}></Text>}
              <Text style={[rStyles.td, { width: COL_W.qty, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>{totalQty}</Text>
              {shop.showColUnit !== false && <Text style={[rStyles.td, { width: COL_W.unit }]}></Text>}
              {shop.showColRate !== false && <Text style={[rStyles.td, { width: COL_W.rate }]}></Text>}
              {shop.showColTaxable !== false && <Text style={[rStyles.td, { width: COL_W.taxable, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>{totalTaxable.toFixed(2)}</Text>}
              {shop.showColGst !== false && (
                <View style={[styles.colGstBoxCell, { width: COL_W.gst, borderRight: '0.5pt solid #000' }]}>
                  <Text style={[styles.colGstRateCell, { width: COL_W.gstRate, borderRight: '0.5pt solid #000' }]}></Text>
                  <Text style={[rStyles.td, { width: COL_W.gstAmt, textAlign: 'right', fontFamily: 'Helvetica-Bold', borderRight: 'none' }]}>{totalGst.toFixed(2)}</Text>
                </View>
              )}
              <Text style={[rStyles.td, { width: COL_W.total, textAlign: 'right', fontFamily: 'Helvetica-Bold', borderRight: 'none' }]}>{subtotal.toFixed(2)}</Text>
            </View>
          </View>

          {/* Bottom section */}
          <View style={styles.bottomGrid}>
            <View style={styles.bottomLeft}>
              <Text style={[styles.sectionLabel, { color: '#800020' }]}>Total In Words (अक्षरी रुपये)</Text>
              <Text style={[styles.wordsBox, { border: '0.5pt solid #800020', backgroundColor: '#fff' }]}>{numberToWords(invoice.grandTotal)}</Text>

              {shop.showBankDetails !== false && shop.bankName && (
                <View style={[styles.bankBox, { border: '0.5pt solid #800020' }]}>
                  <View style={styles.bankRow}><Text style={styles.bankLabel}>Bank</Text><Text style={styles.bankValue}>{shop.bankName}</Text></View>
                  {shop.accountNum && <View style={styles.bankRow}><Text style={styles.bankLabel}>A/c No.</Text><Text style={styles.bankValue}>{shop.accountNum}</Text></View>}
                  {shop.ifscCode && <View style={styles.bankRow}><Text style={styles.bankLabel}>IFSC</Text><Text style={styles.bankValue}>{shop.ifscCode}</Text></View>}
                </View>
              )}
              {shop.showFooterMessage !== false && <Text style={[styles.termsText, { color: '#4b5563' }]}>{shop.footerMessage}</Text>}
            </View>

            <View style={styles.bottomRight}>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Taxable Amt</Text><Text style={styles.summaryValue}>Rs. {totalTaxable.toFixed(2)}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>GST Amt</Text><Text style={styles.summaryValue}>Rs. {totalGst.toFixed(2)}</Text></View>
              {(invoice.discountPercentage ?? 0) > 0 && (
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Discount ({invoice.discountPercentage}%)</Text><Text style={styles.summaryValueRed}>-Rs. {discountAmt.toFixed(2)}</Text></View>
              )}
              <View style={styles.summaryDivider} />
              <View style={[styles.summaryTotalRow, { backgroundColor: '#ffdbe2' }]}><Text style={styles.summaryTotalLabel}>Grand Total (एकूण)</Text><Text style={styles.summaryTotalValue}>Rs. {invoice.grandTotal.toFixed(2)}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Amt Paid</Text><Text style={styles.summaryValueGreen}>Rs. {invoice.amountPaid.toFixed(2)}</Text></View>
              <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: '#dc2626', fontFamily: 'Helvetica-Bold' }]}>Due</Text><Text style={styles.summaryValueRed}>Rs. {balance.toFixed(2)}</Text></View>
            </View>
          </View>

          {/* Signature Grid */}
          <View style={[rStyles.footerGrid, { marginTop: 'auto' }]}>
            <View style={rStyles.receiverSigBox}>
              <Text style={rStyles.receiverSigText}></Text>
              <Text style={{ fontSize: 7, color: '#374151', paddingLeft: 10 }}>Customer Signature (माल घेणाराची सही)</Text>
            </View>
            <View style={rStyles.ownerSigBox}>
              <Text style={rStyles.ownerForText}>For {shop.businessName} ({shop.businessName} करिता)</Text>
              <Text style={{ fontSize: 7, color: '#374151', borderTop: '0.5pt solid #000000', width: 140, textAlign: 'center', paddingTop: 3 }}>Authorised Signatory</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. THERMAL RECEIPT TEMPLATE (80mm / 220pt Slip)
// ─────────────────────────────────────────────────────────────────────────────
function InvoicePDFThermal({ invoice, shop, customer, items, subtotal, discountAmt, balance, totalTaxable, totalGst, totalQty }) {
  // 80mm thermal has useful printable width ≈ 200pt
  const COL_W = getColWidths(shop, 204);

  const tStyles = StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 7.5,
      padding: 8,
      backgroundColor: '#ffffff',
      color: '#000000',
    },
    shopHeader: {
      alignItems: 'center',
      borderBottom: '0.5pt dashed #000000',
      paddingBottom: 4,
      marginBottom: 4,
    },
    shopName: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      textAlign: 'center',
    },
    shopSub: {
      fontSize: 6,
      color: '#4b5563',
      textAlign: 'center',
      marginTop: 1,
    },
    metaBlock: {
      fontSize: 6.5,
      marginBottom: 4,
      borderBottom: '0.5pt dashed #000000',
      paddingBottom: 4,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 1,
    },
    metaBold: { fontFamily: 'Helvetica-Bold' },
    tableHeader: {
      flexDirection: 'row',
      borderBottom: '0.5pt solid #000000',
      paddingVertical: 2,
      fontFamily: 'Helvetica-Bold',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottom: '0.25pt dashed #e5e7eb',
      paddingVertical: 2,
      alignItems: 'flex-start',
    },
    tableTotalRow: {
      flexDirection: 'row',
      borderTop: '0.5pt solid #000000',
      borderBottom: '0.5pt solid #000000',
      paddingVertical: 2.5,
      marginTop: 2,
    },
    summaryBlock: {
      marginTop: 4,
      borderBottom: '0.5pt dashed #000000',
      paddingBottom: 4,
    },
    footerMsg: {
      fontSize: 6,
      textAlign: 'center',
      color: '#6b7280',
      marginTop: 6,
      lineHeight: 1.2,
    },
  });

  return (
    <Document title={`Receipt ${invoice.invoiceNum}`} author={shop.businessName} subject="Receipt">
      <Page size={{ width: 220, height: 400 + items.length * 30 }} style={tStyles.page}>
        <View style={tStyles.shopHeader}>
          <Text style={tStyles.shopName}>{shop.businessName}</Text>
          {shop.address && <Text style={tStyles.shopSub}>{shop.address}</Text>}
          <Text style={tStyles.shopSub}>
            {[shop.phone ? `Tel: ${shop.phone}` : null, shop.showGst !== false && shop.taxId ? `GST: ${shop.taxId}` : null].filter(Boolean).join('  |  ')}
          </Text>
        </View>

        {/* metadata */}
        <View style={tStyles.metaBlock}>
          <View style={tStyles.metaRow}><Text>Receipt No: {invoice.invoiceNum}</Text><Text>Date: {fmtDate(invoice.issuedAt)}</Text></View>
          <View style={tStyles.metaRow}><Text style={tStyles.metaBold}>M/S: {customer.name}</Text><Text>Tel: {customer.phone || '—'}</Text></View>
        </View>

        {/* Items Table */}
        <View>
          <View style={tStyles.tableHeader}>
            <Text style={{ width: COL_W.sr, fontSize: 6.5 }}>Sr</Text>
            <Text style={{ width: COL_W.item, fontSize: 6.5, textAlign: 'left' }}>Item Description</Text>
            {shop.showColHsn !== false && <Text style={{ width: COL_W.hsn, fontSize: 6.5, textAlign: 'center' }}>HSN</Text>}
            <Text style={{ width: COL_W.qty, fontSize: 6.5, textAlign: 'center' }}>Qty</Text>
            {shop.showColUnit !== false && <Text style={{ width: COL_W.unit, fontSize: 6.5, textAlign: 'center' }}>Unit</Text>}
            {shop.showColRate !== false && <Text style={{ width: COL_W.rate, fontSize: 6.5, textAlign: 'right' }}>Rate</Text>}
            {shop.showColTaxable !== false && <Text style={{ width: COL_W.taxable, fontSize: 6.5, textAlign: 'right' }}>Taxable</Text>}
            {shop.showColGst !== false && <Text style={{ width: COL_W.gst, fontSize: 6.5, textAlign: 'right' }}>GST</Text>}
            <Text style={{ width: COL_W.total, fontSize: 6.5, textAlign: 'right' }}>Total</Text>
          </View>

          {items.map((item, idx) => {
            const taxRate = item.product?.taxRate ?? 0;
            const lineTotal = item.quantity * item.unitPrice;
            const rateExcl = item.unitPrice / (1 + taxRate / 100);
            const taxableVal = item.quantity * rateExcl;
            const gstAmt = lineTotal - taxableVal;

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
              if (shop?.showColBulkPrice !== false && item.product?.bulkPrice) metaParts.push(`Bulk: Rs. ${item.product.bulkPrice}`);
            }
            const metaText = metaParts.join(" | ");

            return (
              <View key={item.id ?? idx} style={tStyles.tableRow}>
                <Text style={{ width: COL_W.sr, fontSize: 6.5, textAlign: 'center' }}>{idx + 1}</Text>
                <View style={{ width: COL_W.item, flexDirection: 'column' }}>
                  <Text style={{ fontSize: 6.5, fontFamily: 'Helvetica-Bold' }}>
                    {item.product?.name ?? 'Item'}{item.product?.actualValue ? ` (${item.product.actualValue}${item.product.unit || ''})` : ''}
                  </Text>
                  {metaText ? <Text style={{ fontSize: 5, color: '#4b5563', marginTop: 1 }}>{metaText}</Text> : null}
                </View>
                {shop.showColHsn !== false && <Text style={{ width: COL_W.hsn, fontSize: 6.5, textAlign: 'center' }}>{item.product?.hsnSac || '—'}</Text>}
                <Text style={{ width: COL_W.qty, fontSize: 6.5, textAlign: 'center' }}>{item.quantity}</Text>
                {shop.showColUnit !== false && <Text style={{ width: COL_W.unit, fontSize: 6.5, textAlign: 'center' }}>{item.product?.unit || 'NOS'}</Text>}
                {shop.showColRate !== false && <Text style={{ width: COL_W.rate, fontSize: 6.5, textAlign: 'right' }}>{rateExcl.toFixed(1)}</Text>}
                {shop.showColTaxable !== false && <Text style={{ width: COL_W.taxable, fontSize: 6.5, textAlign: 'right' }}>{taxableVal.toFixed(1)}</Text>}
                {shop.showColGst !== false && <Text style={{ width: COL_W.gst, fontSize: 6.5, textAlign: 'right' }}>{gstAmt.toFixed(1)}</Text>}
                <Text style={{ width: COL_W.total, fontSize: 6.5, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>{lineTotal.toFixed(2)}</Text>
              </View>
            );
          })}

          <View style={tStyles.tableTotalRow}>
            <Text style={{ width: COL_W.sr }}></Text>
            <Text style={{ width: COL_W.item, fontFamily: 'Helvetica-Bold', fontSize: 6.5, textAlign: 'right' }}>Total Qty:</Text>
            {shop.showColHsn !== false && <Text style={{ width: COL_W.hsn }}></Text>}
            <Text style={{ width: COL_W.qty, textAlign: 'center', fontFamily: 'Helvetica-Bold', fontSize: 6.5 }}>{totalQty}</Text>
            {shop.showColUnit !== false && <Text style={{ width: COL_W.unit }}></Text>}
            {shop.showColRate !== false && <Text style={{ width: COL_W.rate }}></Text>}
            {shop.showColTaxable !== false && <Text style={{ width: COL_W.taxable, textAlign: 'right', fontSize: 6.5, fontFamily: 'Helvetica-Bold' }}>{totalTaxable.toFixed(1)}</Text>}
            {shop.showColGst !== false && <Text style={{ width: COL_W.gst, textAlign: 'right', fontSize: 6.5, fontFamily: 'Helvetica-Bold' }}>{totalGst.toFixed(1)}</Text>}
            <Text style={{ width: COL_W.total, textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 6.5 }}>{subtotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Summary Block */}
        <View style={tStyles.summaryBlock}>
          <View style={tStyles.metaRow}><Text>Sub Total:</Text><Text>Rs. {subtotal.toFixed(2)}</Text></View>
          {(invoice.discountPercentage ?? 0) > 0 && (
            <View style={tStyles.metaRow}><Text>Discount ({invoice.discountPercentage}%):</Text><Text>-Rs. {discountAmt.toFixed(2)}</Text></View>
          )}
          <View style={tStyles.metaRow}><Text style={tStyles.metaBold}>Grand Total:</Text><Text style={tStyles.metaBold}>Rs. {invoice.grandTotal.toFixed(2)}</Text></View>
          <View style={tStyles.metaRow}><Text>Paid Amount:</Text><Text style={{ color: '#16a34a', fontFamily: 'Helvetica-Bold' }}>Rs. {invoice.amountPaid.toFixed(2)}</Text></View>
          {balance > 0 && (
            <View style={tStyles.metaRow}><Text style={{ color: '#dc2626' }}>Balance Due:</Text><Text style={{ color: '#dc2626', fontFamily: 'Helvetica-Bold' }}>Rs. {balance.toFixed(2)}</Text></View>
          )}
        </View>

        {shop.showFooterMessage !== false && <Text style={tStyles.footerMsg}>{shop.footerMessage}</Text>}
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. MODERN MINIMALIST TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────
function InvoicePDFMinimal({ invoice, shop, customer, items, subtotal, discountAmt, balance, totalTaxable, totalGst, totalQty }) {
  const COL_W = getColWidths(shop, 505);

  const mStyles = StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 8,
      paddingTop: 36,
      paddingBottom: 36,
      paddingHorizontal: 40,
      backgroundColor: '#ffffff',
      color: '#111827',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    brandName: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
      letterSpacing: -0.5,
    },
    taglineText: { fontSize: 7, color: '#64748b', textTransform: 'uppercase', marginTop: 2 },
    invoiceBadge: {
      backgroundColor: '#f1f5f9',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    metaBlock: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTop: '1pt solid #e2e8f0',
      paddingTop: 10,
      marginBottom: 20,
    },
    metaCol: { width: '48%' },
    tableHeader: {
      flexDirection: 'row',
      borderBottom: '1.5pt solid #0f172a',
      paddingBottom: 6,
      alignItems: 'center',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottom: '0.5pt solid #e2e8f0',
      paddingVertical: 6,
      alignItems: 'center',
    },
    totalRow: {
      flexDirection: 'row',
      borderBottom: '1pt solid #0f172a',
      paddingVertical: 8,
      fontFamily: 'Helvetica-Bold',
      backgroundColor: '#f8fafc',
    },
    th: {
      fontSize: 7.5,
      fontFamily: 'Helvetica-Bold',
      color: '#475569',
    },
    td: { fontSize: 7.5, color: '#334155' },
    summarySection: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 15,
    },
  });

  return (
    <Document title={`Invoice ${invoice.invoiceNum}`} author={shop.businessName} subject="Tax Invoice">
      <Page size="A4" style={mStyles.page}>
        <View style={mStyles.header}>
          <View>
            <Text style={mStyles.brandName}>{shop.businessName}</Text>
            {shop.description && <Text style={mStyles.taglineText}>{shop.description}</Text>}
            <Text style={{ fontSize: 7.5, color: '#64748b', marginTop: 4 }}>{shop.address}</Text>
            {shop.showGst !== false && shop.taxId && <Text style={{ fontSize: 7.5, color: '#64748b' }}>GSTIN: {shop.taxId}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#64748b' }}>INVOICE</Text>
            <View style={mStyles.invoiceBadge}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>{invoice.invoiceNum}</Text>
            </View>
            <Text style={{ fontSize: 7.5, color: '#64748b', marginTop: 4 }}>Issued: {fmtDate(invoice.issuedAt)}</Text>
          </View>
        </View>

        {/* Meta Info */}
        <View style={mStyles.metaBlock}>
          <View style={mStyles.metaCol}>
            <Text style={[styles.metaSectionTitle, { borderBottom: 'none', paddingBottom: 0 }]}>Billed To</Text>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginTop: 3 }}>{customer.name}</Text>
            {customer.address && <Text style={{ fontSize: 7.5, color: '#475569', marginTop: 2 }}>{customer.address}</Text>}
            {customer.phone && <Text style={{ fontSize: 7.5, color: '#475569', marginTop: 2 }}>Tel: {customer.phone}</Text>}
          </View>
          <View style={[mStyles.metaCol, { alignItems: 'flex-end' }]}>
            <Text style={[styles.metaSectionTitle, { borderBottom: 'none', paddingBottom: 0 }]}>Invoice Summary</Text>
            <Text style={{ fontSize: 7.5, color: '#475569', marginTop: 4 }}>Total Amount: Rs. {invoice.grandTotal.toFixed(2)}</Text>
            <Text style={{ fontSize: 7.5, color: '#475569', marginTop: 2 }}>Due Date: {invoice.dueDate ? fmtDate(invoice.dueDate) : 'On Receipt'}</Text>
          </View>
        </View>

        {/* Minimal Table */}
        <View>
          <View style={mStyles.tableHeader}>
            <Text style={[mStyles.th, { width: COL_W.sr, textAlign: 'center' }]}>Sr.</Text>
            <Text style={[mStyles.th, { width: COL_W.item, textAlign: 'left', paddingLeft: 4 }]}>Item Name</Text>
            {shop.showColHsn !== false && <Text style={[mStyles.th, { width: COL_W.hsn, textAlign: 'center' }]}>HSN</Text>}
            <Text style={[mStyles.th, { width: COL_W.qty, textAlign: 'center' }]}>Qty</Text>
            {shop.showColUnit !== false && <Text style={[mStyles.th, { width: COL_W.unit, textAlign: 'center' }]}>Unit</Text>}
            {shop.showColRate !== false && <Text style={[mStyles.th, { width: COL_W.rate, textAlign: 'right' }]}>Rate</Text>}
            {shop.showColTaxable !== false && <Text style={[mStyles.th, { width: COL_W.taxable, textAlign: 'right' }]}>Taxable</Text>}
            {shop.showColGst !== false && <Text style={[mStyles.th, { width: COL_W.gst, textAlign: 'right' }]}>GST</Text>}
            <Text style={[mStyles.th, { width: COL_W.total, textAlign: 'right', paddingRight: 4 }]}>Amount</Text>
          </View>

          {items.map((item, idx) => {
            const taxRate = item.product?.taxRate ?? 0;
            const lineTotal = item.quantity * item.unitPrice;
            const rateExcl = item.unitPrice / (1 + taxRate / 100);
            const taxableVal = item.quantity * rateExcl;
            const gstAmt = lineTotal - taxableVal;

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
              if (shop?.showColBulkPrice !== false && item.product?.bulkPrice) metaParts.push(`Bulk: Rs. ${item.product.bulkPrice}`);
            }
            const metaText = metaParts.join(" | ");

            return (
              <View key={item.id ?? idx} style={mStyles.tableRow}>
                <Text style={[mStyles.td, { width: COL_W.sr, textAlign: 'center' }]}>{idx + 1}</Text>
                <View style={[mStyles.td, { width: COL_W.item, flexDirection: 'column' }]}>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                    {item.product?.name ?? 'Item'}{item.product?.actualValue ? ` (${item.product.actualValue}${item.product.unit || ''})` : ''}
                  </Text>
                  {metaText ? <Text style={{ fontSize: 5.5, color: '#4b5563', marginTop: 1 }}>{metaText}</Text> : null}
                </View>
                {shop.showColHsn !== false && <Text style={[mStyles.td, { width: COL_W.hsn, textAlign: 'center' }]}>{item.product?.hsnSac || '—'}</Text>}
                <Text style={[mStyles.td, { width: COL_W.qty, textAlign: 'center' }]}>{item.quantity}</Text>
                {shop.showColUnit !== false && <Text style={[mStyles.td, { width: COL_W.unit, textAlign: 'center' }]}>{item.product?.unit || 'NOS'}</Text>}
                {shop.showColRate !== false && <Text style={[mStyles.td, { width: COL_W.rate, textAlign: 'right' }]}>{rateExcl.toFixed(2)}</Text>}
                {shop.showColTaxable !== false && <Text style={[mStyles.td, { width: COL_W.taxable, textAlign: 'right' }]}>{taxableVal.toFixed(2)}</Text>}
                {shop.showColGst !== false && <Text style={[mStyles.td, { width: COL_W.gst, textAlign: 'right' }]}>{gstAmt.toFixed(2)}</Text>}
                <Text style={[mStyles.td, { width: COL_W.total, textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>{lineTotal.toFixed(2)}</Text>
              </View>
            );
          })}

          <View style={mStyles.totalRow}>
            <Text style={{ width: COL_W.sr }}></Text>
            <Text style={{ width: COL_W.item, textAlign: 'right', paddingRight: 4 }}>Totals</Text>
            {shop.showColHsn !== false && <Text style={{ width: COL_W.hsn }}></Text>}
            <Text style={{ width: COL_W.qty, textAlign: 'center' }}>{totalQty}</Text>
            {shop.showColUnit !== false && <Text style={{ width: COL_W.unit }}></Text>}
            {shop.showColRate !== false && <Text style={{ width: COL_W.rate }}></Text>}
            {shop.showColTaxable !== false && <Text style={{ width: COL_W.taxable, textAlign: 'right' }}>{totalTaxable.toFixed(2)}</Text>}
            {shop.showColGst !== false && <Text style={{ width: COL_W.gst, textAlign: 'right' }}>{totalGst.toFixed(2)}</Text>}
            <Text style={{ width: COL_W.total, textAlign: 'right', fontFamily: 'Helvetica-Bold' }}>{subtotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={mStyles.summarySection}>
          <View style={{ width: 180 }}>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Sub Total</Text><Text style={styles.summaryValue}>Rs. {subtotal.toFixed(2)}</Text></View>
            {(invoice.discountPercentage ?? 0) > 0 && (
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Discount ({invoice.discountPercentage}%)</Text><Text style={styles.summaryValueRed}>-Rs. {discountAmt.toFixed(2)}</Text></View>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryTotalRow}><Text style={styles.summaryTotalLabel}>Grand Total</Text><Text style={styles.summaryTotalValue}>Rs. {invoice.grandTotal.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Amount Paid</Text><Text style={styles.summaryValueGreen}>Rs. {invoice.amountPaid.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: '#dc2626', fontFamily: 'Helvetica-Bold' }]}>Balance Due</Text><Text style={styles.summaryValueRed}>Rs. {balance.toFixed(2)}</Text></View>
          </View>
        </View>

        {/* Footer */}
        <View style={{ marginTop: 'auto' }}>
          {shop.showFooterMessage !== false && <Text style={[styles.termsText, { textAlign: 'center' }]}>{shop.footerMessage}</Text>}
          <Text style={{ fontSize: 6, color: '#94a3b8', textAlign: 'center' }}>Computer Generated Document — No Signature Required</Text>
        </View>
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. LANDSCAPE TEMPLATE (A5 Landscape)
// ─────────────────────────────────────────────────────────────────────────────
function InvoicePDFLandscape({ invoice, shop, customer, items, subtotal, discountAmt, balance, totalTaxable, totalGst, totalQty }) {
  // A5 Landscape width is 595pt. Print area width is ≈ 505pt with 45pt margins
  const COL_W = getColWidths(shop, 505);

  const lStyles = StyleSheet.create({
    page: {
      fontFamily: 'Helvetica',
      fontSize: 7.5,
      paddingTop: 20,
      paddingBottom: 20,
      paddingHorizontal: 45,
      backgroundColor: '#ffffff',
      color: '#1f2937',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottom: '1pt solid #cbd5e1',
      paddingBottom: 4,
      marginBottom: 6,
    },
    titleBlock: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    shopTitle: {
      fontSize: 16,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
    },
    metadataGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: '#f8fafc',
      border: '0.5pt solid #e2e8f0',
      borderRadius: 4,
      padding: 6,
      marginBottom: 6,
    },
    col: { width: '48%' },
  });

  return (
    <Document title={`Invoice ${invoice.invoiceNum}`} author={shop.businessName} subject="Tax Invoice">
      <Page size="A5" orientation="landscape" style={lStyles.page}>
        <View style={lStyles.header}>
          <View>
            <Text style={lStyles.shopTitle}>{shop.businessName}</Text>
            {shop.address && <Text style={{ fontSize: 7, color: '#64748b' }}>{shop.address}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#0284c7' }}>TAX INVOICE</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>{invoice.invoiceNum}</Text>
          </View>
        </View>

        {/* 2-col meta info */}
        <View style={lStyles.metadataGrid}>
          <View style={lStyles.col}>
            <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#94a3b8', textTransform: 'uppercase' }}>Customer</Text>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>{customer.name}</Text>
            <Text style={{ fontSize: 7, color: '#475569' }}>{customer.phone || 'No Phone'}</Text>
          </View>
          <View style={[lStyles.col, { alignItems: 'flex-end' }]}>
            <Text style={{ fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#94a3b8', textTransform: 'uppercase' }}>Invoice Details</Text>
            <Text style={{ fontSize: 7, color: '#475569' }}>Date: {fmtDate(invoice.issuedAt)}</Text>
            {invoice.dueDate && <Text style={{ fontSize: 7, color: '#475569', fontFamily: 'Helvetica-Bold' }}>Due: {fmtDate(invoice.dueDate)}</Text>}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: COL_W.sr }]}>Sr.</Text>
            <Text style={[styles.th, { width: COL_W.item, textAlign: 'left', paddingLeft: 4 }]}>Item</Text>
            {shop.showColHsn !== false && <Text style={[styles.th, { width: COL_W.hsn }]}>HSN</Text>}
            <Text style={[styles.th, { width: COL_W.qty }]}>Qty</Text>
            {shop.showColUnit !== false && <Text style={[styles.th, { width: COL_W.unit }]}>Unit</Text>}
            {shop.showColRate !== false && <Text style={[styles.th, { width: COL_W.rate, textAlign: 'right' }]}>Rate</Text>}
            {shop.showColTaxable !== false && <Text style={[styles.th, { width: COL_W.taxable, textAlign: 'right' }]}>Taxable</Text>}
            {shop.showColGst !== false && <Text style={[styles.th, { width: COL_W.gst, textAlign: 'right' }]}>GST</Text>}
            <Text style={[styles.th, { width: COL_W.total, textAlign: 'right', paddingRight: 4 }]}>Total</Text>
          </View>

          {items.map((item, idx) => {
            const taxRate = item.product?.taxRate ?? 0;
            const lineTotal = item.quantity * item.unitPrice;
            const rateExcl = item.unitPrice / (1 + taxRate / 100);
            const taxableVal = item.quantity * rateExcl;
            const gstAmt = lineTotal - taxableVal;

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
              if (shop?.showColBulkPrice !== false && item.product?.bulkPrice) metaParts.push(`Bulk: Rs. ${item.product.bulkPrice}`);
            }
            const metaText = metaParts.join(" | ");

            return (
              <View key={item.id ?? idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tdCenter, styles.colSrCell, { width: COL_W.sr }]}>{idx + 1}</Text>
                <View style={[styles.colItemCell, { width: COL_W.item, flexDirection: 'column' }]}>
                  <Text style={styles.tdBold}>
                    {item.product?.name ?? 'Item'}{item.product?.actualValue ? ` (${item.product.actualValue}${item.product.unit || ''})` : ''}
                  </Text>
                  {metaText ? <Text style={{ fontSize: 5.5, color: '#4b5563', marginTop: 1 }}>{metaText}</Text> : null}
                </View>
                {shop.showColHsn !== false && <Text style={[styles.tdCenter, styles.colHsnCell, { width: COL_W.hsn }]}>{item.product?.hsnSac || '—'}</Text>}
                <Text style={[styles.tdCenter, styles.colQtyCell, { width: COL_W.qty }]}>{item.quantity}</Text>
                {shop.showColUnit !== false && <Text style={[styles.tdCenter, styles.colUnitCell, { width: COL_W.unit }]}>{item.product?.unit || 'NOS'}</Text>}
                {shop.showColRate !== false && <Text style={[styles.td, styles.colRateCell, { width: COL_W.rate }]}>{rateExcl.toFixed(1)}</Text>}
                {shop.showColTaxable !== false && <Text style={[styles.td, styles.colTaxableCell, { width: COL_W.taxable }]}>{taxableVal.toFixed(1)}</Text>}
                {shop.showColGst !== false && <Text style={[styles.td, styles.colGstAmtCell, { width: COL_W.gst }]}>{gstAmt.toFixed(1)}</Text>}
                <Text style={[styles.tdBold, styles.colTotalCell, { width: COL_W.total }]}>{lineTotal.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>

        {/* Small bottom summary */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <View style={{ width: '55%' }}>
            {shop.showFooterMessage !== false && <Text style={{ fontSize: 6, color: '#64748b' }}>{shop.footerMessage}</Text>}
          </View>
          <View style={{ width: '40%' }}>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Sub Total</Text><Text style={styles.summaryValue}>Rs. {subtotal.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Grand Total</Text><Text style={styles.summaryTotalValue}>Rs. {invoice.grandTotal.toFixed(2)}</Text></View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
