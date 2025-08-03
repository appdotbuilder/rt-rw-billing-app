
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicePackagesTable, customerSubscriptionsTable, invoicesTable } from '../db/schema';
import { generateMonthlyInvoices } from '../handlers/generate_monthly_invoices';
import { eq } from 'drizzle-orm';

describe('generateMonthlyInvoices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate invoices for active subscriptions', async () => {
    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        full_name: 'John Doe',
        full_address: '123 Main St',
        phone_number: '555-0123',
        email_address: 'john@example.com',
        join_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

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

    const packageId = packageResult[0].id;

    // Create active subscription
    const subscriptionResult = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customerId,
        package_id: packageId,
        start_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const subscriptionId = subscriptionResult[0].id;

    // Generate invoices
    const result = await generateMonthlyInvoices();

    expect(result.generated).toEqual(1);

    // Verify invoice was created
    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.subscription_id, subscriptionId))
      .execute();

    expect(invoices).toHaveLength(1);
    
    const invoice = invoices[0];
    expect(invoice.customer_id).toEqual(customerId);
    expect(invoice.subscription_id).toEqual(subscriptionId);
    expect(parseFloat(invoice.total_amount)).toEqual(29.99);
    expect(invoice.status).toEqual('unpaid');
    expect(invoice.service_details).toEqual('Monthly service: Basic Plan - Basic internet package');
    expect(invoice.invoice_number).toMatch(/^INV-\d{6}-\d{6}$/);
  });

  it('should not generate duplicate invoices for same month', async () => {
    // Create test data
    const customerResult = await db.insert(customersTable)
      .values({
        full_name: 'Jane Smith',
        full_address: '456 Oak Ave',
        phone_number: '555-0456',
        email_address: 'jane@example.com',
        join_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const packageResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Premium Plan',
        speed: '500 Mbps',
        monthly_price: '59.99',
        package_description: 'Premium internet package'
      })
      .returning()
      .execute();

    const subscriptionResult = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customerResult[0].id,
        package_id: packageResult[0].id,
        start_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    // First generation
    const firstResult = await generateMonthlyInvoices();
    expect(firstResult.generated).toEqual(1);

    // Second generation (should not create duplicates)
    const secondResult = await generateMonthlyInvoices();
    expect(secondResult.generated).toEqual(0);

    // Verify only one invoice exists
    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.subscription_id, subscriptionResult[0].id))
      .execute();

    expect(invoices).toHaveLength(1);
  });

  it('should skip inactive subscriptions', async () => {
    // Create test data with inactive subscription
    const customerResult = await db.insert(customersTable)
      .values({
        full_name: 'Bob Wilson',
        full_address: '789 Pine St',
        phone_number: '555-0789',
        email_address: 'bob@example.com',
        join_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const packageResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Standard Plan',
        speed: '200 Mbps',
        monthly_price: '39.99',
        package_description: 'Standard internet package'
      })
      .returning()
      .execute();

    await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customerResult[0].id,
        package_id: packageResult[0].id,
        start_date: '2024-01-01',
        status: 'inactive'
      })
      .execute();

    // Generate invoices
    const result = await generateMonthlyInvoices();

    expect(result.generated).toEqual(0);

    // Verify no invoices were created
    const invoices = await db.select()
      .from(invoicesTable)
      .execute();

    expect(invoices).toHaveLength(0);
  });

  it('should generate multiple invoices for multiple active subscriptions', async () => {
    // Create multiple customers and subscriptions
    const customers = await Promise.all([
      db.insert(customersTable)
        .values({
          full_name: 'Customer One',
          full_address: '111 First St',
          phone_number: '555-0001',
          email_address: 'customer1@example.com',
          join_date: '2024-01-01',
          status: 'active'
        })
        .returning()
        .execute(),
      db.insert(customersTable)
        .values({
          full_name: 'Customer Two',
          full_address: '222 Second St',
          phone_number: '555-0002',
          email_address: 'customer2@example.com',
          join_date: '2024-01-01',
          status: 'active'
        })
        .returning()
        .execute()
    ]);

    const packageResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Multi Plan',
        speed: '300 Mbps',
        monthly_price: '49.99',
        package_description: 'Multi-user internet package'
      })
      .returning()
      .execute();

    // Create subscriptions for both customers
    await Promise.all([
      db.insert(customerSubscriptionsTable)
        .values({
          customer_id: customers[0][0].id,
          package_id: packageResult[0].id,
          start_date: '2024-01-01',
          status: 'active'
        })
        .execute(),
      db.insert(customerSubscriptionsTable)
        .values({
          customer_id: customers[1][0].id,
          package_id: packageResult[0].id,
          start_date: '2024-01-01',
          status: 'active'
        })
        .execute()
    ]);

    // Generate invoices
    const result = await generateMonthlyInvoices();

    expect(result.generated).toEqual(2);

    // Verify both invoices were created
    const invoices = await db.select()
      .from(invoicesTable)
      .execute();

    expect(invoices).toHaveLength(2);
    
    // Check that both customers got invoices
    const customerIds = invoices.map(invoice => invoice.customer_id).sort();
    const expectedCustomerIds = [customers[0][0].id, customers[1][0].id].sort();
    expect(customerIds).toEqual(expectedCustomerIds);
  });
});
