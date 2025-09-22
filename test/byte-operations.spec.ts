import { describe, it, expect } from "vitest";
import {
  read48BitsBE,
  write48BitsBE,
  readUInt64LE,
  rotateLeft64,
  allocateUUIDBuffer,
  fastBufferCopy,
} from "../src/byte-operations";

describe("Optimized Byte Operations", () => {
  describe("48-bit Read/Write Operations", () => {
    it("should correctly read and write 48-bit values", () => {
      const buffer = Buffer.alloc(6);
      const testValue = 0x0123456789abn & 0x0000ffffffffffffn;

      write48BitsBE(buffer, testValue);
      const readValue = read48BitsBE(buffer);

      expect(readValue).toBe(testValue);
    });

    it("should handle boundary values for 48-bit operations", () => {
      const buffer = Buffer.alloc(6);

      // Test zero
      write48BitsBE(buffer, 0n);
      expect(read48BitsBE(buffer)).toBe(0n);

      // Test maximum 48-bit value
      const maxValue = 0x0000ffffffffffffn;
      write48BitsBE(buffer, maxValue);
      expect(read48BitsBE(buffer)).toBe(maxValue);
    });

    it("should perform 48-bit operations correctly with various values", () => {
      const buffer = Buffer.alloc(6);
      const testValues = [
        0x000000000000n,
        0x000000000001n,
        0x0000ffffffffffffn,
        0x0123456789abn,
        0xaabbccddeeffn,
      ];

      testValues.forEach((value) => {
        write48BitsBE(buffer, value);
        const readValue = read48BitsBE(buffer);
        expect(readValue).toBe(value & 0x0000ffffffffffffn);
      });
    });
  });

  describe("64-bit Rotation Operations", () => {
    it("should perform 64-bit rotation correctly", () => {
      const testCases = [
        { value: 0x0123456789abcdefn, bits: 1, expected: 0x02468acf13579bden },
        { value: 0x8000000000000000n, bits: 1, expected: 0x0000000000000001n },
        { value: 0x0000000000000001n, bits: 63, expected: 0x8000000000000000n },
        { value: 0xffffffffffffffffn, bits: 32, expected: 0xffffffffffffffffn },
      ];

      testCases.forEach(({ value, bits, expected }) => {
        const result = rotateLeft64(value, bits);
        expect(result).toBe(expected);
      });
    });

    it("should handle rotation edge cases", () => {
      // Test rotation by 0
      expect(rotateLeft64(0x123456789abcdefn, 0)).toBe(0x123456789abcdefn);

      // Test rotation by 64 (should be same as original)
      expect(rotateLeft64(0x123456789abcdefn, 64)).toBe(0x123456789abcdefn);

      // Test multiple rotations
      const value = 0xaabbccddeeff1122n;
      const rotated8 = rotateLeft64(value, 8);
      const rotated16 = rotateLeft64(rotated8, 8);
      expect(rotated16).toBe(rotateLeft64(value, 16));
    });
  });

  describe("Buffer Operations", () => {
    it("should allocate UUID buffers correctly", () => {
      const buffer = allocateUUIDBuffer();
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer).toHaveLength(16);
    });

    it("should perform fast buffer copy", () => {
      const source = Buffer.from([1, 2, 3, 4, 5]);
      const target = Buffer.alloc(10);

      fastBufferCopy(source, target, 0, 2, 3);
      expect(target.subarray(2, 5)).toEqual(Buffer.from([1, 2, 3]));
    });

    it("should handle various buffer copy scenarios", () => {
      const source = Buffer.from([10, 20, 30, 40, 50, 60]);
      const target = Buffer.alloc(12);

      // Copy full source
      fastBufferCopy(source, target);
      expect(target.subarray(0, 6)).toEqual(source);

      // Copy partial source
      fastBufferCopy(source, target, 2, 8, 3);
      expect(target.subarray(8, 11)).toEqual(Buffer.from([30, 40, 50]));
    });
  });

  describe("64-bit Little Endian Operations", () => {
    it("should read 64-bit little endian values correctly", () => {
      const buffer = Buffer.alloc(8);
      const testValue = 0x123456789abcdefn;

      buffer.writeBigUInt64LE(testValue, 0);
      const readValue = readUInt64LE(buffer);

      expect(readValue).toBe(testValue);
    });

    it("should handle boundary values for 64-bit operations", () => {
      const buffer = Buffer.alloc(8);

      // Test zero
      buffer.writeBigUInt64LE(0n, 0);
      expect(readUInt64LE(buffer)).toBe(0n);

      // Test maximum value
      const maxValue = 0xffffffffffffffffn;
      buffer.writeBigUInt64LE(maxValue, 0);
      expect(readUInt64LE(buffer)).toBe(maxValue);
    });

    it("should work with offset parameter", () => {
      const buffer = Buffer.alloc(16);
      const testValue = 0x987654321abcdef0n;

      buffer.writeBigUInt64LE(testValue, 8);
      const readValue = readUInt64LE(buffer, 8);

      expect(readValue).toBe(testValue);
    });
  });
});
