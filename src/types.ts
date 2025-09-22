/**
 * Represents a 128-bit UUID as a Buffer
 * Using Buffer provides native memory operations and efficient serialization
 */
export type UUID128 = Buffer;

/**
 * SipHash 128-bit key structure
 * Using readonly properties prevents accidental modifications
 * and enables V8 optimization opportunities
 */
export interface UUIDv47Key {
  readonly k0: bigint;
  readonly k1: bigint;
}

/**
 * Performance-optimized UUID operation options
 */
export interface UUIDOperationOptions {
  /** Skip validation when input is trusted */
  readonly skipValidation?: boolean;
  /** Use batch processing when available */
  readonly useBatchProcessing?: boolean;
}

/**
 * UUID parsing result with validation information
 */
export interface UUIDParseResult {
  readonly uuid: UUID128;
  readonly version: number;
  readonly isValid: boolean;
}
