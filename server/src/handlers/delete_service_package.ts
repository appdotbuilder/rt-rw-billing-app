
import { db } from '../db';
import { servicePackagesTable, customerSubscriptionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteServicePackage(id: number): Promise<{ success: boolean }> {
  try {
    // First check if the service package exists
    const existingPackage = await db.select()
      .from(servicePackagesTable)
      .where(eq(servicePackagesTable.id, id))
      .execute();

    if (existingPackage.length === 0) {
      throw new Error('Service package not found');
    }

    // Check if there are any active subscriptions using this package
    const activeSubscriptions = await db.select()
      .from(customerSubscriptionsTable)
      .where(eq(customerSubscriptionsTable.package_id, id))
      .execute();

    if (activeSubscriptions.length > 0) {
      throw new Error('Cannot delete service package with active subscriptions');
    }

    // Delete the service package
    await db.delete(servicePackagesTable)
      .where(eq(servicePackagesTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Service package deletion failed:', error);
    throw error;
  }
}
