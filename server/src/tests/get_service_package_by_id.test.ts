
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicePackagesTable } from '../db/schema';
import { type CreateServicePackageInput } from '../schema';
import { getServicePackageById } from '../handlers/get_service_package_by_id';

const testServicePackage: CreateServicePackageInput = {
  package_name: 'Basic Internet',
  speed: '25 Mbps',
  monthly_price: 39.99,
  package_description: 'Basic internet package for home use'
};

describe('getServicePackageById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return service package by ID', async () => {
    // Create test service package
    const insertResult = await db.insert(servicePackagesTable)
      .values({
        package_name: testServicePackage.package_name,
        speed: testServicePackage.speed,
        monthly_price: testServicePackage.monthly_price.toString(),
        package_description: testServicePackage.package_description
      })
      .returning()
      .execute();

    const createdPackage = insertResult[0];

    // Get service package by ID
    const result = await getServicePackageById(createdPackage.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdPackage.id);
    expect(result!.package_name).toEqual('Basic Internet');
    expect(result!.speed).toEqual('25 Mbps');
    expect(result!.monthly_price).toEqual(39.99);
    expect(typeof result!.monthly_price).toBe('number');
    expect(result!.package_description).toEqual('Basic internet package for home use');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent service package', async () => {
    const result = await getServicePackageById(999);

    expect(result).toBeNull();
  });

  it('should handle numeric price conversion correctly', async () => {
    // Create service package with specific price
    const insertResult = await db.insert(servicePackagesTable)
      .values({
        package_name: 'Premium Package',
        speed: '100 Mbps',
        monthly_price: '99.95',
        package_description: 'Premium package with high speed'
      })
      .returning()
      .execute();

    const createdPackage = insertResult[0];

    const result = await getServicePackageById(createdPackage.id);

    expect(result).not.toBeNull();
    expect(result!.monthly_price).toEqual(99.95);
    expect(typeof result!.monthly_price).toBe('number');
  });
});
