
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CustomerFilter } from '../schema';
import { getCustomers } from '../handlers/get_customers';

const testCustomer1 = {
  full_name: 'John Doe',
  full_address: '123 Main St, City',
  phone_number: '+1234567890',
  email_address: 'john@example.com',
  join_date: '2024-01-15', // Use string format for database insertion
  status: 'active' as const
};

const testCustomer2 = {
  full_name: 'Jane Smith',
  full_address: '456 Oak Ave, Town',
  phone_number: '+9876543210',
  email_address: 'jane@example.com',
  join_date: '2024-02-20', // Use string format for database insertion
  status: 'inactive' as const
};

const testCustomer3 = {
  full_name: 'Bob Johnson',
  full_address: '789 Pine Rd, Village',
  phone_number: '+5555555555',
  email_address: 'bob@test.com',
  join_date: '2024-03-10', // Use string format for database insertion
  status: 'active' as const
};

describe('getCustomers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all customers when no filter is provided', async () => {
    // Create test customers
    await db.insert(customersTable).values([
      testCustomer1,
      testCustomer2,
      testCustomer3
    ]).execute();

    const result = await getCustomers();

    expect(result).toHaveLength(3);
    // Check that all customers are present (order may vary due to close timestamps)
    const names = result.map(c => c.full_name);
    expect(names).toContain('John Doe');
    expect(names).toContain('Jane Smith');
    expect(names).toContain('Bob Johnson');
  });

  it('should filter customers by status', async () => {
    // Create test customers
    await db.insert(customersTable).values([
      testCustomer1,
      testCustomer2,
      testCustomer3
    ]).execute();

    const filter: CustomerFilter = { status: 'active' };
    const result = await getCustomers(filter);

    expect(result).toHaveLength(2);
    expect(result.every(customer => customer.status === 'active')).toBe(true);
    const names = result.map(c => c.full_name);
    expect(names).toContain('John Doe');
    expect(names).toContain('Bob Johnson');
  });

  it('should filter customers by search term in name', async () => {
    // Create test customers
    await db.insert(customersTable).values([
      testCustomer1,
      testCustomer2,
      testCustomer3
    ]).execute();

    const filter: CustomerFilter = { search: 'john' };
    const result = await getCustomers(filter);

    expect(result).toHaveLength(2);
    const names = result.map(c => c.full_name);
    expect(names).toContain('John Doe');
    expect(names).toContain('Bob Johnson');
  });

  it('should filter customers by search term in email', async () => {
    // Create test customers
    await db.insert(customersTable).values([
      testCustomer1,
      testCustomer2,
      testCustomer3
    ]).execute();

    const filter: CustomerFilter = { search: 'test' };
    const result = await getCustomers(filter);

    expect(result).toHaveLength(1);
    expect(result[0].full_name).toBe('Bob Johnson');
    expect(result[0].email_address).toBe('bob@test.com');
  });

  it('should filter customers by search term in phone number', async () => {
    // Create test customers
    await db.insert(customersTable).values([
      testCustomer1,
      testCustomer2,
      testCustomer3
    ]).execute();

    const filter: CustomerFilter = { search: '555' };
    const result = await getCustomers(filter);

    expect(result).toHaveLength(1);
    expect(result[0].full_name).toBe('Bob Johnson');
    expect(result[0].phone_number).toBe('+5555555555');
  });

  it('should combine status and search filters', async () => {
    // Create test customers
    await db.insert(customersTable).values([
      testCustomer1,
      testCustomer2,
      testCustomer3
    ]).execute();

    const filter: CustomerFilter = { 
      status: 'active',
      search: 'john'
    };
    const result = await getCustomers(filter);

    expect(result).toHaveLength(2);
    expect(result.every(customer => customer.status === 'active')).toBe(true);
    const names = result.map(c => c.full_name);
    expect(names).toContain('John Doe');
    expect(names).toContain('Bob Johnson');
  });

  it('should return empty array when no customers match filter', async () => {
    // Create test customers
    await db.insert(customersTable).values([
      testCustomer1,
      testCustomer2
    ]).execute();

    const filter: CustomerFilter = { search: 'nonexistent' };
    const result = await getCustomers(filter);

    expect(result).toHaveLength(0);
  });

  it('should return customers with all required fields', async () => {
    // Create test customer
    await db.insert(customersTable).values(testCustomer1).execute();

    const result = await getCustomers();

    expect(result).toHaveLength(1);
    const customer = result[0];
    
    expect(customer.id).toBeDefined();
    expect(customer.full_name).toBe('John Doe');
    expect(customer.full_address).toBe('123 Main St, City');
    expect(customer.phone_number).toBe('+1234567890');
    expect(customer.email_address).toBe('john@example.com');
    expect(customer.join_date).toBeInstanceOf(Date);
    expect(customer.status).toBe('active');
    expect(customer.created_at).toBeInstanceOf(Date);
    expect(customer.updated_at).toBeInstanceOf(Date);
  });

  it('should sort customers by created_at desc', async () => {
    // Insert customers one by one with small delays to ensure different timestamps
    await db.insert(customersTable).values(testCustomer1).execute();
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
    await db.insert(customersTable).values(testCustomer2).execute();
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay  
    await db.insert(customersTable).values(testCustomer3).execute();

    const result = await getCustomers();

    expect(result).toHaveLength(3);
    // Most recent should be first (Bob Johnson was inserted last)
    expect(result[0].full_name).toBe('Bob Johnson');
    // Verify the created_at timestamps are in descending order
    for (let i = 1; i < result.length; i++) {
      expect(result[i-1].created_at.getTime()).toBeGreaterThanOrEqual(result[i].created_at.getTime());
    }
  });
});
