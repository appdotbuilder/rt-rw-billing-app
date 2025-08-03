
import { db } from '../db';
import { servicePackagesTable } from '../db/schema';
import { type UpdateServicePackageInput, type ServicePackage } from '../schema';
import { eq } from 'drizzle-orm';

export const updateServicePackage = async (input: UpdateServicePackageInput): Promise<ServicePackage> => {
  try {
    // Check if service package exists
    const existingPackages = await db.select()
      .from(servicePackagesTable)
      .where(eq(servicePackagesTable.id, input.id))
      .execute();

    if (existingPackages.length === 0) {
      throw new Error('Service package not found');
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.package_name !== undefined) {
      updateData.package_name = input.package_name;
    }
    if (input.speed !== undefined) {
      updateData.speed = input.speed;
    }
    if (input.monthly_price !== undefined) {
      updateData.monthly_price = input.monthly_price.toString(); // Convert number to string for numeric column
    }
    if (input.package_description !== undefined) {
      updateData.package_description = input.package_description;
    }

    // Update service package record
    const result = await db.update(servicePackagesTable)
      .set(updateData)
      .where(eq(servicePackagesTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const servicePackage = result[0];
    return {
      ...servicePackage,
      monthly_price: parseFloat(servicePackage.monthly_price) // Convert string back to number
    };
  } catch (error) {
    console.error('Service package update failed:', error);
    throw error;
  }
};
