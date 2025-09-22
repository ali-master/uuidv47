import { describe, it, expect } from "vitest";
import {
  createKey,
  createKeyFromBuffer,
  generateRandomKey,
  generateRandomKeys,
  keyToBuffer,
  isValidKey,
} from "../src/key-management";

describe("Key Management", () => {
  describe("Key Creation", () => {
    it("should create keys correctly", () => {
      const k0 = 0x0123456789abcdefn;
      const k1 = 0xfedcba9876543210n;
      const key = createKey(k0, k1);

      expect(key.k0).toBe(k0);
      expect(key.k1).toBe(k1);
      expect(isValidKey(key)).toBe(true);
    });

    it("should create keys with various bigint values", () => {
      const testCases = [
        { k0: 0n, k1: 0n },
        { k0: 0xffffffffffffffffn, k1: 0xffffffffffffffffn },
        { k0: 0x123n, k1: 0x456n },
        { k0: 0xdeadbeefcafebabn, k1: 0x1337133713371337n },
      ];

      testCases.forEach(({ k0, k1 }) => {
        const key = createKey(k0, k1);
        expect(key.k0).toBe(k0);
        expect(key.k1).toBe(k1);
        expect(isValidKey(key)).toBe(true);
      });
    });

    it("should create immutable keys", () => {
      const key = createKey(0x123n, 0x456n);

      // Keys should be readonly
      expect(() => {
        // @ts-expect-error - Testing runtime immutability
        key.k0 = 0x999n;
      }).toThrow();
    });
  });

  describe("Key Buffer Operations", () => {
    it("should create keys from buffer", () => {
      const buffer = Buffer.alloc(16);
      buffer.writeBigUInt64LE(0x0123456789abcdefn, 0);
      buffer.writeBigUInt64LE(0xfedcba9876543210n, 8);

      const key = createKeyFromBuffer(buffer);
      expect(key.k0).toBe(0x0123456789abcdefn);
      expect(key.k1).toBe(0xfedcba9876543210n);
    });

    it("should validate buffer length", () => {
      expect(() => createKeyFromBuffer(Buffer.alloc(15))).toThrow(
        "Key buffer must be exactly 16 bytes",
      );
      expect(() => createKeyFromBuffer(Buffer.alloc(17))).toThrow(
        "Key buffer must be exactly 16 bytes",
      );
      expect(() => createKeyFromBuffer(Buffer.alloc(0))).toThrow(
        "Key buffer must be exactly 16 bytes",
      );
    });

    it("should convert key to buffer", () => {
      const key = createKey(0x0123456789abcdefn, 0xfedcba9876543210n);
      const buffer = keyToBuffer(key);

      expect(buffer).toHaveLength(16);
      expect(buffer.readBigUInt64LE(0)).toBe(key.k0);
      expect(buffer.readBigUInt64LE(8)).toBe(key.k1);
    });

    it("should perform roundtrip buffer conversion", () => {
      const originalKey = createKey(0x0123456789abcdefn, 0xfedcba9876543210n);
      const buffer = keyToBuffer(originalKey);
      const restoredKey = createKeyFromBuffer(buffer);

      expect(restoredKey).toEqual(originalKey);
    });

    it("should handle various key values in buffer operations", () => {
      const testKeys = [
        createKey(0n, 0n),
        createKey(0xffffffffffffffffn, 0xffffffffffffffffn),
        createKey(0x123456789abcdefn, 0xfedcba9876543210n),
        createKey(0xdeadbeefn, 0xcafebabn),
      ];

      testKeys.forEach((originalKey) => {
        const buffer = keyToBuffer(originalKey);
        const restoredKey = createKeyFromBuffer(buffer);
        expect(restoredKey).toEqual(originalKey);
      });
    });
  });

  describe("Key Validation", () => {
    it("should validate keys correctly", () => {
      const validKey = createKey(0x123n, 0x456n);
      expect(isValidKey(validKey)).toBe(true);
    });

    it("should reject invalid key types", () => {
      expect(isValidKey(null)).toBe(false);
      expect(isValidKey(undefined)).toBe(false);
      expect(isValidKey({})).toBe(false);
      expect(isValidKey([])).toBe(false);
      expect(isValidKey("string")).toBe(false);
      expect(isValidKey(42)).toBe(false);
    });

    it("should reject incomplete key objects", () => {
      expect(isValidKey({ k0: 123 })).toBe(false);
      expect(isValidKey({ k1: 123n })).toBe(false);
      expect(isValidKey({ k0: "123", k1: 456n })).toBe(false);
      expect(isValidKey({ k0: 123n, k1: "456" })).toBe(false);
      expect(isValidKey({ k0: 123, k1: 456 })).toBe(false); // Not bigints
    });

    it("should validate key objects with extra properties", () => {
      const keyWithExtra = {
        k0: 0x123n,
        k1: 0x456n,
        extraProperty: "should not matter",
      };
      expect(isValidKey(keyWithExtra)).toBe(true);
    });

    it("should handle edge case values", () => {
      const edgeCases = [
        createKey(0n, 0xffffffffffffffffn),
        createKey(0xffffffffffffffffn, 0n),
        createKey(-1n, -1n), // Negative bigints
        createKey(1n, -1n),
      ];

      edgeCases.forEach((key) => {
        expect(isValidKey(key)).toBe(true);
      });
    });
  });

  describe("Random Key Generation", () => {
    it("should generate random keys", () => {
      const key1 = generateRandomKey();
      const key2 = generateRandomKey();

      expect(isValidKey(key1)).toBe(true);
      expect(isValidKey(key2)).toBe(true);
      expect(key1).not.toEqual(key2); // Extremely unlikely to be equal
    });

    it("should generate cryptographically random keys", () => {
      const keys = Array.from({ length: 100 }, () => generateRandomKey());

      // All keys should be valid
      keys.forEach((key) => {
        expect(isValidKey(key)).toBe(true);
      });

      // All keys should be unique (with very high probability)
      const uniqueKeys = new Set(keys.map((k) => `${k.k0}-${k.k1}`));
      expect(uniqueKeys.size).toBe(100);
    });

    it("should generate keys with good entropy", () => {
      const key = generateRandomKey();

      // Keys should not be zero (extremely unlikely with good entropy)
      expect(key.k0).not.toBe(0n);
      expect(key.k1).not.toBe(0n);

      // Keys should not be simple patterns
      expect(key.k0).not.toBe(0x1111111111111111n);
      expect(key.k1).not.toBe(0x2222222222222222n);
    });
  });

  describe("Batch Key Generation", () => {
    it("should generate batch random keys", () => {
      const count = 5;
      const keys = generateRandomKeys(count);

      expect(keys).toHaveLength(count);
      keys.forEach((key) => {
        expect(isValidKey(key)).toBe(true);
      });

      // All keys should be different
      const uniqueKeys = new Set(keys.map((k) => `${k.k0}-${k.k1}`));
      expect(uniqueKeys.size).toBe(count);
    });

    it("should handle various batch sizes", () => {
      const testSizes = [0, 1, 2, 10, 50, 100];

      testSizes.forEach((size) => {
        const keys = generateRandomKeys(size);
        expect(keys).toHaveLength(size);

        keys.forEach((key) => {
          expect(isValidKey(key)).toBe(true);
        });

        if (size > 1) {
          // Check uniqueness for non-trivial sizes
          const uniqueKeys = new Set(keys.map((k) => `${k.k0}-${k.k1}`));
          expect(uniqueKeys.size).toBe(size);
        }
      });
    });

    it("should be more efficient than individual generation", () => {
      const count = 50;

      // Time individual generation
      const startIndividual = performance.now();
      for (let i = 0; i < count; i++) {
        generateRandomKey();
      }
      const endIndividual = performance.now();
      const individualTime = endIndividual - startIndividual;

      // Time batch generation
      const startBatch = performance.now();
      generateRandomKeys(count);
      const endBatch = performance.now();
      const batchTime = endBatch - startBatch;

      // Batch should be faster (or at least not significantly slower)
      expect(batchTime).toBeLessThan(individualTime * 2);
    });

    it("should handle large batch sizes", () => {
      const largeCount = 1000;
      const keys = generateRandomKeys(largeCount);

      expect(keys).toHaveLength(largeCount);

      // Sample check - validate first and last few keys
      const sampleIndices = [0, 1, 2, largeCount - 3, largeCount - 2, largeCount - 1];
      sampleIndices.forEach((index) => {
        expect(isValidKey(keys[index])).toBe(true);
      });

      // Check uniqueness on a sample
      const sample = keys.slice(0, 100);
      const uniqueSample = new Set(sample.map((k) => `${k.k0}-${k.k1}`));
      expect(uniqueSample.size).toBe(100);
    });
  });

  describe("Key Serialization and Persistence", () => {
    it("should serialize keys consistently", () => {
      const key = createKey(0x123456789abcdefn, 0xfedcba9876543210n);

      const buffer1 = keyToBuffer(key);
      const buffer2 = keyToBuffer(key);

      expect(buffer1).toEqual(buffer2);
    });

    it("should handle serialization of edge case keys", () => {
      const edgeCaseKeys = [
        createKey(0n, 0n),
        createKey(0xffffffffffffffffn, 0xffffffffffffffffn),
        createKey(0x1n, 0xffffffffffffffffn),
        createKey(0xffffffffffffffffn, 0x1n),
      ];

      edgeCaseKeys.forEach((key) => {
        const buffer = keyToBuffer(key);
        const restored = createKeyFromBuffer(buffer);
        expect(restored).toEqual(key);
      });
    });

    it("should preserve key properties across serialization", () => {
      const originalKey = generateRandomKey();
      const buffer = keyToBuffer(originalKey);
      const restoredKey = createKeyFromBuffer(buffer);

      expect(restoredKey.k0).toBe(originalKey.k0);
      expect(restoredKey.k1).toBe(originalKey.k1);
      expect(isValidKey(restoredKey)).toBe(true);
    });
  });

  describe("Performance Characteristics", () => {
    it("should create keys efficiently", () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        createKey(BigInt(i), BigInt(i * 2));
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should be very fast
      expect(duration).toBeLessThan(100);
    });

    it("should validate keys efficiently", () => {
      const validKey = createKey(0x123n, 0x456n);
      const invalidInputs = [null, undefined, {}, { k0: 123 }, "string"];

      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        isValidKey(validKey);
        invalidInputs.forEach((input) => isValidKey(input));
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should be very fast
      expect(duration).toBeLessThan(50);
    });
  });
});
