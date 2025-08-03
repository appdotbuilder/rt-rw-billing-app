
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicePackagesTable, customersTable, customerSubscriptionsTable } from '../db/schema';
import { deleteServicePackage } from '../handlers/delete_service_package';
import { eq } from 'drizzle-orm';

describe('deleteServicePackage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete a service package', async () => {
    // Create a service package
    const packageResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Test Package',
        speed: '100 Mbps',
        monthly_price: '99.99',
        package_description: 'Test package for deletion'
      })
      .returning()
      .execute();

    const packageId = packageResult[0].id;

    // Delete the service package
    const result = await deleteServicePackage(packageId);

    expect(result.success).toBe(true);

    // Verify the package was deleted from database
    const packages = await db.select()
      .from(servicePackagesTable)
      .where(eq(servicePackagesTable.id, packageId))
      .execute();

    expect(packages).toHaveLength(0);
  });

  it('should throw error when service package does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteServicePackage(nonExistentId))
      .rejects
      .toThrow(/service package not found/i);
  });

  it('should throw error when service package has active subscriptions', async () => {
    // Create a customer first
    const customerResult = await db.insert(customersTable)
      .values({
        full_name: 'Test Customer',
        full_address: '123 Test St',
        phone_number: '555-1234',
        email_address: 'test@example.com',
        join_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create a service package
    const packageResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Test Package',
        speed: '100 Mbps',
        monthly_price: '99.99',
        package_description: 'Test package with subscription'
      })
      .returning()
      .execute();

    const packageId = packageResult[0].id;

    // Create a subscription for this package
    await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customerId,
        package_id: packageId,
        start_date: '2024-01-01',
        status: 'active'
      })
      .execute();

    // Try to delete the service package
    await expect(deleteServicePackage(packageId))
      .rejects
      .toThrow(/cannot delete service package with active subscriptions/i);

    // Verify the package still exists
    const packages = await db.select()
      .from(servicePackagesTable)
      .where(eq(servicePackagesTable.id, packageId))
      .execute();

    expect(packages).toHaveLength(1);
  });

  it('should allow deletion when package has no subscriptions', async () => {
    // Create a customer first
    const customerResult = await db.insert(customersTable)
      .values({
        full_name: 'Test Customer',
        full_address: '123 Test St',
        phone_number: '555-1234',
        email_address: 'test@example.com',
        join_date: '2024-01-01',
        status: 'active'
      })
      .returning()
      .execute();

    const customerId = customerResult[0].id;

    // Create two service packages
    const package1Result = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Package with Subscription',
        speed: '100 Mbps',
        monthly_price: '99.99',
        package_description: 'Package that has subscription'
      })
      .returning()
      .execute();

    const package2Result = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Package without Subscription',
        speed: '50 Mbps',
        monthly_price: '49.99',
        package_description: 'Package that has no subscription'
      })
      .returning()
      .execute();

    const package1Id = package1Result[0].id;
    const package2Id = package2Result[0].id;

    // Create subscription only for package1
    await db.insert(customerSubscriptionsTable)
      .values({
        customer_id: customerId,
        package_id: package1Id,
        start_date: '2024-01-01',
        status: 'active'
      })
      .execute();

    // Should be able to delete package2 (no subscriptions)
    const result = await deleteServicePackage(package2Id);

    expect(result.success).toBe(true);

    // Verify package2 was deleted
    const deletedPackages = await db.select()
      .from(servicePackagesTable)
      .where(eq(servicePackagesTable.id, package2Id))
      .execute();

    expect(deletedPackages).toHaveLength(0);

    // Verify package1 still exists
    const remainingPackages = await db.select()
      .from(servicePackagesTable)
      .where(eq(servicePackagesTable.id, package1Id))
      .execute();

    expect(remainingPackages).toHaveLength(1);
  });
});
