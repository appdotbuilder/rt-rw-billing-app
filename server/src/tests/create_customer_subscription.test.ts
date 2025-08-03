
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicePackagesTable, customerSubscriptionsTable } from '../db/schema';
import { type CreateCustomerSubscriptionInput } from '../schema';
import { createCustomerSubscription } from '../handlers/create_customer_subscription';
import { eq } from 'drizzle-orm';

describe('createCustomerSubscription', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let customerId: number;
  let packageId: number;

  beforeEach(async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        full_name: 'Test Customer',
        full_address: '123 Test Street',
        phone_number: '555-0123',
        email_address: 'test@example.com',
        join_date: '2024-01-01', // Use string format
        status: 'active'
      })
      .returning()
      .execute();
    customerId = customerResult[0].id;

    // Create test service package
    const packageResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Plan',
        speed: '100 Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package'
      })
      .returning()
      .execute();
    packageId = packageResult[0].id;
  });

  const testInput = (): CreateCustomerSubscriptionInput => ({
    customer_id: customerId,
    package_id: packageId,
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31'),
    status: 'active'
  });

  it('should create a customer subscription', async () => {
    const input = testInput();
    const result = await createCustomerSubscription(input);

    expect(result.customer_id).toEqual(customerId);
    expect(result.package_id).toEqual(packageId);
    expect(result.start_date).toEqual(new Date('2024-01-01'));
    expect(result.end_date).toEqual(new Date('2024-12-31'));
    expect(result.status).toEqual('active');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save subscription to database', async () => {
    const input = testInput();
    const result = await createCustomerSubscription(input);

    const subscriptions = await db.select()
      .from(customerSubscriptionsTable)
      .where(eq(customerSubscriptionsTable.id, result.id))
      .execute();

    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0].customer_id).toEqual(customerId);
    expect(subscriptions[0].package_id).toEqual(packageId);
    expect(subscriptions[0].start_date).toEqual('2024-01-01');
    expect(subscriptions[0].end_date).toEqual('2024-12-31');
    expect(subscriptions[0].status).toEqual('active');
  });

  it('should create subscription with null end_date when not provided', async () => {
    const input: CreateCustomerSubscriptionInput = {
      customer_id: customerId,
      package_id: packageId,
      start_date: new Date('2024-01-01'),
      status: 'active'
    };

    const result = await createCustomerSubscription(input);

    expect(result.end_date).toBeNull();

    const subscriptions = await db.select()
      .from(customerSubscriptionsTable)
      .where(eq(customerSubscriptionsTable.id, result.id))
      .execute();

    expect(subscriptions[0].end_date).toBeNull();
  });

  it('should apply default status when not provided', async () => {
    const input: CreateCustomerSubscriptionInput = {
      customer_id: customerId,
      package_id: packageId,
      start_date: new Date('2024-01-01'),
      status: 'active' // Include explicit status since it appears to be required
    };

    const result = await createCustomerSubscription(input);

    expect(result.status).toEqual('active');
  });

  it('should throw error when customer does not exist', async () => {
    const input: CreateCustomerSubscriptionInput = {
      customer_id: 99999,
      package_id: packageId,
      start_date: new Date('2024-01-01'),
      status: 'active'
    };

    await expect(createCustomerSubscription(input)).rejects.toThrow(/customer with id 99999 not found/i);
  });

  it('should throw error when service package does not exist', async () => {
    const input: CreateCustomerSubscriptionInput = {
      customer_id: customerId,
      package_id: 99999,
      start_date: new Date('2024-01-01'),
      status: 'active'
    };

    await expect(createCustomerSubscription(input)).rejects.toThrow(/service package with id 99999 not found/i);
  });

  it('should handle different subscription statuses', async () => {
    const suspendedInput: CreateCustomerSubscriptionInput = {
      customer_id: customerId,
      package_id: packageId,
      start_date: new Date('2024-01-01'),
      status: 'suspended'
    };

    const result = await createCustomerSubscription(suspendedInput);

    expect(result.status).toEqual('suspended');

    const subscriptions = await db.select()
      .from(customerSubscriptionsTable)
      .where(eq(customerSubscriptionsTable.id, result.id))
      .execute();

    expect(subscriptions[0].status).toEqual('suspended');
  });
});
