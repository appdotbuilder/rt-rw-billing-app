
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicePackagesTable, customerSubscriptionsTable, invoicesTable } from '../db/schema';
import { getInvoiceById } from '../handlers/get_invoice_by_id';

describe('getInvoiceById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an invoice by ID', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
      .values({
        full_name: 'John Doe',
        full_address: '123 Main St',
        phone_number: '555-0123',
        email_address: 'john@example.com',
        join_date: '2024-01-01', // Use string format for date column
        status: 'active'
      })
      .returning()
      .execute();

    const servicePackage = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Plan',
        speed: '100 Mbps',
        monthly_price: '49.99',
        package_description: 'Basic internet package'
      })
      .returning()
      .execute();

    const subscription = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customer[0].id,
        package_id: servicePackage[0].id,
        start_date: '2024-01-01', // Use string format for date column
        status: 'active'
      })
      .returning()
      .execute();

    const invoice = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        customer_id: customer[0].id,
        subscription_id: subscription[0].id,
        issue_date: '2024-01-01', // Use string format for date column
        due_date: '2024-01-31', // Use string format for date column
        service_period_start: '2024-01-01', // Use string format for date column
        service_period_end: '2024-01-31', // Use string format for date column
        service_details: 'Monthly internet service',
        total_amount: '49.99',
        status: 'unpaid'
      })
      .returning()
      .execute();

    const result = await getInvoiceById(invoice[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(invoice[0].id);
    expect(result!.invoice_number).toEqual('INV-001');
    expect(result!.customer_id).toEqual(customer[0].id);
    expect(result!.subscription_id).toEqual(subscription[0].id);
    expect(result!.total_amount).toEqual(49.99);
    expect(typeof result!.total_amount).toEqual('number');
    expect(result!.status).toEqual('unpaid');
    expect(result!.issue_date).toBeInstanceOf(Date);
    expect(result!.due_date).toBeInstanceOf(Date);
    expect(result!.service_period_start).toBeInstanceOf(Date);
    expect(result!.service_period_end).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent invoice ID', async () => {
    const result = await getInvoiceById(999);

    expect(result).toBeNull();
  });

  it('should handle numeric and date conversion correctly', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
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

    const servicePackage = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Premium Plan',
        speed: '500 Mbps',
        monthly_price: '99.95',
        package_description: 'Premium internet package'
      })
      .returning()
      .execute();

    const subscription = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customer[0].id,
        package_id: servicePackage[0].id,
        start_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const invoice = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-002',
        customer_id: customer[0].id,
        subscription_id: subscription[0].id,
        issue_date: '2024-02-15',
        due_date: '2024-03-15',
        service_period_start: '2024-02-01',
        service_period_end: '2024-02-29',
        service_details: 'Monthly premium service',
        total_amount: '99.95',
        status: 'paid'
      })
      .returning()
      .execute();

    const result = await getInvoiceById(invoice[0].id);

    expect(result).not.toBeNull();
    expect(result!.total_amount).toEqual(99.95);
    expect(typeof result!.total_amount).toEqual('number');
    expect(result!.issue_date).toBeInstanceOf(Date);
    expect(result!.issue_date.getFullYear()).toEqual(2024);
    expect(result!.issue_date.getMonth()).toEqual(1); // February (0-indexed)
    expect(result!.issue_date.getDate()).toEqual(15);
  });
});
