
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicePackagesTable, customerSubscriptionsTable, invoicesTable } from '../db/schema';
import { type UpdateInvoiceStatusInput } from '../schema';
import { updateInvoiceStatus } from '../handlers/update_invoice_status';
import { eq } from 'drizzle-orm';

describe('updateInvoiceStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update invoice status from unpaid to paid', async () => {
    // Create prerequisite data
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

    const packageResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Plan',
        speed: '100Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package'
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

    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        customer_id: customerResult[0].id,
        subscription_id: subscriptionResult[0].id,
        issue_date: '2024-01-01',
        due_date: '2024-01-31',
        service_period_start: '2024-01-01',
        service_period_end: '2024-01-31',
        service_details: 'Basic Plan - January 2024',
        total_amount: '29.99',
        status: 'unpaid'
      })
      .returning()
      .execute();

    const testInput: UpdateInvoiceStatusInput = {
      id: invoiceResult[0].id,
      status: 'paid'
    };

    const result = await updateInvoiceStatus(testInput);

    // Verify the response
    expect(result.id).toEqual(invoiceResult[0].id);
    expect(result.status).toEqual('paid');
    expect(result.total_amount).toEqual(29.99);
    expect(typeof result.total_amount).toEqual('number');
    expect(result.issue_date).toBeInstanceOf(Date);
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.service_period_start).toBeInstanceOf(Date);
    expect(result.service_period_end).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update invoice status from unpaid to overdue', async () => {
    // Create prerequisite data
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
        speed: '500Mbps',
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

    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-002',
        customer_id: customerResult[0].id,
        subscription_id: subscriptionResult[0].id,
        issue_date: '2024-01-01',
        due_date: '2024-01-31',
        service_period_start: '2024-01-01',
        service_period_end: '2024-01-31',
        service_details: 'Premium Plan - January 2024',
        total_amount: '59.99',
        status: 'unpaid'
      })
      .returning()
      .execute();

    const testInput: UpdateInvoiceStatusInput = {
      id: invoiceResult[0].id,
      status: 'overdue'
    };

    const result = await updateInvoiceStatus(testInput);

    expect(result.status).toEqual('overdue');
    expect(result.total_amount).toEqual(59.99);
    expect(typeof result.total_amount).toEqual('number');
  });

  it('should save updated status to database', async () => {
    // Create prerequisite data
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
        speed: '200Mbps',
        monthly_price: '39.99',
        package_description: 'Standard internet package'
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

    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-003',
        customer_id: customerResult[0].id,
        subscription_id: subscriptionResult[0].id,
        issue_date: '2024-01-01',
        due_date: '2024-01-31',
        service_period_start: '2024-01-01',
        service_period_end: '2024-01-31',
        service_details: 'Standard Plan - January 2024',
        total_amount: '39.99',
        status: 'unpaid'
      })
      .returning()
      .execute();

    const testInput: UpdateInvoiceStatusInput = {
      id: invoiceResult[0].id,
      status: 'paid'
    };

    await updateInvoiceStatus(testInput);

    // Verify the database was updated
    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoiceResult[0].id))
      .execute();

    expect(invoices).toHaveLength(1);
    expect(invoices[0].status).toEqual('paid');
    expect(parseFloat(invoices[0].total_amount)).toEqual(39.99);
    expect(invoices[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when invoice not found', async () => {
    const testInput: UpdateInvoiceStatusInput = {
      id: 999,
      status: 'paid'
    };

    await expect(updateInvoiceStatus(testInput)).rejects.toThrow(/invoice not found/i);
  });
});
