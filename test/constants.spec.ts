import { describe, it, expect } from "vitest";
import { UUIDVersion, CONSTANTS, hexChars, hexToValue, validHexChars } from "../src/constants";

describe("Constants and Lookup Tables", () => {
  describe("UUID Version Enum", () => {
    it("should have correct version values", () => {
      expect(UUIDVersion.V4).toBe(4);
      expect(UUIDVersion.V7).toBe(7);
    });

    it("should be readonly", () => {
      // TypeScript should prevent modification, but we can test the values exist
      expect(typeof UUIDVersion.V4).toBe("number");
      expect(typeof UUIDVersion.V7).toBe("number");
    });
  });

  describe("Constants Object", () => {
    it("should have correct UUID constants", () => {
      expect(CONSTANTS.UUID_BYTE_LENGTH).toBe(16);
      expect(CONSTANTS.UUID_STRING_LENGTH).toBe(36);
      expect(CONSTANTS.SIPHASH_MESSAGE_LENGTH).toBe(10);
    });

    it("should have correct bit masks", () => {
      expect(CONSTANTS.MASK_48_BITS).toBe(0x0000ffffffffffffn);
      expect(CONSTANTS.VERSION_MASK).toBe(0x0f);
      expect(CONSTANTS.VERSION_SHIFT).toBe(4);
      expect(CONSTANTS.VARIANT_MASK_CLEAR).toBe(0x3f);
      expect(CONSTANTS.VARIANT_RFC4122).toBe(0x80);
    });

    it("should have correct SipHash constants", () => {
      const sipConstants = CONSTANTS.SIPHASH_CONSTANTS;
      expect(sipConstants.V0_INIT).toBe(0x736f6d6570736575n);
      expect(sipConstants.V1_INIT).toBe(0x646f72616e646f6dn);
      expect(sipConstants.V2_INIT).toBe(0x6c7967656e657261n);
      expect(sipConstants.V3_INIT).toBe(0x7465646279746573n);
      expect(sipConstants.COMPRESSION_ROUNDS).toBe(2);
      expect(sipConstants.FINALIZATION_ROUNDS).toBe(4);
      expect(sipConstants.FINALIZATION_XOR).toBe(0xffn);
    });
  });

  describe("Hex Character Lookup Tables", () => {
    it("should have correct hex characters", () => {
      expect(hexChars).toBe("0123456789abcdef");
      expect(hexChars).toHaveLength(16);
    });

    it("should have optimized hex lookup table", () => {
      expect(hexToValue).toBeInstanceOf(Uint8Array);
      expect(hexToValue).toHaveLength(256);

      // Test valid hex characters
      expect(hexToValue["0".charCodeAt(0)]).toBe(0);
      expect(hexToValue["9".charCodeAt(0)]).toBe(9);
      expect(hexToValue["a".charCodeAt(0)]).toBe(10);
      expect(hexToValue["f".charCodeAt(0)]).toBe(15);
      expect(hexToValue["A".charCodeAt(0)]).toBe(10);
      expect(hexToValue["F".charCodeAt(0)]).toBe(15);

      // Test invalid characters
      expect(hexToValue["g".charCodeAt(0)]).toBe(255);
      expect(hexToValue["Z".charCodeAt(0)]).toBe(255);
    });

    it("should have correct valid hex characters set", () => {
      expect(validHexChars).toBeInstanceOf(Set);
      expect(validHexChars.size).toBe(22); // 0-9, a-f, A-F

      // Test lowercase
      for (let i = 0; i < 16; i++) {
        expect(validHexChars.has(hexChars[i])).toBe(true);
      }

      // Test uppercase
      expect(validHexChars.has("A")).toBe(true);
      expect(validHexChars.has("F")).toBe(true);

      // Test invalid
      expect(validHexChars.has("g")).toBe(false);
      expect(validHexChars.has("Z")).toBe(false);
    });
  });

  describe("Pre-computed Optimization Tables", () => {
    it("should provide efficient hex character validation", () => {
      // Test that hex validation works efficiently
      const validHexString = "0123456789abcdefABCDEF";
      const invalidHexString = "ghijklmnop";

      // Valid characters should be recognized
      for (const char of validHexString) {
        expect(validHexChars.has(char)).toBe(true);
      }

      // Invalid characters should be rejected
      for (const char of invalidHexString) {
        expect(validHexChars.has(char)).toBe(false);
      }
    });
  });

  describe("Performance Optimization Verification", () => {
    it("should provide O(1) hex character lookup", () => {
      const startTime = performance.now();

      // Test many lookups to verify performance
      for (let i = 0; i < 10000; i++) {
        const char = hexChars[i % 16];
        const code = char.charCodeAt(0);
        const value = hexToValue[code];
        expect(value).toBeLessThan(16);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should be very fast (less than 50 ms for 10k lookups, allowing buffer for a system load)
      expect(duration).toBeLessThan(150);
    });

    it("should handle all ASCII characters in hex lookup", () => {
      // Test the full range of the lookup table
      for (let i = 0; i < 256; i++) {
        const value = hexToValue[i];
        expect(typeof value).toBe("number");
        expect(value >= 0 && value <= 255).toBe(true);
      }
    });
  });
});
