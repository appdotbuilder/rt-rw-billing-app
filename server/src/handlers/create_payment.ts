
import { db } from '../db';
import { paymentsTable, invoicesTable } from '../db/schema';
import { type CreatePaymentInput, type Payment } from '../schema';
import { eq } from 'drizzle-orm';

export const createPayment = async (input: CreatePaymentInput): Promise<Payment> => {
  try {
    // First, verify the invoice exists and is unpaid
    const invoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, input.invoice_id))
      .execute();

    if (invoice.length === 0) {
      throw new Error('Invoice not found');
    }

    if (invoice[0].status === 'paid') {
      throw new Error('Invoice is already paid');
    }

    // Create the payment record
    const result = await db.insert(paymentsTable)
      .values({
        invoice_id: input.invoice_id,
        payment_date: input.payment_date.toISOString().split('T')[0], // Convert Date to string (YYYY-MM-DD)
        payment_method: input.payment_method,
        amount_paid: input.amount_paid.toString(), // Convert number to string for numeric column
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Update invoice status to 'paid'
    await db.update(invoicesTable)
      .set({ 
        status: 'paid',
        updated_at: new Date()
      })
      .where(eq(invoicesTable.id, input.invoice_id))
      .execute();

    // Convert fields back to proper types before returning
    const payment = result[0];
    return {
      ...payment,
      payment_date: new Date(payment.payment_date), // Convert string back to Date
      amount_paid: parseFloat(payment.amount_paid) // Convert string back to number
    };
  } catch (error) {
    console.error('Payment creation failed:', error);
    throw error;
  }
};
