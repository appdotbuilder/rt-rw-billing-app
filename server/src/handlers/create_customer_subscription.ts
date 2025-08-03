
import { db } from '../db';
import { customersTable, servicePackagesTable, customerSubscriptionsTable } from '../db/schema';
import { type CreateCustomerSubscriptionInput, type CustomerSubscription } from '../schema';
import { eq } from 'drizzle-orm';

export async function createCustomerSubscription(input: CreateCustomerSubscriptionInput): Promise<CustomerSubscription> {
  try {
    // Validate that customer exists
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.customer_id))
      .execute();

    if (customers.length === 0) {
      throw new Error(`Customer with id ${input.customer_id} not found`);
    }

    // Validate that service package exists
    const packages = await db.select()
      .from(servicePackagesTable)
      .where(eq(servicePackagesTable.id, input.package_id))
      .execute();

    if (packages.length === 0) {
      throw new Error(`Service package with id ${input.package_id} not found`);
    }

    // Create the subscription
    const result = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: input.customer_id,
        package_id: input.package_id,
        start_date: input.start_date.toISOString().split('T')[0], // Convert Date to string
        end_date: input.end_date ? input.end_date.toISOString().split('T')[0] : null, // Convert Date to string or null
        status: input.status || 'active'
      })
      .returning()
      .execute();

    // Convert date strings back to Date objects for return type
    const subscription = result[0];
    return {
      ...subscription,
      start_date: new Date(subscription.start_date),
      end_date: subscription.end_date ? new Date(subscription.end_date) : null
    };
  } catch (error) {
    console.error('Customer subscription creation failed:', error);
    throw error;
  }
}
