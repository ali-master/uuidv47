import { randomBytes } from "crypto";
import type { UUIDv47Key } from "./types";

/**
 * Creates a UUIDv47Key from two 64-bit values
 */
export function createKey(k0: bigint, k1: bigint): UUIDv47Key {
  return Object.freeze({ k0, k1 });
}

/**
 * Creates a UUIDv47Key from a 16-byte buffer
 */
export function createKeyFromBuffer(keyBuffer: Buffer): UUIDv47Key {
  if (keyBuffer.length !== 16) {
    throw new Error("Key buffer must be exactly 16 bytes");
  }

  // Use native Buffer methods for maximum performance
  return Object.freeze({
    k0: keyBuffer.readBigUInt64LE(0),
    k1: keyBuffer.readBigUInt64LE(8),
  });
}

/**
 * Generates a cryptographically secure random key
 */
export function generateRandomKey(): UUIDv47Key {
  return createKeyFromBuffer(randomBytes(16));
}

/**
 * Convert key to buffer for serialization with optimized byte operations
 */
export function keyToBuffer(key: UUIDv47Key): Buffer {
  const buffer = Buffer.allocUnsafe(16);
  buffer.writeBigUInt64LE(key.k0, 0);
  buffer.writeBigUInt64LE(key.k1, 8);

  return buffer;
}

/**
 * key validation
 */
export function isValidKey(key: any): key is UUIDv47Key {
  return (
    typeof key === "object" &&
    key !== null &&
    typeof key.k0 === "bigint" &&
    typeof key.k1 === "bigint"
  );
}

/**
 * Batch key generation
 */
export function generateRandomKeys(count: number): UUIDv47Key[] {
  const results = new Array<UUIDv47Key>(count);
  const batchBuffer = randomBytes(16 * count);

  for (let i = 0; i < count; i++) {
    const offset = i * 16;
    results[i] = Object.freeze({
      k0: batchBuffer.readBigUInt64LE(offset),
      k1: batchBuffer.readBigUInt64LE(offset + 8),
    });
  }

  return results;
}
