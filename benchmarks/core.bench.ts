import { bench, describe } from "vitest";
import {
  encodeV4Facade,
  decodeV4Facade,
  batchEncodeV4Facade,
  batchDecodeV4Facade,
  encodeV4FacadeWithOptions,
  decodeV4FacadeWithOptions,
  batchEncodeV4FacadeWithOptions,
  batchDecodeV4FacadeWithOptions,
  generateRandomKey,
  parseUUID,
  formatUUID,
  type UUID128,
  type UUIDv47Key,
} from "../src";

// Helper function to craft v7 UUIDs for testing
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
  uuid[6] = (uuid[6] & 0xf0) | ((randA12 >> 8) & 0x0f);
  uuid[7] = randA12 & 0xff;

  // Set RFC4122 variant and rand_b
  uuid[8] = (uuid[8] & 0x3f) | 0x80;
  uuid[8] = (uuid[8] & 0xc0) | (Number(randB62 >> 56n) & 0x3f);

  for (let i = 0; i < 7; i++) {
    uuid[9 + i] = Number((randB62 >> BigInt(8 * (6 - i))) & 0xffn);
  }

  return uuid;
}

// Test data setup
const key = generateRandomKey();
const sampleV7 = craftV7(0x018f4e7c3c4an, 0x789, 0x123456789abcdefn & ((1n << 62n) - 1n));
const sampleV4Facade = encodeV4Facade(sampleV7, key);

// Batch test data
const batchSizes = [10, 100, 1000];
const testBatches = batchSizes.reduce(
  (acc, size) => {
    acc[size] = {
      v7UUIDs: Array.from({ length: size }, (_, i) =>
        craftV7(BigInt(Date.now() + i), 0x123 + i, BigInt(0x456789abcdef + i)),
      ),
    };
    return acc;
  },
  {} as Record<number, { v7UUIDs: UUID128[] }>,
);

// Pre-encode v4 facades for decoding benchmarks
Object.keys(testBatches).forEach((size) => {
  const sizeNum = Number(size);
  testBatches[sizeNum].v4Facades = batchEncodeV4Facade(testBatches[sizeNum].v7UUIDs, key);
});

describe("Core UUID Transformation Benchmarks", () => {
  describe("Single UUID Operations", () => {
    bench("encodeV4Facade - standard", () => {
      encodeV4Facade(sampleV7, key);
    });

    bench("encodeV4FacadeWithOptions - with validation", () => {
      encodeV4FacadeWithOptions(sampleV7, key, { skipValidation: false });
    });

    bench("encodeV4FacadeWithOptions - skip validation", () => {
      encodeV4FacadeWithOptions(sampleV7, key, { skipValidation: true });
    });

    bench("decodeV4Facade - standard", () => {
      decodeV4Facade(sampleV4Facade, key);
    });

    bench("decodeV4FacadeWithOptions - with validation", () => {
      decodeV4FacadeWithOptions(sampleV4Facade, key, { skipValidation: false });
    });

    bench("decodeV4FacadeWithOptions - skip validation", () => {
      decodeV4FacadeWithOptions(sampleV4Facade, key, { skipValidation: true });
    });
  });

  describe("Batch Operations - Size Comparison", () => {
    batchSizes.forEach((size) => {
      const testData = testBatches[size];

      bench(`batchEncodeV4Facade - ${size} UUIDs`, () => {
        batchEncodeV4Facade(testData.v7UUIDs, key);
      });

      bench(`batchDecodeV4Facade - ${size} UUIDs`, () => {
        batchDecodeV4Facade(testData.v4Facades, key);
      });

      bench(`batchEncodeV4FacadeWithOptions - ${size} UUIDs (batch)`, () => {
        batchEncodeV4FacadeWithOptions(testData.v7UUIDs, key, {
          useBatchProcessing: true,
        });
      });

      bench(`batchEncodeV4FacadeWithOptions - ${size} UUIDs (individual)`, () => {
        batchEncodeV4FacadeWithOptions(testData.v7UUIDs, key, {
          useBatchProcessing: false,
        });
      });

      bench(`batchDecodeV4FacadeWithOptions - ${size} UUIDs (batch)`, () => {
        batchDecodeV4FacadeWithOptions(testData.v4Facades, key, {
          useBatchProcessing: true,
        });
      });

      bench(`batchDecodeV4FacadeWithOptions - ${size} UUIDs (individual)`, () => {
        batchDecodeV4FacadeWithOptions(testData.v4Facades, key, {
          useBatchProcessing: false,
        });
      });
    });
  });

  describe("Performance Optimization Validation", () => {
    const mediumBatch = testBatches[100];

    bench("Standard batch encode vs individual encode comparison", () => {
      batchEncodeV4Facade(mediumBatch.v7UUIDs, key);
    });

    bench("Individual encode (for comparison)", () => {
      mediumBatch.v7UUIDs.map((uuid) => encodeV4Facade(uuid, key));
    });

    bench("Skip validation vs full validation - encode", () => {
      batchEncodeV4FacadeWithOptions(mediumBatch.v7UUIDs, key, {
        skipValidation: true,
        useBatchProcessing: true,
      });
    });

    bench("Full validation - encode (for comparison)", () => {
      batchEncodeV4FacadeWithOptions(mediumBatch.v7UUIDs, key, {
        skipValidation: false,
        useBatchProcessing: true,
      });
    });
  });

  describe("Round-trip Performance", () => {
    const roundtripBatch = testBatches[100];

    bench("Complete round-trip: encode + decode (standard)", () => {
      const encoded = batchEncodeV4Facade(roundtripBatch.v7UUIDs, key);
      batchDecodeV4Facade(encoded, key);
    });

    bench("Complete round-trip: encode + decode (optimized)", () => {
      const encoded = batchEncodeV4FacadeWithOptions(roundtripBatch.v7UUIDs, key, {
        skipValidation: true,
        useBatchProcessing: true,
      });
      batchDecodeV4FacadeWithOptions(encoded, key, {
        skipValidation: true,
        useBatchProcessing: true,
      });
    });

    bench("Individual round-trip operations", () => {
      roundtripBatch.v7UUIDs.forEach((uuid) => {
        const encoded = encodeV4Facade(uuid, key);
        decodeV4Facade(encoded, key);
      });
    });
  });

  describe("Memory Efficiency Tests", () => {
    const largeBatch = Array.from({ length: 10000 }, (_, i) =>
      craftV7(BigInt(Date.now() + i), i % 4096, BigInt(0x123456789 + i)),
    );

    bench(
      "Large batch encoding (10k UUIDs)",
      () => {
        batchEncodeV4Facade(largeBatch, key);
      },
      { iterations: 10 },
    );

    bench(
      "Large batch decoding (10k UUIDs)",
      () => {
        const encoded = batchEncodeV4Facade(largeBatch, key);
        batchDecodeV4Facade(encoded, key);
      },
      { iterations: 10 },
    );

    bench(
      "Memory-optimized large batch (10k UUIDs)",
      () => {
        batchEncodeV4FacadeWithOptions(largeBatch, key, {
          skipValidation: true,
          useBatchProcessing: true,
        });
      },
      { iterations: 10 },
    );
  });
});
