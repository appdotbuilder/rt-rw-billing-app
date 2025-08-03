
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicePackagesTable, customerSubscriptionsTable, invoicesTable } from '../db/schema';
import { type InvoiceFilter } from '../schema';
import { getInvoices } from '../handlers/get_invoices';

describe('getInvoices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no invoices exist', async () => {
    const result = await getInvoices();

    expect(result).toEqual([]);
  });

  it('should return all invoices when no filter is provided', async () => {
    // Create test customer
    const customer = await db.insert(customersTable)
      .values({
        full_name: 'Test Customer',
        full_address: '123 Test St',
        phone_number: '555-0123',
        email_address: 'test@example.com',
        join_date: '2024-01-01', // Use string format for date fields
        status: 'active'
      })
      .returning()
      .execute();

    // Create test service package
    const servicePackage = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Package',
        speed: '100 Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package'
      })
      .returning()
      .execute();

    // Create test subscription
    const subscription = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customer[0].id,
        package_id: servicePackage[0].id,
        start_date: '2024-01-01', // Use string format for date fields
        status: 'active'
      })
      .returning()
      .execute();

    // Create test invoices
    await db.insert(invoicesTable)
      .values([
        {
          invoice_number: 'INV-001',
          customer_id: customer[0].id,
          subscription_id: subscription[0].id,
          issue_date: '2024-01-01', // Use string format for date fields
          due_date: '2024-01-31',
          service_period_start: '2024-01-01',
          service_period_end: '2024-01-31',
          service_details: 'Monthly internet service',
          total_amount: '29.99',
          status: 'unpaid'
        },
        {
          invoice_number: 'INV-002',
          customer_id: customer[0].id,
          subscription_id: subscription[0].id,
          issue_date: '2024-02-01',
          due_date: '2024-02-29',
          service_period_start: '2024-02-01',
          service_period_end: '2024-02-29',
          service_details: 'Monthly internet service',
          total_amount: '29.99',
          status: 'paid'
        }
      ])
      .execute();

    const result = await getInvoices();

    expect(result).toHaveLength(2);
    expect(result[0].invoice_number).toEqual('INV-001');
    expect(result[0].total_amount).toEqual(29.99);
    expect(typeof result[0].total_amount).toBe('number');
    expect(result[0].issue_date).toBeInstanceOf(Date);
    expect(result[0].due_date).toBeInstanceOf(Date);
    expect(result[0].status).toEqual('unpaid');
    expect(result[1].invoice_number).toEqual('INV-002');
    expect(result[1].status).toEqual('paid');
  });

  it('should filter invoices by status', async () => {
    // Create test customer
    const customer = await db.insert(customersTable)
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

    // Create test service package
    const servicePackage = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Package',
        speed: '100 Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package'
      })
      .returning()
      .execute();

    // Create test subscription
    const subscription = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customer[0].id,
        package_id: servicePackage[0].id,
        start_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    // Create invoices with different statuses
    await db.insert(invoicesTable)
      .values([
        {
          invoice_number: 'INV-PAID-001',
          customer_id: customer[0].id,
          subscription_id: subscription[0].id,
          issue_date: '2024-01-01',
          due_date: '2024-01-31',
          service_period_start: '2024-01-01',
          service_period_end: '2024-01-31',
          service_details: 'Monthly internet service',
          total_amount: '29.99',
          status: 'paid'
        },
        {
          invoice_number: 'INV-UNPAID-001',
          customer_id: customer[0].id,
          subscription_id: subscription[0].id,
          issue_date: '2024-02-01',
          due_date: '2024-02-29',
          service_period_start: '2024-02-01',
          service_period_end: '2024-02-29',
          service_details: 'Monthly internet service',
          total_amount: '29.99',
          status: 'unpaid'
        }
      ])
      .execute();

    const filter: InvoiceFilter = { status: 'paid' };
    const result = await getInvoices(filter);

    expect(result).toHaveLength(1);
    expect(result[0].status).toEqual('paid');
    expect(result[0].invoice_number).toEqual('INV-PAID-001');
  });

  it('should filter invoices by customer_id', async () => {
    // Create test customers
    const customers = await db.insert(customersTable)
      .values([
        {
          full_name: 'Customer One',
          full_address: '123 Test St',
          phone_number: '555-0123',
          email_address: 'customer1@example.com',
          join_date: '2024-01-01',
          status: 'active'
        },
        {
          full_name: 'Customer Two',
          full_address: '456 Test Ave',
          phone_number: '555-0456',
          email_address: 'customer2@example.com',
          join_date: '2024-01-01',
          status: 'active'
        }
      ])
      .returning()
      .execute();

    // Create test service package
    const servicePackage = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Package',
        speed: '100 Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package'
      })
      .returning()
      .execute();

    // Create test subscriptions
    const subscriptions = await db.insert(customerSubscriptionsTable)
      .values([
        {
          customer_id: customers[0].id,
          package_id: servicePackage[0].id,
          start_date: '2024-01-01',
          status: 'active'
        },
        {
          customer_id: customers[1].id,
          package_id: servicePackage[0].id,
          start_date: '2024-01-01',
          status: 'active'
        }
      ])
      .returning()
      .execute();

    // Create invoices for different customers
    await db.insert(invoicesTable)
      .values([
        {
          invoice_number: 'INV-CUST1-001',
          customer_id: customers[0].id,
          subscription_id: subscriptions[0].id,
          issue_date: '2024-01-01',
          due_date: '2024-01-31',
          service_period_start: '2024-01-01',
          service_period_end: '2024-01-31',
          service_details: 'Monthly internet service',
          total_amount: '29.99',
          status: 'unpaid'
        },
        {
          invoice_number: 'INV-CUST2-001',
          customer_id: customers[1].id,
          subscription_id: subscriptions[1].id,
          issue_date: '2024-01-01',
          due_date: '2024-01-31',
          service_period_start: '2024-01-01',
          service_period_end: '2024-01-31',
          service_details: 'Monthly internet service',
          total_amount: '29.99',
          status: 'unpaid'
        }
      ])
      .execute();

    const filter: InvoiceFilter = { customer_id: customers[0].id };
    const result = await getInvoices(filter);

    expect(result).toHaveLength(1);
    expect(result[0].customer_id).toEqual(customers[0].id);
    expect(result[0].invoice_number).toEqual('INV-CUST1-001');
  });

  it('should filter invoices by date range', async () => {
    // Create test customer
    const customer = await db.insert(customersTable)
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

    // Create test service package
    const servicePackage = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Package',
        speed: '100 Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package'
      })
      .returning()
      .execute();

    // Create test subscription
    const subscription = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customer[0].id,
        package_id: servicePackage[0].id,
        start_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    // Create invoices with different issue dates
    await db.insert(invoicesTable)
      .values([
        {
          invoice_number: 'INV-JAN-001',
          customer_id: customer[0].id,
          subscription_id: subscription[0].id,
          issue_date: '2024-01-15',
          due_date: '2024-02-15',
          service_period_start: '2024-01-01',
          service_period_end: '2024-01-31',
          service_details: 'Monthly internet service',
          total_amount: '29.99',
          status: 'unpaid'
        },
        {
          invoice_number: 'INV-MAR-001',
          customer_id: customer[0].id,
          subscription_id: subscription[0].id,
          issue_date: '2024-03-15',
          due_date: '2024-04-15',
          service_period_start: '2024-03-01',
          service_period_end: '2024-03-31',
          service_details: 'Monthly internet service',
          total_amount: '29.99',
          status: 'unpaid'
        }
      ])
      .execute();

    const filter: InvoiceFilter = {
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-02-28')
    };
    const result = await getInvoices(filter);

    expect(result).toHaveLength(1);
    expect(result[0].invoice_number).toEqual('INV-JAN-001');
    expect(result[0].issue_date).toBeInstanceOf(Date);
  });

  it('should apply multiple filters simultaneously', async () => {
    // Create test customer
    const customer = await db.insert(customersTable)
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

    // Create test service package
    const servicePackage = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Package',
        speed: '100 Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package'
      })
      .returning()
      .execute();

    // Create test subscription
    const subscription = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customer[0].id,
        package_id: servicePackage[0].id,
        start_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    // Create invoices with different combinations
    await db.insert(invoicesTable)
      .values([
        {
          invoice_number: 'INV-MATCH-001',
          customer_id: customer[0].id,
          subscription_id: subscription[0].id,
          issue_date: '2024-01-15',
          due_date: '2024-02-15',
          service_period_start: '2024-01-01',
          service_period_end: '2024-01-31',
          service_details: 'Monthly internet service',
          total_amount: '29.99',
          status: 'paid'
        },
        {
          invoice_number: 'INV-NOMATCH-001',
          customer_id: customer[0].id,
          subscription_id: subscription[0].id,
          issue_date: '2024-01-15',
          due_date: '2024-02-15',
          service_period_start: '2024-01-01',
          service_period_end: '2024-01-31',
          service_details: 'Monthly internet service',
          total_amount: '29.99',
          status: 'unpaid'
        }
      ])
      .execute();

    const filter: InvoiceFilter = {
      customer_id: customer[0].id,
      status: 'paid',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31')
    };
    const result = await getInvoices(filter);

    expect(result).toHaveLength(1);
    expect(result[0].invoice_number).toEqual('INV-MATCH-001');
    expect(result[0].status).toEqual('paid');
    expect(result[0].customer_id).toEqual(customer[0].id);
  });
});
