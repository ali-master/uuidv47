import { describe, it, expect } from "vitest";
import {
  encodeV4Facade,
  decodeV4Facade,
  batchEncodeV4Facade,
  batchDecodeV4Facade,
  generateRandomKey,
  parseUUID,
  formatUUID,
  getUUIDVersion,
} from "../src";
import type { UUID128, UUIDv47Key, UUIDOperationOptions } from "../src";

// Helper function to craft a v7 UUID with specific components
function craftV7(timestampMs48: bigint, randA12: number, randB62: bigint): UUID128 {
  const uuid = Buffer.alloc(16);

  // Write 48-bit timestamp big-endian
  const masked = timestampMs48 & 0x0000ffffffffffffn;
  uuid[0] = Number((masked >> 40n) & 0xffn);
  uuid[1] = Number((masked >> 32n) & 0xffn);
  uuid[2] = Number((masked >> 24n) & 0xffn);
  uuid[3] = Number((masked >> 16n) & 0xffn);
  uuid[4] = Number((masked >> 8n) & 0xffn);
  uuid[5] = Number(masked & 0xffn);

  // Set version 7
  uuid[6] = (uuid[6] & 0x0f) | ((7 & 0x0f) << 4);

  // Set rand_a 12 bits
  uuid[6] = (uuid[6] & 0xf0) | ((randA12 >> 8) & 0x0f);
  uuid[7] = randA12 & 0xff;

  // Set RFC4122 variant
  uuid[8] = (uuid[8] & 0x3f) | 0x80;

  // Set rand_b 62 bits
  uuid[8] = (uuid[8] & 0xc0) | (Number(randB62 >> 56n) & 0x3f);
  for (let i = 0; i < 7; i++) {
    uuid[9 + i] = Number((randB62 >> BigInt(8 * (6 - i))) & 0xffn);
  }

  return uuid;
}

describe("Integration Tests", () => {
  describe("Real-World Scenarios", () => {
    it("should handle complex real-world scenarios", () => {
      const key = generateRandomKey();
      const timestamp = BigInt(Date.now());

      // Create multiple UUIDs with different patterns
      const uuids = Array.from({ length: 100 }, (_, i) =>
        craftV7(timestamp + BigInt(i), 0x0abc + (i % 16), BigInt(0x456789abcdef + i)),
      );

      // Test batch operations
      const encodedUuids = batchEncodeV4Facade(uuids, key);
      const decodedUuids = batchDecodeV4Facade(encodedUuids, key);

      expect(decodedUuids).toEqual(uuids);

      // Verify all encoded UUIDs are v4
      encodedUuids.forEach((uuid) => {
        expect(getUUIDVersion(uuid)).toBe(4);
      });

      // Verify all decoded UUIDs are v7
      decodedUuids.forEach((uuid) => {
        expect(getUUIDVersion(uuid)).toBe(7);
      });
    });

    it("should maintain consistency across operations", () => {
      const key = generateRandomKey();
      const testUUID = parseUUID("01234567-89ab-7def-8123-456789abcdef");

      // Multiple encode/decode cycles should be consistent
      let currentUUID = testUUID;
      for (let i = 0; i < 10; i++) {
        const encoded = encodeV4Facade(currentUUID, key);
        const decoded = decodeV4Facade(encoded, key);
        expect(decoded).toEqual(testUUID);
        currentUUID = testUUID; // Reset for next iteration
      }
    });

    it("should handle mixed UUID operations", () => {
      const key = generateRandomKey();
      const v7Uuids = Array.from({ length: 50 }, (_, i) =>
        craftV7(BigInt(Date.now() + i), 0x123 + i, BigInt(0x456789 + i)),
      );

      // Mix individual and batch operations
      const individualEncoded = v7Uuids.slice(0, 10).map((uuid) => encodeV4Facade(uuid, key));
      const batchEncoded = batchEncodeV4Facade(v7Uuids.slice(10), key);

      const allEncoded = [...individualEncoded, ...batchEncoded];

      // Decode all back
      const individualDecoded = individualEncoded.map((uuid) => decodeV4Facade(uuid, key));
      const batchDecoded = batchDecodeV4Facade(batchEncoded, key);

      const allDecoded = [...individualDecoded, ...batchDecoded];

      expect(allDecoded).toEqual(v7Uuids);
    });
  });

  describe("Edge Cases and Robustness", () => {
    it("should handle edge cases gracefully", () => {
      const key = generateRandomKey();

      // Test with zero values
      const zeroUuid = craftV7(0n, 0, 0n);
      const encodedZero = encodeV4Facade(zeroUuid, key);
      const decodedZero = decodeV4Facade(encodedZero, key);
      expect(decodedZero).toEqual(zeroUuid);

      // Test with maximum values
      const maxUuid = craftV7(0x0000ffffffffffffn, 0x0fff, 0x3fffffffffffffffn);
      const encodedMax = encodeV4Facade(maxUuid, key);
      const decodedMax = decodeV4Facade(encodedMax, key);
      expect(decodedMax).toEqual(maxUuid);
    });

    it("should handle various timestamp patterns", () => {
      const key = generateRandomKey();
      const timestampPatterns = [
        0x000000000001n, // Very small
        0x800000000000n, // High bit set
        0x7fffffffffffffn, // Just under max
        0x123456789abcn, // Typical value
      ];

      timestampPatterns.forEach((timestamp) => {
        const uuid = craftV7(timestamp, 0x123, 0x456789abcdefn);
        const encoded = encodeV4Facade(uuid, key);
        const decoded = decodeV4Facade(encoded, key);
        expect(decoded).toEqual(uuid);
      });
    });

    it("should handle different key patterns", () => {
      const testUuid = craftV7(0x123456789abcn, 0x123, 0x456789abcdefn);

      const keyPatterns = [
        { k0: 0n, k1: 0n },
        { k0: 0xffffffffffffffffn, k1: 0xffffffffffffffffn },
        { k0: 0x5555555555555555n, k1: 0xaaaaaaaaaaaaaaan },
        { k0: 0x123456789abcdefn, k1: 0xfedcba9876543210n },
      ];

      keyPatterns.forEach(({ k0, k1 }) => {
        const key = { k0, k1 };
        const encoded = encodeV4Facade(testUuid, key);
        const decoded = decodeV4Facade(encoded, key);
        expect(decoded).toEqual(testUuid);
      });
    });
  });

  describe("Performance Integration", () => {
    it("should maintain performance characteristics under load", () => {
      const key = generateRandomKey();
      const largeDataset = Array.from({ length: 1000 }, (_, i) =>
        craftV7(BigInt(Date.now() + i), i % 4096, BigInt(0x123456789 + i)),
      );

      const startTime = performance.now();

      // Perform large batch operation
      const encoded = batchEncodeV4Facade(largeDataset, key);
      const decoded = batchDecodeV4Facade(encoded, key);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Verify correctness
      expect(decoded).toEqual(largeDataset);

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // Less than 1 second for 1000 UUIDs
    });

    it("should scale efficiently with data size", () => {
      const key = generateRandomKey();
      const dataSizes = [10, 50, 100, 200];
      const timings: number[] = [];

      dataSizes.forEach((size) => {
        const dataset = Array.from({ length: size }, (_, i) =>
          craftV7(BigInt(Date.now() + i), i % 4096, BigInt(0x987654321 + i)),
        );

        const startTime = performance.now();
        const encoded = batchEncodeV4Facade(dataset, key);
        const decoded = batchDecodeV4Facade(encoded, key);
        const endTime = performance.now();

        expect(decoded).toEqual(dataset);
        timings.push(endTime - startTime);
      });

      // Performance should scale roughly linearly
      const timePerOp = timings.map((time, i) => time / dataSizes[i]);
      const avgTimePerOp = timePerOp.reduce((sum, time) => sum + time, 0) / timePerOp.length;

      // All per-operation times should be within reasonable variance
      timePerOp.forEach((time) => {
        expect(time).toBeLessThan(avgTimePerOp * 2);
      });
    });
  });

  describe("Cross-Component Integration", () => {
    it("should integrate all components seamlessly", () => {
      // Generate key
      const key = generateRandomKey();

      // Parse UUID string
      const uuidString = "01234567-89ab-7def-8123-456789abcdef";
      const parsedUuid = parseUUID(uuidString);

      // Encode
      const encoded = encodeV4Facade(parsedUuid, key);

      // Verify format
      const encodedString = formatUUID(encoded);
      expect(encodedString).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );

      // Decode
      const decoded = decodeV4Facade(encoded, key);

      // Format back to string
      const decodedString = formatUUID(decoded);
      expect(decodedString).toBe(uuidString);
    });

    it("should handle round-trip string operations", () => {
      const key = generateRandomKey();
      const originalStrings = [
        "00000000-0000-7000-8000-000000000000",
        "12345678-9abc-7def-8123-456789abcdef",
        "ffffffff-ffff-7fff-bfff-ffffffffffff",
      ];

      originalStrings.forEach((original) => {
        const parsed = parseUUID(original);
        const encoded = encodeV4Facade(parsed, key);
        const decoded = decodeV4Facade(encoded, key);
        const final = formatUUID(decoded);

        expect(final).toBe(original);
      });
    });
  });

  describe("Error Propagation and Handling", () => {
    it("should properly propagate validation errors", () => {
      const key = generateRandomKey();
      const invalidV4 = parseUUID("01234567-89ab-4def-8123-456789abcdef"); // v4 instead of v7

      expect(() => encodeV4Facade(invalidV4, key)).toThrow("Input UUID must be version 7");

      const validV7 = parseUUID("01234567-89ab-7def-8123-456789abcdef");
      const encoded = encodeV4Facade(validV7, key);

      // Manually corrupt the version to test decode error
      const corruptedV7 = Buffer.from(encoded);
      corruptedV7[6] = (corruptedV7[6] & 0x0f) | (7 << 4); // Set version to 7

      expect(() => decodeV4Facade(corruptedV7, key)).toThrow("Input UUID must be version 4");
    });

    it("should handle batch operation errors gracefully", () => {
      const key = generateRandomKey();
      const mixedUuids = [
        parseUUID("01234567-89ab-7def-8123-456789abcdef"), // Valid v7
        parseUUID("01234567-89ab-4def-8123-456789abcdef"), // Invalid v4
      ];

      // Batch operations should fail on first invalid UUID
      expect(() => batchEncodeV4Facade(mixedUuids, key)).toThrow();
    });
  });
});
