import { bench, describe } from "vitest";
import {
  generateRandomKey,
  generateRandomKeys,
  createKey,
  createKeyFromBuffer,
  keyToBuffer,
  isValidKey,
  type UUIDv47Key,
} from "../src";
import { randomFillSync } from "node:crypto";

// Test data setup
const testKeys = Array.from({ length: 1000 }, () => generateRandomKey());
const sampleKey = generateRandomKey();
const keyBuffer = keyToBuffer(sampleKey);
const invalidObjects = [null, undefined, {}, { k0: 123 }, "string", 42];
const validKeys = testKeys.slice(0, 100);

describe("Key Management Benchmarks", () => {
  describe("Key Generation Performance", () => {
    bench(
      "generateRandomKey - single",
      () => {
        generateRandomKey();
      },
      {
        iterations: 10_000,
      },
    );

    bench(
      "generateRandomKeys - batch 10",
      () => {
        generateRandomKeys(10);
      },
      {
        iterations: 1_000,
      },
    );

    bench(
      "generateRandomKeys - batch 100",
      () => {
        generateRandomKeys(100);
      },
      {
        iterations: 100,
      },
    );

    bench(
      "generateRandomKeys - batch 1000",
      () => {
        generateRandomKeys(1000);
      },
      {
        iterations: 10,
      },
    );

    bench(
      "Individual generation - 10 keys (for comparison)",
      () => {
        for (let i = 0; i < 10; i++) {
          generateRandomKey();
        }
      },
      {
        iterations: 1_000,
      },
    );

    bench(
      "Individual generation - 100 keys (for comparison)",
      () => {
        for (let i = 0; i < 100; i++) {
          generateRandomKey();
        }
      },
      {
        iterations: 100,
      },
    );
  });

  describe("Key Creation Methods", () => {
    bench(
      "createKey - from bigints",
      () => {
        createKey(0x0123456789abcdefn, 0xfedcba9876543210n);
      },
      {
        iterations: 100_000,
      },
    );

    bench(
      "createKeyFromBuffer - from 16-byte buffer",
      () => {
        createKeyFromBuffer(keyBuffer);
      },
      {
        iterations: 50_000,
      },
    );

    bench(
      "generateRandomKey vs createKey performance",
      () => {
        generateRandomKey();
      },
      {
        iterations: 10_000,
      },
    );

    bench(
      "createKey vs createKeyFromBuffer",
      () => {
        createKey(0x1234567890abcdefn, 0xfedcba0987654321n);
      },
      {
        iterations: 100_000,
      },
    );
  });

  describe("Key Serialization Performance", () => {
    bench(
      "keyToBuffer - single key",
      () => {
        keyToBuffer(sampleKey);
      },
      {
        iterations: 100_000,
      },
    );

    bench(
      "keyToBuffer - batch conversion",
      () => {
        validKeys.forEach((key) => keyToBuffer(key));
      },
      {
        iterations: 10_000,
      },
    );

    bench(
      "createKeyFromBuffer + keyToBuffer roundtrip",
      () => {
        const buffer = keyToBuffer(sampleKey);
        createKeyFromBuffer(buffer);
      },
      {
        iterations: 50_000,
      },
    );

    bench(
      "Batch key serialization (100 keys)",
      () => {
        const buffers = validKeys.map((key) => keyToBuffer(key));
        buffers.map((buffer) => createKeyFromBuffer(buffer));
      },
      {
        iterations: 1_000,
      },
    );
  });

  describe("Key Validation Performance", () => {
    bench(
      "isValidKey - valid key",
      () => {
        isValidKey(sampleKey);
      },
      {
        iterations: 100_000,
      },
    );

    bench(
      "isValidKey - invalid objects (mixed)",
      () => {
        invalidObjects.forEach((obj) => isValidKey(obj));
      },
      {
        iterations: 10_000,
      },
    );

    bench(
      "isValidKey - batch validation (100 valid keys)",
      () => {
        validKeys.forEach((key) => isValidKey(key));
      },
      {
        iterations: 1_000,
      },
    );

    bench(
      "isValidKey - null check",
      () => {
        isValidKey(null);
      },
      {
        iterations: 100_000,
      },
    );

    bench(
      "isValidKey - object with wrong types",
      () => {
        isValidKey({ k0: "string", k1: 123 });
      },
      {
        iterations: 100_000,
      },
    );
  });

  describe("Key Generation Efficiency Comparison", () => {
    bench(
      "Batch generation vs individual - 50 keys (batch)",
      () => {
        generateRandomKeys(50);
      },
      {
        iterations: 1_000,
      },
    );

    bench(
      "Batch generation vs individual - 50 keys (individual)",
      () => {
        Array.from({ length: 50 }, () => generateRandomKey());
      },
      {
        iterations: 1_000,
      },
    );

    bench(
      "Batch generation vs individual - 200 keys (batch)",
      () => {
        generateRandomKeys(200);
      },
      {
        iterations: 100,
      },
    );

    bench(
      "Batch generation vs individual - 200 keys (individual)",
      () => {
        Array.from({ length: 200 }, () => generateRandomKey());
      },
      {
        iterations: 100,
      },
    );
  });

  describe("Memory Efficiency Tests", () => {
    bench(
      "Large batch key generation (5000 keys)",
      () => {
        generateRandomKeys(5000);
      },
      { iterations: 10 },
    );

    bench(
      "Key creation with different patterns",
      () => {
        const patterns = [
          { k0: 0n, k1: 0n },
          { k0: 0xffffffffffffffffn, k1: 0xffffffffffffffffn },
          { k0: 0x5555555555555555n, k1: 0xaaaaaaaaaaaaaaan },
          { k0: 0x123456789abcdefn, k1: 0xfedcba9876543210n },
        ];
        patterns.forEach(({ k0, k1 }) => createKey(k0, k1));
      },
      {
        iterations: 10_000,
      },
    );

    bench(
      "Key immutability verification",
      () => {
        const key = createKey(0x123n, 0x456n);
        try {
          // This should fail due to Object.freeze()
          (key as any).k0 = 0x999n;
        } catch (e) {
          // Expected to throw
        }
      },
      {
        iterations: 100_000,
      },
    );
  });

  describe("Real-World Usage Patterns", () => {
    const multiTenantKeys = new Map<string, UUIDv47Key>();

    bench(
      "Multi-tenant key storage and retrieval",
      () => {
        // Simulate storing keys for different tenants
        const tenantId = `tenant-${Math.random()}`;
        const key = generateRandomKey();
        multiTenantKeys.set(tenantId, key);

        // Retrieve the key
        multiTenantKeys.get(tenantId);
      },
      {
        iterations: 10_000,
      },
    );

    bench(
      "Key persistence simulation (serialize + deserialize)",
      () => {
        const key = generateRandomKey();
        const buffer = keyToBuffer(key);
        // Simulate storage/retrieval
        const restoredKey = createKeyFromBuffer(buffer);
        isValidKey(restoredKey);
      },
      {
        iterations: 10_000,
      },
    );

    bench(
      "Key rotation pattern",
      () => {
        // Simulate key rotation: generate new, validate old, store new
        const oldKey = sampleKey;
        const newKey = generateRandomKey();

        isValidKey(oldKey);
        keyToBuffer(oldKey); // Archive old key
        isValidKey(newKey); // Validate new key
      },
      {
        iterations: 10_000,
      },
    );

    bench(
      "Bulk key operations (create, validate, serialize)",
      () => {
        const keys = generateRandomKeys(10);
        keys.forEach((key) => {
          isValidKey(key);
          keyToBuffer(key);
        });
      },
      {
        iterations: 1_000,
      },
    );
  });

  describe("Performance Edge Cases", () => {
    bench(
      "Zero value keys",
      () => {
        createKey(0n, 0n);
      },
      {
        iterations: 100_000,
      },
    );

    bench(
      "Maximum value keys",
      () => {
        createKey(0xffffffffffffffffn, 0xffffffffffffffffn);
      },
      {
        iterations: 100_000,
      },
    );

    bench(
      "Mixed pattern keys",
      () => {
        createKey(0x123456789abcdefn, 0n);
        createKey(0n, 0xfedcba9876543210n);
      },
      {
        iterations: 10_000,
      },
    );

    bench(
      "Validation with edge case values",
      () => {
        const edgeCases = [
          createKey(0n, 0xffffffffffffffffn),
          createKey(0xffffffffffffffffn, 0n),
          createKey(-1n, -1n),
          createKey(1n, -1n),
        ];
        edgeCases.forEach((key) => isValidKey(key));
      },
      {
        iterations: 10_000,
      },
    );
  });
});
