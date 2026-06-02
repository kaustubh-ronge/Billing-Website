import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/authHelper';
import { db } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfMonth, subMonths, format, eachDayOfInterval, subDays } from 'date-fns';

export async function GET(req) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get('filter') || 'monthly'; // daily, weekly, monthly, yearly

    // Fetch all active customers count
    const totalCustomers = await db.customer.count({
      where: { shopId: user.shopId, isDeleted: false }
    });

    // Fetch all invoices for this shop to calculate metrics
    const invoices = await db.invoice.findMany({
      where: { shopId: user.shopId },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { issuedAt: 'asc' }
    });

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);

    let todaySales = 0;
    let monthlySales = 0;
    let totalPendingPayments = 0;
    let paidInvoicesCount = 0;
    let unpaidInvoicesCount = 0; // pending + partial
    
    // Grouping sales for charts
    // Daily sales for the last 30 days
    const last30Days = eachDayOfInterval({
      start: subDays(now, 29),
      end: now
    });
    
    const dailySalesMap = new Map(last30Days.map(day => [format(day, 'yyyy-MM-dd'), { date: format(day, 'MMM dd'), sales: 0, count: 0 }]));
    
    // Monthly sales for the last 12 months
    const last12Months = Array.from({ length: 12 }, (_, i) => subMonths(now, i)).reverse();
    const monthlySalesMap = new Map(last12Months.map(month => [format(month, 'yyyy-MM'), { month: format(month, 'MMM yyyy'), sales: 0, count: 0 }]));

    // Customer analytics
    const customerOutstanding = {}; // customerId -> { name, phone, outstanding }
    const productSales = {}; // productId -> { name, quantity, revenue, isService }

    invoices.forEach(inv => {
      const dateStr = format(inv.issuedAt, 'yyyy-MM-dd');
      const monthStr = format(inv.issuedAt, 'yyyy-MM');
      const balance = inv.grandTotal - inv.amountPaid;

      // Basic stats
      if (inv.issuedAt >= todayStart && inv.issuedAt <= todayEnd) {
        todaySales += inv.grandTotal;
      }
      if (inv.issuedAt >= monthStart) {
        monthlySales += inv.grandTotal;
      }

      totalPendingPayments += Math.max(0, balance);

      if (inv.status === 'PAID') {
        paidInvoicesCount++;
      } else {
        unpaidInvoicesCount++;
      }

      // Chart mapping
      if (dailySalesMap.has(dateStr)) {
        const current = dailySalesMap.get(dateStr);
        current.sales += inv.grandTotal;
        current.count += 1;
      }
      if (monthlySalesMap.has(monthStr)) {
        const current = monthlySalesMap.get(monthStr);
        current.sales += inv.grandTotal;
        current.count += 1;
      }

      // Customer Outstanding
      if (balance > 0 && inv.customer) {
        if (!customerOutstanding[inv.customerId]) {
          customerOutstanding[inv.customerId] = {
            id: inv.customerId,
            name: inv.customer.name,
            phone: inv.customer.phone,
            outstanding: 0,
            invoiceCount: 0
          };
        }
        customerOutstanding[inv.customerId].outstanding += balance;
        customerOutstanding[inv.customerId].invoiceCount += 1;
      }

      // Product sales tracking
      inv.items.forEach(item => {
        const prod = item.product;
        if (!productSales[prod.id]) {
          productSales[prod.id] = {
            id: prod.id,
            name: prod.name,
            quantity: 0,
            revenue: 0,
            isService: prod.isService,
            category: prod.category || 'Other'
          };
        }
        productSales[prod.id].quantity += item.quantity;
        productSales[prod.id].revenue += item.quantity * item.unitPrice;
      });
    });

    // Formatting charts for Recharts
    const dailyChartData = Array.from(dailySalesMap.values());
    const monthlyChartData = Array.from(monthlySalesMap.values());

    // Top pending customers list
    const topPendingCustomers = Object.values(customerOutstanding)
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 10);

    // Top selling products list
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // AI Insights - Expected Monthly Revenue & Trends
    const previous3Months = Array.from({ length: 3 }, (_, i) => subMonths(now, i + 1));
    let previous3MonthsSales = 0;
    previous3Months.forEach(m => {
      const monthStr = format(m, 'yyyy-MM');
      if (monthlySalesMap.has(monthStr)) {
        previous3MonthsSales += monthlySalesMap.get(monthStr).sales;
      }
    });
    const avgMonthlyRevenue = previous3MonthsSales / 3 || monthlySales || 0;
    
    // Low stock warnings
    const lowStockProducts = await db.product.findMany({
      where: {
        shopId: user.shopId,
        trackInventory: true,
        stockCount: {
          not: null
        }
      }
    });
    
    const lowStockAlerts = lowStockProducts.filter(p => p.stockCount <= (p.lowStockAlert ?? 5)).map(p => ({
      id: p.id,
      name: p.name,
      stockCount: p.stockCount,
      lowStockAlert: p.lowStockAlert
    }));

    return NextResponse.json({
      metrics: {
        todaySales: Math.round(todaySales * 100) / 100,
        monthlySales: Math.round(monthlySales * 100) / 100,
        totalCustomers,
        pendingPayments: Math.round(totalPendingPayments * 100) / 100,
        paidInvoicesCount,
        unpaidInvoicesCount
      },
      charts: {
        daily: dailyChartData,
        monthly: monthlyChartData
      },
      reports: {
        topPendingCustomers,
        topProducts,
        lowStockAlerts
      },
      insights: {
        expectedMonthlyRevenue: Math.round(Math.max(avgMonthlyRevenue, monthlySales) * 1.1 * 100) / 100, // 10% projection
        bestCategory: topProducts.length > 0 ? topProducts[0].category : 'N/A',
        collectionRatio: todaySales > 0 ? Math.round((paidInvoicesCount / (paidInvoicesCount + unpaidInvoicesCount)) * 100) : 100
      }
    });

  } catch (error) {
    console.error("Error generating report analytics:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
