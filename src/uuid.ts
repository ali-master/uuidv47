import { CONSTANTS, hexChars, UUIDVersion } from "./constants";
import type { UUID128 } from "./types";

/**
 * Gets the version of a UUID
 */
export function getUUIDVersion(uuid: UUID128): UUIDVersion {
  return (uuid[6] >> CONSTANTS.VERSION_SHIFT) & CONSTANTS.VERSION_MASK;
}

/**
 * Sets the version of a UUID
 */
export function setUUIDVersion(uuid: UUID128, version: UUIDVersion): void {
  uuid[6] =
    (uuid[6] & CONSTANTS.VERSION_MASK) |
    ((version & CONSTANTS.VERSION_MASK) << CONSTANTS.VERSION_SHIFT);
}

/**
 * Sets RFC4122 variant bits
 */
export function setVariantRFC4122(uuid: UUID128): void {
  uuid[8] = (uuid[8] & CONSTANTS.VARIANT_MASK_CLEAR) | CONSTANTS.VARIANT_RFC4122;
}

/**
 * Builds SipHash input from v7 UUID's random bits
 */
export function buildSipHashInput(uuid: UUID128): Buffer {
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
function hexValue(char: string): number {
  const code = char.charCodeAt(0);
  if (code >= 48 && code <= 57) return code - 48; // 0-9
  if (code >= 97 && code <= 102) return code - 87; // a-f
  if (code >= 65 && code <= 70) return code - 55; // A-F
  return -1;
}

/**
 * Parses UUID string in canonical format (8-4-4-4-12)
 */
export function parseUUID(uuidString: string): UUID128 {
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
    const highNibble = hexValue(uuidString[hexPositions[i * 2]]);
    const lowNibble = hexValue(uuidString[hexPositions[i * 2 + 1]]);

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
export function formatUUID(uuid: UUID128): string {
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
