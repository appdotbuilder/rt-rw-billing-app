
import { db } from '../db';
import { invoicesTable, customersTable, customerSubscriptionsTable } from '../db/schema';
import { type CreateInvoiceInput, type Invoice } from '../schema';
import { eq } from 'drizzle-orm';

export const createInvoice = async (input: CreateInvoiceInput): Promise<Invoice> => {
  try {
    // Verify customer exists
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.customer_id))
      .execute();

    if (customers.length === 0) {
      throw new Error(`Customer with id ${input.customer_id} does not exist`);
    }

    // Verify subscription exists
    const subscriptions = await db.select()
      .from(customerSubscriptionsTable)
      .where(eq(customerSubscriptionsTable.id, input.subscription_id))
      .execute();

    if (subscriptions.length === 0) {
      throw new Error(`Subscription with id ${input.subscription_id} does not exist`);
    }

    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Format dates as strings for date columns
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    // Insert invoice record
    const result = await db.insert(invoicesTable)
      .values({
        invoice_number: invoiceNumber,
        customer_id: input.customer_id,
        subscription_id: input.subscription_id,
        issue_date: formatDate(input.issue_date),
        due_date: formatDate(input.due_date),
        service_period_start: formatDate(input.service_period_start),
        service_period_end: formatDate(input.service_period_end),
        service_details: input.service_details,
        total_amount: input.total_amount.toString(), // Convert number to string for numeric column
        status: 'unpaid'
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers and date strings back to dates
    const invoice = result[0];
    return {
      ...invoice,
      issue_date: new Date(invoice.issue_date),
      due_date: new Date(invoice.due_date),
      service_period_start: new Date(invoice.service_period_start),
      service_period_end: new Date(invoice.service_period_end),
      total_amount: parseFloat(invoice.total_amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Invoice creation failed:', error);
    throw error;
  }
};
