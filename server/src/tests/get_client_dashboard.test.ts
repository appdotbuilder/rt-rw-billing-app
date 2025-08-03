
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  customersTable, 
  servicePackagesTable, 
  customerSubscriptionsTable,
  invoicesTable,
  paymentsTable
} from '../db/schema';
import { getClientDashboard } from '../handlers/get_client_dashboard';

describe('getClientDashboard', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return complete dashboard data for customer with active subscription', async () => {
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

    // Create service package
    const packageResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Premium Plan',
        speed: '100 Mbps',
        monthly_price: '99.99',
        package_description: 'High-speed internet package'
      })
      .returning()
      .execute();

    const packageId = packageResult[0].id;

    // Create subscription
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

    // Create invoice
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        customer_id: customerId,
        subscription_id: subscriptionId,
        issue_date: '2024-01-01',
        due_date: '2024-01-31',
        service_period_start: '2024-01-01',
        service_period_end: '2024-01-31',
        service_details: 'Monthly internet service',
        total_amount: '99.99',
        status: 'paid'
      })
      .returning()
      .execute();

    const invoiceId = invoiceResult[0].id;

    // Create payment
    await db.insert(paymentsTable)
      .values({
        invoice_id: invoiceId,
        payment_date: '2024-01-15',
        payment_method: 'credit_card',
        amount_paid: '99.99',
        notes: 'Payment via credit card'
      })
      .execute();

    const result = await getClientDashboard(customerId);

    // Verify customer data
    expect(result.customer.id).toEqual(customerId);
    expect(result.customer.full_name).toEqual('John Doe');
    expect(result.customer.email_address).toEqual('john@example.com');
    expect(result.customer.status).toEqual('active');
    expect(result.customer.join_date).toBeInstanceOf(Date);
    expect(result.customer.join_date.getFullYear()).toEqual(2024);

    // Verify active subscription
    expect(result.active_subscription).not.toBeNull();
    expect(result.active_subscription!.id).toEqual(subscriptionId);
    expect(result.active_subscription!.status).toEqual('active');
    expect(result.active_subscription!.customer_id).toEqual(customerId);
    expect(result.active_subscription!.start_date).toBeInstanceOf(Date);
    expect(result.active_subscription!.start_date.getFullYear()).toEqual(2024);

    // Verify service package data
    expect(result.service_package).not.toBeNull();
    expect(result.service_package!.package_name).toEqual('Premium Plan');
    expect(result.service_package!.speed).toEqual('100 Mbps');
    expect(result.service_package!.monthly_price).toEqual(99.99);
    expect(typeof result.service_package!.monthly_price).toBe('number');

    // Verify invoices
    expect(result.invoices).toHaveLength(1);
    expect(result.invoices[0].invoice_number).toEqual('INV-001');
    expect(result.invoices[0].total_amount).toEqual(99.99);
    expect(typeof result.invoices[0].total_amount).toBe('number');
    expect(result.invoices[0].status).toEqual('paid');
    expect(result.invoices[0].issue_date).toBeInstanceOf(Date);
    expect(result.invoices[0].due_date).toBeInstanceOf(Date);

    // Verify payments
    expect(result.payments).toHaveLength(1);
    expect(result.payments[0].payment_method).toEqual('credit_card');
    expect(result.payments[0].amount_paid).toEqual(99.99);
    expect(typeof result.payments[0].amount_paid).toBe('number');
    expect(result.payments[0].notes).toEqual('Payment via credit card');
    expect(result.payments[0].payment_date).toBeInstanceOf(Date);
  });

  it('should return customer data with null subscription when no active subscription exists', async () => {
    // Create test customer only
    const customerResult = await db.insert(customersTable)
      .values({
        full_name: 'Jane Smith',
        full_address: '456 Oak St',
        phone_number: '555-0456',
        email_address: 'jane@example.com',
        join_date: '2024-02-01',
        status: 'inactive'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    const result = await getClientDashboard(customerId);

    // Verify customer data
    expect(result.customer.id).toEqual(customerId);
    expect(result.customer.full_name).toEqual('Jane Smith');
    expect(result.customer.status).toEqual('inactive');
    expect(result.customer.join_date).toBeInstanceOf(Date);

    // Verify no subscription data
    expect(result.active_subscription).toBeNull();
    expect(result.service_package).toBeNull();
    expect(result.invoices).toHaveLength(0);
    expect(result.payments).toHaveLength(0);
  });

  it('should throw error when customer does not exist', async () => {
    await expect(getClientDashboard(999)).rejects.toThrow(/Customer with id 999 not found/i);
  });

  it('should handle multiple subscriptions and prefer active status', async () => {
    // Create test customer
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

    const customerId = customerResult[0].id;

    // Create service packages
    const package1Result = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Plan',
        speed: '50 Mbps',
        monthly_price: '49.99',
        package_description: 'Basic internet package'
      })
      .returning()
      .execute();

    const package2Result = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Premium Plan',
        speed: '100 Mbps',
        monthly_price: '99.99',
        package_description: 'Premium internet package'
      })
      .returning()
      .execute();

    // Create inactive subscription first
    await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customerId,
        package_id: package1Result[0].id,
        start_date: '2024-01-01',
        status: 'inactive'
      })
      .execute();

    // Create active subscription
    const activeSubscriptionResult = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customerId,
        package_id: package2Result[0].id,
        start_date: '2024-02-01',
        status: 'active'
      })
      .returning()
      .execute();

    const result = await getClientDashboard(customerId);

    // Should prefer the active subscription
    expect(result.active_subscription).not.toBeNull();
    expect(result.active_subscription!.id).toEqual(activeSubscriptionResult[0].id);
    expect(result.active_subscription!.status).toEqual('active');
    expect(result.active_subscription!.start_date).toBeInstanceOf(Date);

    // Should get the premium package details
    expect(result.service_package).not.toBeNull();
    expect(result.service_package!.package_name).toEqual('Premium Plan');
    expect(result.service_package!.monthly_price).toEqual(99.99);
  });
});
