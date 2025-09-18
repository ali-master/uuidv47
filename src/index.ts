/**
 * Represents a 128-bit UUID as a Buffer
 */
export type UUID128 = Buffer;

/**
 * SipHash 128-bit key structure
 */
export interface UUIDv47Key {
  readonly k0: bigint;
  readonly k1: bigint;
}

/**
 * UUID version enumeration
 */
export enum UUIDVersion {
  V4 = 4,
  V7 = 7,
}

/**
 * Configuration constants
 */
const CONSTANTS = {
  UUID_BYTE_LENGTH: 16,
  UUID_STRING_LENGTH: 36,
  SIPHASH_MESSAGE_LENGTH: 10,
  MASK_48_BITS: 0x0000ffffffffffffn,
  VERSION_MASK: 0x0f,
  VERSION_SHIFT: 4,
  VARIANT_MASK_CLEAR: 0x3f,
  VARIANT_RFC4122: 0x80,
  SIPHASH_CONSTANTS: {
    V0_INIT: 0x736f6d6570736575n,
    V1_INIT: 0x646f72616e646f6dn,
    V2_INIT: 0x6c7967656e657261n,
    V3_INIT: 0x7465646279746573n,
    COMPRESSION_ROUNDS: 2,
    FINALIZATION_ROUNDS: 4,
    FINALIZATION_XOR: 0xffn,
  },
} as const;

/**
 * Utility class for byte operations with optimized performance
 */
class ByteOperations {
  /**
   * Reads a 64-bit little-endian value from buffer
   */
  static readUInt64LE(buffer: Buffer, offset: number = 0): bigint {
    return buffer.readBigUInt64LE(offset);
  }

  /**
   * Writes a 48-bit big-endian value to buffer
   */
  static write48BitsBE(buffer: Buffer, value: bigint, offset: number = 0): void {
    // Extract 48 bits and write as 6 bytes big-endian
    buffer[offset] = Number((value >> 40n) & 0xffn);
    buffer[offset + 1] = Number((value >> 32n) & 0xffn);
    buffer[offset + 2] = Number((value >> 24n) & 0xffn);
    buffer[offset + 3] = Number((value >> 16n) & 0xffn);
    buffer[offset + 4] = Number((value >> 8n) & 0xffn);
    buffer[offset + 5] = Number(value & 0xffn);
  }

  /**
   * Reads a 48-bit big-endian value from buffer
   */
  static read48BitsBE(buffer: Buffer, offset: number = 0): bigint {
    return (
      (BigInt(buffer[offset]) << 40n) |
      (BigInt(buffer[offset + 1]) << 32n) |
      (BigInt(buffer[offset + 2]) << 24n) |
      (BigInt(buffer[offset + 3]) << 16n) |
      (BigInt(buffer[offset + 4]) << 8n) |
      BigInt(buffer[offset + 5])
    );
  }

  /**
   * Left rotation for 64-bit values
   */
  static rotateLeft64(value: bigint, bits: number): bigint {
    const shift = BigInt(bits);
    return ((value << shift) | (value >> (64n - shift))) & 0xffffffffffffffffn;
  }
}

/**
 * SipHash-2-4 implementation optimized for TypeScript
 */
class SipHash24 {
  /**
   * Computes SipHash-2-4 hash of input data
   */
  static compute(input: Buffer, key: UUIDv47Key): bigint {
    const { k0, k1 } = key;
    const {
      V0_INIT,
      V1_INIT,
      V2_INIT,
      V3_INIT,
      COMPRESSION_ROUNDS,
      FINALIZATION_ROUNDS,
      FINALIZATION_XOR,
    } = CONSTANTS.SIPHASH_CONSTANTS;

    let v0 = V0_INIT ^ k0;
    let v1 = V1_INIT ^ k1;
    let v2 = V2_INIT ^ k0;
    let v3 = V3_INIT ^ k1;

    const inputLength = input.length;
    const fullBlocks = Math.floor(inputLength / 8);
    const remainder = inputLength % 8;

    // Process full 8-byte blocks
    let offset = 0;
    for (let i = 0; i < fullBlocks; i++) {
      const message = ByteOperations.readUInt64LE(input, offset);
      v3 ^= message;

      // Compression rounds
      for (let round = 0; round < COMPRESSION_ROUNDS; round++) {
        [v0, v1, v2, v3] = this.sipRound(v0, v1, v2, v3);
      }

      v0 ^= message;
      offset += 8;
    }

    // Process remaining bytes with length encoding
    let lastBlock = BigInt(inputLength) << 56n;
    for (let i = 0; i < remainder; i++) {
      lastBlock |= BigInt(input[offset + i]) << BigInt(i * 8);
    }

    v3 ^= lastBlock;

    // Compression rounds for last block
    for (let round = 0; round < COMPRESSION_ROUNDS; round++) {
      [v0, v1, v2, v3] = this.sipRound(v0, v1, v2, v3);
    }

    v0 ^= lastBlock;

    // Finalization
    v2 ^= FINALIZATION_XOR;
    for (let round = 0; round < FINALIZATION_ROUNDS; round++) {
      [v0, v1, v2, v3] = this.sipRound(v0, v1, v2, v3);
    }

    return v0 ^ v1 ^ v2 ^ v3;
  }

  /**
   * Single SipHash compression round
   */
  private static sipRound(
    v0: bigint,
    v1: bigint,
    v2: bigint,
    v3: bigint,
  ): [bigint, bigint, bigint, bigint] {
    v0 = (v0 + v1) & 0xffffffffffffffffn;
    v2 = (v2 + v3) & 0xffffffffffffffffn;
    v1 = ByteOperations.rotateLeft64(v1, 13);
    v3 = ByteOperations.rotateLeft64(v3, 16);
    v1 ^= v0;
    v3 ^= v2;
    v0 = ByteOperations.rotateLeft64(v0, 32);
    v2 = (v2 + v1) & 0xffffffffffffffffn;
    v0 = (v0 + v3) & 0xffffffffffffffffn;
    v1 = ByteOperations.rotateLeft64(v1, 17);
    v3 = ByteOperations.rotateLeft64(v3, 21);
    v1 ^= v2;
    v3 ^= v0;
    v2 = ByteOperations.rotateLeft64(v2, 32);

    return [v0, v1, v2, v3];
  }
}

/**
 * UUID manipulation utilities
 */
class UUIDUtils {
  /**
   * Gets the version of a UUID
   */
  static getVersion(uuid: UUID128): UUIDVersion {
    return (uuid[6] >> CONSTANTS.VERSION_SHIFT) & CONSTANTS.VERSION_MASK;
  }

  /**
   * Sets the version of a UUID
   */
  static setVersion(uuid: UUID128, version: UUIDVersion): void {
    uuid[6] =
      (uuid[6] & CONSTANTS.VERSION_MASK) |
      ((version & CONSTANTS.VERSION_MASK) << CONSTANTS.VERSION_SHIFT);
  }

  /**
   * Sets RFC4122 variant bits
   */
  static setVariantRFC4122(uuid: UUID128): void {
    uuid[8] = (uuid[8] & CONSTANTS.VARIANT_MASK_CLEAR) | CONSTANTS.VARIANT_RFC4122;
  }

  /**
   * Builds SipHash input from v7 UUID's random bits
   */
  static buildSipHashInput(uuid: UUID128): Buffer {
    const message = Buffer.allocUnsafe(CONSTANTS.SIPHASH_MESSAGE_LENGTH);

    // Extract random bits: [low-nibble of b6][b7][b8&0x3F][b9..b15]
    message[0] = uuid[6] & CONSTANTS.VERSION_MASK;
    message[1] = uuid[7];
    message[2] = uuid[8] & CONSTANTS.VARIANT_MASK_CLEAR;
    uuid.subarray(9, 16).copy(message, 3);

    return message;
  }

  /**
   * Validates hex character and returns its value
   */
  static hexValue(char: string): number {
    const code = char.charCodeAt(0);
    if (code >= 48 && code <= 57) return code - 48; // 0-9
    if (code >= 97 && code <= 102) return code - 87; // a-f
    if (code >= 65 && code <= 70) return code - 55; // A-F
    return -1;
  }

  /**
   * Parses UUID string in canonical format (8-4-4-4-12)
   */
  static parseUUIDString(uuidString: string): UUID128 {
    if (uuidString.length !== CONSTANTS.UUID_STRING_LENGTH) {
      throw new Error(
        `Invalid UUID string length: expected ${CONSTANTS.UUID_STRING_LENGTH}, got ${uuidString.length}`,
      );
    }

    const dashPositions = [8, 13, 18, 23];
    for (const pos of dashPositions) {
      if (uuidString[pos] !== "-") {
        throw new Error(`Invalid UUID format: missing dash at position ${pos}`);
      }
    }

    const hexPositions = [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7, // 8 chars
      9,
      10,
      11,
      12, // 4 chars
      14,
      15,
      16,
      17, // 4 chars
      19,
      20,
      21,
      22, // 4 chars
      24,
      25,
      26,
      27,
      28,
      29,
      30,
      31,
      32,
      33,
      34,
      35, // 12 chars
    ];

    const result = Buffer.allocUnsafe(CONSTANTS.UUID_BYTE_LENGTH);

    for (let i = 0; i < CONSTANTS.UUID_BYTE_LENGTH; i++) {
      const highNibble = this.hexValue(uuidString[hexPositions[i * 2]]);
      const lowNibble = this.hexValue(uuidString[hexPositions[i * 2 + 1]]);

      if (highNibble === -1 || lowNibble === -1) {
        throw new Error(`Invalid hex character in UUID at position ${i}`);
      }

      result[i] = (highNibble << 4) | lowNibble;
    }

    return result;
  }

  /**
   * Formats UUID as canonical string (8-4-4-4-12)
   */
  static formatUUIDString(uuid: UUID128): string {
    const hexChars = "0123456789abcdef";
    const result: string[] = [];

    let byteIndex = 0;
    const sections = [4, 2, 2, 2, 6]; // byte counts for each section

    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      if (sectionIndex > 0) {
        result.push("-");
      }

      for (let i = 0; i < sections[sectionIndex]; i++) {
        const byte = uuid[byteIndex++];
        result.push(hexChars[byte >> 4], hexChars[byte & 0xf]);
      }
    }

    return result.join("");
  }
}

/**
 * Main UUIDv47 implementation class
 */
export class UUIDv47 {
  /**
   * Encodes a UUIDv7 into a UUIDv4 facade using the provided key
   */
  static encodeV4Facade(uuidV7: UUID128, key: UUIDv47Key): UUID128 {
    if (UUIDUtils.getVersion(uuidV7) !== UUIDVersion.V7) {
      throw new Error("Input UUID must be version 7");
    }

    // Generate mask from random bits using SipHash
    const sipInput = UUIDUtils.buildSipHashInput(uuidV7);
    const hashResult = SipHash24.compute(sipInput, key);
    const mask48 = hashResult & CONSTANTS.MASK_48_BITS;

    // Extract and encrypt timestamp
    const timestamp48 = ByteOperations.read48BitsBE(uuidV7, 0);
    const encryptedTimestamp = timestamp48 ^ mask48;

    // Create v4 facade
    const result = Buffer.from(uuidV7);
    ByteOperations.write48BitsBE(result, encryptedTimestamp, 0);
    UUIDUtils.setVersion(result, UUIDVersion.V4);
    UUIDUtils.setVariantRFC4122(result);

    return result;
  }

  /**
   * Decodes a UUIDv4 facade back to original UUIDv7 using the provided key
   */
  static decodeV4Facade(uuidV4Facade: UUID128, key: UUIDv47Key): UUID128 {
    if (UUIDUtils.getVersion(uuidV4Facade) !== UUIDVersion.V4) {
      throw new Error("Input UUID must be version 4");
    }

    // Rebuild the same SipHash input from facade (identical random bytes)
    const sipInput = UUIDUtils.buildSipHashInput(uuidV4Facade);
    const hashResult = SipHash24.compute(sipInput, key);
    const mask48 = hashResult & CONSTANTS.MASK_48_BITS;

    // Decrypt timestamp
    const encryptedTimestamp = ByteOperations.read48BitsBE(uuidV4Facade, 0);
    const originalTimestamp = encryptedTimestamp ^ mask48;

    // Restore original v7
    const result = Buffer.from(uuidV4Facade);
    ByteOperations.write48BitsBE(result, originalTimestamp, 0);
    UUIDUtils.setVersion(result, UUIDVersion.V7);
    UUIDUtils.setVariantRFC4122(result);

    return result;
  }

  /**
   * Creates a UUIDv47Key from two 64-bit values
   */
  static createKey(k0: bigint, k1: bigint): UUIDv47Key {
    return { k0, k1 };
  }

  /**
   * Creates a UUIDv47Key from a 16-byte buffer
   */
  static createKeyFromBuffer(keyBuffer: Buffer): UUIDv47Key {
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
  static generateRandomKey(): UUIDv47Key {
    const { randomBytes } = require("crypto");
    return this.createKeyFromBuffer(randomBytes(16));
  }

  /**
   * Parses a UUID string into a Buffer
   */
  static parseUUID(uuidString: string): UUID128 {
    return UUIDUtils.parseUUIDString(uuidString);
  }

  /**
   * Formats a UUID Buffer as a string
   */
  static formatUUID(uuid: UUID128): string {
    return UUIDUtils.formatUUIDString(uuid);
  }

  /**
   * Gets the version of a UUID
   */
  static getUUIDVersion(uuid: UUID128): UUIDVersion {
    return UUIDUtils.getVersion(uuid);
  }
}

/**
 * Default export for convenience
 */
export default UUIDv47;
