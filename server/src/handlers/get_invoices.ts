
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type Invoice, type InvoiceFilter } from '../schema';
import { eq, and, gte, lte, type SQL } from 'drizzle-orm';

export async function getInvoices(filter?: InvoiceFilter): Promise<Invoice[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter?.status) {
      conditions.push(eq(invoicesTable.status, filter.status));
    }

    if (filter?.customer_id) {
      conditions.push(eq(invoicesTable.customer_id, filter.customer_id));
    }

    if (filter?.start_date) {
      // Convert Date to string for database query
      const startDateStr = filter.start_date.toISOString().split('T')[0];
      conditions.push(gte(invoicesTable.issue_date, startDateStr));
    }

    if (filter?.end_date) {
      // Convert Date to string for database query
      const endDateStr = filter.end_date.toISOString().split('T')[0];
      conditions.push(lte(invoicesTable.issue_date, endDateStr));
    }

    // Build query with proper type inference
    const query = conditions.length > 0
      ? db.select().from(invoicesTable).where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : db.select().from(invoicesTable);

    const results = await query.execute();

    // Convert numeric fields to numbers and date strings to Date objects
    return results.map(invoice => ({
      ...invoice,
      total_amount: parseFloat(invoice.total_amount),
      issue_date: new Date(invoice.issue_date),
      due_date: new Date(invoice.due_date),
      service_period_start: new Date(invoice.service_period_start),
      service_period_end: new Date(invoice.service_period_end)
    }));
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    throw error;
  }
}
