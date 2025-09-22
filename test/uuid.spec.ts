import { describe, it, expect } from "vitest";
import {
  formatUUID,
  getUUIDVersion,
  parseUUID,
  parseUUIDWithOptions,
  isValidUUIDString,
  setUUIDVersion,
  setVariantRFC4122,
  buildSipHashInput,
} from "../src/uuid";
import { UUIDVersion } from "../src/constants";
import type { UUID128, UUIDOperationOptions } from "../src/types";
import { allocateUUIDBuffer } from "../src/byte-operations";

describe("UUID Operations", () => {
  describe("UUID Parse/Format Roundtrip", () => {
    it("should parse and format UUID correctly", () => {
      const testString = "00000000-0000-7000-8000-000000000000";

      const parsed = parseUUID(testString);
      expect(getUUIDVersion(parsed)).toBe(7);

      const formatted = formatUUID(parsed);
      const reparsed = parseUUID(formatted);

      expect(parsed).toEqual(reparsed);
    });

    it("should handle various UUID formats", () => {
      const testCases = [
        "01234567-89ab-cdef-0123-456789abcdef",
        "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF",
        "00000000-0000-0000-0000-000000000000",
        "a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890",
      ];

      testCases.forEach((uuidString) => {
        const parsed = parseUUID(uuidString);
        const formatted = formatUUID(parsed);
        expect(formatted.toLowerCase()).toBe(uuidString.toLowerCase());
      });
    });

    it("should reject invalid UUID strings", () => {
      const invalidUUIDs = [
        "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz",
        "01234567-89ab-cdef-0123-456789abcde", // too short
        "01234567-89ab-cdef-0123-456789abcdefg", // too long
        "01234567+89ab+cdef+0123+456789abcdef", // wrong separators
        "invalid-uuid-string",
      ];

      invalidUUIDs.forEach((invalid) => {
        expect(() => parseUUID(invalid)).toThrow();
      });
    });
  });

  describe("UUID Parsing with Options", () => {
    it("should parse UUID with options successfully", () => {
      const validUuid = "01234567-89ab-7def-8123-456789abcdef";

      // Test with default options
      const result1 = parseUUIDWithOptions(validUuid);
      expect(result1.isValid).toBe(true);
      expect(result1.version).toBe(7);
      expect(formatUUID(result1.uuid)).toBe(validUuid);

      // Test with skipValidation option
      const result2 = parseUUIDWithOptions(validUuid, { skipValidation: true });
      expect(result2.isValid).toBe(true);
      expect(result2.version).toBe(7);
    });

    it("should handle invalid UUID strings gracefully", () => {
      const invalidUuids = [
        "invalid-length",
        "01234567-89ab-7def-8123-456789abcde", // too short
        "01234567-89ab-7def-8123-456789abcdefg", // too long
        "01234567+89ab+7def+8123+456789abcdef", // wrong separators
        "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz", // invalid hex
      ];

      invalidUuids.forEach((invalid) => {
        const result = parseUUIDWithOptions(invalid);
        expect(result.isValid).toBe(false);
        expect(result.version).toBe(0);
      });
    });

    it("should skip validation when requested", () => {
      const malformedUuid = "01234567-89ab-7def-8123-456789abcdef";
      const result = parseUUIDWithOptions(malformedUuid, { skipValidation: true });
      expect(result.isValid).toBe(true);
    });

    it("should handle options parameter variations", () => {
      const validUuid = "01234567-89ab-7def-8123-456789abcdef";

      // Test with undefined options
      const result1 = parseUUIDWithOptions(validUuid, undefined);
      expect(result1.isValid).toBe(true);

      // Test with empty options object
      const result2 = parseUUIDWithOptions(validUuid, {});
      expect(result2.isValid).toBe(true);

      // Test with partial options
      const result3 = parseUUIDWithOptions(validUuid, { skipValidation: false });
      expect(result3.isValid).toBe(true);
    });
  });

  describe("UUID String Validation", () => {
    it("should validate correct UUID strings", () => {
      const validUuids = [
        "00000000-0000-0000-0000-000000000000",
        "01234567-89ab-cdef-0123-456789abcdef",
        "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF",
        "a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890",
      ];

      validUuids.forEach((uuid) => {
        expect(isValidUUIDString(uuid)).toBe(true);
      });
    });

    it("should reject invalid UUID strings", () => {
      const invalidUuids = [
        "invalid",
        "01234567-89ab-cdef-0123-456789abcde", // too short
        "01234567-89ab-cdef-0123-456789abcdefg", // too long
        "01234567+89ab+cdef+0123+456789abcdef", // wrong separators
        "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz", // invalid hex
        "01234567-89ab-cdef-0123-456789abcdeg", // invalid hex at end
      ];

      invalidUuids.forEach((uuid) => {
        expect(isValidUUIDString(uuid)).toBe(false);
      });
    });

    it("should handle edge cases in validation", () => {
      // Test empty string
      expect(isValidUUIDString("")).toBe(false);

      // Test string with correct length but wrong format
      expect(isValidUUIDString("123456789012345678901234567890123456")).toBe(false);

      // Test case sensitivity
      expect(isValidUUIDString("ABCDEF01-2345-6789-ABCD-EF0123456789")).toBe(true);
      expect(isValidUUIDString("abcdef01-2345-6789-abcd-ef0123456789")).toBe(true);
    });
  });

  describe("Version and Variant Manipulation", () => {
    it("should set and get version correctly", () => {
      const uuid = allocateUUIDBuffer();

      setUUIDVersion(uuid, UUIDVersion.V7);
      expect(getUUIDVersion(uuid)).toBe(7);

      setUUIDVersion(uuid, UUIDVersion.V4);
      expect(getUUIDVersion(uuid)).toBe(4);
    });

    it("should handle all valid version values", () => {
      const uuid = allocateUUIDBuffer();

      for (let version = 0; version <= 15; version++) {
        setUUIDVersion(uuid, version);
        expect(getUUIDVersion(uuid)).toBe(version);
      }
    });

    it("should set RFC4122 variant correctly", () => {
      const uuid = allocateUUIDBuffer();

      setVariantRFC4122(uuid);
      expect(uuid[8] & 0xc0).toBe(0x80);

      // Test that it preserves other bits
      uuid[8] = 0x3f; // Set all variant bits to 0
      setVariantRFC4122(uuid);
      expect(uuid[8] & 0x3f).toBe(0x3f); // Lower 6 bits should be preserved
      expect(uuid[8] & 0xc0).toBe(0x80); // Upper 2 bits should be 10
    });

    it("should preserve other UUID bits when setting version", () => {
      const uuid = parseUUID("01234567-89ab-cdef-0123-456789abcdef");
      const originalByte6 = uuid[6];

      setUUIDVersion(uuid, UUIDVersion.V7);

      // Version bits should change, but lower 4 bits should be preserved
      expect(uuid[6] & 0x0f).toBe(originalByte6 & 0x0f);
      expect((uuid[6] >> 4) & 0x0f).toBe(7);
    });
  });

  describe("SipHash Input Building", () => {
    it("should build SipHash input correctly", () => {
      const uuid = parseUUID("01234567-89ab-7def-8123-456789abcdef");
      const sipInput = buildSipHashInput(uuid);

      expect(sipInput).toHaveLength(10);

      // First byte should be version bits (lower 4 bits of byte 6)
      expect(sipInput[0]).toBe(uuid[6] & 0x0f);

      // Second byte should be byte 7
      expect(sipInput[1]).toBe(uuid[7]);

      // Third byte should be variant bits (lower 6 bits of byte 8)
      expect(sipInput[2]).toBe(uuid[8] & 0x3f);

      // Remaining 7 bytes should be bytes 9-15
      expect(sipInput.subarray(3, 10)).toEqual(uuid.subarray(9, 16));
    });

    it("should produce consistent SipHash input", () => {
      const uuid1 = parseUUID("01234567-89ab-7def-8123-456789abcdef");
      const uuid2 = parseUUID("01234567-89ab-7def-8123-456789abcdef");

      const sipInput1 = buildSipHashInput(uuid1);
      const sipInput2 = buildSipHashInput(uuid2);

      expect(sipInput1).toEqual(sipInput2);
    });

    it("should handle different UUID patterns", () => {
      const testUUIDs = [
        "00000000-0000-7000-8000-000000000000",
        "ffffffff-ffff-7fff-bfff-ffffffffffff",
        "12345678-9abc-7def-8123-456789abcdef",
      ];

      testUUIDs.forEach((uuidString) => {
        const uuid = parseUUID(uuidString);
        const sipInput = buildSipHashInput(uuid);

        expect(sipInput).toHaveLength(10);
        expect(sipInput[0]).toBe(uuid[6] & 0x0f);
        expect(sipInput[1]).toBe(uuid[7]);
        expect(sipInput[2]).toBe(uuid[8] & 0x3f);
      });
    });
  });

  describe("UUID Formatting Performance", () => {
    it("should format UUIDs efficiently", () => {
      const uuid = parseUUID("01234567-89ab-cdef-0123-456789abcdef");

      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        formatUUID(uuid);
      }
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100); // Should be very fast
    });

    it("should maintain formatting consistency", () => {
      const testCases = [
        {
          input: "01234567-89ab-cdef-0123-456789abcdef",
          expected: "01234567-89ab-cdef-0123-456789abcdef",
        },
        {
          input: "ABCDEF01-2345-6789-ABCD-EF0123456789",
          expected: "abcdef01-2345-6789-abcd-ef0123456789",
        },
        {
          input: "00000000-0000-0000-0000-000000000000",
          expected: "00000000-0000-0000-0000-000000000000",
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const uuid = parseUUID(input);
        const formatted = formatUUID(uuid);
        expect(formatted).toBe(expected);
      });
    });
  });
});
