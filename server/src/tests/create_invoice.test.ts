
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { invoicesTable, customersTable, customerSubscriptionsTable, servicePackagesTable } from '../db/schema';
import { type CreateInvoiceInput } from '../schema';
import { createInvoice } from '../handlers/create_invoice';
import { eq } from 'drizzle-orm';

describe('createInvoice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let customerId: number;
  let subscriptionId: number;

  beforeEach(async () => {
    // Format date helper
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    // Create test customer
    const customerResult = await db.insert(customersTable)
      .values({
        full_name: 'Test Customer',
        full_address: '123 Test St',
        phone_number: '555-0123',
        email_address: 'test@example.com',
        join_date: formatDate(new Date('2024-01-01')),
        status: 'active'
      })
      .returning()
      .execute();
    customerId = customerResult[0].id;

    // Create test service package
    const packageResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Internet',
        speed: '50 Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package'
      })
      .returning()
      .execute();

    // Create test subscription
    const subscriptionResult = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customerId,
        package_id: packageResult[0].id,
        start_date: formatDate(new Date('2024-01-01')),
        status: 'active'
      })
      .returning()
      .execute();
    subscriptionId = subscriptionResult[0].id;
  });

  const testInput: CreateInvoiceInput = {
    customer_id: 0, // Will be set dynamically
    subscription_id: 0, // Will be set dynamically
    issue_date: new Date('2024-01-15'),
    due_date: new Date('2024-02-15'),
    service_period_start: new Date('2024-01-01'),
    service_period_end: new Date('2024-01-31'),
    service_details: 'Monthly internet service',
    total_amount: 29.99
  };

  it('should create an invoice', async () => {
    const input = {
      ...testInput,
      customer_id: customerId,
      subscription_id: subscriptionId
    };

    const result = await createInvoice(input);

    // Basic field validation
    expect(result.customer_id).toEqual(customerId);
    expect(result.subscription_id).toEqual(subscriptionId);
    expect(result.issue_date).toEqual(input.issue_date);
    expect(result.due_date).toEqual(input.due_date);
    expect(result.service_period_start).toEqual(input.service_period_start);
    expect(result.service_period_end).toEqual(input.service_period_end);
    expect(result.service_details).toEqual('Monthly internet service');
    expect(result.total_amount).toEqual(29.99);
    expect(typeof result.total_amount).toBe('number');
    expect(result.status).toEqual('unpaid');
    expect(result.id).toBeDefined();
    expect(result.invoice_number).toBeDefined();
    expect(result.invoice_number).toMatch(/^INV-\d+-[a-z0-9]+$/);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save invoice to database', async () => {
    const input = {
      ...testInput,
      customer_id: customerId,
      subscription_id: subscriptionId
    };

    const result = await createInvoice(input);

    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, result.id))
      .execute();

    expect(invoices).toHaveLength(1);
    expect(invoices[0].customer_id).toEqual(customerId);
    expect(invoices[0].subscription_id).toEqual(subscriptionId);
    expect(invoices[0].service_details).toEqual('Monthly internet service');
    expect(parseFloat(invoices[0].total_amount)).toEqual(29.99);
    expect(invoices[0].status).toEqual('unpaid');
    expect(invoices[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate unique invoice numbers', async () => {
    const input = {
      ...testInput,
      customer_id: customerId,
      subscription_id: subscriptionId
    };

    const result1 = await createInvoice(input);
    const result2 = await createInvoice(input);

    expect(result1.invoice_number).not.toEqual(result2.invoice_number);
    expect(result1.invoice_number).toMatch(/^INV-\d+-[a-z0-9]+$/);
    expect(result2.invoice_number).toMatch(/^INV-\d+-[a-z0-9]+$/);
  });

  it('should throw error for non-existent customer', async () => {
    const input = {
      ...testInput,
      customer_id: 99999,
      subscription_id: subscriptionId
    };

    await expect(createInvoice(input)).rejects.toThrow(/customer with id 99999 does not exist/i);
  });

  it('should throw error for non-existent subscription', async () => {
    const input = {
      ...testInput,
      customer_id: customerId,
      subscription_id: 99999
    };

    await expect(createInvoice(input)).rejects.toThrow(/subscription with id 99999 does not exist/i);
  });
});
