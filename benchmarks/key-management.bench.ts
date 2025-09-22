import { describe, bench } from "vitest";
import { createKey, createKeyFromBuffer, generateRandomKey } from "../src";

describe("UUIDv47 Key Management", () => {
  // Pre-generated test data
  const testKeyBuffers = Array.from({ length: 100 }, () => {
    const buffer = Buffer.alloc(16);
    require("crypto").randomFillSync(buffer);
    return buffer;
  });

  const testBigIntPairs = Array.from({ length: 100 }, () => ({
    k0: BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
    k1: BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)),
  }));

  bench(
    "generateRandomKey - single key",
    () => {
      generateRandomKey();
    },
    {
      iterations: 10_000,
    },
  );

  bench(
    "generateRandomKey - batch 100 keys",
    () => {
      for (let i = 0; i < 100; i++) {
        generateRandomKey();
      }
    },
    {
      iterations: 1_000,
    },
  );

  bench(
    "createKey from bigints",
    () => {
      const pair = testBigIntPairs[0];
      createKey(pair.k0, pair.k1);
    },
    {
      iterations: 100_000,
    },
  );

  bench(
    "createKeyFromBuffer",
    () => {
      createKeyFromBuffer(testKeyBuffers[0]);
    },
    {
      iterations: 50_000,
    },
  );

  bench(
    "createKeyFromBuffer - batch 100 keys",
    () => {
      for (let i = 0; i < 100; i++) {
        createKeyFromBuffer(testKeyBuffers[i]);
      }
    },
    {
      iterations: 1_000,
    },
  );

  bench(
    "key creation comparison - random vs from buffer",
    () => {
      // Simulate choosing between random generation and buffer creation
      const useRandom = Math.random() > 0.5;
      if (useRandom) {
        generateRandomKey();
      } else {
        createKeyFromBuffer(testKeyBuffers[0]);
      }
    },
    {
      iterations: 20_000,
    },
  );
});
