
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { servicePackagesTable } from '../db/schema';
import { type CreateServicePackageInput } from '../schema';
import { getServicePackages } from '../handlers/get_service_packages';

// Test data for multiple packages
const testPackages: CreateServicePackageInput[] = [
  {
    package_name: 'Basic Plan',
    speed: '10 Mbps',
    monthly_price: 29.99,
    package_description: 'Basic internet package for light usage'
  },
  {
    package_name: 'Premium Plan',
    speed: '100 Mbps',
    monthly_price: 79.99,
    package_description: 'High-speed internet for heavy users'
  },
  {
    package_name: 'Standard Plan',
    speed: '50 Mbps',
    monthly_price: 49.99,
    package_description: 'Standard internet package for regular usage'
  }
];

describe('getServicePackages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no packages exist', async () => {
    const result = await getServicePackages();
    expect(result).toEqual([]);
  });

  it('should return all service packages', async () => {
    // Create test packages
    for (const pkg of testPackages) {
      await db.insert(servicePackagesTable)
        .values({
          ...pkg,
          monthly_price: pkg.monthly_price.toString()
        })
        .execute();
    }

    const result = await getServicePackages();

    expect(result).toHaveLength(3);
    
    // Verify all packages are returned with correct data types
    result.forEach(pkg => {
      expect(pkg.id).toBeDefined();
      expect(typeof pkg.package_name).toBe('string');
      expect(typeof pkg.speed).toBe('string');
      expect(typeof pkg.monthly_price).toBe('number');
      expect(typeof pkg.package_description).toBe('string');
      expect(pkg.created_at).toBeInstanceOf(Date);
      expect(pkg.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return packages sorted by monthly_price ascending', async () => {
    // Create test packages
    for (const pkg of testPackages) {
      await db.insert(servicePackagesTable)
        .values({
          ...pkg,
          monthly_price: pkg.monthly_price.toString()
        })
        .execute();
    }

    const result = await getServicePackages();

    expect(result).toHaveLength(3);
    
    // Verify sorting by price (ascending)
    expect(result[0].package_name).toEqual('Basic Plan');
    expect(result[0].monthly_price).toEqual(29.99);
    
    expect(result[1].package_name).toEqual('Standard Plan');
    expect(result[1].monthly_price).toEqual(49.99);
    
    expect(result[2].package_name).toEqual('Premium Plan');
    expect(result[2].monthly_price).toEqual(79.99);
    
    // Verify prices are in ascending order
    for (let i = 1; i < result.length; i++) {
      expect(result[i].monthly_price).toBeGreaterThanOrEqual(result[i - 1].monthly_price);
    }
  });

  it('should handle single package correctly', async () => {
    const singlePackage = testPackages[0];
    
    await db.insert(servicePackagesTable)
      .values({
        ...singlePackage,
        monthly_price: singlePackage.monthly_price.toString()
      })
      .execute();

    const result = await getServicePackages();

    expect(result).toHaveLength(1);
    expect(result[0].package_name).toEqual('Basic Plan');
    expect(result[0].speed).toEqual('10 Mbps');
    expect(result[0].monthly_price).toEqual(29.99);
    expect(result[0].package_description).toEqual('Basic internet package for light usage');
  });
});
