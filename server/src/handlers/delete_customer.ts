
import { db } from '../db';
import { customersTable, customerSubscriptionsTable, invoicesTable, paymentsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function deleteCustomer(id: number): Promise<{ success: boolean }> {
  try {
    // Check if customer exists
    const existingCustomer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, id))
      .execute();

    if (existingCustomer.length === 0) {
      throw new Error('Customer not found');
    }

    // Check for active subscriptions
    const activeSubscriptions = await db.select()
      .from(customerSubscriptionsTable)
      .where(
        and(
          eq(customerSubscriptionsTable.customer_id, id),
          eq(customerSubscriptionsTable.status, 'active')
        )
      )
      .execute();

    if (activeSubscriptions.length > 0) {
      throw new Error('Cannot delete customer with active subscriptions');
    }

    // Check for unpaid invoices
    const unpaidInvoices = await db.select()
      .from(invoicesTable)
      .where(
        and(
          eq(invoicesTable.customer_id, id),
          eq(invoicesTable.status, 'unpaid')
        )
      )
      .execute();

    if (unpaidInvoices.length > 0) {
      throw new Error('Cannot delete customer with unpaid invoices');
    }

    // Get all invoices for this customer to delete related payments
    const customerInvoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.customer_id, id))
      .execute();

    // Delete payments for all customer invoices
    for (const invoice of customerInvoices) {
      await db.delete(paymentsTable)
        .where(eq(paymentsTable.invoice_id, invoice.id))
        .execute();
    }

    // Delete all invoices for the customer
    await db.delete(invoicesTable)
      .where(eq(invoicesTable.customer_id, id))
      .execute();

    // Delete all subscriptions for the customer
    await db.delete(customerSubscriptionsTable)
      .where(eq(customerSubscriptionsTable.customer_id, id))
      .execute();

    // Finally, delete the customer
    await db.delete(customersTable)
      .where(eq(customersTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Customer deletion failed:', error);
    throw error;
  }
}
