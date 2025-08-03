
import { db } from '../db';
import { customersTable, invoicesTable, customerSubscriptionsTable, servicePackagesTable } from '../db/schema';
import { type AdminStats } from '../schema';
import { eq, and, sql } from 'drizzle-orm';

export async function getAdminStats(): Promise<AdminStats> {
  try {
    // Count active customers
    const activeCustomersResult = await db.select({
      count: sql<number>`cast(count(*) as int)`
    })
    .from(customersTable)
    .where(eq(customersTable.status, 'active'))
    .execute();

    const totalActiveCustomers = activeCustomersResult[0]?.count || 0;

    // Count unpaid invoices
    const unpaidInvoicesResult = await db.select({
      count: sql<number>`cast(count(*) as int)`
    })
    .from(invoicesTable)
    .where(eq(invoicesTable.status, 'unpaid'))
    .execute();

    const totalUnpaidInvoices = unpaidInvoicesResult[0]?.count || 0;

    // Calculate estimated monthly revenue from active subscriptions
    const monthlyRevenueResult = await db.select({
      total: sql<string>`cast(coalesce(sum(${servicePackagesTable.monthly_price}), 0) as text)`
    })
    .from(customerSubscriptionsTable)
    .innerJoin(servicePackagesTable, eq(customerSubscriptionsTable.package_id, servicePackagesTable.id))
    .where(eq(customerSubscriptionsTable.status, 'active'))
    .execute();

    const estimatedMonthlyRevenue = parseFloat(monthlyRevenueResult[0]?.total || '0');

    return {
      total_active_customers: totalActiveCustomers,
      total_unpaid_invoices: totalUnpaidInvoices,
      estimated_monthly_revenue: estimatedMonthlyRevenue
    };
  } catch (error) {
    console.error('Admin stats calculation failed:', error);
    throw error;
  }
}
