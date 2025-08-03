
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicePackagesTable, customerSubscriptionsTable } from '../db/schema';
import { getCustomerSubscriptions } from '../handlers/get_customer_subscriptions';

describe('getCustomerSubscriptions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all customer subscriptions when no customerId provided', async () => {
    // Create prerequisite data
    const customer1 = await db.insert(customersTable)
      .values({
        full_name: 'John Doe',
        full_address: '123 Main St',
        phone_number: '555-0101',
        email_address: 'john@example.com',
        join_date: '2024-01-01', // Date as string
        status: 'active'
      })
      .returning()
      .execute();

    const customer2 = await db.insert(customersTable)
      .values({
        full_name: 'Jane Smith',
        full_address: '456 Oak Ave',
        phone_number: '555-0102',
        email_address: 'jane@example.com',
        join_date: '2024-01-02', // Date as string
        status: 'active'
      })
      .returning()
      .execute();

    const servicePackage = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Internet',
        speed: '100 Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package'
      })
      .returning()
      .execute();

    // Create subscriptions for both customers
    await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customer1[0].id,
        package_id: servicePackage[0].id,
        start_date: '2024-01-01', // Date as string
        status: 'active'
      })
      .execute();

    await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customer2[0].id,
        package_id: servicePackage[0].id,
        start_date: '2024-01-02', // Date as string
        status: 'active'
      })
      .execute();

    const result = await getCustomerSubscriptions();

    expect(result).toHaveLength(2);
    expect(result[0].customer_id).toEqual(customer1[0].id);
    expect(result[0].package_id).toEqual(servicePackage[0].id);
    expect(result[0].status).toEqual('active');
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
  });

  it('should return subscriptions for specific customer when customerId provided', async () => {
    // Create prerequisite data
    const customer1 = await db.insert(customersTable)
      .values({
        full_name: 'John Doe',
        full_address: '123 Main St',
        phone_number: '555-0101',
        email_address: 'john@example.com',
        join_date: '2024-01-01', // Date as string
        status: 'active'
      })
      .returning()
      .execute();

    const customer2 = await db.insert(customersTable)
      .values({
        full_name: 'Jane Smith',
        full_address: '456 Oak Ave',
        phone_number: '555-0102',
        email_address: 'jane@example.com',
        join_date: '2024-01-02', // Date as string
        status: 'active'
      })
      .returning()
      .execute();

    const servicePackage = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Internet',
        speed: '100 Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package'
      })
      .returning()
      .execute();

    // Create subscriptions for both customers
    await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customer1[0].id,
        package_id: servicePackage[0].id,
        start_date: '2024-01-01', // Date as string
        status: 'active'
      })
      .execute();

    await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customer2[0].id,
        package_id: servicePackage[0].id,
        start_date: '2024-01-02', // Date as string
        status: 'inactive'
      })
      .execute();

    const result = await getCustomerSubscriptions(customer1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].customer_id).toEqual(customer1[0].id);
    expect(result[0].package_id).toEqual(servicePackage[0].id);
    expect(result[0].status).toEqual('active');
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].end_date).toBeNull();
  });

  it('should return empty array when customer has no subscriptions', async () => {
    // Create customer but no subscriptions
    const customer = await db.insert(customersTable)
      .values({
        full_name: 'John Doe',
        full_address: '123 Main St',
        phone_number: '555-0101',
        email_address: 'john@example.com',
        join_date: '2024-01-01', // Date as string
        status: 'active'
      })
      .returning()
      .execute();

    const result = await getCustomerSubscriptions(customer[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no subscriptions exist', async () => {
    const result = await getCustomerSubscriptions();

    expect(result).toHaveLength(0);
  });

  it('should handle subscription with end_date correctly', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
      .values({
        full_name: 'John Doe',
        full_address: '123 Main St',
        phone_number: '555-0101',
        email_address: 'john@example.com',
        join_date: '2024-01-01', // Date as string
        status: 'active'
      })
      .returning()
      .execute();

    const servicePackage = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Premium Internet',
        speed: '500 Mbps',
        monthly_price: '59.99',
        package_description: 'Premium internet package'
      })
      .returning()
      .execute();

    // Create subscription with end_date
    await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customer[0].id,
        package_id: servicePackage[0].id,
        start_date: '2024-01-01', // Date as string
        end_date: '2024-12-31', // Date as string
        status: 'inactive'
      })
      .execute();

    const result = await getCustomerSubscriptions(customer[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].end_date).toBeInstanceOf(Date);
    expect(result[0].end_date?.getFullYear()).toEqual(2024);
    expect(result[0].status).toEqual('inactive');
  });
});
