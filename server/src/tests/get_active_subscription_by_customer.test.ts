
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicePackagesTable, customerSubscriptionsTable } from '../db/schema';
import { getActiveSubscriptionByCustomer } from '../handlers/get_active_subscription_by_customer';

describe('getActiveSubscriptionByCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when customer has no subscriptions', async () => {
    // Create customer without subscriptions
    const customerResult = await db.insert(customersTable)
      .values({
        full_name: 'John Doe',
        full_address: '123 Main St, City, State',
        phone_number: '+1234567890',
        email_address: 'john@example.com',
        join_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const result = await getActiveSubscriptionByCustomer(customerResult[0].id);
    expect(result).toBeNull();
  });

  it('should return null when customer has no active subscriptions', async () => {
    // Create customer and service package
    const customerResult = await db.insert(customersTable)
      .values({
        full_name: 'John Doe',
        full_address: '123 Main St, City, State',
        phone_number: '+1234567890',
        email_address: 'john@example.com',
        join_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const packageResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Internet',
        speed: '100 Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package for home use'
      })
      .returning()
      .execute();

    // Create inactive subscription
    await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customerResult[0].id,
        package_id: packageResult[0].id,
        start_date: '2024-01-01',
        end_date: '2024-02-01',
        status: 'inactive'
      })
      .returning()
      .execute();

    const result = await getActiveSubscriptionByCustomer(customerResult[0].id);
    expect(result).toBeNull();
  });

  it('should return active subscription for customer', async () => {
    // Create customer and service package
    const customerResult = await db.insert(customersTable)
      .values({
        full_name: 'John Doe',
        full_address: '123 Main St, City, State',
        phone_number: '+1234567890',
        email_address: 'john@example.com',
        join_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const packageResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Internet',
        speed: '100 Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package for home use'
      })
      .returning()
      .execute();

    // Create active subscription
    const subscriptionResult = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customerResult[0].id,
        package_id: packageResult[0].id,
        start_date: '2024-01-01',
        end_date: null,
        status: 'active'
      })
      .returning()
      .execute();

    const result = await getActiveSubscriptionByCustomer(customerResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(subscriptionResult[0].id);
    expect(result!.customer_id).toEqual(customerResult[0].id);
    expect(result!.package_id).toEqual(packageResult[0].id);
    expect(result!.status).toEqual('active');
    expect(result!.start_date).toBeInstanceOf(Date);
    expect(result!.end_date).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return most recent active subscription when multiple exist', async () => {
    // Create customer and service package
    const customerResult = await db.insert(customersTable)
      .values({
        full_name: 'John Doe',
        full_address: '123 Main St, City, State',
        phone_number: '+1234567890',
        email_address: 'john@example.com',
        join_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const packageResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Internet',
        speed: '100 Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package for home use'
      })
      .returning()
      .execute();

    // Create first active subscription
    await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customerResult[0].id,
        package_id: packageResult[0].id,
        start_date: '2024-01-01',
        end_date: null,
        status: 'active'
      })
      .returning()
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Create second active subscription (more recent)
    const secondSubscriptionResult = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customerResult[0].id,
        package_id: packageResult[0].id,
        start_date: '2024-02-01',
        end_date: null,
        status: 'active'
      })
      .returning()
      .execute();

    const result = await getActiveSubscriptionByCustomer(customerResult[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(secondSubscriptionResult[0].id);
    expect(result!.start_date).toEqual(new Date('2024-02-01'));
  });

  it('should not return subscriptions for different customers', async () => {
    // Create two customers
    const customer1Result = await db.insert(customersTable)
      .values({
        full_name: 'John Doe',
        full_address: '123 Main St, City, State',
        phone_number: '+1234567890',
        email_address: 'john@example.com',
        join_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const customer2Result = await db.insert(customersTable)
      .values({
        full_name: 'Jane Doe',
        full_address: '123 Main St, City, State',
        phone_number: '+1234567890',
        email_address: 'jane@example.com',
        join_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const packageResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Internet',
        speed: '100 Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package for home use'
      })
      .returning()
      .execute();

    // Create active subscription for customer 2
    await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customer2Result[0].id,
        package_id: packageResult[0].id,
        start_date: '2024-01-01',
        end_date: null,
        status: 'active'
      })
      .returning()
      .execute();

    // Query for customer 1 should return null
    const result = await getActiveSubscriptionByCustomer(customer1Result[0].id);
    expect(result).toBeNull();
  });
});
