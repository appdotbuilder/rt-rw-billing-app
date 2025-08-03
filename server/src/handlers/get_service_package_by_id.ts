
import { db } from '../db';
import { servicePackagesTable } from '../db/schema';
import { type ServicePackage } from '../schema';
import { eq } from 'drizzle-orm';

export const getServicePackageById = async (id: number): Promise<ServicePackage | null> => {
  try {
    const result = await db.select()
      .from(servicePackagesTable)
      .where(eq(servicePackagesTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const servicePackage = result[0];
    return {
      ...servicePackage,
      monthly_price: parseFloat(servicePackage.monthly_price) // Convert numeric to number
    };
  } catch (error) {
    console.error('Failed to get service package by ID:', error);
    throw error;
  }
};
