
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type CreateCustomerInput, type Customer } from '../schema';

export const createCustomer = async (input: CreateCustomerInput): Promise<Customer> => {
  try {
    // Insert customer record
    const result = await db.insert(customersTable)
      .values({
        full_name: input.full_name,
        full_address: input.full_address,
        phone_number: input.phone_number,
        email_address: input.email_address,
        join_date: input.join_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        status: input.status
      })
      .returning()
      .execute();

    // Convert join_date string back to Date and return the created customer
    const customer = result[0];
    return {
      ...customer,
      join_date: new Date(customer.join_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Customer creation failed:', error);
    throw error;
  }
};
