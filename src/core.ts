import type { UUID128, UUIDv47Key, UUIDOperationOptions } from "./types";
import { buildSipHashInput, getUUIDVersion, setUUIDVersion, setVariantRFC4122 } from "./uuid";
import { CONSTANTS, UUIDVersion } from "./constants";
import { computeSipHashFixed10Bytes } from "./sip-hash";
import { read48BitsBE, write48BitsBE } from "./byte-operations";

/**
 * UUIDv7 to UUIDv4 facade encoding with optimized SipHash
 */
export function encodeV4Facade(uuidV7: UUID128, key: UUIDv47Key): UUID128 {
  if (getUUIDVersion(uuidV7) !== UUIDVersion.V7) {
    throw new Error("Input UUID must be version 7");
  }

  // Generate mask from random bits using optimized SipHash
  const sipInput = buildSipHashInput(uuidV7);
  const hashResult = computeSipHashFixed10Bytes(sipInput, key);
  const mask48 = hashResult & CONSTANTS.MASK_48_BITS;

  // Extract and encrypt timestamp with single operations
  const timestamp48 = read48BitsBE(uuidV7, 0);
  const encryptedTimestamp = timestamp48 ^ mask48;

  // Create v4 facade with minimal buffer operations
  const result = Buffer.from(uuidV7);
  write48BitsBE(result, encryptedTimestamp, 0);
  setUUIDVersion(result, UUIDVersion.V4);
  setVariantRFC4122(result);

  return result;
}

/**
 * UUIDv4 facade to UUIDv7 decoding with optimized SipHash
 */
export function decodeV4Facade(uuidV4Facade: UUID128, key: UUIDv47Key): UUID128 {
  if (getUUIDVersion(uuidV4Facade) !== UUIDVersion.V4) {
    throw new Error("Input UUID must be version 4");
  }

  // Rebuild the same SipHash input from facade using optimized implementation
  const sipInput = buildSipHashInput(uuidV4Facade);
  const hashResult = computeSipHashFixed10Bytes(sipInput, key);
  const mask48 = hashResult & CONSTANTS.MASK_48_BITS;

  // Decrypt timestamp with single operations
  const encryptedTimestamp = read48BitsBE(uuidV4Facade, 0);
  const originalTimestamp = encryptedTimestamp ^ mask48;

  // Restore original v7 with minimal buffer operations
  const result = Buffer.from(uuidV4Facade);
  write48BitsBE(result, originalTimestamp, 0);
  setUUIDVersion(result, UUIDVersion.V7);
  setVariantRFC4122(result);

  return result;
}

/**
 * Batch encoding function for maximum throughput when processing multiple UUIDs
 */
export function batchEncodeV4Facade(uuids: UUID128[], key: UUIDv47Key): UUID128[] {
  const results = new Array<UUID128>(uuids.length);

  for (let i = 0; i < uuids.length; i++) {
    results[i] = encodeV4Facade(uuids[i], key);
  }

  return results;
}

/**
 * Batch decoding function for maximum throughput when processing multiple UUIDs
 */
export function batchDecodeV4Facade(uuids: UUID128[], key: UUIDv47Key): UUID128[] {
  const results = new Array<UUID128>(uuids.length);

  for (let i = 0; i < uuids.length; i++) {
    results[i] = decodeV4Facade(uuids[i], key);
  }

  return results;
}

/**
 * encoding with performance options
 */
export function encodeV4FacadeWithOptions(
  uuidV7: UUID128,
  key: UUIDv47Key,
  options?: UUIDOperationOptions,
): UUID128 {
  const skipValidation = options?.skipValidation ?? false;

  if (!skipValidation && getUUIDVersion(uuidV7) !== UUIDVersion.V7) {
    throw new Error("Input UUID must be version 7");
  }

  // Generate mask from random bits using optimized SipHash
  const sipInput = buildSipHashInput(uuidV7);
  const hashResult = computeSipHashFixed10Bytes(sipInput, key);
  const mask48 = hashResult & CONSTANTS.MASK_48_BITS;

  // Extract and encrypt timestamp with single operations
  const timestamp48 = read48BitsBE(uuidV7, 0);
  const encryptedTimestamp = timestamp48 ^ mask48;

  // Create v4 facade with minimal buffer operations
  const result = Buffer.from(uuidV7);
  write48BitsBE(result, encryptedTimestamp, 0);
  setUUIDVersion(result, UUIDVersion.V4);
  setVariantRFC4122(result);

  return result;
}

/**
 * decoding with performance options
 */
export function decodeV4FacadeWithOptions(
  uuidV4Facade: UUID128,
  key: UUIDv47Key,
  options?: UUIDOperationOptions,
): UUID128 {
  const skipValidation = options?.skipValidation ?? false;

  if (!skipValidation && getUUIDVersion(uuidV4Facade) !== UUIDVersion.V4) {
    throw new Error("Input UUID must be version 4");
  }

  // Rebuild the same SipHash input from facade using optimized implementation
  const sipInput = buildSipHashInput(uuidV4Facade);
  const hashResult = computeSipHashFixed10Bytes(sipInput, key);
  const mask48 = hashResult & CONSTANTS.MASK_48_BITS;

  // Decrypt timestamp with single operations
  const encryptedTimestamp = read48BitsBE(uuidV4Facade, 0);
  const originalTimestamp = encryptedTimestamp ^ mask48;

  // Restore original v7 with minimal buffer operations
  const result = Buffer.from(uuidV4Facade);
  write48BitsBE(result, originalTimestamp, 0);
  setUUIDVersion(result, UUIDVersion.V7);
  setVariantRFC4122(result);

  return result;
}

/**
 * batch encoding with performance options
 */
export function batchEncodeV4FacadeWithOptions(
  uuids: UUID128[],
  key: UUIDv47Key,
  options?: UUIDOperationOptions,
): UUID128[] {
  const useBatchProcessing = options?.useBatchProcessing ?? true;

  if (useBatchProcessing) {
    return batchEncodeV4Facade(uuids, key);
  }

  // Process individually with options
  return uuids.map((uuid) => encodeV4FacadeWithOptions(uuid, key, options));
}

/**
 * batch decoding with performance options
 */
export function batchDecodeV4FacadeWithOptions(
  uuids: UUID128[],
  key: UUIDv47Key,
  options?: UUIDOperationOptions,
): UUID128[] {
  const useBatchProcessing = options?.useBatchProcessing ?? true;

  if (useBatchProcessing) {
    return batchDecodeV4Facade(uuids, key);
  }

  // Process individually with options
  return uuids.map((uuid) => decodeV4FacadeWithOptions(uuid, key, options));
}
