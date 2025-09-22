import { describe, bench } from "vitest";
import { type UUIDv47Key } from "../src";
import { decodeV4Facade, encodeV4Facade } from "../src/core";

describe("UUIDv47 Core Operations", () => {
  // Pre-generate test data for consistent benchmarking
  const testKey: UUIDv47Key = {
    k0: 0x0123456789abcdefn,
    k1: 0xfedcba9876543210n,
  };

  const testV7UUIDs = Array.from({ length: 1000 }, (_, i) => {
    const timestamp = Buffer.alloc(6);
    timestamp.writeUIntBE(Date.now() + i, 0, 6);

    const randomBytes = Buffer.alloc(10);
    require("crypto").randomFillSync(randomBytes);

    const v7UUID = Buffer.concat([timestamp, randomBytes]);
    v7UUID[6] = (v7UUID[6] & 0x0f) | 0x70; // Set version 7
    v7UUID[8] = (v7UUID[8] & 0x3f) | 0x80; // Set RFC4122 variant

    return v7UUID;
  });

  const testV4Facades = testV7UUIDs.map((uuid) => encodeV4Facade(uuid, testKey));

  bench(
    "encodeV4Facade - single UUID",
    () => {
      encodeV4Facade(testV7UUIDs[0], testKey);
    },
    {
      iterations: 50_000,
    },
  );

  bench(
    "decodeV4Facade - single UUID",
    () => {
      decodeV4Facade(testV4Facades[0], testKey);
    },
    {
      iterations: 50_000,
    },
  );

  bench(
    "encodeV4Facade - batch 100 UUIDs",
    () => {
      for (let i = 0; i < 100; i++) {
        encodeV4Facade(testV7UUIDs[i], testKey);
      }
    },
    {
      iterations: 1_000,
    },
  );

  bench(
    "decodeV4Facade - batch 100 UUIDs",
    () => {
      for (let i = 0; i < 100; i++) {
        decodeV4Facade(testV4Facades[i], testKey);
      }
    },
    {
      iterations: 1_000,
    },
  );

  bench(
    "roundtrip transformation - encode + decode",
    () => {
      const facade = encodeV4Facade(testV7UUIDs[0], testKey);
      decodeV4Facade(facade, testKey);
    },
    {
      iterations: 25_000,
    },
  );
});
