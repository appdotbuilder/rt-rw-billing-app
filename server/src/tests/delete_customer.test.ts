
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicePackagesTable, customerSubscriptionsTable, invoicesTable } from '../db/schema';
import { deleteCustomer } from '../handlers/delete_customer';
import { eq } from 'drizzle-orm';

describe('deleteCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete a customer with no constraints', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        full_name: 'Test Customer',
        full_address: '123 Test St',
        phone_number: '555-0123',
        email_address: 'test@example.com',
        join_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Delete the customer
    const result = await deleteCustomer(customerId);

    expect(result.success).toBe(true);

    // Verify customer was deleted
    const deletedCustomer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();

    expect(deletedCustomer).toHaveLength(0);
  });

  it('should throw error when customer does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteCustomer(nonExistentId))
      .rejects
      .toThrow(/customer not found/i);
  });

  it('should throw error when customer has active subscriptions', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        full_name: 'Test Customer',
        full_address: '123 Test St',
        phone_number: '555-0123',
        email_address: 'test@example.com',
        join_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create service package
    const packageResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Package',
        speed: '10Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package'
      })
      .returning()
      .execute();

    const packageId = packageResult[0].id;

    // Create active subscription
    await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customerId,
        package_id: packageId,
        start_date: '2024-01-01',
        status: 'active'
      })
      .execute();

    // Attempt to delete customer
    await expect(deleteCustomer(customerId))
      .rejects
      .toThrow(/cannot delete customer with active subscriptions/i);
  });

  it('should throw error when customer has unpaid invoices', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        full_name: 'Test Customer',
        full_address: '123 Test St',
        phone_number: '555-0123',
        email_address: 'test@example.com',
        join_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create service package
    const packageResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Package',
        speed: '10Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package'
      })
      .returning()
      .execute();

    const packageId = packageResult[0].id;

    // Create inactive subscription
    const subscriptionResult = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customerId,
        package_id: packageId,
        start_date: '2024-01-01',
        status: 'inactive'
      })
      .returning()
      .execute();

    const subscriptionId = subscriptionResult[0].id;

    // Create unpaid invoice
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-2024-001',
        customer_id: customerId,
        subscription_id: subscriptionId,
        issue_date: '2024-01-01',
        due_date: '2024-01-31',
        service_period_start: '2024-01-01',
        service_period_end: '2024-01-31',
        service_details: 'Monthly internet service',
        total_amount: '29.99',
        status: 'unpaid'
      })
      .execute();

    // Attempt to delete customer
    await expect(deleteCustomer(customerId))
      .rejects
      .toThrow(/cannot delete customer with unpaid invoices/i);
  });

  it('should successfully delete customer with inactive subscriptions and paid invoices', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        full_name: 'Test Customer',
        full_address: '123 Test St',
        phone_number: '555-0123',
        email_address: 'test@example.com',
        join_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create service package
    const packageResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Package',
        speed: '10Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package'
      })
      .returning()
      .execute();

    const packageId = packageResult[0].id;

    // Create inactive subscription
    const subscriptionResult = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customerId,
        package_id: packageId,
        start_date: '2024-01-01',
        status: 'inactive'
      })
      .returning()
      .execute();

    const subscriptionId = subscriptionResult[0].id;

    // Create paid invoice
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-2024-001',
        customer_id: customerId,
        subscription_id: subscriptionId,
        issue_date: '2024-01-01',
        due_date: '2024-01-31',
        service_period_start: '2024-01-01',
        service_period_end: '2024-01-31',
        service_details: 'Monthly internet service',
        total_amount: '29.99',
        status: 'paid'
      })
      .execute();

    // Delete the customer should succeed
    const result = await deleteCustomer(customerId);

    expect(result.success).toBe(true);

    // Verify customer was deleted
    const deletedCustomer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .execute();

    expect(deletedCustomer).toHaveLength(0);

    // Verify related records were also deleted
    const deletedSubscriptions = await db.select()
      .from(customerSubscriptionsTable)
      .where(eq(customerSubscriptionsTable.customer_id, customerId))
      .execute();

    expect(deletedSubscriptions).toHaveLength(0);

    const deletedInvoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.customer_id, customerId))
      .execute();

    expect(deletedInvoices).toHaveLength(0);
  });
});
