import { decodeV4Facade, encodeV4Facade } from "./core";
import type { UUID128, UUIDv47Key } from "./types";
import { createKey, createKeyFromBuffer, generateRandomKey } from "./key-management";
import { formatUUID, getUUIDVersion, parseUUID } from "./uuid";
import type { UUIDVersion } from "./constants";

/**
 * Main UUIDv47 implementation class
 */
export class UUIDv47 {
  /**
   * Encodes a UUIDv7 into a UUIDv4 facade using the provided key
   */
  static encodeV4Facade(uuidV7: UUID128, key: UUIDv47Key): UUID128 {
    return encodeV4Facade(uuidV7, key);
  }

  /**
   * Decodes a UUIDv4 facade back to original UUIDv7 using the provided key
   */
  static decodeV4Facade(uuidV4Facade: UUID128, key: UUIDv47Key): UUID128 {
    return decodeV4Facade(uuidV4Facade, key);
  }

  /**
   * Creates a UUIDv47Key from two 64-bit values
   */
  static createKey(k0: bigint, k1: bigint): UUIDv47Key {
    return createKey(k0, k1);
  }

  /**
   * Creates a UUIDv47Key from a 16-byte buffer
   */
  static createKeyFromBuffer(keyBuffer: Buffer): UUIDv47Key {
    return createKeyFromBuffer(keyBuffer);
  }

  /**
   * Generates a cryptographically secure random key
   */
  static generateRandomKey(): UUIDv47Key {
    return generateRandomKey();
  }

  /**
   * Parses a UUID string into a Buffer
   */
  static parseUUID(uuidString: string): UUID128 {
    return parseUUID(uuidString);
  }

  /**
   * Formats a UUID Buffer as a string
   */
  static formatUUID(uuid: UUID128): string {
    return formatUUID(uuid);
  }

  /**
   * Gets the version of a UUID
   */
  static getUUIDVersion(uuid: UUID128): UUIDVersion {
    return getUUIDVersion(uuid);
  }
}

/**
 * Default export for convenience
 */
export default UUIDv47;
