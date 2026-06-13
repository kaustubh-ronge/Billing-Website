export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfMonth, subMonths, subDays, format, eachDayOfInterval } from 'date-fns';

export async function GET() {
  const ctx = await requirePermission('dashboard:view');
  if (ctx instanceof NextResponse) return ctx;
  const { user } = ctx;

  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const last30DaysStart = subDays(todayStart, 29);
    const last12MonthsStart = subMonths(startOfMonth(now), 11);

    const shopId = user.shopId;

    // Run all aggregation queries in parallel — never loads invoice rows into Node.js
    const [
      totalCustomers,
      todayAgg,
      monthAgg,
      pendingAgg,
      paidCount,
      unpaidCount,
      dailyRaw,
      monthlyRaw,
      topPendingRaw,
      topProductsRaw,
      lowStockProducts,
    ] = await Promise.all([
      db.customer.count({ where: { shopId, isDeleted: false } }),

      db.invoice.aggregate({
        where: { shopId, issuedAt: { gte: todayStart, lte: todayEnd } },
        _sum: { grandTotal: true },
      }),

      db.invoice.aggregate({
        where: { shopId, issuedAt: { gte: monthStart } },
        _sum: { grandTotal: true },
      }),

      // Outstanding = sum of (grandTotal - amountPaid) for unpaid invoices
      db.$queryRaw`
        SELECT COALESCE(SUM("grandTotal" - "amountPaid"), 0)::float AS outstanding
        FROM "Invoice"
        WHERE "shopId" = ${shopId} AND "status" != 'PAID'
      `,

      db.invoice.count({ where: { shopId, status: 'PAID' } }),
      db.invoice.count({ where: { shopId, status: { not: 'PAID' } } }),

      // Daily sales for last 30 days
      db.$queryRaw`
        SELECT
          DATE("issuedAt") AS date,
          SUM("grandTotal")::float AS sales,
          COUNT(*)::int AS count
        FROM "Invoice"
        WHERE "shopId" = ${shopId}
          AND "issuedAt" >= ${last30DaysStart}
        GROUP BY DATE("issuedAt")
        ORDER BY date
      `,

      // Monthly sales for last 12 months
      db.$queryRaw`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "issuedAt"), 'YYYY-MM') AS month,
          SUM("grandTotal")::float AS sales,
          COUNT(*)::int AS count
        FROM "Invoice"
        WHERE "shopId" = ${shopId}
          AND "issuedAt" >= ${last12MonthsStart}
        GROUP BY DATE_TRUNC('month', "issuedAt")
        ORDER BY DATE_TRUNC('month', "issuedAt")
      `,

      // Top pending customers
      db.$queryRaw`
        SELECT
          c.id,
          c.name,
          c.phone,
          SUM(i."grandTotal" - i."amountPaid")::float AS outstanding,
          COUNT(i.id)::int AS "invoiceCount"
        FROM "Invoice" i
        JOIN "Customer" c ON i."customerId" = c.id
        WHERE i."shopId" = ${shopId}
          AND i."status" != 'PAID'
        GROUP BY c.id, c.name, c.phone
        ORDER BY outstanding DESC
        LIMIT 10
      `,

      // Top products by quantity sold
      db.$queryRaw`
        SELECT
          p.id,
          p.name,
          p.category,
          p."isService",
          SUM(ii.quantity)::int AS quantity,
          SUM(ii.quantity * ii."unitPrice")::float AS revenue
        FROM "InvoiceItem" ii
        JOIN "Product" p ON ii."productId" = p.id
        JOIN "Invoice" i ON ii."invoiceId" = i.id
        WHERE i."shopId" = ${shopId}
        GROUP BY p.id, p.name, p.category, p."isService"
        ORDER BY quantity DESC
        LIMIT 5
      `,

      db.product.findMany({
        where: { shopId, trackInventory: true, stockCount: { not: null } },
        select: { id: true, name: true, stockCount: true, lowStockAlert: true },
      }),
    ]);

    // Build filled daily chart (zero-pad missing days)
    const last30Days = eachDayOfInterval({ start: last30DaysStart, end: now });
    const dailyMap = new Map(
      (dailyRaw).map((r) => [String(r.date).substring(0, 10), r])
    );
    const dailyChartData = last30Days.map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const row = dailyMap.get(key);
      return { date: format(day, 'MMM dd'), sales: row ? Number(row.sales) : 0, count: row ? Number(row.count) : 0 };
    });

    // Build filled monthly chart (zero-pad missing months)
    const monthlyMap = new Map((monthlyRaw).map((r) => [r.month, r]));
    const monthlyChartData = Array.from({ length: 12 }, (_, i) => {
      const m = subMonths(now, 11 - i);
      const key = format(m, 'yyyy-MM');
      const row = monthlyMap.get(key);
      return { month: format(m, 'MMM yyyy'), sales: row ? Number(row.sales) : 0, count: row ? Number(row.count) : 0 };
    });

    const todaySales = Number(todayAgg._sum.grandTotal ?? 0);
    const monthlySales = Number(monthAgg._sum.grandTotal ?? 0);
    const pendingPayments = Number((pendingAgg)[0]?.outstanding ?? 0);

    // Avg of previous 3 months for forecast
    const prev3Keys = [1, 2, 3].map((i) => format(subMonths(now, i), 'yyyy-MM'));
    const prev3Total = prev3Keys.reduce((sum, key) => {
      const row = monthlyMap.get(key);
      return sum + (row ? Number(row.sales) : 0);
    }, 0);
    const avgMonthly = prev3Total / 3 || monthlySales || 0;

    const lowStockAlerts = lowStockProducts
      .filter((p) => p.stockCount <= (p.lowStockAlert ?? 5))
      .map((p) => ({ id: p.id, name: p.name, stockCount: p.stockCount, lowStockAlert: p.lowStockAlert }));

    const topProducts = (topProductsRaw).map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category || 'Other',
      isService: r.isService,
      quantity: Number(r.quantity),
      revenue: Number(r.revenue),
    }));

    const topPendingCustomers = (topPendingRaw).map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      outstanding: Number(r.outstanding),
      invoiceCount: Number(r.invoiceCount),
    }));

    return NextResponse.json({
      metrics: {
        todaySales: Math.round(todaySales * 100) / 100,
        monthlySales: Math.round(monthlySales * 100) / 100,
        totalCustomers,
        pendingPayments: Math.round(pendingPayments * 100) / 100,
        paidInvoicesCount: paidCount,
        unpaidInvoicesCount: unpaidCount,
      },
      charts: {
        daily: dailyChartData,
        monthly: monthlyChartData,
      },
      reports: {
        topPendingCustomers,
        topProducts,
        lowStockAlerts,
      },
      insights: {
        expectedMonthlyRevenue: Math.round(Math.max(avgMonthly, monthlySales) * 1.1 * 100) / 100,
        bestCategory: topProducts.length > 0 ? topProducts[0].category : 'N/A',
        collectionRatio:
          paidCount + unpaidCount > 0
            ? Math.round((paidCount / (paidCount + unpaidCount)) * 100)
            : 100,
      },
    });
  } catch (error) {
    console.error('Error generating report analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
