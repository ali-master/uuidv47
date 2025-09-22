import { describe, it, expect } from "vitest";
import { computeSipHash, computeSipHashFixed10Bytes } from "../src/sip-hash";
import { createKey } from "../src/key-management";
import type { UUIDv47Key } from "../src/types";

// Test helper for SipHash reference implementation
class TestSipHash {
  private static rotLeft64(value: bigint, bits: number): bigint {
    const shift = BigInt(bits);
    return ((value << shift) | (value >> (64n - shift))) & 0xffffffffffffffffn;
  }

  private static leBytesToU64(bytes: Buffer): bigint {
    return (
      BigInt(bytes[0]) |
      (BigInt(bytes[1]) << 8n) |
      (BigInt(bytes[2]) << 16n) |
      (BigInt(bytes[3]) << 24n) |
      (BigInt(bytes[4]) << 32n) |
      (BigInt(bytes[5]) << 40n) |
      (BigInt(bytes[6]) << 48n) |
      (BigInt(bytes[7]) << 56n)
    );
  }

  static compute(input: Buffer, k0: bigint, k1: bigint): bigint {
    let v0 = 0x736f6d6570736575n ^ k0;
    let v1 = 0x646f72616e646f6dn ^ k1;
    let v2 = 0x6c7967656e657261n ^ k0;
    let v3 = 0x7465646279746573n ^ k1;

    const inputLength = input.length;
    let offset = 0;

    // Process full 8-byte blocks
    while (offset + 8 <= inputLength) {
      const m = this.leBytesToU64(input.subarray(offset, offset + 8));
      v3 ^= m;

      // 2 compression rounds
      for (let i = 0; i < 2; i++) {
        v0 = (v0 + v1) & 0xffffffffffffffffn;
        v2 = (v2 + v3) & 0xffffffffffffffffn;
        v1 = this.rotLeft64(v1, 13);
        v3 = this.rotLeft64(v3, 16);
        v1 ^= v0;
        v3 ^= v2;
        v0 = this.rotLeft64(v0, 32);
        v2 = (v2 + v1) & 0xffffffffffffffffn;
        v0 = (v0 + v3) & 0xffffffffffffffffn;
        v1 = this.rotLeft64(v1, 17);
        v3 = this.rotLeft64(v3, 21);
        v1 ^= v2;
        v3 ^= v0;
        v2 = this.rotLeft64(v2, 32);
      }

      v0 ^= m;
      offset += 8;
    }

    // Handle last 0-7 bytes with length encoding
    let lastBlock = BigInt(inputLength) << 56n;
    const remaining = inputLength & 7;

    for (let i = 0; i < remaining; i++) {
      lastBlock |= BigInt(input[offset + i]) << BigInt(i * 8);
    }

    v3 ^= lastBlock;

    // 2 compression rounds for last block
    for (let i = 0; i < 2; i++) {
      v0 = (v0 + v1) & 0xffffffffffffffffn;
      v2 = (v2 + v3) & 0xffffffffffffffffn;
      v1 = this.rotLeft64(v1, 13);
      v3 = this.rotLeft64(v3, 16);
      v1 ^= v0;
      v3 ^= v2;
      v0 = this.rotLeft64(v0, 32);
      v2 = (v2 + v1) & 0xffffffffffffffffn;
      v0 = (v0 + v3) & 0xffffffffffffffffn;
      v1 = this.rotLeft64(v1, 17);
      v3 = this.rotLeft64(v3, 21);
      v1 ^= v2;
      v3 ^= v0;
      v2 = this.rotLeft64(v2, 32);
    }

    v0 ^= lastBlock;

    // Finalization: v2 ^= 0xff, then 4 rounds
    v2 ^= 0xffn;
    for (let i = 0; i < 4; i++) {
      v0 = (v0 + v1) & 0xffffffffffffffffn;
      v2 = (v2 + v3) & 0xffffffffffffffffn;
      v1 = this.rotLeft64(v1, 13);
      v3 = this.rotLeft64(v3, 16);
      v1 ^= v0;
      v3 ^= v2;
      v0 = this.rotLeft64(v0, 32);
      v2 = (v2 + v1) & 0xffffffffffffffffn;
      v0 = (v0 + v3) & 0xffffffffffffffffn;
      v1 = this.rotLeft64(v1, 17);
      v3 = this.rotLeft64(v3, 21);
      v1 ^= v2;
      v3 ^= v0;
      v2 = this.rotLeft64(v2, 32);
    }

    return v0 ^ v1 ^ v2 ^ v3;
  }
}

describe("SipHash Implementation", () => {
  describe("SipHash Test Vectors", () => {
    it("should match known SipHash test vectors", () => {
      const k0 = 0x0706050403020100n;
      const k1 = 0x0f0e0d0c0b0a0908n;

      const expectedVectors = [
        [0x31, 0x0e, 0x0e, 0xdd, 0x47, 0xdb, 0x6f, 0x72], // len 0
        [0xfd, 0x67, 0xdc, 0x93, 0xc5, 0x39, 0xf8, 0x74], // len 1
        [0x5a, 0x4f, 0xa9, 0xd9, 0x09, 0x80, 0x6c, 0x0d], // len 2
        [0x2d, 0x7e, 0xfb, 0xd7, 0x96, 0x66, 0x67, 0x85], // len 3
        [0xb7, 0x87, 0x71, 0x27, 0xe0, 0x94, 0x27, 0xcf], // len 4
        [0x8d, 0xa6, 0x99, 0xcd, 0x64, 0x55, 0x76, 0x18], // len 5
        [0xce, 0xe3, 0xfe, 0x58, 0x6e, 0x46, 0xc9, 0xcb], // len 6
        [0x37, 0xd1, 0x01, 0x8b, 0xf5, 0x00, 0x02, 0xab], // len 7
        [0x62, 0x24, 0x93, 0x9a, 0x79, 0xf5, 0xf5, 0x93], // len 8
        [0xb0, 0xe4, 0xa9, 0x0b, 0xdf, 0x82, 0x00, 0x9e], // len 9
        [0xf3, 0xb9, 0xdd, 0x94, 0xc5, 0xbb, 0x5d, 0x7a], // len 10
        [0xa7, 0xad, 0x6b, 0x22, 0x46, 0x2f, 0xb3, 0xf4], // len 11
        [0xfb, 0xe5, 0x0e, 0x86, 0xbc, 0x8f, 0x1e, 0x75], // len 12
      ];

      const key = createKey(k0, k1);
      const message = Buffer.allocUnsafe(64);
      for (let i = 0; i < 64; i++) {
        message[i] = i;
      }

      // Test each length
      for (let len = 0; len < expectedVectors.length; len++) {
        const input = message.subarray(0, len);
        const computed = computeSipHash(input, key);
        const expected = TestSipHash.leBytesToU64(Buffer.from(expectedVectors[len]));

        expect(computed).toBe(expected);
      }
    });

    it("should handle additional message lengths", () => {
      const k0 = 0x0706050403020100n;
      const k1 = 0x0f0e0d0c0b0a0908n;
      const key = createKey(k0, k1);
      const message = Buffer.allocUnsafe(64);
      for (let i = 0; i < 64; i++) {
        message[i] = i;
      }

      const lengths = [13, 14, 15, 16, 17, 20, 32, 63];
      lengths.forEach((len) => {
        const input = message.subarray(0, len);
        const result = computeSipHash(input, key);
        expect(typeof result).toBe("bigint");
        expect(result).not.toBe(0n);
      });
    });

    it("should match reference implementation", () => {
      const testCases = [
        { input: Buffer.from([]), k0: 0n, k1: 0n },
        { input: Buffer.from([1, 2, 3]), k0: 0x123n, k1: 0x456n },
        {
          input: Buffer.from([0xff, 0xfe, 0xfd, 0xfc, 0xfb, 0xfa, 0xf9, 0xf8]),
          k0: 0xdeadbeefn,
          k1: 0xcafebabn,
        },
      ];

      testCases.forEach(({ input, k0, k1 }) => {
        const key = createKey(k0, k1);
        const optimized = computeSipHash(input, key);
        const reference = TestSipHash.compute(input, k0, k1);
        expect(optimized).toBe(reference);
      });
    });
  });

  describe("Optimized SipHash Implementation", () => {
    it("should compute SipHash consistently", () => {
      const testMessage = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const key = createKey(0x0123456789abcdefn, 0xfedcba9876543210n);

      const hash1 = computeSipHashFixed10Bytes(testMessage, key);
      const hash2 = computeSipHashFixed10Bytes(testMessage, key);

      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe("bigint");
    });

    it("should produce different hashes for different inputs", () => {
      const key = createKey(0x1111111111111111n, 0x2222222222222222n);
      const message1 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const message2 = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 11]);

      const hash1 = computeSipHashFixed10Bytes(message1, key);
      const hash2 = computeSipHashFixed10Bytes(message2, key);

      expect(hash1).not.toBe(hash2);
    });

    it("should produce different hashes for different keys", () => {
      const message = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const key1 = createKey(0x1111111111111111n, 0x2222222222222222n);
      const key2 = createKey(0x3333333333333333n, 0x4444444444444444n);

      const hash1 = computeSipHashFixed10Bytes(message, key1);
      const hash2 = computeSipHashFixed10Bytes(message, key2);

      expect(hash1).not.toBe(hash2);
    });

    it("should match general implementation for 10-byte inputs", () => {
      const testMessages = [
        Buffer.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
        Buffer.from([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]),
        Buffer.from([255, 254, 253, 252, 251, 250, 249, 248, 247, 246]),
      ];

      const key = createKey(0xaabbccddeeff1122n, 0x3344556677889900n);

      testMessages.forEach((message) => {
        const generalHash = computeSipHash(message, key);
        const optimizedHash = computeSipHashFixed10Bytes(message, key);
        expect(optimizedHash).toBe(generalHash);
      });
    });

    it("should handle edge case inputs", () => {
      const key = createKey(0n, 0n);
      const edgeMessages = [
        Buffer.alloc(10, 0), // All zeros
        Buffer.alloc(10, 255), // All 0xFF
        Buffer.from([1, 0, 1, 0, 1, 0, 1, 0, 1, 0]), // Alternating pattern
      ];

      edgeMessages.forEach((message) => {
        const hash = computeSipHashFixed10Bytes(message, key);
        expect(typeof hash).toBe("bigint");
        // Hash should be deterministic
        const hash2 = computeSipHashFixed10Bytes(message, key);
        expect(hash).toBe(hash2);
      });
    });
  });

  describe("Performance Characteristics", () => {
    it("should be performant for many operations", () => {
      const key = createKey(0x123456789abcdefn, 0xfedcba9876543210n);
      const message = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        computeSipHashFixed10Bytes(message, key);
      }
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    it("should show performance benefit for fixed-length variant", () => {
      const key = createKey(0x123456789abcdefn, 0xfedcba9876543210n);
      const message = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const iterations = 1000;

      // Time general implementation
      const startGeneral = performance.now();
      for (let i = 0; i < iterations; i++) {
        computeSipHash(message, key);
      }
      const endGeneral = performance.now();
      const generalTime = endGeneral - startGeneral;

      // Time optimized implementation
      const startOptimized = performance.now();
      for (let i = 0; i < iterations; i++) {
        computeSipHashFixed10Bytes(message, key);
      }
      const endOptimized = performance.now();
      const optimizedTime = endOptimized - startOptimized;

      // Optimized should be faster or at least not significantly slower
      expect(optimizedTime).toBeLessThanOrEqual(generalTime * 1.5);
    });
  });

  describe("Cryptographic Properties", () => {
    it("should have good avalanche effect", () => {
      const key = createKey(0x123456789abcdefn, 0xfedcba9876543210n);
      const baseMessage = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const baseHash = computeSipHashFixed10Bytes(baseMessage, key);

      // Change each bit and verify hash changes significantly
      for (let byteIndex = 0; byteIndex < 10; byteIndex++) {
        for (let bitIndex = 0; bitIndex < 8; bitIndex++) {
          const modifiedMessage = Buffer.from(baseMessage);
          modifiedMessage[byteIndex] ^= 1 << bitIndex;

          const modifiedHash = computeSipHashFixed10Bytes(modifiedMessage, key);
          expect(modifiedHash).not.toBe(baseHash);

          // Check that many bits changed (avalanche effect)
          const xor = baseHash ^ modifiedHash;
          const bitsChanged = xor.toString(2).split("1").length - 1;
          expect(bitsChanged).toBeGreaterThan(16); // Should change many bits
        }
      }
    });

    it("should distribute hash values well", () => {
      const key = createKey(0x987654321abcdef0n, 0x123456789abcdef0n);
      const hashes = new Set<bigint>();

      // Generate many hashes with sequential inputs
      for (let i = 0; i < 1000; i++) {
        const message = Buffer.alloc(10);
        message.writeUInt32LE(i, 0);
        message.writeUInt32LE(i * 2, 4);
        message.writeUInt16LE(i % 65536, 8);

        const hash = computeSipHashFixed10Bytes(message, key);
        hashes.add(hash);
      }

      // Should have good distribution (very few collisions)
      expect(hashes.size).toBeGreaterThan(990); // Less than 1% collision rate
    });

    it("should be deterministic across multiple runs", () => {
      const key = createKey(0xaabbccddeeff1122n, 0x3344556677889900n);
      const message = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x11, 0x22]);

      const results = Array.from({ length: 100 }, () => computeSipHashFixed10Bytes(message, key));

      // All results should be identical
      results.forEach((result) => {
        expect(result).toBe(results[0]);
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle various message lengths in general implementation", () => {
      const key = createKey(0x123n, 0x456n);
      const lengths = [0, 1, 7, 8, 9, 15, 16, 17, 31, 32, 33];

      lengths.forEach((len) => {
        const message = Buffer.alloc(len, len % 256);
        const hash = computeSipHash(message, key);
        expect(typeof hash).toBe("bigint");
      });
    });

    it("should handle zero keys", () => {
      const zeroKey = createKey(0n, 0n);
      const message = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      const hash = computeSipHashFixed10Bytes(message, zeroKey);
      expect(typeof hash).toBe("bigint");
      expect(hash).not.toBe(0n); // Should still produce non-zero hash
    });

    it("should handle maximum key values", () => {
      const maxKey = createKey(0xffffffffffffffffn, 0xffffffffffffffffn);
      const message = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

      const hash = computeSipHashFixed10Bytes(message, maxKey);
      expect(typeof hash).toBe("bigint");
    });
  });
});
