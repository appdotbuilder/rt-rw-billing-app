
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable, servicePackagesTable, customerSubscriptionsTable, invoicesTable, paymentsTable } from '../db/schema';
import { type CreatePaymentInput } from '../schema';
import { createPayment } from '../handlers/create_payment';
import { eq } from 'drizzle-orm';

describe('createPayment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let customerId: number;
  let packageId: number;
  let subscriptionId: number;
  let invoiceId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const customer = await db.insert(customersTable)
      .values({
        full_name: 'Test Customer',
        full_address: '123 Test St',
        phone_number: '555-0123',
        email_address: 'test@example.com',
        join_date: '2024-01-01', // Use string for date column
        status: 'active'
      })
      .returning()
      .execute();
    customerId = customer[0].id;

    const servicePackage = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Basic Plan',
        speed: '100 Mbps',
        monthly_price: '29.99',
        package_description: 'Basic internet package'
      })
      .returning()
      .execute();
    packageId = servicePackage[0].id;

    const subscription = await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customerId,
        package_id: packageId,
        start_date: '2024-01-01', // Use string for date column
        status: 'active'
      })
      .returning()
      .execute();
    subscriptionId = subscription[0].id;

    const invoice = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        customer_id: customerId,
        subscription_id: subscriptionId,
        issue_date: '2024-01-01', // Use string for date column
        due_date: '2024-01-31', // Use string for date column
        service_period_start: '2024-01-01', // Use string for date column
        service_period_end: '2024-01-31', // Use string for date column
        service_details: 'Monthly service',
        total_amount: '29.99',
        status: 'unpaid'
      })
      .returning()
      .execute();
    invoiceId = invoice[0].id;
  });

  const testInput: CreatePaymentInput = {
    invoice_id: 0, // Will be set in each test
    payment_date: new Date('2024-01-15'),
    payment_method: 'cash',
    amount_paid: 29.99,
    notes: 'Payment received'
  };

  it('should create a payment', async () => {
    testInput.invoice_id = invoiceId;
    const result = await createPayment(testInput);

    // Basic field validation
    expect(result.invoice_id).toEqual(invoiceId);
    expect(result.payment_date).toEqual(testInput.payment_date);
    expect(result.payment_method).toEqual('cash');
    expect(result.amount_paid).toEqual(29.99);
    expect(typeof result.amount_paid).toBe('number');
    expect(result.notes).toEqual('Payment received');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save payment to database', async () => {
    testInput.invoice_id = invoiceId;
    const result = await createPayment(testInput);

    // Query the payment from database
    const payments = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, result.id))
      .execute();

    expect(payments).toHaveLength(1);
    expect(payments[0].invoice_id).toEqual(invoiceId);
    expect(new Date(payments[0].payment_date)).toEqual(testInput.payment_date);
    expect(payments[0].payment_method).toEqual('cash');
    expect(parseFloat(payments[0].amount_paid)).toEqual(29.99);
    expect(payments[0].notes).toEqual('Payment received');
    expect(payments[0].created_at).toBeInstanceOf(Date);
  });

  it('should update invoice status to paid', async () => {
    testInput.invoice_id = invoiceId;
    await createPayment(testInput);

    // Check that invoice status was updated
    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoiceId))
      .execute();

    expect(invoices).toHaveLength(1);
    expect(invoices[0].status).toEqual('paid');
    expect(invoices[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle payment with null notes', async () => {
    testInput.invoice_id = invoiceId;
    testInput.notes = null;
    
    const result = await createPayment(testInput);

    expect(result.notes).toBeNull();

    // Verify in database
    const payments = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, result.id))
      .execute();

    expect(payments[0].notes).toBeNull();
  });

  it('should throw error for non-existent invoice', async () => {
    testInput.invoice_id = 99999; // Non-existent invoice ID
    
    await expect(createPayment(testInput)).rejects.toThrow(/invoice not found/i);
  });

  it('should throw error for already paid invoice', async () => {
    // First, mark the invoice as paid
    await db.update(invoicesTable)
      .set({ status: 'paid' })
      .where(eq(invoicesTable.id, invoiceId))
      .execute();

    testInput.invoice_id = invoiceId;
    
    await expect(createPayment(testInput)).rejects.toThrow(/already paid/i);
  });

  it('should handle different payment methods', async () => {
    testInput.invoice_id = invoiceId;
    testInput.payment_method = 'bank_transfer';
    
    const result = await createPayment(testInput);

    expect(result.payment_method).toEqual('bank_transfer');

    // Verify in database
    const payments = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, result.id))
      .execute();

    expect(payments[0].payment_method).toEqual('bank_transfer');
  });
});
