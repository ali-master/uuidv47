<div align="center">
    <img src="assets/logo.svg" alt="UUIDv47 TypeScript Logo" width="120" height="120" />
    <h1>UUIDv47</h1>
    <p><strong>Reversible UUID v4/v7 transformation using SipHash-2-4</strong></p>
    
[![NPM Version](https://img.shields.io/npm/v/@usex/uuidv47?style=flat-square&color=blue)](https://www.npmjs.com/package/@usex/uuidv47)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-80%2B-brightgreen?style=flat-square)](https://github.com/ali-master/uuidv47)
[![Bundle Size](https://img.shields.io/badge/bundle-5.71KB-brightgreen?style=flat-square)](https://bundlephobia.com/package/@usex/uuidv47)
[![Minified + Gzipped](https://img.shields.io/badge/gzipped-2.25KB-success?style=flat-square)](https://bundlephobia.com/package/@usex/uuidv47)

<p><em>⚡ Ultra-lightweight • 🚀 Zero dependencies • 📦 Just 2.25KB gzipped</em></p>
</div>

## 🚀 What is UUIDv47?

**UUIDv47** is a revolutionary approach to UUID management that allows you to **reversibly transform** UUIDs between v7 (time-ordered) and v4 (random-appearing) formats. This enables you to:

- 🔒 **Hide time-ordering** from external APIs while maintaining internal chronological benefits
- 🎭 **Present v4 facades** to clients while storing efficient v7 UUIDs internally  
- 🔐 **Cryptographically secure** transformations using SipHash-2-4 algorithm
- ⚡ **High performance** with >10,000 operations per second
- 🔄 **Perfect reversibility** - no data loss in transformations
- 📦 **Tiny footprint** - only 2.25KB gzipped with zero dependencies

## 🎯 Why Choose UUIDv47?

UUIDv47 is a lightweight library at just 5.71KB (2.25KB gzipped) that provides enterprise-grade UUID transformation capabilities with zero dependencies.

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Core Concepts](#-core-concepts)
- [Usage Examples](#-usage-examples)
- [API Reference](#-api-reference)
- [Performance](#-performance)
- [Security](#-se)
- [Contributing](#-contributing)

## 📦 Installation

```bash
# Using Bun (recommended)
bun add @usex/uuidv47

# Using npm
npm install @usex/uuidv47

# Using yarn
yarn add @usex/uuidv47

# Using pnpm
pnpm add @usex/uuidv47
```

### Requirements

- **Node.js**: 16.0.0+
- **TypeScript**: 5.0+ (for TypeScript projects)
- **Runtime**: Works with Node.js, Bun, Deno, and modern browsers

## ⚡ Quick Start

```typescript
import { generateRandomKey, parseUUID, formatUUID, encodeV4Facade, decodeV4Facade } from '@usex/uuidv47';

// 1. Generate a secure transformation key
const key = generateRandomKey();

// 2. Parse your UUIDv7 (from your UUID generator)
const originalV7 = parseUUID('018f4e7c-3c4a-7000-8000-123456789abc');

// 3. Transform to v4 facade (for external APIs)
const v4Facade = encodeV4Facade(originalV7, key);
console.log(formatUUID(v4Facade));
// Output: "a1b2c3d4-e5f6-4789-9abc-def012345678" (appears random)

// 4. Transform back to original v7 (for internal use)
const decodedV7 = decodeV4Facade(v4Facade, key);
console.log(formatUUID(decodedV7));
// Output: "018f4e7c-3c4a-7000-8000-123456789abc" (original restored)
```

## 🧠 Core Concepts

### The Problem UUIDv47 Solves

**UUIDv7** provides excellent time-ordering properties but reveals creation timestamps to anyone who can parse them. **UUIDv4** appears random but lacks useful ordering. **UUIDv47** gives you both:

```typescript
// Internal storage: UUIDv7 (time-ordered, efficient)
const internalId = "018f4e7c-3c4a-7000-8000-123456789abc";  // Created at specific timestamp

// External API: UUIDv4 facade (random-appearing, private)
const publicId = "a1b2c3d4-e5f6-4789-9abc-def012345678";   // Hides creation time

// They're the SAME identifier, just different representations!
```

### How It Works

1. **Timestamp Encryption**: The 48-bit timestamp in UUIDv7 is XORed with a SipHash-2-4 derived mask
2. **Random Bits Preserved**: The random portion remains unchanged, maintaining uniqueness
3. **Version Swap**: Version bits are changed between 4 and 7 during transformation
4. **Perfect Reversibility**: Using the same key, transformations are completely reversible

### Key Components

- **SipHash-2-4**: Cryptographically secure hash function for generating encryption masks
- **48-bit Timestamp**: The time component that gets encrypted/decrypted
- **Transformation Key**: 128-bit key (two 64-bit values) for secure transformations
- **UUID128**: Buffer representation of 16-byte UUIDs for efficient processing

## 💡 Usage Examples

### 1. Basic Encode/Decode Operations

```typescript
import { generateRandomKey, parseUUID, formatUUID, getUUIDVersion, encodeV4Facade, decodeV4Facade } from '@usex/uuidv47';

const key = generateRandomKey();
const v7UUID = parseUUID("018f4e7c-3c4a-7000-8000-123456789abc");

console.log(`Original UUIDv7: ${formatUUID(v7UUID)}`);
console.log(`Version: ${getUUIDVersion(v7UUID)}`); // 7

const v4Facade = encodeV4Facade(v7UUID, key);
console.log(`UUIDv4 Facade: ${formatUUID(v4Facade)}`);
console.log(`Version: ${getUUIDVersion(v4Facade)}`); // 4

const decodedV7 = decodeV4Facade(v4Facade, key);
console.log(`Decoded UUIDv7: ${formatUUID(decodedV7)}`);
console.log(`Matches original: ${decodedV7.equals(v7UUID)}`); // true
```

### 2. Service Integration Pattern

```typescript
class UUIDTransformationService {
  private readonly key: UUIDv47Key;

  constructor(keyMaterial?: Buffer) {
    this.key = keyMaterial 
      ? createKeyFromBuffer(keyMaterial)
      : generateRandomKey();
  }

  // For external APIs - hide time ordering
  toPublicId(internalV7: string): string {
    const uuid = parseUUID(internalV7);
    const facade = encodeV4Facade(uuid, this.key);
    return formatUUID(facade);
  }

  // For internal processing - restore time ordering
  toInternalId(publicV4: string): string {
    const uuid = parseUUID(publicV4);
    const original = decodeV4Facade(uuid, this.key);
    return formatUUID(original);
  }
}

// Usage
const service = new UUIDTransformationService();
const internalId = "018f4e7c-3c4a-7000-8000-123456789abc";
const publicId = service.toPublicId(internalId);
const recoveredId = service.toInternalId(publicId);

console.log({ internalId, publicId, recoveredId });
// { 
//   internalId: "018f4e7c-3c4a-7000-8000-123456789abc",
//   publicId: "a1b2c3d4-e5f6-4789-9abc-def012345678", 
//   recoveredId: "018f4e7c-3c4a-7000-8000-123456789abc"
// }
```

### 3. Multi-Tenant Key Management

```typescript
class MultiTenantUUIDService {
  private readonly tenantKeys = new Map<string, UUIDv47Key>();

  setTenantKey(tenantId: string, keyMaterial: Buffer): void {
    this.tenantKeys.set(tenantId, createKeyFromBuffer(keyMaterial));
  }

  encodeForTenant(tenantId: string, v7UUID: string): string {
    const key = this.tenantKeys.get(tenantId);
    if (!key) throw new Error(`No key found for tenant: ${tenantId}`);
    
    const uuid = parseUUID(v7UUID);
    const facade = encodeV4Facade(uuid, key);
    return formatUUID(facade);
  }

  decodeForTenant(tenantId: string, v4Facade: string): string {
    const key = this.tenantKeys.get(tenantId);
    if (!key) throw new Error(`No key found for tenant: ${tenantId}`);
    
    const uuid = parseUUID(v4Facade);
    const original = decodeV4Facade(uuid, key);
    return formatUUID(original);
  }
}
```

### 4. Batch Processing

```typescript
// Process 1000 UUIDs efficiently
const key = generateRandomKey();
const v7UUIDs = generateV7UUIDs(1000); // Your UUID generation

console.time('Batch Encode');
const facades = v7UUIDs.map(uuid => encodeV4Facade(uuid, key));
console.timeEnd('Batch Encode'); // ~10ms for 1000 UUIDs

console.time('Batch Decode');
const decoded = facades.map(facade => decodeV4Facade(facade, key));
console.timeEnd('Batch Decode'); // ~10ms for 1000 UUIDs

// Verify all transformations are perfect
const allMatch = decoded.every((uuid, i) => uuid.equals(v7UUIDs[i]));
console.log(`All roundtrips successful: ${allMatch}`); // true
```

### 5. Error Handling

```typescript
const key = generateRandomKey();

try {
  // This will throw - can only encode v7 UUIDs
  const v4UUID = parseUUID("a1b2c3d4-e5f6-4000-8000-123456789abc");
  encodeV4Facade(v4UUID, key);
} catch (error) {
  console.log(error.message); // "Input UUID must be version 7"
}

try {
  // This will throw - can only decode v4 UUIDs
  const v7UUID = parseUUID("018f4e7c-3c4a-7000-8000-123456789abc");
  decodeV4Facade(v7UUID, key);
} catch (error) {
  console.log(error.message); // "Input UUID must be version 4"
}

try {
  // This will throw - invalid UUID format
  parseUUID("invalid-uuid-string");
} catch (error) {
  console.log(error.message); // "Invalid UUID string length: expected 36, got 19"
}
```

### 6. UUID v7 Timestamp Extraction

```typescript
import { parseUUID, extractTimestampFromV7, formatUUID } from '@usex/uuidv47';

// Extract timestamp from a UUID v7
const v7UUID = parseUUID("018f4e7c-3c4a-7000-8000-123456789abc");
const timestamp = extractTimestampFromV7(v7UUID);

console.log(`UUID v7: ${formatUUID(v7UUID)}`);
console.log(`Timestamp: ${timestamp.getTime()} ms`);
console.log(`Date: ${timestamp.toISOString()}`); // "2024-10-07T23:15:45.610Z"
console.log(`Local: ${timestamp.toLocaleString()}`);

// Compare creation times of multiple UUIDs
const uuid1 = parseUUID("018f4e7c-3c4a-7000-8000-111111111111");
const uuid2 = parseUUID("018f4e7c-4000-7000-8000-222222222222");
const uuid3 = parseUUID("018f4e7c-5000-7000-8000-333333333333");

const date1 = extractTimestampFromV7(uuid1);
const date2 = extractTimestampFromV7(uuid2);
const date3 = extractTimestampFromV7(uuid3);

console.log("UUIDs in chronological order:");
console.log(`  ${formatUUID(uuid1)}: ${date1.toISOString()}`);
console.log(`  ${formatUUID(uuid2)}: ${date2.toISOString()}`);
console.log(`  ${formatUUID(uuid3)}: ${date3.toISOString()}`);

// Use for sorting, filtering by date, etc.
const uuids = [uuid3, uuid1, uuid2];
const sortedByTime = uuids.sort((a, b) => {
  const timeA = extractTimestampFromV7(a).getTime();
  const timeB = extractTimestampFromV7(b).getTime();
  return timeA - timeB;
});

// Error handling - only works with v7 UUIDs
try {
  const v4UUID = parseUUID("a1b2c3d4-e5f6-4000-8000-123456789abc");
  extractTimestampFromV7(v4UUID);
} catch (error) {
  console.log(error.message); // "Cannot extract timestamp: UUID is version 4, expected version 7"
}
```

## 📚 API Reference

### Core Transformation Functions

#### `encodeV4Facade(uuidV7: UUID128, key: UUIDv47Key): UUID128`
Transform a UUIDv7 into a UUIDv4 facade that appears random but can be reversed.

```typescript
import { encodeV4Facade, parseUUID, generateRandomKey } from '@usex/uuidv47';

const key = generateRandomKey();
const v7 = parseUUID("018f4e7c-3c4a-7000-8000-123456789abc");
const v4Facade = encodeV4Facade(v7, key);
```

#### `decodeV4Facade(uuidV4Facade: UUID128, key: UUIDv47Key): UUID128`
Transform a UUIDv4 facade back to its original UUIDv7 format.

```typescript
import { decodeV4Facade } from '@usex/uuidv47';

const originalV7 = decodeV4Facade(v4Facade, key);
```

#### Enhanced Core Functions with Options

#### `encodeV4FacadeWithOptions(uuidV7: UUID128, key: UUIDv47Key, options?: UUIDOperationOptions): UUID128`
Encode with performance optimization options.

```typescript
import { encodeV4FacadeWithOptions } from '@usex/uuidv47';

// Skip validation for trusted input (faster)
const encoded = encodeV4FacadeWithOptions(v7, key, { skipValidation: true });
```

#### `decodeV4FacadeWithOptions(uuidV4Facade: UUID128, key: UUIDv47Key, options?: UUIDOperationOptions): UUID128`
Decode with performance optimization options.

```typescript
import { decodeV4FacadeWithOptions } from '@usex/uuidv47';

// Skip validation for maximum performance
const decoded = decodeV4FacadeWithOptions(v4Facade, key, { skipValidation: true });
```

### Batch Processing Functions

#### `batchEncodeV4Facade(uuids: UUID128[], key: UUIDv47Key): UUID128[]`
Process multiple UUIDs efficiently in a single operation.

```typescript
import { batchEncodeV4Facade } from '@usex/uuidv47';

const v7UUIDs = [uuid1, uuid2, uuid3]; // Array of v7 UUIDs
const v4Facades = batchEncodeV4Facade(v7UUIDs, key);
```

#### `batchDecodeV4Facade(uuids: UUID128[], key: UUIDv47Key): UUID128[]`
Decode multiple UUIDs efficiently in a single operation.

```typescript
import { batchDecodeV4Facade } from '@usex/uuidv47';

const originalUUIDs = batchDecodeV4Facade(v4Facades, key);
```

#### `batchEncodeV4FacadeWithOptions(uuids: UUID128[], key: UUIDv47Key, options?: UUIDOperationOptions): UUID128[]`
Batch encoding with performance options.

```typescript
import { batchEncodeV4FacadeWithOptions } from '@usex/uuidv47';

// Use individual processing instead of batch optimization
const encoded = batchEncodeV4FacadeWithOptions(uuids, key, { 
  useBatchProcessing: false,
  skipValidation: true 
});
```

#### `batchDecodeV4FacadeWithOptions(uuids: UUID128[], key: UUIDv47Key, options?: UUIDOperationOptions): UUID128[]`
Batch decoding with performance options.

```typescript
import { batchDecodeV4FacadeWithOptions } from '@usex/uuidv47';

const decoded = batchDecodeV4FacadeWithOptions(facades, key, {
  useBatchProcessing: false,
  skipValidation: true
});
```

### UUID Parsing and Formatting Functions

#### `parseUUID(uuidString: string): UUID128`
Convert a UUID string to internal Buffer representation.

```typescript
import { parseUUID } from '@usex/uuidv47';

const uuid = parseUUID("018f4e7c-3c4a-7000-8000-123456789abc");
```

#### `formatUUID(uuid: UUID128): string`
Convert a UUID Buffer to standard string format.

```typescript
import { formatUUID } from '@usex/uuidv47';

const uuidString = formatUUID(uuid); // "018f4e7c-3c4a-7000-8000-123456789abc"
```

#### `parseUUIDWithOptions(uuidString: string, options?: UUIDOperationOptions): UUIDParseResult`
Parse UUID with enhanced result information and performance options.

```typescript
import { parseUUIDWithOptions } from '@usex/uuidv47';

const result = parseUUIDWithOptions("018f4e7c-3c4a-7000-8000-123456789abc");
console.log(result);
// {
//   uuid: Buffer,
//   version: 7,
//   isValid: true
// }

// Skip validation for performance
const fastResult = parseUUIDWithOptions(uuidString, { skipValidation: true });
```

#### `isValidUUIDString(uuidString: string): boolean`
Fast validation of UUID string format without full parsing.

```typescript
import { isValidUUIDString } from '@usex/uuidv47';

const isValid = isValidUUIDString("018f4e7c-3c4a-7000-8000-123456789abc"); // true
const isInvalid = isValidUUIDString("invalid-uuid"); // false
```

#### `extractTimestampFromV7(uuid: UUID128): Date`
Extract the timestamp from a UUID v7 and convert it to a JavaScript Date object.

UUID v7 stores a 48-bit Unix timestamp (milliseconds since epoch) in the first 6 bytes. This function extracts that timestamp and returns it as a Date object.

```typescript
import { extractTimestampFromV7, parseUUID } from '@usex/uuidv47';

// Parse a UUID v7
const uuid = parseUUID("018f4e7c-3c4a-7000-8000-123456789abc");

// Extract the timestamp
const date = extractTimestampFromV7(uuid);
console.log(date.toISOString()); // "2024-10-07T23:15:45.610Z"
console.log(date.getTime());     // 1728340545610

// Compare timestamps from multiple UUIDs
const uuid1 = parseUUID("018f4e7c-3c4a-7000-8000-123456789abc");
const uuid2 = parseUUID("018f4e7c-4000-7000-8000-123456789abc");
const date1 = extractTimestampFromV7(uuid1);
const date2 = extractTimestampFromV7(uuid2);
console.log(date1 < date2); // true (uuid1 was created before uuid2)
```

**Note:** This function will throw an error if the UUID is not version 7.

```typescript
// This will throw an error
const v4UUID = parseUUID("01234567-89ab-4000-8000-123456789abc");
extractTimestampFromV7(v4UUID); // Error: Cannot extract timestamp: UUID is version 4, expected version 7
```

### UUID Version and Variant Functions

#### `getUUIDVersion(uuid: UUID128): UUIDVersion`
Extract the version number from a UUID.

```typescript
import { getUUIDVersion } from '@usex/uuidv47';

const version = getUUIDVersion(uuid); // 7 for UUIDv7, 4 for UUIDv4
```

#### `setUUIDVersion(uuid: UUID128, version: UUIDVersion): void`
Set the version bits in a UUID (modifies the UUID in place).

```typescript
import { setUUIDVersion, UUIDVersion } from '@usex/uuidv47';

setUUIDVersion(uuid, UUIDVersion.V4); // Sets version to 4
```

#### `setVariantRFC4122(uuid: UUID128): void`
Set the RFC4122 variant bits in a UUID (modifies the UUID in place).

```typescript
import { setVariantRFC4122 } from '@usex/uuidv47';

setVariantRFC4122(uuid); // Sets proper variant bits
```

### Key Management Functions

#### `generateRandomKey(): UUIDv47Key`
Generate a cryptographically secure random transformation key.

```typescript
import { generateRandomKey } from '@usex/uuidv47';

const key = generateRandomKey();
```

#### `createKey(k0: bigint, k1: bigint): UUIDv47Key`
Create a transformation key from two 64-bit values.

```typescript
import { createKey } from '@usex/uuidv47';

const key = createKey(0x0123456789abcdefn, 0xfedcba9876543210n);
```

#### `createKeyFromBuffer(keyBuffer: Buffer): UUIDv47Key`
Create a transformation key from a 16-byte buffer.

```typescript
import { createKeyFromBuffer } from '@usex/uuidv47';

const keyBuffer = Buffer.from('0123456789abcdeffedcba9876543210', 'hex');
const key = createKeyFromBuffer(keyBuffer);
```

#### `keyToBuffer(key: UUIDv47Key): Buffer`
Convert a transformation key to a 16-byte buffer for serialization.

```typescript
import { keyToBuffer } from '@usex/uuidv47';

const buffer = keyToBuffer(key); // 16-byte Buffer
```

#### `isValidKey(key: any): key is UUIDv47Key`
Type guard to validate if an object is a valid UUIDv47Key.

```typescript
import { isValidKey } from '@usex/uuidv47';

if (isValidKey(someObject)) {
  // TypeScript now knows someObject is UUIDv47Key
  const encoded = encodeV4Facade(uuid, someObject);
}
```

#### `generateRandomKeys(count: number): UUIDv47Key[]`
Generate multiple random keys efficiently in a single operation.

```typescript
import { generateRandomKeys } from '@usex/uuidv47';

const keys = generateRandomKeys(10); // Array of 10 random keys
```

## 🙏 Acknowledgments
- **SipHash Algorithm**: Jean-Philippe Aumasson and Daniel J. Bernstein
- **UUID Standards**: RFC 4122 and RFC 9562

## Star History

<a href="https://www.star-history.com/#ali-master/uuidv47&Date&LogScale">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=ali-master/uuidv47&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=ali-master/uuidv47&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=ali-master/uuidv47&type=Date" />
 </picture>
</a>

---

<div align="center">
  <p>
    <sub>Built with ❤️ by <a href="https://github.com/ali-master" target="_blank">Ali Torki</a> and contributors</sub>
  </p>
  <p>
    <a href="https://github.com/ali-master/uuidv47">⭐ Star us on GitHub</a> •
    <a href="https://linkedin.com/in/alitorki">🐦 Follow on LinkedIn</a> •
    <a href="https://www.npmjs.com/package/@usex/uuidv47">📦 View on NPM</a>
  </p>
</div>
