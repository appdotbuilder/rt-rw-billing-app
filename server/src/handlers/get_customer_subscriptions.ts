
import { db } from '../db';
import { customerSubscriptionsTable } from '../db/schema';
import { type CustomerSubscription } from '../schema';
import { eq } from 'drizzle-orm';

export async function getCustomerSubscriptions(customerId?: number): Promise<CustomerSubscription[]> {
  try {
    // Build query with conditional where clause
    const results = customerId !== undefined
      ? await db.select()
          .from(customerSubscriptionsTable)
          .where(eq(customerSubscriptionsTable.customer_id, customerId))
          .execute()
      : await db.select()
          .from(customerSubscriptionsTable)
          .execute();

    // Convert date strings back to Date objects to match schema
    return results.map(subscription => ({
      ...subscription,
      start_date: new Date(subscription.start_date),
      end_date: subscription.end_date ? new Date(subscription.end_date) : null,
    }));
  } catch (error) {
    console.error('Failed to fetch customer subscriptions:', error);
    throw error;
  }
}
