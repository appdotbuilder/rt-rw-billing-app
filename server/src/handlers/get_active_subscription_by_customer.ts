
import { db } from '../db';
import { customerSubscriptionsTable } from '../db/schema';
import { type CustomerSubscription } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getActiveSubscriptionByCustomer(customerId: number): Promise<CustomerSubscription | null> {
  try {
    // Query for active subscription for the specific customer
    // Order by created_at desc to get the most recent one
    const result = await db.select()
      .from(customerSubscriptionsTable)
      .where(
        and(
          eq(customerSubscriptionsTable.customer_id, customerId),
          eq(customerSubscriptionsTable.status, 'active')
        )
      )
      .orderBy(desc(customerSubscriptionsTable.created_at))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    const subscription = result[0];
    
    // Return with proper type conversion - no numeric fields to convert in subscriptions table
    return {
      ...subscription,
      // Convert date fields to Date objects if they come as strings
      start_date: new Date(subscription.start_date),
      end_date: subscription.end_date ? new Date(subscription.end_date) : null,
      created_at: new Date(subscription.created_at),
      updated_at: new Date(subscription.updated_at)
    };
  } catch (error) {
    console.error('Failed to get active subscription by customer:', error);
    throw error;
  }
}
