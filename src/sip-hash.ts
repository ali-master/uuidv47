import { CONSTANTS, BIGINT_MASKS, SHIFT_AMOUNTS } from "./constants";
import { type UUIDv47Key } from "./types";
import { readUInt64LE, rotateLeft64 } from "./byte-operations";

/**
 * SipHash round with inlined operations for maximum performance
 * This eliminates function call overhead and optimizes register usage
 */
function sipRoundInlined(
  v0: bigint,
  v1: bigint,
  v2: bigint,
  v3: bigint,
): [bigint, bigint, bigint, bigint] {
  const { QWORD } = BIGINT_MASKS;

  // First phase: additions and rotations
  v0 = (v0 + v1) & QWORD;
  v2 = (v2 + v3) & QWORD;
  v1 = rotateLeft64(v1, 13);
  v3 = rotateLeft64(v3, 16);
  v1 ^= v0;
  v3 ^= v2;
  v0 = rotateLeft64(v0, 32);

  // Second phase: more additions and rotations
  v2 = (v2 + v1) & QWORD;
  v0 = (v0 + v3) & QWORD;
  v1 = rotateLeft64(v1, 17);
  v3 = rotateLeft64(v3, 21);
  v1 ^= v2;
  v3 ^= v0;
  v2 = rotateLeft64(v2, 32);

  return [v0, v1, v2, v3];
}

/**
 * SipHash-2-4 implementation with aggressive optimizations
 */
export function computeSipHash(input: Buffer, key: UUIDv47Key): bigint {
  const { k0, k1 } = key;
  const { V0_INIT, V1_INIT, V2_INIT, V3_INIT, FINALIZATION_XOR } = CONSTANTS.SIPHASH_CONSTANTS;

  // Initialize state with key mixing
  let v0 = V0_INIT ^ k0;
  let v1 = V1_INIT ^ k1;
  let v2 = V2_INIT ^ k0;
  let v3 = V3_INIT ^ k1;

  const inputLength = input.length;
  const fullBlocks = inputLength >>> 3; // Fast division by 8
  const remainder = inputLength & 7; // Fast modulo 8

  // Process full 8-byte blocks with unrolled compression rounds
  let offset = 0;
  for (let i = 0; i < fullBlocks; i++) {
    const message = readUInt64LE(input, offset);
    v3 ^= message;

    // Unroll compression rounds for maximum performance (2 rounds)
    [v0, v1, v2, v3] = sipRoundInlined(v0, v1, v2, v3);
    [v0, v1, v2, v3] = sipRoundInlined(v0, v1, v2, v3);

    v0 ^= message;
    offset += 8;
  }

  // Optimized final block processing with length encoding
  const { BITS_56 } = SHIFT_AMOUNTS;
  let lastBlock = BigInt(inputLength) << BITS_56;

  // Process remaining bytes with optimized bit operations
  for (let i = 0; i < remainder; i++) {
    lastBlock |= BigInt(input[offset + i]) << BigInt(i << 3); // i * 8 as bit shift
  }

  v3 ^= lastBlock;

  // Unroll compression rounds for last block (2 rounds)
  [v0, v1, v2, v3] = sipRoundInlined(v0, v1, v2, v3);
  [v0, v1, v2, v3] = sipRoundInlined(v0, v1, v2, v3);

  v0 ^= lastBlock;

  // Finalization with unrolled rounds (4 rounds)
  v2 ^= FINALIZATION_XOR;
  [v0, v1, v2, v3] = sipRoundInlined(v0, v1, v2, v3);
  [v0, v1, v2, v3] = sipRoundInlined(v0, v1, v2, v3);
  [v0, v1, v2, v3] = sipRoundInlined(v0, v1, v2, v3);
  [v0, v1, v2, v3] = sipRoundInlined(v0, v1, v2, v3);

  return v0 ^ v1 ^ v2 ^ v3;
}

/**
 * SipHash implementation for when input length is known
 * This eliminates length calculations and optimizes for the exact use case
 */
export function computeSipHashFixed10Bytes(input: Buffer, key: UUIDv47Key): bigint {
  const { k0, k1 } = key;
  const { V0_INIT, V1_INIT, V2_INIT, V3_INIT, FINALIZATION_XOR } = CONSTANTS.SIPHASH_CONSTANTS;

  // Initialize state
  let v0 = V0_INIT ^ k0;
  let v1 = V1_INIT ^ k1;
  let v2 = V2_INIT ^ k0;
  let v3 = V3_INIT ^ k1;

  // Process first 8 bytes
  const message = readUInt64LE(input, 0);
  v3 ^= message;

  // Compression rounds (unrolled)
  [v0, v1, v2, v3] = sipRoundInlined(v0, v1, v2, v3);
  [v0, v1, v2, v3] = sipRoundInlined(v0, v1, v2, v3);

  v0 ^= message;

  // Process last 2 bytes + length (10 << 56)
  const lastBlock = (BigInt(10) << 56n) | (BigInt(input[9]) << 8n) | BigInt(input[8]);

  v3 ^= lastBlock;

  // Compression rounds (unrolled)
  [v0, v1, v2, v3] = sipRoundInlined(v0, v1, v2, v3);
  [v0, v1, v2, v3] = sipRoundInlined(v0, v1, v2, v3);

  v0 ^= lastBlock;

  // Finalization (unrolled)
  v2 ^= FINALIZATION_XOR;
  [v0, v1, v2, v3] = sipRoundInlined(v0, v1, v2, v3);
  [v0, v1, v2, v3] = sipRoundInlined(v0, v1, v2, v3);
  [v0, v1, v2, v3] = sipRoundInlined(v0, v1, v2, v3);
  [v0, v1, v2, v3] = sipRoundInlined(v0, v1, v2, v3);

  return v0 ^ v1 ^ v2 ^ v3;
}
