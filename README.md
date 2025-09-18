<div align="center">
    <img src="assets/logo.svg" alt="UUIDv47 TypeScript Logo" width="120" height="120" />
    <h1>UUIDv47 TypeScript</h1>
    <p><strong>Reversible UUID v4/v7 transformation using SipHash-2-4</strong></p>
    
[![NPM Version](https://img.shields.io/npm/v/@usex/uuidv47?style=flat-square&color=blue)](https://www.npmjs.com/package/@usex/uuidv47)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-80%2B-brightgreen?style=flat-square)](https://github.com/ali-master/uuidv47)
</div>

## 🚀 What is UUIDv47?

**UUIDv47** is a revolutionary approach to UUID management that allows you to **reversibly transform** UUIDs between v7 (time-ordered) and v4 (random-appearing) formats. This enables you to:

- 🔒 **Hide time-ordering** from external APIs while maintaining internal chronological benefits
- 🎭 **Present v4 facades** to clients while storing efficient v7 UUIDs internally  
- 🔐 **Cryptographically secure** transformations using SipHash-2-4 algorithm
- ⚡ **High performance** with >10,000 operations per second
- 🔄 **Perfect reversibility** - no data loss in transformations

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Core Concepts](#-core-concepts)
- [API Reference](#-api-reference)
- [Usage Examples](#-usage-examples)
- [Performance](#-performance)
- [Security](#-security-best-practices)
- [Testing](#-testing)
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
import { UUIDv47 } from '@usex/uuidv47';

// 1. Generate a secure transformation key
const key = UUIDv47.generateRandomKey();

// 2. Parse your UUIDv7 (from your UUID generator)
const originalV7 = UUIDv47.parseUUID('018f4e7c-3c4a-7000-8000-123456789abc');

// 3. Transform to v4 facade (for external APIs)
const v4Facade = UUIDv47.encodeV4Facade(originalV7, key);
console.log(UUIDv47.formatUUID(v4Facade));
// Output: "a1b2c3d4-e5f6-4789-9abc-def012345678" (appears random)

// 4. Transform back to original v7 (for internal use)
const decodedV7 = UUIDv47.decodeV4Facade(v4Facade, key);
console.log(UUIDv47.formatUUID(decodedV7));
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

## 📚 API Reference

### Main Class: `UUIDv47`

#### Core Transformation Methods

```typescript
// Transform UUIDv7 to UUIDv4 facade
static encodeV4Facade(uuidV7: UUID128, key: UUIDv47Key): UUID128

// Transform UUIDv4 facade back to UUIDv7
static decodeV4Facade(uuidV4Facade: UUID128, key: UUIDv47Key): UUID128
```

#### Key Management Methods

```typescript
// Generate cryptographically secure random key
static generateRandomKey(): UUIDv47Key

// Create key from two 64-bit bigint values
static createKey(k0: bigint, k1: bigint): UUIDv47Key

// Create key from 16-byte buffer (for loading from storage)
static createKeyFromBuffer(keyBuffer: Buffer): UUIDv47Key
```

#### UUID Utility Methods

```typescript
// Parse UUID string to Buffer
static parseUUID(uuidString: string): UUID128

// Format UUID Buffer to string
static formatUUID(uuid: UUID128): string

// Get UUID version (4 or 7)
static getUUIDVersion(uuid: UUID128): UUIDVersion
```

### Type Definitions

```typescript
// 128-bit UUID as Buffer
type UUID128 = Buffer;

// SipHash key structure
interface UUIDv47Key {
  readonly k0: bigint;  // First 64-bit key component
  readonly k1: bigint;  // Second 64-bit key component
}

// UUID version enumeration
enum UUIDVersion {
  V4 = 4,
  V7 = 7
}
```

## 💡 Usage Examples

### 1. Basic Encode/Decode Operations

```typescript
import { UUIDv47 } from '@usex/uuidv47';

const key = UUIDv47.generateRandomKey();
const v7UUID = UUIDv47.parseUUID("018f4e7c-3c4a-7000-8000-123456789abc");

console.log(`Original UUIDv7: ${UUIDv47.formatUUID(v7UUID)}`);
console.log(`Version: ${UUIDv47.getUUIDVersion(v7UUID)}`); // 7

const v4Facade = UUIDv47.encodeV4Facade(v7UUID, key);
console.log(`UUIDv4 Facade: ${UUIDv47.formatUUID(v4Facade)}`);
console.log(`Version: ${UUIDv47.getUUIDVersion(v4Facade)}`); // 4

const decodedV7 = UUIDv47.decodeV4Facade(v4Facade, key);
console.log(`Decoded UUIDv7: ${UUIDv47.formatUUID(decodedV7)}`);
console.log(`Matches original: ${decodedV7.equals(v7UUID)}`); // true
```

### 2. Service Integration Pattern

```typescript
class UUIDTransformationService {
  private readonly key: UUIDv47Key;

  constructor(keyMaterial?: Buffer) {
    this.key = keyMaterial 
      ? UUIDv47.createKeyFromBuffer(keyMaterial)
      : UUIDv47.generateRandomKey();
  }

  // For external APIs - hide time ordering
  toPublicId(internalV7: string): string {
    const uuid = UUIDv47.parseUUID(internalV7);
    const facade = UUIDv47.encodeV4Facade(uuid, this.key);
    return UUIDv47.formatUUID(facade);
  }

  // For internal processing - restore time ordering
  toInternalId(publicV4: string): string {
    const uuid = UUIDv47.parseUUID(publicV4);
    const original = UUIDv47.decodeV4Facade(uuid, this.key);
    return UUIDv47.formatUUID(original);
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
    this.tenantKeys.set(tenantId, UUIDv47.createKeyFromBuffer(keyMaterial));
  }

  encodeForTenant(tenantId: string, v7UUID: string): string {
    const key = this.tenantKeys.get(tenantId);
    if (!key) throw new Error(`No key found for tenant: ${tenantId}`);
    
    const uuid = UUIDv47.parseUUID(v7UUID);
    const facade = UUIDv47.encodeV4Facade(uuid, key);
    return UUIDv47.formatUUID(facade);
  }

  decodeForTenant(tenantId: string, v4Facade: string): string {
    const key = this.tenantKeys.get(tenantId);
    if (!key) throw new Error(`No key found for tenant: ${tenantId}`);
    
    const uuid = UUIDv47.parseUUID(v4Facade);
    const original = UUIDv47.decodeV4Facade(uuid, key);
    return UUIDv47.formatUUID(original);
  }
}
```

### 4. Batch Processing

```typescript
// Process 1000 UUIDs efficiently
const key = UUIDv47.generateRandomKey();
const v7UUIDs = generateV7UUIDs(1000); // Your UUID generation

console.time('Batch Encode');
const facades = v7UUIDs.map(uuid => UUIDv47.encodeV4Facade(uuid, key));
console.timeEnd('Batch Encode'); // ~10ms for 1000 UUIDs

console.time('Batch Decode');
const decoded = facades.map(facade => UUIDv47.decodeV4Facade(facade, key));
console.timeEnd('Batch Decode'); // ~10ms for 1000 UUIDs

// Verify all transformations are perfect
const allMatch = decoded.every((uuid, i) => uuid.equals(v7UUIDs[i]));
console.log(`All roundtrips successful: ${allMatch}`); // true
```

### 5. Error Handling

```typescript
const key = UUIDv47.generateRandomKey();

try {
  // This will throw - can only encode v7 UUIDs
  const v4UUID = UUIDv47.parseUUID("a1b2c3d4-e5f6-4000-8000-123456789abc");
  UUIDv47.encodeV4Facade(v4UUID, key);
} catch (error) {
  console.log(error.message); // "Input UUID must be version 7"
}

try {
  // This will throw - can only decode v4 UUIDs
  const v7UUID = UUIDv47.parseUUID("018f4e7c-3c4a-7000-8000-123456789abc");
  UUIDv47.decodeV4Facade(v7UUID, key);
} catch (error) {
  console.log(error.message); // "Input UUID must be version 4"
}

try {
  // This will throw - invalid UUID format
  UUIDv47.parseUUID("invalid-uuid-string");
} catch (error) {
  console.log(error.message); // "Invalid UUID string length: expected 36, got 19"
}
```

## ⚡ Performance

UUIDv47 is optimized for production use with exceptional performance characteristics based on comprehensive benchmarking:

### Core Operations Benchmarks

| Operation | Performance | Notes |
|-----------|-------------|-------|
| **Encode v7→v4** | **~149,000 ops/sec** | Single UUID transformation |
| **Decode v4→v7** | **~150,000 ops/sec** | Single UUID transformation |
| **Roundtrip (encode+decode)** | **~75,000 ops/sec** | Full transformation cycle |
| **Batch Encode (100 UUIDs)** | **~1,500 ops/sec** | Batch processing throughput |
| **Batch Decode (100 UUIDs)** | **~1,500 ops/sec** | Batch processing throughput |

### Key Management Performance

| Operation | Performance | Notes |
|-----------|-------------|-------|
| **Create from BigInts** | **~16.4M ops/sec** | Ultra-fast key creation |
| **Create from Buffer** | **~10M ops/sec** | Buffer-based key creation |
| **Generate Random Key** | **~685,000 ops/sec** | Cryptographically secure |
| **Batch Key Generation (100)** | **~7,300 ops/sec** | Bulk key operations |

### String/Buffer Operations

| Operation | Performance | Notes |
|-----------|-------------|-------|
| **Parse UUID String** | **~5.7M ops/sec** | String to Buffer conversion |
| **Format UUID Buffer** | **~2.7M ops/sec** | Buffer to String conversion |
| **Get UUID Version** | **~16.6M ops/sec** | Version extraction |
| **Parse-Format Roundtrip** | **~2M ops/sec** | Full string processing cycle |
| **UUID Validation Workflow** | **~5.5M ops/sec** | Parse + version check |

### Real-World Usage Patterns

| Scenario | Performance | Notes |
|----------|-------------|-------|
| **Service Pattern (Public)** | **~137,000 ops/sec** | Single transformation to public ID |
| **Service Pattern (Internal)** | **~69,000 ops/sec** | Single transformation from public ID |
| **Multi-Tenant Encode** | **~140,500 ops/sec** | Single tenant transformation |
| **Multi-Tenant (5 tenants)** | **~27,800 ops/sec** | Round-robin across tenants |
| **API Response (10 IDs)** | **~13,700 ops/sec** | Batch ID hiding simulation |
| **Security Validation** | **~56,900 ops/sec** | Key isolation verification |

### Memory Usage

- **Zero allocations** during transformations (reuses input buffers when possible)
- **16 bytes** per UUID128 (native Buffer)
- **16 bytes** per UUIDv47Key (two bigints)
- **Minimal overhead** - direct memory operations

### Performance Characteristics

- **Consistent Performance**: Sub-millisecond latency for single operations
- **Scalable Batching**: Efficient batch processing for high-throughput scenarios  
- **Memory Efficient**: Direct buffer operations without unnecessary allocations
- **CPU Optimized**: BigInt arithmetic optimized for 64-bit operations
- **Cache Friendly**: Lookup tables and inlined operations for critical paths

### Optimization Features

- **BigInt arithmetic** for 64-bit operations
- **Buffer reuse** where possible
- **Lookup tables** for hex conversion
- **Inlined operations** for critical paths
- **TypeScript optimizations** compiled to efficient JavaScript
- **SipHash-2-4** optimized implementation with minimal overhead

### Benchmark Environment

- **Runtime**: Bun/Node.js on modern CPU
- **Iterations**: 50K-100K+ per test for statistical significance
- **Methodology**: Vitest benchmark framework with multiple runs
- **Hardware**: Results may vary based on hardware configuration

## 🔐 Security Best Practices

> **⚠️ Critical**: Proper key management is essential for security. Follow these guidelines to ensure safe implementation.

### 🔑 Key Management

- 🏛️ **Secure Storage**: Store keys in Hardware Security Modules (HSM), key vaults, or encrypted storage
- 🏢 **Environment Isolation**: Use different keys per tenant/environment to prevent cross-contamination  
- 🔄 **Key Rotation**: Implement periodic key rotation with proper migration strategies
- 📝 **Logging Policy**: Never log or transmit keys in plaintext - treat them as sensitive credentials

### ✅ Validation & Processing

- 🔍 **Version Validation**: Always validate UUID versions before processing to prevent attacks
- 🧬 **Key Derivation**: Consider using key derivation functions from master secrets for scalability

### 🛡️ Additional Security Measures

- 🔐 **Access Control**: Implement strict access controls for key management operations
- 📊 **Audit Logging**: Log all key usage and UUID transformation operations for security monitoring
- 🔒 **Transport Security**: Use TLS/HTTPS for all communications involving UUIDs or keys
- 🧪 **Testing**: Regularly test your key rotation and recovery procedures

### Security Properties

- **SipHash-2-4**: Cryptographically secure PRF resistant to timing attacks
- **Key Isolation**: Different keys produce completely different facades for the same UUID
- **Tamper Detection**: Any modification to facade results in different decoded UUID
- **Forward Security**: Compromising current key doesn't affect past transformations with different keys

## 🧪 Testing

The library includes comprehensive test coverage with >80% code coverage:

```bash
# Run all tests
bun test

# Run with coverage report
bun run test:coverage

# Watch mode for development
bun run test:watch

# UI mode with coverage
bun run test:ui
```

### Test Categories

- **Unit Tests**: All public methods and edge cases
- **Integration Tests**: Real-world usage patterns
- **Security Tests**: Key isolation and tamper detection
- **Performance Tests**: Benchmark critical operations
- **Compatibility Tests**: Cross-platform validation

### Sample Test Output

```bash
✓ Basic encode/decode operations (50 tests)
✓ Key management and validation (25 tests) 
✓ Error handling and edge cases (30 tests)
✓ Security and isolation tests (20 tests)
✓ Performance benchmarks (10 tests)

Coverage: 85.2% (lines), 90.1% (functions), 82.7% (branches)
```

## 🔧 Development Setup

```bash
# Clone repository
git clone https://github.com/ali-master/uuidv47.git
cd uuidv47

# Install dependencies (Bun recommended)
bun install

# Run development build
bun run dev

# Run tests
bun run test

# Run benchmarks
bun run test:bench

# Build for production
bun run build
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes with tests
4. **Ensure** all tests pass (`bun test`)
5. **Commit** your changes (`git commit -m 'feat: Add amazing feature'`)
6. **Push** to the branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **SipHash Algorithm**: Jean-Philippe Aumasson and Daniel J. Bernstein
- **UUID Standards**: RFC 4122 and RFC 9562
- **TypeScript Community**: For excellent tooling and ecosystem

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
