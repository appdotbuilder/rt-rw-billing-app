
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicePackagesTable } from '../db/schema';
import { type CreateServicePackageInput, type UpdateServicePackageInput } from '../schema';
import { updateServicePackage } from '../handlers/update_service_package';
import { eq } from 'drizzle-orm';

// Helper to create a test service package
const createTestServicePackage = async (): Promise<number> => {
  const testPackage: CreateServicePackageInput = {
    package_name: 'Basic Internet',
    speed: '100 Mbps',
    monthly_price: 49.99,
    package_description: 'Basic internet package for home use'
  };

  const result = await db.insert(servicePackagesTable)
    .values({
      package_name: testPackage.package_name,
      speed: testPackage.speed,
      monthly_price: testPackage.monthly_price.toString(),
      package_description: testPackage.package_description
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateServicePackage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a service package with all fields', async () => {
    const packageId = await createTestServicePackage();

    const updateInput: UpdateServicePackageInput = {
      id: packageId,
      package_name: 'Premium Internet',
      speed: '1 Gbps',
      monthly_price: 99.99,
      package_description: 'Premium high-speed internet package'
    };

    const result = await updateServicePackage(updateInput);

    expect(result.id).toEqual(packageId);
    expect(result.package_name).toEqual('Premium Internet');
    expect(result.speed).toEqual('1 Gbps');
    expect(result.monthly_price).toEqual(99.99);
    expect(typeof result.monthly_price).toEqual('number');
    expect(result.package_description).toEqual('Premium high-speed internet package');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const packageId = await createTestServicePackage();

    const updateInput: UpdateServicePackageInput = {
      id: packageId,
      package_name: 'Updated Basic Internet',
      monthly_price: 59.99
    };

    const result = await updateServicePackage(updateInput);

    expect(result.id).toEqual(packageId);
    expect(result.package_name).toEqual('Updated Basic Internet');
    expect(result.speed).toEqual('100 Mbps'); // Should remain unchanged
    expect(result.monthly_price).toEqual(59.99);
    expect(result.package_description).toEqual('Basic internet package for home use'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated service package to database', async () => {
    const packageId = await createTestServicePackage();

    const updateInput: UpdateServicePackageInput = {
      id: packageId,
      package_name: 'Database Test Package',
      speed: '500 Mbps'
    };

    await updateServicePackage(updateInput);

    // Verify changes are saved to database
    const packages = await db.select()
      .from(servicePackagesTable)
      .where(eq(servicePackagesTable.id, packageId))
      .execute();

    expect(packages).toHaveLength(1);
    expect(packages[0].package_name).toEqual('Database Test Package');
    expect(packages[0].speed).toEqual('500 Mbps');
    expect(parseFloat(packages[0].monthly_price)).toEqual(49.99); // Should remain unchanged
    expect(packages[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent service package', async () => {
    const updateInput: UpdateServicePackageInput = {
      id: 999,
      package_name: 'Non-existent Package'
    };

    expect(updateServicePackage(updateInput)).rejects.toThrow(/service package not found/i);
  });

  it('should update updated_at timestamp', async () => {
    const packageId = await createTestServicePackage();

    // Get original updated_at
    const originalPackages = await db.select()
      .from(servicePackagesTable)
      .where(eq(servicePackagesTable.id, packageId))
      .execute();
    const originalUpdatedAt = originalPackages[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateServicePackageInput = {
      id: packageId,
      package_name: 'Timestamp Test Package'
    };

    const result = await updateServicePackage(updateInput);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
