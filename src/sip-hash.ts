import { CONSTANTS, type UUIDv47Key } from "./index";
import { readUInt64LE, rotateLeft64 } from "./byte-operations";

/**
 * Single SipHash compression round
 */
function sipRound(
  v0: bigint,
  v1: bigint,
  v2: bigint,
  v3: bigint,
): [bigint, bigint, bigint, bigint] {
  v0 = (v0 + v1) & 0xffffffffffffffffn;
  v2 = (v2 + v3) & 0xffffffffffffffffn;
  v1 = rotateLeft64(v1, 13);
  v3 = rotateLeft64(v3, 16);
  v1 ^= v0;
  v3 ^= v2;
  v0 = rotateLeft64(v0, 32);
  v2 = (v2 + v1) & 0xffffffffffffffffn;
  v0 = (v0 + v3) & 0xffffffffffffffffn;
  v1 = rotateLeft64(v1, 17);
  v3 = rotateLeft64(v3, 21);
  v1 ^= v2;
  v3 ^= v0;
  v2 = rotateLeft64(v2, 32);

  return [v0, v1, v2, v3];
}

/**
 * Computes SipHash-2-4 hash of input data
 */
export function computeSipHash(input: Buffer, key: UUIDv47Key): bigint {
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
    const message = readUInt64LE(input, offset);
    v3 ^= message;

    // Compression rounds
    for (let round = 0; round < COMPRESSION_ROUNDS; round++) {
      [v0, v1, v2, v3] = sipRound(v0, v1, v2, v3);
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
    [v0, v1, v2, v3] = sipRound(v0, v1, v2, v3);
  }

  v0 ^= lastBlock;

  // Finalization
  v2 ^= FINALIZATION_XOR;
  for (let round = 0; round < FINALIZATION_ROUNDS; round++) {
    [v0, v1, v2, v3] = sipRound(v0, v1, v2, v3);
  }

  return v0 ^ v1 ^ v2 ^ v3;
}
