import type { UUID128, UUIDv47Key } from "./types";
import { buildSipHashInput, getUUIDVersion, setUUIDVersion, setVariantRFC4122 } from "./uuid";
import { CONSTANTS, UUIDVersion } from "./constants";
import { computeSipHash } from "./sip-hash";
import { read48BitsBE, write48BitsBE } from "./byte-operations";

/**
 * Encodes a UUIDv7 into a UUIDv4 facade using the provided key
 */
export function encodeV4Facade(uuidV7: UUID128, key: UUIDv47Key): UUID128 {
  if (getUUIDVersion(uuidV7) !== UUIDVersion.V7) {
    throw new Error("Input UUID must be version 7");
  }

  // Generate mask from random bits using SipHash
  const sipInput = buildSipHashInput(uuidV7);
  const hashResult = computeSipHash(sipInput, key);
  const mask48 = hashResult & CONSTANTS.MASK_48_BITS;

  // Extract and encrypt timestamp
  const timestamp48 = read48BitsBE(uuidV7, 0);
  const encryptedTimestamp = timestamp48 ^ mask48;

  // Create v4 facade
  const result = Buffer.from(uuidV7);
  write48BitsBE(result, encryptedTimestamp, 0);
  setUUIDVersion(result, UUIDVersion.V4);
  setVariantRFC4122(result);

  return result;
}

/**
 * Decodes a UUIDv4 facade back to original UUIDv7 using the provided key
 */
export function decodeV4Facade(uuidV4Facade: UUID128, key: UUIDv47Key): UUID128 {
  if (getUUIDVersion(uuidV4Facade) !== UUIDVersion.V4) {
    throw new Error("Input UUID must be version 4");
  }

  // Rebuild the same SipHash input from facade (identical random bytes)
  const sipInput = buildSipHashInput(uuidV4Facade);
  const hashResult = computeSipHash(sipInput, key);
  const mask48 = hashResult & CONSTANTS.MASK_48_BITS;

  // Decrypt timestamp
  const encryptedTimestamp = read48BitsBE(uuidV4Facade, 0);
  const originalTimestamp = encryptedTimestamp ^ mask48;

  // Restore original v7
  const result = Buffer.from(uuidV4Facade);
  write48BitsBE(result, originalTimestamp, 0);
  setUUIDVersion(result, UUIDVersion.V7);
  setVariantRFC4122(result);

  return result;
}
