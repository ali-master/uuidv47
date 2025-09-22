import { describe, it, expect, beforeEach } from "vitest";
import {
  encodeV4Facade,
  decodeV4Facade,
  batchEncodeV4Facade,
  batchDecodeV4Facade,
  encodeV4FacadeWithOptions,
  decodeV4FacadeWithOptions,
  batchEncodeV4FacadeWithOptions,
  batchDecodeV4FacadeWithOptions,
} from "../src/core";
import { getUUIDVersion, parseUUID } from "../src/uuid";
import { createKey, generateRandomKey } from "../src/key-management";
import { UUIDVersion } from "../src/constants";
import type { UUID128, UUIDv47Key, UUIDOperationOptions } from "../src/types";

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

describe("Core UUID Operations", () => {
  describe("Encode/Decode Roundtrip", () => {
    it("should perform perfect roundtrip transformation", () => {
      const key: UUIDv47Key = {
        k0: 0x0123456789abcdefn,
        k1: 0xfedcba9876543210n,
      };

      // Test with multiple combinations
      for (let i = 0; i < 16; i++) {
        const timestamp = BigInt(0x100000 * i + 123);
        const randA = (0x0aaa ^ (i * 7)) & 0x0fff;
        const randB =
          (0x0123456789abcdefn ^ (0x1111111111111111n * BigInt(i))) & ((1n << 62n) - 1n);

        const originalV7 = craftV7(timestamp, randA, randB);

        // Encode to facade
        const facade = encodeV4Facade(originalV7, key);
        expect(getUUIDVersion(facade)).toBe(4);
        expect(facade[8] & 0xc0).toBe(0x80); // RFC4122 variant

        // Decode back to original
        const decodedV7 = decodeV4Facade(facade, key);
        expect(decodedV7).toEqual(originalV7);

        // Test with wrong key - should NOT match
        const wrongKey: UUIDv47Key = {
          k0: key.k0 ^ 0xdeadbeefn,
          k1: key.k1 ^ 0x1337n,
        };

        const badDecode = decodeV4Facade(facade, wrongKey);
        expect(badDecode).not.toEqual(originalV7);
      }
    });

    it("should handle edge cases in roundtrip transformation", () => {
      const key: UUIDv47Key = { k0: 0x1234n, k1: 0x5678n };

      // Test with minimum values
      const minV7 = craftV7(0n, 0, 0n);
      const minFacade = encodeV4Facade(minV7, key);
      const minDecoded = decodeV4Facade(minFacade, key);
      expect(minDecoded).toEqual(minV7);

      // Test with maximum values
      const maxTimestamp = 0x0000ffffffffffffn;
      const maxRandA = 0x0fff;
      const maxRandB = (1n << 62n) - 1n;

      const maxV7 = craftV7(maxTimestamp, maxRandA, maxRandB);
      const maxFacade = encodeV4Facade(maxV7, key);
      const maxDecoded = decodeV4Facade(maxFacade, key);
      expect(maxDecoded).toEqual(maxV7);
    });

    it("should preserve random bits across transformation", () => {
      const v7 = craftV7(0x123456789abcn, 0x0abc, 0x0123456789abcdefn & ((1n << 62n) - 1n));
      const key: UUIDv47Key = { k0: 0x1111n, k1: 0x2222n };

      const facade = encodeV4Facade(v7, key);

      // Random bits should be identical
      expect(facade[6] & 0x0f).toBe(v7[6] & 0x0f);
      expect(facade[7]).toBe(v7[7]);
      expect(facade[8] & 0x3f).toBe(v7[8] & 0x3f);
      expect(facade.subarray(9, 16)).toEqual(v7.subarray(9, 16));
    });

    it("should validate input UUID versions", () => {
      const key = createKey(0x123n, 0x456n);
      const v7 = craftV7(0x123456789abcn, 0x0abc, 0x456789abcdefn);
      const v4Facade = encodeV4Facade(v7, key);

      // Test encoding with wrong version
      const wrongVersion = Buffer.from(v7);
      wrongVersion[6] = (wrongVersion[6] & 0x0f) | (4 << 4); // Set to v4
      expect(() => encodeV4Facade(wrongVersion, key)).toThrow("Input UUID must be version 7");

      // Test decoding with wrong version
      const wrongVersionFacade = Buffer.from(v4Facade);
      wrongVersionFacade[6] = (wrongVersionFacade[6] & 0x0f) | (7 << 4); // Set to v7
      expect(() => decodeV4Facade(wrongVersionFacade, key)).toThrow("Input UUID must be version 4");
    });
  });

  describe("Core Operations with Options", () => {
    let testKey: UUIDv47Key;
    let testV7: UUID128;
    let testV4Facade: UUID128;

    beforeEach(() => {
      testKey = createKey(0x0123456789abcdefn, 0xfedcba9876543210n);
      testV7 = craftV7(0x123456789abcn, 0x0abc, 0x456789abcdefn);
      testV4Facade = encodeV4Facade(testV7, testKey);
    });

    it("should encode with options", () => {
      // Test with validation
      const encoded1 = encodeV4FacadeWithOptions(testV7, testKey);
      expect(getUUIDVersion(encoded1)).toBe(UUIDVersion.V4);

      // Test without validation for performance
      const encoded2 = encodeV4FacadeWithOptions(testV7, testKey, { skipValidation: true });
      expect(encoded2).toEqual(encoded1);

      // Test error with wrong version when validation enabled
      const wrongVersion = Buffer.from(testV7);
      wrongVersion[6] = (wrongVersion[6] & 0x0f) | (4 << 4); // Set to v4
      expect(() => encodeV4FacadeWithOptions(wrongVersion, testKey)).toThrow();

      // Test no error with wrong version when validation disabled
      const encoded3 = encodeV4FacadeWithOptions(wrongVersion, testKey, { skipValidation: true });
      expect(getUUIDVersion(encoded3)).toBe(UUIDVersion.V4);
    });

    it("should decode with options", () => {
      // Test with validation
      const decoded1 = decodeV4FacadeWithOptions(testV4Facade, testKey);
      expect(decoded1).toEqual(testV7);

      // Test without validation for performance
      const decoded2 = decodeV4FacadeWithOptions(testV4Facade, testKey, { skipValidation: true });
      expect(decoded2).toEqual(testV7);

      // Test error with wrong version when validation enabled
      const wrongVersion = Buffer.from(testV4Facade);
      wrongVersion[6] = (wrongVersion[6] & 0x0f) | (7 << 4); // Set to v7
      expect(() => decodeV4FacadeWithOptions(wrongVersion, testKey)).toThrow();

      // Test no error with wrong version when validation disabled
      const decoded3 = decodeV4FacadeWithOptions(wrongVersion, testKey, { skipValidation: true });
      expect(getUUIDVersion(decoded3)).toBe(UUIDVersion.V7);
    });

    it("should handle undefined and empty options", () => {
      // Test with undefined options
      const encoded1 = encodeV4FacadeWithOptions(testV7, testKey, undefined);
      expect(getUUIDVersion(encoded1)).toBe(UUIDVersion.V4);

      // Test with empty options object
      const encoded2 = encodeV4FacadeWithOptions(testV7, testKey, {});
      expect(encoded2).toEqual(encoded1);

      // Test decoding with options
      const decoded1 = decodeV4FacadeWithOptions(testV4Facade, testKey, undefined);
      const decoded2 = decodeV4FacadeWithOptions(testV4Facade, testKey, {});
      expect(decoded1).toEqual(decoded2);
    });
  });

  describe("Batch Operations", () => {
    let testKey: UUIDv47Key;
    let testUuids: UUID128[];

    beforeEach(() => {
      testKey = generateRandomKey();
      testUuids = Array.from({ length: 10 }, (_, i) =>
        craftV7(BigInt(0x100000 + i), 0x0abc + i, BigInt(0x456789abcdef + i)),
      );
    });

    it("should perform batch encoding correctly", () => {
      const encoded = batchEncodeV4Facade(testUuids, testKey);

      expect(encoded).toHaveLength(testUuids.length);
      encoded.forEach((uuid) => {
        expect(getUUIDVersion(uuid)).toBe(UUIDVersion.V4);
      });
    });

    it("should perform batch decoding correctly", () => {
      const encoded = batchEncodeV4Facade(testUuids, testKey);
      const decoded = batchDecodeV4Facade(encoded, testKey);

      expect(decoded).toEqual(testUuids);
    });

    it("should handle empty arrays", () => {
      const emptyArray: UUID128[] = [];

      const encoded = batchEncodeV4Facade(emptyArray, testKey);
      expect(encoded).toHaveLength(0);

      const decoded = batchDecodeV4Facade(emptyArray, testKey);
      expect(decoded).toHaveLength(0);
    });

    it("should handle single UUID in batch", () => {
      const singleUuid = [testUuids[0]];

      const encoded = batchEncodeV4Facade(singleUuid, testKey);
      expect(encoded).toHaveLength(1);
      expect(getUUIDVersion(encoded[0])).toBe(UUIDVersion.V4);

      const decoded = batchDecodeV4Facade(encoded, testKey);
      expect(decoded).toEqual(singleUuid);
    });
  });

  describe("Batch Operations with Options", () => {
    let testKey: UUIDv47Key;
    let testUuids: UUID128[];

    beforeEach(() => {
      testKey = generateRandomKey();
      testUuids = Array.from({ length: 5 }, (_, i) =>
        craftV7(BigInt(0x100000 + i), 0x0abc + i, BigInt(0x456789abcdef + i)),
      );
    });

    it("should perform batch encoding with options", () => {
      // Test with batch processing enabled (default)
      const encoded1 = batchEncodeV4FacadeWithOptions(testUuids, testKey);
      expect(encoded1).toHaveLength(testUuids.length);
      encoded1.forEach((uuid) => {
        expect(getUUIDVersion(uuid)).toBe(UUIDVersion.V4);
      });

      // Test with batch processing disabled
      const encoded2 = batchEncodeV4FacadeWithOptions(testUuids, testKey, {
        useBatchProcessing: false,
      });
      expect(encoded2).toEqual(encoded1);

      // Test with skip validation
      const encoded3 = batchEncodeV4FacadeWithOptions(testUuids, testKey, {
        skipValidation: true,
        useBatchProcessing: false,
      });
      expect(encoded3).toHaveLength(testUuids.length);
    });

    it("should perform batch decoding with options", () => {
      const encoded = batchEncodeV4Facade(testUuids, testKey);

      // Test with batch processing enabled (default)
      const decoded1 = batchDecodeV4FacadeWithOptions(encoded, testKey);
      expect(decoded1).toEqual(testUuids);

      // Test with batch processing disabled
      const decoded2 = batchDecodeV4FacadeWithOptions(encoded, testKey, {
        useBatchProcessing: false,
      });
      expect(decoded2).toEqual(testUuids);

      // Test with skip validation
      const decoded3 = batchDecodeV4FacadeWithOptions(encoded, testKey, {
        skipValidation: true,
        useBatchProcessing: false,
      });
      expect(decoded3).toEqual(testUuids);
    });

    it("should handle various option combinations", () => {
      const options: UUIDOperationOptions[] = [
        {},
        { skipValidation: true },
        { useBatchProcessing: false },
        { skipValidation: true, useBatchProcessing: false },
        { skipValidation: false, useBatchProcessing: true },
      ];

      options.forEach((option) => {
        const encoded = batchEncodeV4FacadeWithOptions(testUuids, testKey, option);
        const decoded = batchDecodeV4FacadeWithOptions(encoded, testKey, option);
        expect(decoded).toEqual(testUuids);
      });
    });
  });

  describe("Performance and Consistency", () => {
    it("should maintain consistent results across multiple operations", () => {
      const key = createKey(0xaabbccddeeff1122n, 0x3344556677889900n);
      const uuid = craftV7(0x123456789abcn, 0x0def, 0x456789abcdef0123n & ((1n << 62n) - 1n));

      // Perform encoding multiple times
      const results = Array.from({ length: 100 }, () => encodeV4Facade(uuid, key));

      // All results should be identical
      results.forEach((result) => {
        expect(result).toEqual(results[0]);
      });

      // All should decode back to original
      results.forEach((result) => {
        const decoded = decodeV4Facade(result, key);
        expect(decoded).toEqual(uuid);
      });
    });

    it("should handle all byte value ranges correctly", () => {
      const key: UUIDv47Key = { k0: 0xaaaan, k1: 0xbbbbn };

      const testPatterns = [
        { ts: 0x000000000000n, ra: 0x000, rb: 0x0000000000000000n },
        { ts: 0xffffffffffffn, ra: 0xfff, rb: 0x3fffffffffffffffn },
        { ts: 0xaaaaaaaaaaaan, ra: 0xaaa, rb: 0x2aaaaaaaaaaaaaaan },
        { ts: 0x555555555555n, ra: 0x555, rb: 0x1555555555555555n },
      ];

      testPatterns.forEach(({ ts, ra, rb }) => {
        const v7 = craftV7(ts, ra, rb);
        const facade = encodeV4Facade(v7, key);
        const decoded = decodeV4Facade(facade, key);

        expect(decoded).toEqual(v7);
      });
    });
  });
});
