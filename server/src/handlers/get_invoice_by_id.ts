
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type Invoice } from '../schema';
import { eq } from 'drizzle-orm';

export const getInvoiceById = async (id: number): Promise<Invoice | null> => {
  try {
    const result = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const invoice = result[0];
    return {
      ...invoice,
      total_amount: parseFloat(invoice.total_amount), // Convert numeric to number
      issue_date: new Date(invoice.issue_date), // Convert date string to Date
      due_date: new Date(invoice.due_date), // Convert date string to Date
      service_period_start: new Date(invoice.service_period_start), // Convert date string to Date
      service_period_end: new Date(invoice.service_period_end) // Convert date string to Date
    };
  } catch (error) {
    console.error('Failed to get invoice by ID:', error);
    throw error;
  }
};
