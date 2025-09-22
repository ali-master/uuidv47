import { BIGINT_MASKS, SHIFT_AMOUNTS } from "./constants";

/**
 * 64-bit little-endian read using native Buffer method
 */
export function readUInt64LE(buffer: Buffer, offset: number = 0): bigint {
  return buffer.readBigUInt64LE(offset);
}

/**
 * 48-bit big-endian write with minimal BigInt conversions
 */
export function write48BitsBE(buffer: Buffer, value: bigint, offset: number = 0): void {
  // Use pre-computed shift amounts and single mask operations
  const { BYTE } = BIGINT_MASKS;
  const { BITS_8, BITS_16, BITS_24, BITS_32, BITS_40 } = SHIFT_AMOUNTS;

  // Batch the byte extractions to minimize BigInt operations
  buffer[offset] = Number((value >> BITS_40) & BYTE);
  buffer[offset + 1] = Number((value >> BITS_32) & BYTE);
  buffer[offset + 2] = Number((value >> BITS_24) & BYTE);
  buffer[offset + 3] = Number((value >> BITS_16) & BYTE);
  buffer[offset + 4] = Number((value >> BITS_8) & BYTE);
  buffer[offset + 5] = Number(value & BYTE);
}

/**
 * 48-bit big-endian read with minimal BigInt operations
 */
export function read48BitsBE(buffer: Buffer, offset: number = 0): bigint {
  const { BITS_8, BITS_16, BITS_24, BITS_32, BITS_40 } = SHIFT_AMOUNTS;

  // Use single BigInt conversions and batch operations
  return (
    (BigInt(buffer[offset]) << BITS_40) |
    (BigInt(buffer[offset + 1]) << BITS_32) |
    (BigInt(buffer[offset + 2]) << BITS_24) |
    (BigInt(buffer[offset + 3]) << BITS_16) |
    (BigInt(buffer[offset + 4]) << BITS_8) |
    BigInt(buffer[offset + 5])
  );
}

/**
 * 64-bit left rotation with optimized bit operations
 */
export function rotateLeft64(value: bigint, bits: number): bigint {
  const { QWORD, ROTATION_64 } = BIGINT_MASKS;
  const shift = BigInt(bits);

  // Use pre-computed mask for maximum efficiency
  return ((value << shift) | (value >> (ROTATION_64 - shift))) & QWORD;
}

/**
 * byte array copy optimized for UUID operations
 */
export function fastBufferCopy(
  source: Buffer,
  target: Buffer,
  sourceStart: number = 0,
  targetStart: number = 0,
  length: number = source.length,
): void {
  // Use native Buffer.copy for maximum performance
  source.copy(target, targetStart, sourceStart, sourceStart + length);
}

/**
 * buffer allocation for UUID operations
 */
export function allocateUUIDBuffer(): Buffer {
  // Use Buffer.allocUnsafeSlow for maximum performance when we control initialization
  return Buffer.allocUnsafe(16);
}
