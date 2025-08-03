
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicePackagesTable, customerSubscriptionsTable, invoicesTable } from '../db/schema';
import { getAdminStats } from '../handlers/get_admin_stats';
import { type CreateCustomerInput, type CreateServicePackageInput, type CreateCustomerSubscriptionInput, type CreateInvoiceInput } from '../schema';

describe('getAdminStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero stats when no data exists', async () => {
    const result = await getAdminStats();

    expect(result.total_active_customers).toEqual(0);
    expect(result.total_unpaid_invoices).toEqual(0);
    expect(result.estimated_monthly_revenue).toEqual(0);
  });

  it('should count active customers correctly', async () => {
    // Create test customers
    await db.insert(customersTable).values([
      {
        full_name: 'Active Customer 1',
        full_address: '123 Main St',
        phone_number: '555-0001',
        email_address: 'active1@test.com',
        join_date: '2024-01-01',
        status: 'active'
      },
      {
        full_name: 'Active Customer 2',
        full_address: '456 Oak Ave',
        phone_number: '555-0002',
        email_address: 'active2@test.com',
        join_date: '2024-01-02',
        status: 'active'
      },
      {
        full_name: 'Inactive Customer',
        full_address: '789 Pine St',
        phone_number: '555-0003',
        email_address: 'inactive@test.com',
        join_date: '2024-01-03',
        status: 'inactive'
      }
    ]).execute();

    const result = await getAdminStats();

    expect(result.total_active_customers).toEqual(2);
  });

  it('should count unpaid invoices correctly', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable).values({
      full_name: 'Test Customer',
      full_address: '123 Main St',
      phone_number: '555-0001',
      email_address: 'test@test.com',
      join_date: '2024-01-01',
      status: 'active'
    }).returning().execute();

    const servicePackage = await db.insert(servicePackagesTable).values({
      package_name: 'Basic Plan',
      speed: '100 Mbps',
      monthly_price: '29.99',
      package_description: 'Basic internet package'
    }).returning().execute();

    const subscription = await db.insert(customerSubscriptionsTable).values({
      customer_id: customer[0].id,
      package_id: servicePackage[0].id,
      start_date: '2024-01-01',
      status: 'active'
    }).returning().execute();

    // Create invoices with different statuses
    await db.insert(invoicesTable).values([
      {
        invoice_number: 'INV-001',
        customer_id: customer[0].id,
        subscription_id: subscription[0].id,
        issue_date: '2024-01-01',
        due_date: '2024-01-31',
        service_period_start: '2024-01-01',
        service_period_end: '2024-01-31',
        service_details: 'Internet service',
        total_amount: '29.99',
        status: 'unpaid'
      },
      {
        invoice_number: 'INV-002',
        customer_id: customer[0].id,
        subscription_id: subscription[0].id,
        issue_date: '2024-02-01',
        due_date: '2024-02-28',
        service_period_start: '2024-02-01',
        service_period_end: '2024-02-28',
        service_details: 'Internet service',
        total_amount: '29.99',
        status: 'unpaid'
      },
      {
        invoice_number: 'INV-003',
        customer_id: customer[0].id,
        subscription_id: subscription[0].id,
        issue_date: '2023-12-01',
        due_date: '2023-12-31',
        service_period_start: '2023-12-01',
        service_period_end: '2023-12-31',
        service_details: 'Internet service',
        total_amount: '29.99',
        status: 'paid'
      }
    ]).execute();

    const result = await getAdminStats();

    expect(result.total_unpaid_invoices).toEqual(2);
  });

  it('should calculate estimated monthly revenue from active subscriptions', async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable).values({
      full_name: 'Test Customer',
      full_address: '123 Main St',
      phone_number: '555-0001',
      email_address: 'test@test.com',
      join_date: '2024-01-01',
      status: 'active'
    }).returning().execute();

    const servicePackages = await db.insert(servicePackagesTable).values([
      {
        package_name: 'Basic Plan',
        speed: '100 Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package'
      },
      {
        package_name: 'Premium Plan',
        speed: '500 Mbps',
        monthly_price: '59.99',
        package_description: 'Premium internet package'
      }
    ]).returning().execute();

    // Create active and inactive subscriptions
    await db.insert(customerSubscriptionsTable).values([
      {
        customer_id: customer[0].id,
        package_id: servicePackages[0].id,
        start_date: '2024-01-01',
        status: 'active'
      },
      {
        customer_id: customer[0].id,
        package_id: servicePackages[1].id,
        start_date: '2024-01-01',
        status: 'active'
      },
      {
        customer_id: customer[0].id,
        package_id: servicePackages[0].id,
        start_date: '2023-01-01',
        status: 'inactive'
      }
    ]).execute();

    const result = await getAdminStats();

    // Should only count active subscriptions: 29.99 + 59.99 = 89.98
    expect(result.estimated_monthly_revenue).toEqual(89.98);
  });

  it('should return complete stats with all data present', async () => {
    // Create comprehensive test data
    const customers = await db.insert(customersTable).values([
      {
        full_name: 'Active Customer 1',
        full_address: '123 Main St',
        phone_number: '555-0001',
        email_address: 'active1@test.com',
        join_date: '2024-01-01',
        status: 'active'
      },
      {
        full_name: 'Active Customer 2',
        full_address: '456 Oak Ave',
        phone_number: '555-0002',
        email_address: 'active2@test.com',
        join_date: '2024-01-02',
        status: 'active'
      },
      {
        full_name: 'Inactive Customer',
        full_address: '789 Pine St',
        phone_number: '555-0003',
        email_address: 'inactive@test.com',
        join_date: '2024-01-03',
        status: 'inactive'
      }
    ]).returning().execute();

    const servicePackage = await db.insert(servicePackagesTable).values({
      package_name: 'Standard Plan',
      speed: '200 Mbps',
      monthly_price: '39.99',
      package_description: 'Standard internet package'
    }).returning().execute();

    const subscriptions = await db.insert(customerSubscriptionsTable).values([
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
    ]).returning().execute();

    await db.insert(invoicesTable).values([
      {
        invoice_number: 'INV-001',
        customer_id: customers[0].id,
        subscription_id: subscriptions[0].id,
        issue_date: '2024-01-01',
        due_date: '2024-01-31',
        service_period_start: '2024-01-01',
        service_period_end: '2024-01-31',
        service_details: 'Internet service',
        total_amount: '39.99',
        status: 'unpaid'
      },
      {
        invoice_number: 'INV-002',
        customer_id: customers[1].id,
        subscription_id: subscriptions[1].id,
        issue_date: '2024-01-01',
        due_date: '2024-01-31',
        service_period_start: '2024-01-01',
        service_period_end: '2024-01-31',
        service_details: 'Internet service',
        total_amount: '39.99',
        status: 'paid'
      }
    ]).execute();

    const result = await getAdminStats();

    expect(result.total_active_customers).toEqual(2);
    expect(result.total_unpaid_invoices).toEqual(1);
    expect(result.estimated_monthly_revenue).toEqual(79.98); // 2 active subscriptions * 39.99
  });
});
