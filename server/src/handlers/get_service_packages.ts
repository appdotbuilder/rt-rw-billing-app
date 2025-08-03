
import { db } from '../db';
import { servicePackagesTable } from '../db/schema';
import { type ServicePackage } from '../schema';
import { asc } from 'drizzle-orm';

export async function getServicePackages(): Promise<ServicePackage[]> {
  try {
    const results = await db.select()
      .from(servicePackagesTable)
      .orderBy(asc(servicePackagesTable.monthly_price))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(pkg => ({
      ...pkg,
      monthly_price: parseFloat(pkg.monthly_price)
    }));
  } catch (error) {
    console.error('Failed to fetch service packages:', error);
    throw error;
  }
}
