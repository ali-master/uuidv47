import { describe, bench } from "vitest";
import { formatUUID, getUUIDVersion, parseUUID } from "../src/uuid";

describe("UUIDv47 Parse and Format Operations", () => {
  // Pre-generated test data
  const testUUIDStrings = [
    "01234567-89ab-7cde-8f01-23456789abcd",
    "018f4e7c-3c4a-7000-8000-123456789abc",
    "01900000-0000-7000-8000-000000000000",
    "019fffff-ffff-7fff-bfff-ffffffffffff",
    "01850000-1234-7567-89ab-cdef01234567",
  ];

  // Create more test strings for batch operations
  const batchUUIDStrings = Array.from({ length: 1000 }, (_, i) => {
    const timestamp = (Date.now() + i).toString(16).padStart(12, "0");
    const random = Math.random().toString(16).substring(2, 14).padStart(12, "0");
    return `${timestamp.substring(0, 8)}-${timestamp.substring(8, 12)}-7${random.substring(0, 3)}-8${random.substring(3, 6)}-${random.substring(6, 12)}${Math.random().toString(16).substring(2, 8)}`;
  });

  const testUUIDBuffers = testUUIDStrings.map((str) => parseUUID(str));
  const batchUUIDBuffers = batchUUIDStrings.map((str) => parseUUID(str));

  bench(
    "parseUUID - single UUID string",
    () => {
      parseUUID(testUUIDStrings[0]);
    },
    {
      iterations: 100_000,
    },
  );

  bench(
    "formatUUID - single UUID buffer",
    () => {
      formatUUID(testUUIDBuffers[0]);
    },
    {
      iterations: 100_000,
    },
  );

  bench(
    "parseUUID - batch 100 UUID strings",
    () => {
      for (let i = 0; i < 100; i++) {
        parseUUID(batchUUIDStrings[i]);
      }
    },
    {
      iterations: 2_000,
    },
  );

  bench(
    "formatUUID - batch 100 UUID buffers",
    () => {
      for (let i = 0; i < 100; i++) {
        formatUUID(batchUUIDBuffers[i]);
      }
    },
    {
      iterations: 2_000,
    },
  );

  bench(
    "parse-format roundtrip - single UUID",
    () => {
      const parsed = parseUUID(testUUIDStrings[0]);
      formatUUID(parsed);
    },
    {
      iterations: 50_000,
    },
  );

  bench(
    "getUUIDVersion - single UUID",
    () => {
      getUUIDVersion(testUUIDBuffers[0]);
    },
    {
      iterations: 1_000_000,
    },
  );

  bench(
    "getUUIDVersion - batch 100 UUIDs",
    () => {
      for (let i = 0; i < 100; i++) {
        getUUIDVersion(batchUUIDBuffers[i]);
      }
    },
    {
      iterations: 10_000,
    },
  );

  bench(
    "UUID validation workflow - parse + version check",
    () => {
      const parsed = parseUUID(testUUIDStrings[0]);
      const version = getUUIDVersion(parsed);
      // Simulate version validation
      version === 7;
    },
    {
      iterations: 50_000,
    },
  );
});
