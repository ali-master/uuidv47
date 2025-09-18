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
