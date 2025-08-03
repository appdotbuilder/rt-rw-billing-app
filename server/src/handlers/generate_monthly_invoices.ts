
import { db } from '../db';
import { customerSubscriptionsTable, invoicesTable, servicePackagesTable, customersTable } from '../db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';

export async function generateMonthlyInvoices(): Promise<{ generated: number }> {
  try {
    // Get current month start and end dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    // Get all active subscriptions
    const activeSubscriptions = await db.select({
      subscription_id: customerSubscriptionsTable.id,
      customer_id: customerSubscriptionsTable.customer_id,
      package_id: customerSubscriptionsTable.package_id,
      start_date: customerSubscriptionsTable.start_date,
      customer_name: customersTable.full_name,
      package_name: servicePackagesTable.package_name,
      package_price: servicePackagesTable.monthly_price,
      package_description: servicePackagesTable.package_description
    })
    .from(customerSubscriptionsTable)
    .innerJoin(customersTable, eq(customerSubscriptionsTable.customer_id, customersTable.id))
    .innerJoin(servicePackagesTable, eq(customerSubscriptionsTable.package_id, servicePackagesTable.id))
    .where(eq(customerSubscriptionsTable.status, 'active'))
    .execute();

    // Check which subscriptions already have invoices for current month
    const existingInvoices = await db.select({
      subscription_id: invoicesTable.subscription_id
    })
    .from(invoicesTable)
    .where(and(
      gte(invoicesTable.service_period_start, currentMonthStart.toISOString().split('T')[0]),
      lt(invoicesTable.service_period_start, nextMonthStart.toISOString().split('T')[0])
    ))
    .execute();

    const existingInvoiceSubscriptionIds = new Set(
      existingInvoices.map(invoice => invoice.subscription_id)
    );

    // Filter out subscriptions that already have invoices for current month
    const subscriptionsNeedingInvoices = activeSubscriptions.filter(
      subscription => !existingInvoiceSubscriptionIds.has(subscription.subscription_id)
    );

    let generatedCount = 0;

    // Generate invoices for remaining subscriptions
    for (const subscription of subscriptionsNeedingInvoices) {
      // Calculate service period (current month)
      const servicePeriodStart = new Date(currentMonthStart);
      const servicePeriodEnd = new Date(nextMonthStart);
      servicePeriodEnd.setDate(servicePeriodEnd.getDate() - 1); // Last day of current month

      // Calculate due date (15 days from issue date)
      const issueDate = new Date();
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 15);

      // Generate unique invoice number
      const invoiceNumber = `INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}-${subscription.subscription_id.toString().padStart(6, '0')}`;

      // Create service details
      const serviceDetails = `Monthly service: ${subscription.package_name} - ${subscription.package_description}`;

      await db.insert(invoicesTable)
        .values({
          invoice_number: invoiceNumber,
          customer_id: subscription.customer_id,
          subscription_id: subscription.subscription_id,
          issue_date: issueDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          service_period_start: servicePeriodStart.toISOString().split('T')[0],
          service_period_end: servicePeriodEnd.toISOString().split('T')[0],
          service_details: serviceDetails,
          total_amount: subscription.package_price, // Already a string from numeric column
          status: 'unpaid'
        })
        .execute();

      generatedCount++;
    }

    return { generated: generatedCount };
  } catch (error) {
    console.error('Monthly invoice generation failed:', error);
    throw error;
  }
}
