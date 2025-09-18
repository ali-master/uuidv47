import { describe, bench } from "vitest";
import { UUIDv47, type UUIDv47Key } from "../src";

describe("UUIDv47 Real-World Usage Patterns", () => {
  // Simulate a service with persistent key (from examples)
  class UUIDTransformationService {
    private readonly key: UUIDv47Key;

    constructor(keyMaterial?: Buffer) {
      if (keyMaterial) {
        this.key = UUIDv47.createKeyFromBuffer(keyMaterial);
      } else {
        this.key = UUIDv47.generateRandomKey();
      }
    }

    transformToPublic(internalV7: string): string {
      const uuid = UUIDv47.parseUUID(internalV7);
      const facade = UUIDv47.encodeV4Facade(uuid, this.key);
      return UUIDv47.formatUUID(facade);
    }

    transformFromPublic(publicV4: string): string {
      const uuid = UUIDv47.parseUUID(publicV4);
      const original = UUIDv47.decodeV4Facade(uuid, this.key);
      return UUIDv47.formatUUID(original);
    }
  }

  // Multi-tenant service (from examples)
  class MultiTenantUUIDService {
    private readonly tenantKeys = new Map<string, UUIDv47Key>();

    setTenantKey(tenantId: string, keyMaterial: Buffer): void {
      this.tenantKeys.set(tenantId, UUIDv47.createKeyFromBuffer(keyMaterial));
    }

    encodeForTenant(tenantId: string, v7UUID: string): string {
      const key = this.tenantKeys.get(tenantId);
      if (!key) throw new Error(`No key found for tenant: ${tenantId}`);

      const uuid = UUIDv47.parseUUID(v7UUID);
      const facade = UUIDv47.encodeV4Facade(uuid, key);
      return UUIDv47.formatUUID(facade);
    }

    decodeForTenant(tenantId: string, v4Facade: string): string {
      const key = this.tenantKeys.get(tenantId);
      if (!key) throw new Error(`No key found for tenant: ${tenantId}`);

      const uuid = UUIDv47.parseUUID(v4Facade);
      const original = UUIDv47.decodeV4Facade(uuid, key);
      return UUIDv47.formatUUID(original);
    }
  }

  // Pre-generated test data
  const testService = new UUIDTransformationService();
  const testV7Strings = Array.from({ length: 100 }, (_, i) => {
    const timestamp = (Date.now() + i).toString(16).padStart(12, "0");
    const random = Math.random().toString(16).substring(2, 14).padStart(12, "0");
    return `${timestamp.substring(0, 8)}-${timestamp.substring(8, 12)}-7${random.substring(0, 3)}-8${random.substring(3, 6)}-${random.substring(6, 12)}${Math.random().toString(16).substring(2, 8)}`;
  });

  const multiTenantService = new MultiTenantUUIDService();
  const tenantIds = ["tenant-1", "tenant-2", "tenant-3", "tenant-4", "tenant-5"];

  // Setup tenant keys
  tenantIds.forEach((tenantId) => {
    const keyBuffer = Buffer.alloc(16);
    require("crypto").randomFillSync(keyBuffer);
    multiTenantService.setTenantKey(tenantId, keyBuffer);
  });

  bench(
    "service pattern - single transformation to public",
    () => {
      testService.transformToPublic(testV7Strings[0]);
    },
    {
      iterations: 25_000,
    },
  );

  bench(
    "service pattern - single transformation from public",
    () => {
      const publicV4 = testService.transformToPublic(testV7Strings[0]);
      testService.transformFromPublic(publicV4);
    },
    {
      iterations: 12_500,
    },
  );

  bench(
    "service pattern - full roundtrip",
    () => {
      const publicV4 = testService.transformToPublic(testV7Strings[0]);
      const recovered = testService.transformFromPublic(publicV4);
      // Verify equality (realistic usage)
      recovered === testV7Strings[0];
    },
    {
      iterations: 12_500,
    },
  );

  bench(
    "service pattern - batch 50 transformations",
    () => {
      for (let i = 0; i < 50; i++) {
        testService.transformToPublic(testV7Strings[i]);
      }
    },
    {
      iterations: 1_000,
    },
  );

  bench(
    "multi-tenant - single tenant encode",
    () => {
      multiTenantService.encodeForTenant("tenant-1", testV7Strings[0]);
    },
    {
      iterations: 20_000,
    },
  );

  bench(
    "multi-tenant - round-robin across 5 tenants",
    () => {
      for (let i = 0; i < 5; i++) {
        const tenantId = tenantIds[i];
        multiTenantService.encodeForTenant(tenantId, testV7Strings[i]);
      }
    },
    {
      iterations: 5_000,
    },
  );

  bench(
    "multi-tenant - full workflow with validation",
    () => {
      const tenantId = tenantIds[Math.floor(Math.random() * tenantIds.length)];
      const v7UUID = testV7Strings[0];

      // Encode
      const facade = multiTenantService.encodeForTenant(tenantId, v7UUID);

      // Decode
      const decoded = multiTenantService.decodeForTenant(tenantId, facade);

      // Validate
      decoded === v7UUID;
    },
    {
      iterations: 10_000,
    },
  );

  bench(
    "API response simulation - hide internal IDs",
    () => {
      // Simulate converting internal UUIDs for API response
      const internalIds = testV7Strings.slice(0, 10);
      const publicIds = internalIds.map((id) => testService.transformToPublic(id));

      // Simulate JSON serialization check
      publicIds.length === 10;
    },
    {
      iterations: 2_000,
    },
  );

  bench(
    "batch processing - 100 UUIDs with error handling",
    () => {
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < 100; i++) {
        try {
          const result = testService.transformToPublic(testV7Strings[i]);
          if (result) successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      // Realistic usage includes counting results
      successCount + errorCount === 100;
    },
    {
      iterations: 500,
    },
  );

  bench(
    "security check - key isolation verification",
    () => {
      const service1 = new UUIDTransformationService();
      const service2 = new UUIDTransformationService();

      const uuid = testV7Strings[0];
      const facade1 = service1.transformToPublic(uuid);
      const facade2 = service2.transformToPublic(uuid);

      // Verify different keys produce different facades
      facade1 !== facade2;
    },
    {
      iterations: 5_000,
    },
  );
});
