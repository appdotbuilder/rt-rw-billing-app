
import { db } from '../db';
import { customersTable } from '../db/schema';
import { type Customer, type CustomerFilter } from '../schema';
import { eq, or, ilike, desc, and, type SQL } from 'drizzle-orm';

export async function getCustomers(filter?: CustomerFilter): Promise<Customer[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter?.status) {
      conditions.push(eq(customersTable.status, filter.status));
    }

    if (filter?.search) {
      const searchTerm = `%${filter.search}%`;
      conditions.push(
        or(
          ilike(customersTable.full_name, searchTerm),
          ilike(customersTable.email_address, searchTerm),
          ilike(customersTable.phone_number, searchTerm)
        )!
      );
    }

    // Build and execute query
    const results = conditions.length > 0
      ? await db.select()
          .from(customersTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(customersTable.created_at))
          .execute()
      : await db.select()
          .from(customersTable)
          .orderBy(desc(customersTable.created_at))
          .execute();

    // Convert date fields and return
    return results.map(customer => ({
      ...customer,
      join_date: new Date(customer.join_date), // Convert string to Date
    }));
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    throw error;
  }
}
