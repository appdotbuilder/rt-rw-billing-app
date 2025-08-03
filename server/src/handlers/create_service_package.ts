
import { db } from '../db';
import { servicePackagesTable } from '../db/schema';
import { type CreateServicePackageInput, type ServicePackage } from '../schema';

export const createServicePackage = async (input: CreateServicePackageInput): Promise<ServicePackage> => {
  try {
    // Insert service package record
    const result = await db.insert(servicePackagesTable)
      .values({
        package_name: input.package_name,
        speed: input.speed,
        monthly_price: input.monthly_price.toString(), // Convert number to string for numeric column
        package_description: input.package_description
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const servicePackage = result[0];
    return {
      ...servicePackage,
      monthly_price: parseFloat(servicePackage.monthly_price) // Convert string back to number
    };
  } catch (error) {
    console.error('Service package creation failed:', error);
    throw error;
  }
};
