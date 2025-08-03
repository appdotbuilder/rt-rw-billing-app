
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicePackagesTable } from '../db/schema';
import { type CreateServicePackageInput } from '../schema';
import { createServicePackage } from '../handlers/create_service_package';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateServicePackageInput = {
  package_name: 'Premium Internet',
  speed: '100 Mbps',
  monthly_price: 49.99,
  package_description: 'High-speed internet package for premium users'
};

describe('createServicePackage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a service package', async () => {
    const result = await createServicePackage(testInput);

    // Basic field validation
    expect(result.package_name).toEqual('Premium Internet');
    expect(result.speed).toEqual('100 Mbps');
    expect(result.monthly_price).toEqual(49.99);
    expect(typeof result.monthly_price).toBe('number');
    expect(result.package_description).toEqual(testInput.package_description);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save service package to database', async () => {
    const result = await createServicePackage(testInput);

    // Query using proper drizzle syntax
    const packages = await db.select()
      .from(servicePackagesTable)
      .where(eq(servicePackagesTable.id, result.id))
      .execute();

    expect(packages).toHaveLength(1);
    expect(packages[0].package_name).toEqual('Premium Internet');
    expect(packages[0].speed).toEqual('100 Mbps');
    expect(parseFloat(packages[0].monthly_price)).toEqual(49.99);
    expect(packages[0].package_description).toEqual(testInput.package_description);
    expect(packages[0].created_at).toBeInstanceOf(Date);
    expect(packages[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle different price values correctly', async () => {
    const testCases = [
      { ...testInput, monthly_price: 29.99 },
      { ...testInput, monthly_price: 100.00 },
      { ...testInput, monthly_price: 15.50 }
    ];

    for (const testCase of testCases) {
      const result = await createServicePackage(testCase);
      
      expect(result.monthly_price).toEqual(testCase.monthly_price);
      expect(typeof result.monthly_price).toBe('number');
      
      // Verify in database
      const packages = await db.select()
        .from(servicePackagesTable)
        .where(eq(servicePackagesTable.id, result.id))
        .execute();
      
      expect(parseFloat(packages[0].monthly_price)).toEqual(testCase.monthly_price);
    }
  });

  it('should create packages with different speeds', async () => {
    const speedTestCases = [
      { ...testInput, package_name: 'Basic', speed: '25 Mbps' },
      { ...testInput, package_name: 'Standard', speed: '50 Mbps' },
      { ...testInput, package_name: 'Premium', speed: '1 Gbps' }
    ];

    for (const testCase of speedTestCases) {
      const result = await createServicePackage(testCase);
      
      expect(result.package_name).toEqual(testCase.package_name);
      expect(result.speed).toEqual(testCase.speed);
      expect(result.id).toBeDefined();
    }
  });
});
