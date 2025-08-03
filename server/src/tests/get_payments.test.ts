
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
import { getPayments } from '../handlers/get_payments';

// Test data setup
const testCustomer1 = {
  full_name: 'John Doe',
  full_address: '123 Main St',
  phone_number: '555-0123',
  email_address: 'john@example.com',
  join_date: '2024-01-01',
  status: 'active' as const
};

const testCustomer2 = {
  full_name: 'Jane Smith',
  full_address: '456 Oak Ave',
  phone_number: '555-0456',
  email_address: 'jane@example.com',
  join_date: '2024-01-15',
  status: 'active' as const
};

const testPackage = {
  package_name: 'Basic Internet',
  speed: '50 Mbps',
  monthly_price: '29.99',
  package_description: 'Basic internet package'
};

describe('getPayments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no payments exist', async () => {
    const result = await getPayments();
    expect(result).toEqual([]);
  });

  it('should return all payments when no customerId provided', async () => {
    // Create prerequisite data
    const customers = await db.insert(customersTable)
      .values([testCustomer1, testCustomer2])
      .returning()
      .execute();

    const packages = await db.insert(servicePackagesTable)
      .values(testPackage)
      .returning()
      .execute();

    const subscriptions = await db.insert(customerSubscriptionsTable)
      .values([
        {
          customer_id: customers[0].id,
          package_id: packages[0].id,
          start_date: '2024-01-01',
          status: 'active' as const
        },
        {
          customer_id: customers[1].id,
          package_id: packages[0].id,
          start_date: '2024-01-15',
          status: 'active' as const
        }
      ])
      .returning()
      .execute();

    const invoices = await db.insert(invoicesTable)
      .values([
        {
          invoice_number: 'INV-001',
          customer_id: customers[0].id,
          subscription_id: subscriptions[0].id,
          issue_date: '2024-01-01',
          due_date: '2024-01-31',
          service_period_start: '2024-01-01',
          service_period_end: '2024-01-31',
          service_details: 'Monthly service',
          total_amount: '29.99',
          status: 'paid' as const
        },
        {
          invoice_number: 'INV-002',
          customer_id: customers[1].id,
          subscription_id: subscriptions[1].id,
          issue_date: '2024-01-15',
          due_date: '2024-02-15',
          service_period_start: '2024-01-15',
          service_period_end: '2024-02-15',
          service_details: 'Monthly service',
          total_amount: '29.99',
          status: 'paid' as const
        }
      ])
      .returning()
      .execute();

    // Create payments for both invoices
    await db.insert(paymentsTable)
      .values([
        {
          invoice_id: invoices[0].id,
          payment_date: '2024-01-01',
          payment_method: 'cash' as const,
          amount_paid: '29.99',
          notes: 'Cash payment'
        },
        {
          invoice_id: invoices[1].id,
          payment_date: '2024-01-15',
          payment_method: 'bank_transfer' as const,
          amount_paid: '29.99',
          notes: 'Bank transfer'
        }
      ])
      .execute();

    const result = await getPayments();

    expect(result).toHaveLength(2);
    expect(result[0].amount_paid).toEqual(29.99);
    expect(typeof result[0].amount_paid).toBe('number');
    expect(result[0].payment_method).toBe('cash');
    expect(result[0].notes).toBe('Cash payment');
    expect(result[0].payment_date).toBeInstanceOf(Date);
    expect(result[1].payment_method).toBe('bank_transfer');
  });

  it('should return payments for specific customer only', async () => {
    // Create prerequisite data
    const customers = await db.insert(customersTable)
      .values([testCustomer1, testCustomer2])
      .returning()
      .execute();

    const packages = await db.insert(servicePackagesTable)
      .values(testPackage)
      .returning()
      .execute();

    const subscriptions = await db.insert(customerSubscriptionsTable)
      .values([
        {
          customer_id: customers[0].id,
          package_id: packages[0].id,
          start_date: '2024-01-01',
          status: 'active' as const
        },
        {
          customer_id: customers[1].id,
          package_id: packages[0].id,
          start_date: '2024-01-15',
          status: 'active' as const
        }
      ])
      .returning()
      .execute();

    const invoices = await db.insert(invoicesTable)
      .values([
        {
          invoice_number: 'INV-001',
          customer_id: customers[0].id,
          subscription_id: subscriptions[0].id,
          issue_date: '2024-01-01',
          due_date: '2024-01-31',
          service_period_start: '2024-01-01',
          service_period_end: '2024-01-31',
          service_details: 'Monthly service',
          total_amount: '29.99',
          status: 'paid' as const
        },
        {
          invoice_number: 'INV-002',
          customer_id: customers[1].id,
          subscription_id: subscriptions[1].id,
          issue_date: '2024-01-15',
          due_date: '2024-02-15',
          service_period_start: '2024-01-15',
          service_period_end: '2024-02-15',
          service_details: 'Monthly service',
          total_amount: '29.99',
          status: 'paid' as const
        }
      ])
      .returning()
      .execute();

    // Create payments for both invoices
    await db.insert(paymentsTable)
      .values([
        {
          invoice_id: invoices[0].id,
          payment_date: '2024-01-01',
          payment_method: 'cash' as const,
          amount_paid: '29.99',
          notes: 'Payment for customer 1'
        },
        {
          invoice_id: invoices[1].id,
          payment_date: '2024-01-15',
          payment_method: 'bank_transfer' as const,
          amount_paid: '29.99',
          notes: 'Payment for customer 2'
        }
      ])
      .execute();

    // Get payments for first customer only
    const result = await getPayments(customers[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].amount_paid).toEqual(29.99);
    expect(typeof result[0].amount_paid).toBe('number');
    expect(result[0].payment_method).toBe('cash');
    expect(result[0].notes).toBe('Payment for customer 1');
    expect(result[0].payment_date).toBeInstanceOf(Date);
  });

  it('should return empty array for customer with no payments', async () => {
    // Create customer but no payments
    const customers = await db.insert(customersTable)
      .values(testCustomer1)
      .returning()
      .execute();

    const result = await getPayments(customers[0].id);
    expect(result).toEqual([]);
  });

  it('should handle multiple payments for same customer', async () => {
    // Create prerequisite data
    const customers = await db.insert(customersTable)
      .values(testCustomer1)
      .returning()
      .execute();

    const packages = await db.insert(servicePackagesTable)
      .values(testPackage)
      .returning()
      .execute();

    const subscriptions = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customers[0].id,
        package_id: packages[0].id,
        start_date: '2024-01-01',
        status: 'active' as const
      })
      .returning()
      .execute();

    const invoices = await db.insert(invoicesTable)
      .values([
        {
          invoice_number: 'INV-001',
          customer_id: customers[0].id,
          subscription_id: subscriptions[0].id,
          issue_date: '2024-01-01',
          due_date: '2024-01-31',
          service_period_start: '2024-01-01',
          service_period_end: '2024-01-31',
          service_details: 'January service',
          total_amount: '29.99',
          status: 'paid' as const
        },
        {
          invoice_number: 'INV-002',
          customer_id: customers[0].id,
          subscription_id: subscriptions[0].id,
          issue_date: '2024-02-01',
          due_date: '2024-02-28',
          service_period_start: '2024-02-01',
          service_period_end: '2024-02-28',
          service_details: 'February service',
          total_amount: '29.99',
          status: 'paid' as const
        }
      ])
      .returning()
      .execute();

    // Create multiple payments for the same customer
    await db.insert(paymentsTable)
      .values([
        {
          invoice_id: invoices[0].id,
          payment_date: '2024-01-01',
          payment_method: 'cash' as const,
          amount_paid: '29.99',
          notes: 'January payment'
        },
        {
          invoice_id: invoices[1].id,
          payment_date: '2024-02-01',
          payment_method: 'credit_card' as const,
          amount_paid: '29.99',
          notes: 'February payment'
        }
      ])
      .execute();

    const result = await getPayments(customers[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].amount_paid).toEqual(29.99);
    expect(result[1].amount_paid).toEqual(29.99);
    expect(result[0].notes).toBe('January payment');
    expect(result[1].notes).toBe('February payment');
  });
});
