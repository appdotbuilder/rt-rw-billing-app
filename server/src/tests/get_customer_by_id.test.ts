
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { getCustomerById } from '../handlers/get_customer_by_id';

describe('getCustomerById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return customer when found', async () => {
    // Create test customer - convert Date to string for database insertion
    const insertResult = await db.insert(customersTable)
      .values({
        full_name: 'John Doe',
        full_address: '123 Main St, City, State 12345',
        phone_number: '+1-555-0123',
        email_address: 'john.doe@example.com',
        join_date: '2024-01-15', // Use string format for date column
        status: 'active'
      })
      .returning()
      .execute();

    const customerId = insertResult[0].id;

    // Test the handler
    const result = await getCustomerById(customerId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(customerId);
    expect(result!.full_name).toEqual('John Doe');
    expect(result!.full_address).toEqual('123 Main St, City, State 12345');
    expect(result!.phone_number).toEqual('+1-555-0123');
    expect(result!.email_address).toEqual('john.doe@example.com');
    expect(result!.join_date).toBeInstanceOf(Date);
    expect(result!.join_date.toISOString().split('T')[0]).toEqual('2024-01-15');
    expect(result!.status).toEqual('active');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when customer not found', async () => {
    const result = await getCustomerById(999);

    expect(result).toBeNull();
  });

  it('should return correct customer when multiple exist', async () => {
    // Create multiple customers
    const customer1 = await db.insert(customersTable)
      .values({
        full_name: 'John Doe',
        full_address: '123 Main St, City, State 12345',
        phone_number: '+1-555-0123',
        email_address: 'john.doe@example.com',
        join_date: '2024-01-15',
        status: 'active'
      })
      .returning()
      .execute();

    const customer2 = await db.insert(customersTable)
      .values({
        full_name: 'Jane Smith',
        full_address: '456 Oak Ave, Town, State 67890',
        phone_number: '+1-555-0456',
        email_address: 'jane.smith@example.com',
        join_date: '2024-02-20',
        status: 'active'
      })
      .returning()
      .execute();

    // Test fetching specific customer
    const result = await getCustomerById(customer2[0].id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(customer2[0].id);
    expect(result!.full_name).toEqual('Jane Smith');
    expect(result!.email_address).toEqual('jane.smith@example.com');
    expect(result!.join_date).toBeInstanceOf(Date);
    expect(result!.join_date.toISOString().split('T')[0]).toEqual('2024-02-20');
  });
});
