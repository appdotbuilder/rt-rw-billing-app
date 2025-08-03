
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type UpdateInvoiceStatusInput, type Invoice } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateInvoiceStatus(input: UpdateInvoiceStatusInput): Promise<Invoice> {
  try {
    // Update invoice status and return the updated record
    const result = await db.update(invoicesTable)
      .set({
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(invoicesTable.id, input.id))
      .returning()
      .execute();

    // Check if invoice was found and updated
    if (result.length === 0) {
      throw new Error('Invoice not found');
    }

    // Convert numeric and date fields back to proper types before returning
    const invoice = result[0];
    return {
      ...invoice,
      total_amount: parseFloat(invoice.total_amount),
      issue_date: new Date(invoice.issue_date),
      due_date: new Date(invoice.due_date),
      service_period_start: new Date(invoice.service_period_start),
      service_period_end: new Date(invoice.service_period_end)
    };
  } catch (error) {
    console.error('Invoice status update failed:', error);
    throw error;
  }
}
