/**
 * Reads a 64-bit little-endian value from buffer
 */
export function readUInt64LE(buffer: Buffer, offset: number = 0): bigint {
  return buffer.readBigUInt64LE(offset);
}

/**
 * Writes a 48-bit big-endian value to buffer
 */
export function write48BitsBE(buffer: Buffer, value: bigint, offset: number = 0): void {
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
export function read48BitsBE(buffer: Buffer, offset: number = 0): bigint {
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
export function rotateLeft64(value: bigint, bits: number): bigint {
  const shift = BigInt(bits);
  return ((value << shift) | (value >> (64n - shift))) & 0xffffffffffffffffn;
}
