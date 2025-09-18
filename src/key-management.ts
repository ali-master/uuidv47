import { randomBytes } from "crypto";
import type { UUIDv47Key } from "./types";

/**
 * Creates a UUIDv47Key from two 64-bit values
 */
export function createKey(k0: bigint, k1: bigint): UUIDv47Key {
  return { k0, k1 };
}

/**
 * Creates a UUIDv47Key from a 16-byte buffer
 */
export function createKeyFromBuffer(keyBuffer: Buffer): UUIDv47Key {
  if (keyBuffer.length !== 16) {
    throw new Error("Key buffer must be exactly 16 bytes");
  }

  return {
    k0: keyBuffer.readBigUInt64LE(0),
    k1: keyBuffer.readBigUInt64LE(8),
  };
}

/**
 * Generates a cryptographically secure random key
 */
export function generateRandomKey(): UUIDv47Key {
  return createKeyFromBuffer(randomBytes(16));
}
