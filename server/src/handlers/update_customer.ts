
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type UpdateCustomerInput, type Customer } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateCustomer(input: UpdateCustomerInput): Promise<Customer> {
  try {
    // Check if customer exists first
    const existingCustomer = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, input.id))
      .execute();

    if (existingCustomer.length === 0) {
      throw new Error('Customer not found');
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof customersTable.$inferInsert> = {};
    
    if (input.full_name !== undefined) {
      updateData.full_name = input.full_name;
    }
    if (input.full_address !== undefined) {
      updateData.full_address = input.full_address;
    }
    if (input.phone_number !== undefined) {
      updateData.phone_number = input.phone_number;
    }
    if (input.email_address !== undefined) {
      updateData.email_address = input.email_address;
    }
    if (input.join_date !== undefined) {
      // Convert Date to string for date column
      updateData.join_date = input.join_date.toISOString().split('T')[0];
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the customer
    const result = await db.update(customersTable)
      .set(updateData)
      .where(eq(customersTable.id, input.id))
      .returning()
      .execute();

    // Convert date string back to Date object for return
    const customer = result[0];
    return {
      ...customer,
      join_date: new Date(customer.join_date)
    };
  } catch (error) {
    console.error('Customer update failed:', error);
    throw error;
  }
}
