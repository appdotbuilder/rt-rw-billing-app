
import { db } from '../db';
import { paymentsTable, invoicesTable, customersTable } from '../db/schema';
import { type Payment } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPayments(customerId?: number): Promise<Payment[]> {
  try {
    if (customerId) {
      // Query with joins when filtering by customer
      const results = await db.select()
        .from(paymentsTable)
        .innerJoin(invoicesTable, eq(paymentsTable.invoice_id, invoicesTable.id))
        .innerJoin(customersTable, eq(invoicesTable.customer_id, customersTable.id))
        .where(eq(customersTable.id, customerId))
        .execute();

      // Handle joined result structure
      return results.map(result => ({
        ...result.payments,
        amount_paid: parseFloat(result.payments.amount_paid),
        payment_date: new Date(result.payments.payment_date),
        created_at: result.payments.created_at,
        updated_at: result.payments.updated_at
      }));
    } else {
      // Simple query without joins when getting all payments
      const results = await db.select()
        .from(paymentsTable)
        .execute();

      return results.map(result => ({
        ...result,
        amount_paid: parseFloat(result.amount_paid),
        payment_date: new Date(result.payment_date),
        created_at: result.created_at,
        updated_at: result.updated_at
      }));
    }
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    throw error;
  }
}
