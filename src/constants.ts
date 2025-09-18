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

export const hexChars = "0123456789abcdef";
