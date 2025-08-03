
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput } from '../schema';
import { createCustomer } from '../handlers/create_customer';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateCustomerInput = {
  full_name: 'John Doe',
  full_address: '123 Main St, City, State 12345',
  phone_number: '+1-555-123-4567',
  email_address: 'john.doe@example.com',
  join_date: new Date('2024-01-15'),
  status: 'active'
};

describe('createCustomer', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a customer with all fields', async () => {
    const result = await createCustomer(testInput);

    // Basic field validation
    expect(result.full_name).toEqual('John Doe');
    expect(result.full_address).toEqual(testInput.full_address);
    expect(result.phone_number).toEqual(testInput.phone_number);
    expect(result.email_address).toEqual(testInput.email_address);
    expect(result.join_date).toEqual(testInput.join_date);
    expect(result.status).toEqual('active');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a customer with default status when not specified', async () => {
    const inputWithoutStatus: CreateCustomerInput = {
      full_name: 'Jane Smith',
      full_address: '456 Oak Ave, Town, State 67890',
      phone_number: '+1-555-987-6543',
      email_address: 'jane.smith@example.com',
      join_date: new Date('2024-02-01'),
      status: 'active' // Include default status
    };

    const result = await createCustomer(inputWithoutStatus);

    expect(result.full_name).toEqual('Jane Smith');
    expect(result.status).toEqual('active');
    expect(result.id).toBeDefined();
  });

  it('should save customer to database', async () => {
    const result = await createCustomer(testInput);

    // Query using proper drizzle syntax
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers).toHaveLength(1);
    expect(customers[0].full_name).toEqual('John Doe');
    expect(customers[0].full_address).toEqual(testInput.full_address);
    expect(customers[0].phone_number).toEqual(testInput.phone_number);
    expect(customers[0].email_address).toEqual(testInput.email_address);
    expect(new Date(customers[0].join_date)).toEqual(testInput.join_date);
    expect(customers[0].status).toEqual('active');
    expect(customers[0].created_at).toBeInstanceOf(Date);
    expect(customers[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create customer with inactive status', async () => {
    const inactiveCustomerInput: CreateCustomerInput = {
      ...testInput,
      full_name: 'Inactive Customer',
      email_address: 'inactive@example.com',
      status: 'inactive'
    };

    const result = await createCustomer(inactiveCustomerInput);

    expect(result.full_name).toEqual('Inactive Customer');
    expect(result.status).toEqual('inactive');
    expect(result.id).toBeDefined();

    // Verify in database
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(customers[0].status).toEqual('inactive');
  });

  it('should handle date fields correctly', async () => {
    const specificDate = new Date('2024-03-15');
    const dateTestInput: CreateCustomerInput = {
      ...testInput,
      full_name: 'Date Test Customer',
      email_address: 'datetest@example.com',
      join_date: specificDate
    };

    const result = await createCustomer(dateTestInput);

    expect(result.join_date).toEqual(specificDate);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify dates are stored correctly in database
    const customers = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, result.id))
      .execute();

    expect(new Date(customers[0].join_date)).toEqual(specificDate);
    expect(customers[0].created_at).toBeInstanceOf(Date);
    expect(customers[0].updated_at).toBeInstanceOf(Date);
  });
});
