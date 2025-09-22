import { bench, describe } from "vitest";
import {
  parseUUID,
  formatUUID,
  parseUUIDWithOptions,
  isValidUUIDString,
  getUUIDVersion,
  setUUIDVersion,
  setVariantRFC4122,
  buildSipHashInput,
  UUIDVersion,
  type UUID128,
  type UUIDOperationOptions,
} from "../src";

// Test data setup
const validUUIDs = [
  "018f4e7c-3c4a-7000-8000-123456789abc", // UUIDv7
  "a1b2c3d4-e5f6-4000-8000-123456789abc", // UUIDv4
  "00000000-0000-0000-0000-000000000000", // Zero UUID
  "ffffffff-ffff-ffff-ffff-ffffffffffff", // Max UUID
  "12345678-90ab-cdef-1234-567890abcdef", // Mixed case
  "ABCDEF01-2345-6789-ABCD-EF0123456789", // Uppercase
];

const invalidUUIDs = [
  "invalid-length",
  "01234567-89ab-cdef-0123-456789abcde", // too short
  "01234567-89ab-cdef-0123-456789abcdefg", // too long
  "01234567+89ab+cdef+0123+456789abcdef", // wrong separators
  "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz", // invalid hex
  "01234567-89ab-cdef-0123-456789abcdeg", // invalid hex at end
  "",
  "not-a-uuid-at-all",
];

const parsedUUIDs = validUUIDs.map((uuid) => parseUUID(uuid));
const mixedValidation = [...validUUIDs, ...invalidUUIDs];

describe("UUID Parsing and Formatting Benchmarks", () => {
  describe("Basic Parsing Performance", () => {
    bench("parseUUID - UUIDv7", () => {
      parseUUID("018f4e7c-3c4a-7000-8000-123456789abc");
    });

    bench("parseUUID - UUIDv4", () => {
      parseUUID("a1b2c3d4-e5f6-4000-8000-123456789abc");
    });

    bench("parseUUID - zero UUID", () => {
      parseUUID("00000000-0000-0000-0000-000000000000");
    });

    bench("parseUUID - max UUID", () => {
      parseUUID("ffffffff-ffff-ffff-ffff-ffffffffffff");
    });

    bench("parseUUID - mixed case", () => {
      parseUUID("ABCDEF01-2345-6789-abcd-ef0123456789");
    });

    bench("parseUUID - batch processing (100 UUIDs)", () => {
      const batch = Array(100).fill("018f4e7c-3c4a-7000-8000-123456789abc");
      batch.forEach((uuid) => parseUUID(uuid));
    });
  });

  describe("Enhanced Parsing with Options", () => {
    bench("parseUUIDWithOptions - default options", () => {
      parseUUIDWithOptions("018f4e7c-3c4a-7000-8000-123456789abc");
    });

    bench("parseUUIDWithOptions - skip validation", () => {
      parseUUIDWithOptions("018f4e7c-3c4a-7000-8000-123456789abc", {
        skipValidation: true,
      });
    });

    bench("parseUUIDWithOptions - with validation", () => {
      parseUUIDWithOptions("018f4e7c-3c4a-7000-8000-123456789abc", {
        skipValidation: false,
      });
    });

    bench("parseUUIDWithOptions - invalid UUID (graceful)", () => {
      parseUUIDWithOptions("invalid-uuid-string");
    });

    bench("parseUUIDWithOptions - batch valid UUIDs", () => {
      validUUIDs.forEach((uuid) => parseUUIDWithOptions(uuid, { skipValidation: true }));
    });

    bench("parseUUIDWithOptions - batch mixed validity", () => {
      mixedValidation.forEach((uuid) => parseUUIDWithOptions(uuid));
    });
  });

  describe("UUID Validation Performance", () => {
    bench("isValidUUIDString - valid UUID", () => {
      isValidUUIDString("018f4e7c-3c4a-7000-8000-123456789abc");
    });

    bench("isValidUUIDString - invalid UUID", () => {
      isValidUUIDString("invalid-uuid-string");
    });

    bench("isValidUUIDString - batch valid UUIDs", () => {
      validUUIDs.forEach((uuid) => isValidUUIDString(uuid));
    });

    bench("isValidUUIDString - batch invalid UUIDs", () => {
      invalidUUIDs.forEach((uuid) => isValidUUIDString(uuid));
    });

    bench("isValidUUIDString - batch mixed validity", () => {
      mixedValidation.forEach((uuid) => isValidUUIDString(uuid));
    });

    bench("isValidUUIDString vs parseUUID - validation only", () => {
      const uuid = "018f4e7c-3c4a-7000-8000-123456789abc";
      isValidUUIDString(uuid);
    });

    bench("parseUUID - validation comparison", () => {
      try {
        parseUUID("018f4e7c-3c4a-7000-8000-123456789abc");
      } catch (e) {
        // Handle errors
      }
    });
  });

  describe("UUID Formatting Performance", () => {
    bench("formatUUID - single UUID", () => {
      formatUUID(parsedUUIDs[0]);
    });

    bench("formatUUID - batch formatting (100 UUIDs)", () => {
      const batch = Array(100).fill(parsedUUIDs[0]);
      batch.forEach((uuid) => formatUUID(uuid));
    });

    bench("formatUUID - different UUID patterns", () => {
      parsedUUIDs.forEach((uuid) => formatUUID(uuid));
    });

    bench("Parse + Format roundtrip", () => {
      const original = "018f4e7c-3c4a-7000-8000-123456789abc";
      const parsed = parseUUID(original);
      formatUUID(parsed);
    });

    bench("Parse + Format roundtrip (batch)", () => {
      validUUIDs.forEach((uuid) => {
        const parsed = parseUUID(uuid);
        formatUUID(parsed);
      });
    });
  });

  describe("UUID Version Operations", () => {
    bench("getUUIDVersion - single UUID", () => {
      getUUIDVersion(parsedUUIDs[0]);
    });

    bench("getUUIDVersion - batch processing", () => {
      parsedUUIDs.forEach((uuid) => getUUIDVersion(uuid));
    });

    bench("setUUIDVersion - v4 to v7", () => {
      const uuid = Buffer.from(parsedUUIDs[1]); // Copy to avoid mutation
      setUUIDVersion(uuid, UUIDVersion.V7);
    });

    bench("setUUIDVersion - v7 to v4", () => {
      const uuid = Buffer.from(parsedUUIDs[0]); // Copy to avoid mutation
      setUUIDVersion(uuid, UUIDVersion.V4);
    });

    bench("setVariantRFC4122 - single UUID", () => {
      const uuid = Buffer.from(parsedUUIDs[0]);
      setVariantRFC4122(uuid);
    });

    bench("Version manipulation pipeline", () => {
      const uuid = Buffer.from(parsedUUIDs[0]);
      getUUIDVersion(uuid);
      setUUIDVersion(uuid, UUIDVersion.V4);
      setVariantRFC4122(uuid);
    });
  });

  describe("Advanced UUID Operations", () => {
    bench("buildSipHashInput - single UUID", () => {
      buildSipHashInput(parsedUUIDs[0]);
    });

    bench("buildSipHashInput - batch processing", () => {
      parsedUUIDs.forEach((uuid) => buildSipHashInput(uuid));
    });

    bench("Complete UUID processing pipeline", () => {
      const uuidString = "018f4e7c-3c4a-7000-8000-123456789abc";
      const parsed = parseUUID(uuidString);
      const version = getUUIDVersion(parsed);
      const sipInput = buildSipHashInput(parsed);
      const formatted = formatUUID(parsed);
    });
  });

  describe("Performance Optimization Comparisons", () => {
    bench("Standard parsing vs options parsing", () => {
      parseUUID("018f4e7c-3c4a-7000-8000-123456789abc");
    });

    bench("Options parsing (for comparison)", () => {
      parseUUIDWithOptions("018f4e7c-3c4a-7000-8000-123456789abc");
    });

    bench("Validation-only vs full parsing", () => {
      isValidUUIDString("018f4e7c-3c4a-7000-8000-123456789abc");
    });

    bench("Full parsing (for comparison)", () => {
      parseUUID("018f4e7c-3c4a-7000-8000-123456789abc");
    });

    bench("Skip validation benefit demonstration", () => {
      parseUUIDWithOptions("018f4e7c-3c4a-7000-8000-123456789abc", {
        skipValidation: true,
      });
    });

    bench("With validation (for comparison)", () => {
      parseUUIDWithOptions("018f4e7c-3c4a-7000-8000-123456789abc", {
        skipValidation: false,
      });
    });
  });

  describe("Error Handling Performance", () => {
    bench("parseUUID - error handling", () => {
      try {
        parseUUID("invalid-uuid");
      } catch (e) {
        // Expected error
      }
    });

    bench("parseUUIDWithOptions - graceful error handling", () => {
      const result = parseUUIDWithOptions("invalid-uuid");
      // No exception thrown, just returns invalid result
    });

    bench("isValidUUIDString - fast rejection", () => {
      isValidUUIDString("obviously-not-a-uuid");
    });

    bench("Batch error handling - mixed validity", () => {
      mixedValidation.forEach((uuid) => {
        try {
          if (isValidUUIDString(uuid)) {
            parseUUID(uuid);
          }
        } catch (e) {
          // Handle errors
        }
      });
    });
  });

  describe("Memory Efficiency Tests", () => {
    const largeBatch = Array(10000).fill("018f4e7c-3c4a-7000-8000-123456789abc");

    bench(
      "Large batch parsing (10k UUIDs)",
      () => {
        largeBatch.forEach((uuid) => parseUUID(uuid));
      },
      { iterations: 10 },
    );

    bench(
      "Large batch validation (10k UUIDs)",
      () => {
        largeBatch.forEach((uuid) => isValidUUIDString(uuid));
      },
      { iterations: 10 },
    );

    bench(
      "Large batch formatting (10k UUIDs)",
      () => {
        const parsed = largeBatch.map((uuid) => parseUUID(uuid));
        parsed.forEach((uuid) => formatUUID(uuid));
      },
      { iterations: 10 },
    );

    bench(
      "Memory-optimized parsing with options",
      () => {
        largeBatch.forEach((uuid) => parseUUIDWithOptions(uuid, { skipValidation: true }));
      },
      { iterations: 10 },
    );
  });

  describe("Real-World Usage Patterns", () => {
    bench("API validation pattern", () => {
      const apiInput = "018f4e7c-3c4a-7000-8000-123456789abc";
      if (isValidUUIDString(apiInput)) {
        const parsed = parseUUID(apiInput);
        const version = getUUIDVersion(parsed);
        // Process based on version
      }
    });

    bench("Database storage pattern", () => {
      const uuid = parseUUID("018f4e7c-3c4a-7000-8000-123456789abc");
      // Convert to string for storage
      const stored = formatUUID(uuid);
      // Parse back from storage
      parseUUID(stored);
    });

    bench("Bulk processing pattern", () => {
      const uuids = validUUIDs.slice(0, 3);
      const processed = uuids
        .filter((uuid) => isValidUUIDString(uuid))
        .map((uuid) => parseUUID(uuid))
        .map((uuid) => ({
          uuid,
          version: getUUIDVersion(uuid),
          sipInput: buildSipHashInput(uuid),
        }));
    });

    bench("Transform pipeline pattern", () => {
      const input = "018f4e7c-3c4a-7000-8000-123456789abc";
      const result = parseUUIDWithOptions(input);
      if (result.isValid) {
        const modified = Buffer.from(result.uuid);
        setUUIDVersion(modified, UUIDVersion.V4);
        setVariantRFC4122(modified);
        formatUUID(modified);
      }
    });
  });
});
