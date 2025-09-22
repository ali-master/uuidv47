import { describe, it, expect } from "vitest";
import { UUIDVersion } from "../src/constants";
import { formatUUID, getUUIDVersion, parseUUID } from "../src/uuid";
import { decodeV4Facade, encodeV4Facade, type UUID128, type UUIDv47Key } from "../src";

class TestByteOperations {
  /**
   * Convert little-endian 8 bytes to uint64
   */
  static leBytesToU64(bytes: Buffer): bigint {
    return (
      BigInt(bytes[0]) |
      (BigInt(bytes[1]) << 8n) |
      (BigInt(bytes[2]) << 16n) |
      (BigInt(bytes[3]) << 24n) |
      (BigInt(bytes[4]) << 32n) |
      (BigInt(bytes[5]) << 40n) |
      (BigInt(bytes[6]) << 48n) |
      (BigInt(bytes[7]) << 56n)
    );
  }

  /**
   * Write 48-bit value big-endian
   */
  static write48BE(buffer: Buffer, value: bigint): void {
    const masked = value & 0x0000ffffffffffffn;
    buffer[0] = Number((masked >> 40n) & 0xffn);
    buffer[1] = Number((masked >> 32n) & 0xffn);
    buffer[2] = Number((masked >> 24n) & 0xffn);
    buffer[3] = Number((masked >> 16n) & 0xffn);
    buffer[4] = Number((masked >> 8n) & 0xffn);
    buffer[5] = Number(masked & 0xffn);
  }

  /**
   * Read 48-bit value big-endian
   */
  static read48BE(buffer: Buffer): bigint {
    return (
      (BigInt(buffer[0]) << 40n) |
      (BigInt(buffer[1]) << 32n) |
      (BigInt(buffer[2]) << 24n) |
      (BigInt(buffer[3]) << 16n) |
      (BigInt(buffer[4]) << 8n) |
      BigInt(buffer[5])
    );
  }
}

class TestUUIDUtils {
  /**
   * Get UUID version
   */
  static getVersion(uuid: UUID128): number {
    return (uuid[6] >> 4) & 0x0f;
  }

  /**
   * Set UUID version
   */
  static setVersion(uuid: UUID128, version: number): void {
    uuid[6] = (uuid[6] & 0x0f) | ((version & 0x0f) << 4);
  }

  /**
   * Set RFC4122 variant
   */
  static setVariantRFC4122(uuid: UUID128): void {
    uuid[8] = (uuid[8] & 0x3f) | 0x80;
  }

  /**
   * Build SipHash input from UUID
   */
  static buildSipInputFromV7(uuid: UUID128): Buffer {
    const message = Buffer.allocUnsafe(10);
    message[0] = uuid[6] & 0x0f;
    message[1] = uuid[7];
    message[2] = uuid[8] & 0x3f;
    uuid.subarray(9, 16).copy(message, 3);
    return message;
  }
}

/**
 * SipHash implementation for testing
 */
class TestSipHash {
  private static rotLeft64(value: bigint, bits: number): bigint {
    const shift = BigInt(bits);
    return ((value << shift) | (value >> (64n - shift))) & 0xffffffffffffffffn;
  }

  static compute(input: Buffer, k0: bigint, k1: bigint): bigint {
    let v0 = 0x736f6d6570736575n ^ k0;
    let v1 = 0x646f72616e646f6dn ^ k1;
    let v2 = 0x6c7967656e657261n ^ k0;
    let v3 = 0x7465646279746573n ^ k1;

    const inputLength = input.length;
    let offset = 0;

    // Process full 8-byte blocks
    while (offset + 8 <= inputLength) {
      const m = TestByteOperations.leBytesToU64(input.subarray(offset, offset + 8));
      v3 ^= m;

      // 2 compression rounds
      for (let i = 0; i < 2; i++) {
        v0 = (v0 + v1) & 0xffffffffffffffffn;
        v2 = (v2 + v3) & 0xffffffffffffffffn;
        v1 = this.rotLeft64(v1, 13);
        v3 = this.rotLeft64(v3, 16);
        v1 ^= v0;
        v3 ^= v2;
        v0 = this.rotLeft64(v0, 32);
        v2 = (v2 + v1) & 0xffffffffffffffffn;
        v0 = (v0 + v3) & 0xffffffffffffffffn;
        v1 = this.rotLeft64(v1, 17);
        v3 = this.rotLeft64(v3, 21);
        v1 ^= v2;
        v3 ^= v0;
        v2 = this.rotLeft64(v2, 32);
      }

      v0 ^= m;
      offset += 8;
    }

    // Handle last 0-7 bytes with length encoding
    let lastBlock = BigInt(inputLength) << 56n;
    const remaining = inputLength & 7;

    for (let i = 0; i < remaining; i++) {
      lastBlock |= BigInt(input[offset + i]) << BigInt(i * 8);
    }

    v3 ^= lastBlock;

    // 2 compression rounds for last block
    for (let i = 0; i < 2; i++) {
      v0 = (v0 + v1) & 0xffffffffffffffffn;
      v2 = (v2 + v3) & 0xffffffffffffffffn;
      v1 = this.rotLeft64(v1, 13);
      v3 = this.rotLeft64(v3, 16);
      v1 ^= v0;
      v3 ^= v2;
      v0 = this.rotLeft64(v0, 32);
      v2 = (v2 + v1) & 0xffffffffffffffffn;
      v0 = (v0 + v3) & 0xffffffffffffffffn;
      v1 = this.rotLeft64(v1, 17);
      v3 = this.rotLeft64(v3, 21);
      v1 ^= v2;
      v3 ^= v0;
      v2 = this.rotLeft64(v2, 32);
    }

    v0 ^= lastBlock;

    // Finalization: v2 ^= 0xff, then 4 rounds
    v2 ^= 0xffn;
    for (let i = 0; i < 4; i++) {
      v0 = (v0 + v1) & 0xffffffffffffffffn;
      v2 = (v2 + v3) & 0xffffffffffffffffn;
      v1 = this.rotLeft64(v1, 13);
      v3 = this.rotLeft64(v3, 16);
      v1 ^= v0;
      v3 ^= v2;
      v0 = this.rotLeft64(v0, 32);
      v2 = (v2 + v1) & 0xffffffffffffffffn;
      v0 = (v0 + v3) & 0xffffffffffffffffn;
      v1 = this.rotLeft64(v1, 17);
      v3 = this.rotLeft64(v3, 21);
      v1 ^= v2;
      v3 ^= v0;
      v2 = this.rotLeft64(v2, 32);
    }

    return v0 ^ v1 ^ v2 ^ v3;
  }
}

/**
 * Craft a v7 UUID with specific components
 */
function craftV7(timestampMs48: bigint, randA12: number, randB62: bigint): UUID128 {
  const uuid = Buffer.alloc(16);

  // Write 48-bit timestamp
  TestByteOperations.write48BE(uuid, timestampMs48 & 0x0000ffffffffffffn);

  // Set version 7
  TestUUIDUtils.setVersion(uuid, 7);

  // Set rand_a 12 bits
  uuid[6] = (uuid[6] & 0xf0) | ((randA12 >> 8) & 0x0f);
  uuid[7] = randA12 & 0xff;

  // Set RFC4122 variant
  TestUUIDUtils.setVariantRFC4122(uuid);

  // Set rand_b 62 bits (first 6 bits go in byte 8, remaining 56 bits in bytes 9-15)
  uuid[8] = (uuid[8] & 0xc0) | (Number(randB62 >> 56n) & 0x3f);
  for (let i = 0; i < 7; i++) {
    uuid[9 + i] = Number((randB62 >> BigInt(8 * (6 - i))) & 0xffn);
  }

  return uuid;
}

describe("48-bit Read/Write Operations", () => {
  it("should correctly read and write 48-bit values", () => {
    const buffer = Buffer.alloc(6);
    const testValue = 0x0123456789abn & 0x0000ffffffffffffn;

    TestByteOperations.write48BE(buffer, testValue);
    const readValue = TestByteOperations.read48BE(buffer);

    expect(readValue).toBe(testValue);
  });

  it("should handle boundary values for 48-bit operations", () => {
    const buffer = Buffer.alloc(6);

    // Test zero
    TestByteOperations.write48BE(buffer, 0n);
    expect(TestByteOperations.read48BE(buffer)).toBe(0n);

    // Test maximum 48-bit value
    const maxValue = 0x0000ffffffffffffn;
    TestByteOperations.write48BE(buffer, maxValue);
    expect(TestByteOperations.read48BE(buffer)).toBe(maxValue);
  });
});

describe("UUID Parse/Format Roundtrip", () => {
  it("should parse and format UUID correctly", () => {
    const testString = "00000000-0000-7000-8000-000000000000";

    const parsed = parseUUID(testString);
    expect(TestUUIDUtils.getVersion(parsed)).toBe(7);

    const formatted = formatUUID(parsed);
    const reparsed = parseUUID(formatted);

    expect(parsed).toEqual(reparsed);
  });

  it("should reject invalid UUID strings", () => {
    const invalidUUID = "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz";
    expect(() => parseUUID(invalidUUID)).toThrow("Invalid hex character in UUID");
  });
});

describe("Version and Variant Manipulation", () => {
  it("should set and get version correctly", () => {
    const uuid = Buffer.alloc(16);

    TestUUIDUtils.setVersion(uuid, 7);
    expect(TestUUIDUtils.getVersion(uuid)).toBe(7);

    TestUUIDUtils.setVariantRFC4122(uuid);
    expect(uuid[8] & 0xc0).toBe(0x80);
  });

  it("should handle all valid version values", () => {
    const uuid = Buffer.alloc(16);

    for (let version = 0; version <= 15; version++) {
      TestUUIDUtils.setVersion(uuid, version);
      expect(TestUUIDUtils.getVersion(uuid)).toBe(version);
    }
  });
});

describe("SipHash Test Vectors", () => {
  it("should match known SipHash test vectors", () => {
    const k0 = 0x0706050403020100n;
    const k1 = 0x0f0e0d0c0b0a0908n;

    const expectedVectors = [
      [0x31, 0x0e, 0x0e, 0xdd, 0x47, 0xdb, 0x6f, 0x72], // len 0
      [0xfd, 0x67, 0xdc, 0x93, 0xc5, 0x39, 0xf8, 0x74], // len 1
      [0x5a, 0x4f, 0xa9, 0xd9, 0x09, 0x80, 0x6c, 0x0d], // len 2
      [0x2d, 0x7e, 0xfb, 0xd7, 0x96, 0x66, 0x67, 0x85], // len 3
      [0xb7, 0x87, 0x71, 0x27, 0xe0, 0x94, 0x27, 0xcf], // len 4
      [0x8d, 0xa6, 0x99, 0xcd, 0x64, 0x55, 0x76, 0x18], // len 5
      [0xce, 0xe3, 0xfe, 0x58, 0x6e, 0x46, 0xc9, 0xcb], // len 6
      [0x37, 0xd1, 0x01, 0x8b, 0xf5, 0x00, 0x02, 0xab], // len 7
      [0x62, 0x24, 0x93, 0x9a, 0x79, 0xf5, 0xf5, 0x93], // len 8
      [0xb0, 0xe4, 0xa9, 0x0b, 0xdf, 0x82, 0x00, 0x9e], // len 9
      [0xf3, 0xb9, 0xdd, 0x94, 0xc5, 0xbb, 0x5d, 0x7a], // len 10
      [0xa7, 0xad, 0x6b, 0x22, 0x46, 0x2f, 0xb3, 0xf4], // len 11
      [0xfb, 0xe5, 0x0e, 0x86, 0xbc, 0x8f, 0x1e, 0x75], // len 12
    ];

    // Create message with sequential bytes
    const message = Buffer.allocUnsafe(64);
    for (let i = 0; i < 64; i++) {
      message[i] = i;
    }

    // Test each length
    for (let len = 0; len < expectedVectors.length; len++) {
      const input = message.subarray(0, len);
      const computed = TestSipHash.compute(input, k0, k1);
      const expected = TestByteOperations.leBytesToU64(Buffer.from(expectedVectors[len]));

      expect(computed).toBe(expected);
    }
  });

  it("should handle additional message lengths", () => {
    const k0 = 0x0706050403020100n;
    const k1 = 0x0f0e0d0c0b0a0908n;
    const message = Buffer.allocUnsafe(64);
    for (let i = 0; i < 64; i++) {
      message[i] = i;
    }

    const result = TestSipHash.compute(message.subarray(0, 15), k0, k1);
    expect(typeof result).toBe("bigint");
    expect(result).not.toBe(0n);
  });
});

describe("SipHash Input Stability", () => {
  it("should generate identical SipHash input for v7 and facade", () => {
    const timestamp = 0x123456789abcn;
    const randA = 0x0abc;
    const randB = 0x0123456789abcdefn & ((1n << 62n) - 1n); // Mask to 62 bits

    const originalV7 = craftV7(timestamp, randA, randB);
    const key: UUIDv47Key = {
      k0: 0x0123456789abcdefn,
      k1: 0xfedcba9876543210n,
    };

    const facade = encodeV4Facade(originalV7, key);

    const sipInput1 = TestUUIDUtils.buildSipInputFromV7(originalV7);
    const sipInput2 = TestUUIDUtils.buildSipInputFromV7(facade);

    expect(sipInput1).toEqual(sipInput2);
  });

  it("should preserve random bits across transformation", () => {
    const v7 = craftV7(0x123456789abcn, 0x0abc, 0x0123456789abcdefn & ((1n << 62n) - 1n));
    const key: UUIDv47Key = { k0: 0x1111n, k1: 0x2222n };

    const facade = encodeV4Facade(v7, key);

    // Random bits should be identical
    expect(facade[6] & 0x0f).toBe(v7[6] & 0x0f);
    expect(facade[7]).toBe(v7[7]);
    expect(facade[8] & 0x3f).toBe(v7[8] & 0x3f);
    expect(facade.subarray(9, 16)).toEqual(v7.subarray(9, 16));
  });
});

describe("Encode/Decode Roundtrip", () => {
  it("should perform perfect roundtrip transformation", () => {
    const key: UUIDv47Key = {
      k0: 0x0123456789abcdefn,
      k1: 0xfedcba9876543210n,
    };

    // Test with 16 different combinations
    for (let i = 0; i < 16; i++) {
      const timestamp = BigInt(0x100000 * i + 123);
      const randA = (0x0aaa ^ (i * 7)) & 0x0fff;
      const randB = (0x0123456789abcdefn ^ (0x1111111111111111n * BigInt(i))) & ((1n << 62n) - 1n);

      const originalV7 = craftV7(timestamp, randA, randB);

      // Encode to facade
      const facade = encodeV4Facade(originalV7, key);
      expect(TestUUIDUtils.getVersion(facade)).toBe(4);
      expect(facade[8] & 0xc0).toBe(0x80); // RFC4122 variant

      // Decode back to original
      const decodedV7 = decodeV4Facade(facade, key);
      expect(decodedV7).toEqual(originalV7);

      // Test with wrong key - should NOT match
      const wrongKey: UUIDv47Key = {
        k0: key.k0 ^ 0xdeadbeefn,
        k1: key.k1 ^ 0x1337n,
      };

      const badDecode = decodeV4Facade(facade, wrongKey);
      expect(badDecode).not.toEqual(originalV7);
    }
  });

  it("should handle edge cases in roundtrip transformation", () => {
    const key: UUIDv47Key = { k0: 0x1234n, k1: 0x5678n };

    // Test with minimum values
    const minV7 = craftV7(0n, 0, 0n);
    const minFacade = encodeV4Facade(minV7, key);
    const minDecoded = decodeV4Facade(minFacade, key);
    expect(minDecoded).toEqual(minV7);

    // Test with maximum values
    const maxTimestamp = 0x0000ffffffffffffn;
    const maxRandA = 0x0fff;
    const maxRandB = (1n << 62n) - 1n;

    const maxV7 = craftV7(maxTimestamp, maxRandA, maxRandB);
    const maxFacade = encodeV4Facade(maxV7, key);
    const maxDecoded = decodeV4Facade(maxFacade, key);
    expect(maxDecoded).toEqual(maxV7);
  });
});

describe("Implementation Consistency Verification", () => {
  it("should maintain consistent", () => {
    const testKey: UUIDv47Key = {
      k0: 0x0123456789abcdefn,
      k1: 0xfedcba9876543210n,
    };

    const testV7 = craftV7(0x123456789abcn, 0x0abc, 0x456789abcdefn);
    const facade = encodeV4Facade(testV7, testKey);

    // Verify structure
    expect(getUUIDVersion(facade)).toBe(UUIDVersion.V4);
    expect(facade[8] & 0x80).toBe(0x80); // RFC4122 variant

    // Verify roundtrip
    const decoded = decodeV4Facade(facade, testKey);
    expect(decoded).toEqual(testV7);
    expect(getUUIDVersion(decoded)).toBe(UUIDVersion.V7);
  });

  it("should handle all byte value ranges correctly", () => {
    const key: UUIDv47Key = { k0: 0xaaaan, k1: 0xbbbbn };

    // Test with various byte patterns
    const testPatterns = [
      { ts: 0x000000000000n, ra: 0x000, rb: 0x0000000000000000n },
      { ts: 0xffffffffffffn, ra: 0xfff, rb: 0x3fffffffffffffffn },
      { ts: 0xaaaaaaaaaaaan, ra: 0xaaa, rb: 0x2aaaaaaaaaaaaaaan },
      { ts: 0x555555555555n, ra: 0x555, rb: 0x1555555555555555n },
    ];

    testPatterns.forEach(({ ts, ra, rb }) => {
      const v7 = craftV7(ts, ra, rb);
      const facade = encodeV4Facade(v7, key);
      const decoded = decodeV4Facade(facade, key);

      expect(decoded).toEqual(v7);
    });
  });
});
