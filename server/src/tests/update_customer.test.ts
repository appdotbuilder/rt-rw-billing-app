
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type UpdateCustomerInput, type CreateCustomerInput } from '../schema';
import { updateCustomer } from '../handlers/update_customer';
import { eq } from 'drizzle-orm';

// Helper function to create a test customer
const createTestCustomer = async (customerData: CreateCustomerInput) => {
  const result = await db.insert(customersTable)
    .values({
      full_name: customerData.full_name,
      full_address: customerData.full_address,
      phone_number: customerData.phone_number,
      email_address: customerData.email_address,
      join_date: customerData.join_date.toISOString().split('T')[0], // Convert Date to string
      status: customerData.status
    })
    .returning()
    .execute();
  
  // Convert date string back to Date object
  return {
    ...result[0],
    join_date: new Date(result[0].join_date)
  };
};

const testCustomerInput: CreateCustomerInput = {
  full_name: 'John Doe',
  full_address: '123 Main St, Anytown, USA',
  phone_number: '+1234567890',
  email_address: 'john.doe@example.com',
  join_date: new Date('2024-01-15'),
  status: 'active'
};

describe('updateCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update customer name only', async () => {
    // Create test customer first
    const existingCustomer = await createTestCustomer(testCustomerInput);

    const updateInput: UpdateCustomerInput = {
      id: existingCustomer.id,
      full_name: 'Jane Smith'
    };

    const result = await updateCustomer(updateInput);

    // Verify updated fields
    expect(result.full_name).toEqual('Jane Smith');
    // Verify unchanged fields
    expect(result.full_address).toEqual(testCustomerInput.full_address);
    expect(result.phone_number).toEqual(testCustomerInput.phone_number);
    expect(result.email_address).toEqual(testCustomerInput.email_address);
    expect(result.status).toEqual(testCustomerInput.status);
    expect(result.join_date).toEqual(testCustomerInput.join_date);
    expect(result.id).toEqual(existingCustomer.id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > existingCustomer.updated_at).toBe(true);
  });

  it('should update multiple fields', async () => {
    // Create test customer first
    const existingCustomer = await createTestCustomer(testCustomerInput);

    const updateInput: UpdateCustomerInput = {
      id: existingCustomer.id,
      full_name: 'Jane Smith',
      email_address: 'jane.smith@example.com',
      status: 'inactive',
      phone_number: '+9876543210'
    };

    const result = await updateCustomer(updateInput);

    // Verify all updated fields
    expect(result.full_name).toEqual('Jane Smith');
    expect(result.email_address).toEqual('jane.smith@example.com');
    expect(result.status).toEqual('inactive');
    expect(result.phone_number).toEqual('+9876543210');
    // Verify unchanged fields
    expect(result.full_address).toEqual(testCustomerInput.full_address);
    expect(result.join_date).toEqual(testCustomerInput.join_date);
    expect(result.id).toEqual(existingCustomer.id);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update customer in database', async () => {
    // Create test customer first
    const existingCustomer = await createTestCustomer(testCustomerInput);

    const updateInput: UpdateCustomerInput = {
      id: existingCustomer.id,
      full_name: 'Updated Name',
      status: 'inactive'
    };

    await updateCustomer(updateInput);

    // Query database to verify update
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, existingCustomer.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].full_name).toEqual('Updated Name');
    expect(customers[0].status).toEqual('inactive');
    expect(customers[0].full_address).toEqual(testCustomerInput.full_address);
    expect(customers[0].updated_at).toBeInstanceOf(Date);
    expect(customers[0].updated_at > existingCustomer.updated_at).toBe(true);
    // Verify join_date is stored correctly as string in DB
    expect(customers[0].join_date).toEqual('2024-01-15');
  });

  it('should update join_date correctly', async () => {
    // Create test customer first
    const existingCustomer = await createTestCustomer(testCustomerInput);

    const newJoinDate = new Date('2024-03-01');
    const updateInput: UpdateCustomerInput = {
      id: existingCustomer.id,
      join_date: newJoinDate
    };

    const result = await updateCustomer(updateInput);

    expect(result.join_date).toEqual(newJoinDate);
    expect(result.full_name).toEqual(testCustomerInput.full_name);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify in database
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, existingCustomer.id))
      .execute();

    expect(customers[0].join_date).toEqual('2024-03-01');
  });

  it('should throw error when customer does not exist', async () => {
    const updateInput: UpdateCustomerInput = {
      id: 99999, // Non-existent ID
      full_name: 'Updated Name'
    };

    await expect(updateCustomer(updateInput)).rejects.toThrow(/customer not found/i);
  });

  it('should handle empty update gracefully', async () => {
    // Create test customer first
    const existingCustomer = await createTestCustomer(testCustomerInput);

    const updateInput: UpdateCustomerInput = {
      id: existingCustomer.id
      // No fields to update
    };

    const result = await updateCustomer(updateInput);

    // All original fields should remain the same except updated_at
    expect(result.full_name).toEqual(testCustomerInput.full_name);
    expect(result.full_address).toEqual(testCustomerInput.full_address);
    expect(result.phone_number).toEqual(testCustomerInput.phone_number);
    expect(result.email_address).toEqual(testCustomerInput.email_address);
    expect(result.status).toEqual(testCustomerInput.status);
    expect(result.join_date).toEqual(testCustomerInput.join_date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > existingCustomer.updated_at).toBe(true);
  });
});
