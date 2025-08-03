
import { db } from '../db';
import { customersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Customer } from '../schema';

export const getCustomerById = async (id: number): Promise<Customer | null> => {
  try {
    const result = await db.select()
      .from(customersTable)
      .where(eq(customersTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const customer = result[0];
    return {
      ...customer,
      // Convert date string to Date object
      join_date: new Date(customer.join_date),
    };
  } catch (error) {
    console.error('Failed to fetch customer by ID:', error);
    throw error;
  }
};
