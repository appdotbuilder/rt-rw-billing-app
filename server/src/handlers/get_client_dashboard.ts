
import { db } from '../db';
import { 
  customersTable, 
  customerSubscriptionsTable, 
  servicePackagesTable, 
  invoicesTable, 
  paymentsTable 
} from '../db/schema';
import { type ClientDashboard } from '../schema';
import { eq } from 'drizzle-orm';

export async function getClientDashboard(customerId: number): Promise<ClientDashboard> {
  try {
    // Fetch customer data
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();

    if (customers.length === 0) {
      throw new Error(`Customer with id ${customerId} not found`);
    }

    const customer = {
      ...customers[0],
      join_date: new Date(customers[0].join_date)
    };

    // Fetch active subscription with service package
    const activeSubscriptions = await db.select()
      .from(customerSubscriptionsTable)
      .innerJoin(servicePackagesTable, eq(customerSubscriptionsTable.package_id, servicePackagesTable.id))
      .where(eq(customerSubscriptionsTable.customer_id, customerId))
      .execute();

    // Find the active subscription (prefer 'active' status, fallback to most recent)
    let activeSubscriptionData = null;
    let servicePackageData = null;

    if (activeSubscriptions.length > 0) {
      const activeSubscription = activeSubscriptions.find(sub => 
        sub.customer_subscriptions.status === 'active'
      ) || activeSubscriptions[0]; // Fallback to first subscription

      activeSubscriptionData = {
        ...activeSubscription.customer_subscriptions,
        start_date: new Date(activeSubscription.customer_subscriptions.start_date),
        end_date: activeSubscription.customer_subscriptions.end_date 
          ? new Date(activeSubscription.customer_subscriptions.end_date) 
          : null
      };

      servicePackageData = {
        ...activeSubscription.service_packages,
        monthly_price: parseFloat(activeSubscription.service_packages.monthly_price)
      };
    }

    // Fetch all invoices for the customer
    const invoiceResults = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.customer_id, customerId))
      .execute();

    const invoices = invoiceResults.map(invoice => ({
      ...invoice,
      issue_date: new Date(invoice.issue_date),
      due_date: new Date(invoice.due_date),
      service_period_start: new Date(invoice.service_period_start),
      service_period_end: new Date(invoice.service_period_end),
      total_amount: parseFloat(invoice.total_amount)
    }));

    // Fetch all payments for the customer's invoices
    const paymentResults = await db.select()
      .from(paymentsTable)
      .innerJoin(invoicesTable, eq(paymentsTable.invoice_id, invoicesTable.id))
      .where(eq(invoicesTable.customer_id, customerId))
      .execute();

    const payments = paymentResults.map(result => ({
      ...result.payments,
      payment_date: new Date(result.payments.payment_date),
      amount_paid: parseFloat(result.payments.amount_paid)
    }));

    return {
      customer,
      active_subscription: activeSubscriptionData,
      service_package: servicePackageData,
      invoices,
      payments
    };
  } catch (error) {
    console.error('Failed to fetch client dashboard:', error);
    throw error;
  }
}
