import {
  CONSTANTS,
  hexChars,
  hexToValue,
  DASH_POSITIONS,
  HEX_POSITIONS,
  UUID_SECTIONS,
  UUIDVersion,
} from "./constants";
import { allocateUUIDBuffer } from "./byte-operations";
import type { UUID128, UUIDOperationOptions, UUIDParseResult } from "./types";

/**
 * UUID version extraction using bit operations
 */
export function getUUIDVersion(uuid: UUID128): UUIDVersion {
  return (uuid[6] >> CONSTANTS.VERSION_SHIFT) & CONSTANTS.VERSION_MASK;
}

/**
 * Optimized UUID version setting with minimal operations
 */
export function setUUIDVersion(uuid: UUID128, version: UUIDVersion): void {
  uuid[6] =
    (uuid[6] & ~(CONSTANTS.VERSION_MASK << CONSTANTS.VERSION_SHIFT)) |
    (version << CONSTANTS.VERSION_SHIFT);
}

/**
 * Optimized RFC4122 variant setting
 */
export function setVariantRFC4122(uuid: UUID128): void {
  uuid[8] = (uuid[8] & CONSTANTS.VARIANT_MASK_CLEAR) | CONSTANTS.VARIANT_RFC4122;
}

/**
 * SipHash input builder with minimal allocations
 */
export function buildSipHashInput(uuid: UUID128): Buffer {
  // Pre-allocate buffer for maximum performance
  const message = Buffer.allocUnsafe(CONSTANTS.SIPHASH_MESSAGE_LENGTH);

  // Optimized A bit extraction with single operations
  message[0] = uuid[6] & CONSTANTS.VERSION_MASK;
  message[1] = uuid[7];
  message[2] = uuid[8] & CONSTANTS.VARIANT_MASK_CLEAR;

  // Use fast native copy for remaining bytes
  uuid.copy(message, 3, 9, 16);

  return message;
}

/**
 * hex character validations and conversion
 */
function fastHexValue(charCode: number): number {
  const value = hexToValue[charCode];
  return value === 255 ? -1 : value;
}

/**
 * UUID parser with optimized validation
 */
export function parseUUID(uuidString: string): UUID128 {
  // Fast length check
  if (uuidString.length !== CONSTANTS.UUID_STRING_LENGTH) {
    throw new Error(
      `Invalid UUID string length: expected ${CONSTANTS.UUID_STRING_LENGTH}, got ${uuidString.length}`,
    );
  }

  // Pre-allocate result buffer for maximum performance
  const result = allocateUUIDBuffer();

  // Optimized dash validation using pre-computed positions
  for (const pos of DASH_POSITIONS) {
    if (uuidString.charCodeAt(pos) !== 45) {
      // 45 is '-' character code
      throw new Error(`Invalid UUID format: missing dash at position ${pos}`);
    }
  }

  // hex parsing using lookup table and pre-computed positions
  for (let i = 0; i < CONSTANTS.UUID_BYTE_LENGTH; i++) {
    const highCharCode = uuidString.charCodeAt(HEX_POSITIONS[i * 2]);
    const lowCharCode = uuidString.charCodeAt(HEX_POSITIONS[i * 2 + 1]);

    const highNibble = fastHexValue(highCharCode);
    const lowNibble = fastHexValue(lowCharCode);

    if (highNibble === -1 || lowNibble === -1) {
      throw new Error(`Invalid hex character in UUID at position ${i * 2}`);
    }

    result[i] = (highNibble << 4) | lowNibble;
  }

  return result;
}

/**
 * UUID formatter with pre-computed layout
 */
export function formatUUID(uuid: UUID128): string {
  // Pre-allocate a string array for maximum performance
  const result: string[] = new Array(36);
  let resultIndex = 0;
  let byteIndex = 0;

  // Process each section with pre-computed lengths
  for (let sectionIndex = 0; sectionIndex < UUID_SECTIONS.length; sectionIndex++) {
    // Add dash separator (except for the first section)
    if (sectionIndex > 0) {
      result[resultIndex++] = "-";
    }

    // Process bytes in the current section
    const sectionLength = UUID_SECTIONS[sectionIndex];
    for (let i = 0; i < sectionLength; i++) {
      const byte = uuid[byteIndex++];
      result[resultIndex++] = hexChars[byte >> 4];
      result[resultIndex++] = hexChars[byte & 0xf];
    }
  }

  return result.join("");
}

/**
 * UUID parser with performance options
 */
export function parseUUIDWithOptions(
  uuidString: string,
  options?: UUIDOperationOptions,
): UUIDParseResult {
  const skipValidation = options?.skipValidation ?? false;

  try {
    if (!skipValidation) {
      // Fast length check
      if (uuidString.length !== CONSTANTS.UUID_STRING_LENGTH) {
        return {
          uuid: allocateUUIDBuffer(),
          version: 0,
          isValid: false,
        };
      }

      // Optimized dash validation using pre-computed positions
      for (const pos of DASH_POSITIONS) {
        if (uuidString.charCodeAt(pos) !== 45) {
          return {
            uuid: allocateUUIDBuffer(),
            version: 0,
            isValid: false,
          };
        }
      }
    }

    const uuid = parseUUID(uuidString);
    const version = getUUIDVersion(uuid);

    return {
      uuid,
      version,
      isValid: true,
    };
  } catch {
    return {
      uuid: allocateUUIDBuffer(),
      version: 0,
      isValid: false,
    };
  }
}

/**
 * Validate a UUID string format without full parsing
 */
export function isValidUUIDString(uuidString: string): boolean {
  if (uuidString.length !== CONSTANTS.UUID_STRING_LENGTH) {
    return false;
  }

  // Check dashes at correct positions
  for (const pos of DASH_POSITIONS) {
    if (uuidString.charCodeAt(pos) !== 45) {
      return false;
    }
  }

  // Check hex characters at all other positions
  for (let i = 0; i < CONSTANTS.UUID_BYTE_LENGTH; i++) {
    const highCharCode = uuidString.charCodeAt(HEX_POSITIONS[i * 2]);
    const lowCharCode = uuidString.charCodeAt(HEX_POSITIONS[i * 2 + 1]);

    if (fastHexValue(highCharCode) === -1 || fastHexValue(lowCharCode) === -1) {
      return false;
    }
  }

  return true;
}

/**
 * Extract the timestamp from UUID v7 and convert to Date object
 *
 * UUID v7 stores a 48-bit Unix timestamp (milliseconds since epoch) in the first 6 bytes.
 * This function extracts that timestamp and returns it as a JavaScript Date object.
 *
 * @param uuid - The UUID128 buffer to extract timestamp from
 * @returns Date object representing the timestamp embedded in the UUID v7
 * @throws Error if the UUID is not version 7
 *
 * @example
 * ```typescript
 * const uuid = parseUUID('018f4e7c-3c4a-7000-8000-123456789abc');
 * const date = extractTimestampFromV7(uuid);
 * console.log(date.toISOString()); // "2024-03-15T10:30:45.678Z"
 * ```
 */
export function extractTimestampFromV7(uuid: UUID128): Date {
  const version = getUUIDVersion(uuid);

  if (version !== UUIDVersion.V7) {
    throw new Error(`Cannot extract timestamp: UUID is version ${version}, expected version 7`);
  }

  // Extract the 48-bit timestamp from the first 6 bytes
  // UUID v7 format: timestamp_ms (48 bits) | version (4 bits) | random (12 bits) | variant (2 bits) | random (62 bits)
  // Bytes 0-5 contain the timestamp in big-endian format
  // Use Buffer's readUIntBE to properly read 48-bit integer without precision loss
  const timestampMs = uuid.readUIntBE(0, 6);

  return new Date(timestampMs);
}
