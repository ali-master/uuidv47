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
export const CONSTANTS = {
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

// Pre-computed hex character arrays and lookup tables
export const hexChars = "0123456789abcdef";

// hex lookup tables - O(1) character to value conversion
export const hexToValue = new Uint8Array(256);
export const validHexChars = new Set<string>();

// Initialize hex lookup table once at module load
for (let i = 0; i < 256; i++) {
  hexToValue[i] = 255; // Invalid marker
}

// Populate valid hex characters and their values
for (let i = 0; i < 16; i++) {
  const char = hexChars[i];
  const code = char.charCodeAt(0);
  validHexChars.add(char);
  validHexChars.add(char.toUpperCase());
  hexToValue[code] = i;
  hexToValue[code - 32] = i; // Handle uppercase (A-F)
}

// Pre-computed dash positions for UUID parsing
export const DASH_POSITIONS = new Set([8, 13, 18, 23]);

// Pre-computed hex positions for faster UUID parsing
export const HEX_POSITIONS = [
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
] as const;

// Section lengths for UUID formatting
export const UUID_SECTIONS = [4, 2, 2, 2, 6] as const;

// Pre-computed bigint constants for bit operations
export const BIGINT_MASKS = {
  BYTE: 0xffn,
  WORD: 0xffffn,
  DWORD: 0xffffffffn,
  QWORD: 0xffffffffffffffffn,
  ROTATION_64: 64n,
} as const;

// Pre-computed shift amounts
export const SHIFT_AMOUNTS = {
  BITS_8: 8n,
  BITS_16: 16n,
  BITS_24: 24n,
  BITS_32: 32n,
  BITS_40: 40n,
  BITS_48: 48n,
  BITS_56: 56n,
} as const;
