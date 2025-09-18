import { UUIDv47, type UUID128, type UUIDv47Key } from "..";

/**
 * ANSI color codes for console output
 */
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
} as const;

/**
 * Utility functions for colored console output
 */
const colorize = {
  header: (text: string) => `${colors.bright}${colors.cyan}${text}${colors.reset}`,
  success: (text: string) => `${colors.green}✓ ${text}${colors.reset}`,
  error: (text: string) => `${colors.red}✗ ${text}${colors.reset}`,
  warning: (text: string) => `${colors.yellow}⚠ ${text}${colors.reset}`,
  info: (text: string) => `${colors.blue}ℹ ${text}${colors.reset}`,
  highlight: (text: string) => `${colors.bright}${colors.yellow}${text}${colors.reset}`,
  uuid: (text: string) => `${colors.magenta}${text}${colors.reset}`,
  key: (text: string) => `${colors.cyan}${text}${colors.reset}`,
  number: (text: string) => `${colors.yellow}${text}${colors.reset}`,
  security: (text: string) => `${colors.red}🔒 ${text}${colors.reset}`,
  rocket: (text: string) => `${colors.green}🚀 ${text}${colors.reset}`,
  dim: (text: string) => `${colors.dim}${text}${colors.reset}`,
  label: (text: string) => `${colors.bright}${text}${colors.reset}`,
  value: (text: string) => `${colors.white}${text}${colors.reset}`,
};

/**
 * Basic Usage Examples
 */
class UUIDv47Examples {
  /**
   * Example 1: Basic Encode/Decode Operations
   */
  static basicExample(): void {
    console.log(colorize.header("=== Basic UUIDv47 Operations ==="));

    // Generate a secure key
    const key = UUIDv47.generateRandomKey();
    console.log(
      `${colorize.label("Generated key:")} k0=${colorize.key(key.k0.toString(16))}, k1=${colorize.key(key.k1.toString(16))}`,
    );

    // Create a sample v7 UUID (normally you'd get this from your UUID generator)
    const sampleV7String = "01234567-89ab-7cde-8f01-23456789abcd";
    const v7UUID = UUIDv47.parseUUID(sampleV7String);
    console.log(`${colorize.label("Original UUIDv7:")} ${colorize.uuid(sampleV7String)}`);
    console.log(
      `${colorize.label("Version:")} ${colorize.number(UUIDv47.getUUIDVersion(v7UUID).toString())}`,
    );

    // Encode v7 as v4 facade
    const v4Facade = UUIDv47.encodeV4Facade(v7UUID, key);
    const v4FacadeString = UUIDv47.formatUUID(v4Facade);
    console.log(`${colorize.label("UUIDv4 Facade:")} ${colorize.uuid(v4FacadeString)}`);
    console.log(
      `${colorize.label("Version:")} ${colorize.number(UUIDv47.getUUIDVersion(v4Facade).toString())}`,
    );

    // Decode facade back to original v7
    const decodedV7 = UUIDv47.decodeV4Facade(v4Facade, key);
    const decodedV7String = UUIDv47.formatUUID(decodedV7);
    console.log(`${colorize.label("Decoded UUIDv7:")} ${colorize.uuid(decodedV7String)}`);
    console.log(
      `${colorize.label("Matches original:")} ${decodedV7String === sampleV7String ? colorize.success("true") : colorize.error("false")}`,
    );

    console.log("");
  }

  /**
   * Example 2: Key Management Strategies
   */
  static keyManagementExample(): void {
    console.log(colorize.header("=== Key Management Examples ==="));

    // Method 1: Generate random key
    const randomKey = UUIDv47.generateRandomKey();
    console.log(colorize.success("Random key generated"));

    // Method 2: Create key from known values
    const knownKey = UUIDv47.createKey(0x0123456789abcdefn, 0xfedcba9876543210n);
    console.log(colorize.success("Known key created from bigint values"));

    // Method 3: Create key from buffer (e.g., from secure storage)
    const keyBuffer = Buffer.from([
      0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32,
      0x10,
    ]);
    const bufferKey = UUIDv47.createKeyFromBuffer(keyBuffer);
    console.log(colorize.success("Key created from 16-byte buffer"));

    // Demonstrate key isolation
    const testUUID = UUIDv47.parseUUID("01234567-89ab-7000-8000-123456789abc");
    const facade1 = UUIDv47.encodeV4Facade(testUUID, randomKey);
    const facade2 = UUIDv47.encodeV4Facade(testUUID, knownKey);
    const facade3 = UUIDv47.encodeV4Facade(testUUID, bufferKey);

    console.log(colorize.info("Same UUID with different keys produces different facades:"));
    console.log(
      `  ${colorize.label("Random key:")}  ${colorize.uuid(UUIDv47.formatUUID(facade1))}`,
    );
    console.log(
      `  ${colorize.label("Known key:")}   ${colorize.uuid(UUIDv47.formatUUID(facade2))}`,
    );
    console.log(
      `  ${colorize.label("Buffer key:")}  ${colorize.uuid(UUIDv47.formatUUID(facade3))}`,
    );
    console.log("");
  }

  /**
   * Example 3: Error Handling and Validation
   */
  static errorHandlingExample(): void {
    console.log(colorize.header("=== Error Handling Examples ==="));

    const validKey = UUIDv47.generateRandomKey();

    try {
      // Attempt to encode non-v7 UUID
      const v4UUID = UUIDv47.parseUUID("01234567-89ab-4000-8000-123456789abc");
      UUIDv47.encodeV4Facade(v4UUID, validKey);
    } catch (error) {
      console.log(
        colorize.success(
          `Correctly rejected non-v7 UUID: ${colorize.dim((error as Error).message)}`,
        ),
      );
    }

    try {
      // Attempt to decode non-v4 UUID
      const v7UUID = UUIDv47.parseUUID("01234567-89ab-7000-8000-123456789abc");
      UUIDv47.decodeV4Facade(v7UUID, validKey);
    } catch (error) {
      console.log(
        colorize.success(
          `Correctly rejected non-v4 UUID: ${colorize.dim((error as Error).message)}`,
        ),
      );
    }

    try {
      // Invalid UUID string
      UUIDv47.parseUUID("invalid-uuid-string");
    } catch (error) {
      console.log(
        colorize.success(
          `Correctly rejected invalid UUID string: ${colorize.dim((error as Error).message)}`,
        ),
      );
    }

    try {
      // Invalid key buffer
      UUIDv47.createKeyFromBuffer(Buffer.from([1, 2, 3])); // Too short
    } catch (error) {
      console.log(
        colorize.success(
          `Correctly rejected invalid key buffer: ${colorize.dim((error as Error).message)}`,
        ),
      );
    }

    console.log("");
  }

  /**
   * Example 4: Batch Processing
   */
  static batchProcessingExample(): void {
    console.log(colorize.header("=== Batch Processing Example ==="));

    const key = UUIDv47.generateRandomKey();
    const batchSize = 100;

    // Generate test v7 UUIDs
    const v7UUIDs: UUID128[] = [];
    for (let i = 0; i < batchSize; i++) {
      // Create artificial v7 UUIDs with sequential timestamps
      const timestamp = Buffer.alloc(6);
      timestamp.writeUIntBE(Date.now() + i, 0, 6);

      const randomBytes = Buffer.alloc(10);
      require("crypto").randomFillSync(randomBytes);

      const v7UUID = Buffer.concat([timestamp, randomBytes]);
      v7UUID[6] = (v7UUID[6] & 0x0f) | 0x70; // Set version 7
      v7UUID[8] = (v7UUID[8] & 0x3f) | 0x80; // Set RFC4122 variant

      v7UUIDs.push(v7UUID);
    }

    console.log(colorize.info(`Processing ${colorize.number(batchSize.toString())} UUIDs...`));

    // Encode all to facades
    const startEncode = Date.now();
    const facades = v7UUIDs.map((uuid) => UUIDv47.encodeV4Facade(uuid, key));
    const encodeTime = Date.now() - startEncode;

    // Decode all back
    const startDecode = Date.now();
    const decoded = facades.map((facade) => UUIDv47.decodeV4Facade(facade, key));
    const decodeTime = Date.now() - startDecode;

    // Verify all match
    const allMatch = decoded.every((uuid, index) => uuid.equals(v7UUIDs[index]));

    console.log(
      colorize.success(`All ${colorize.number(batchSize.toString())} UUIDs processed successfully`),
    );
    console.log(
      `  ${colorize.label("Encode time:")} ${colorize.number(`${encodeTime}ms`)} (${colorize.highlight(`${Math.round((batchSize / encodeTime) * 1000)} ops/sec`)})`,
    );
    console.log(
      `  ${colorize.label("Decode time:")} ${colorize.number(`${decodeTime}ms`)} (${colorize.highlight(`${Math.round((batchSize / decodeTime) * 1000)} ops/sec`)})`,
    );
    console.log(
      `  ${colorize.label("All roundups match:")} ${allMatch ? colorize.success("true") : colorize.error("false")}`,
    );
    console.log("");
  }

  /**
   * Example 5: Real-world Integration Patterns
   */
  static integrationPatternsExample(): void {
    console.log(colorize.header("=== Integration Patterns Example ==="));

    // Pattern 1: Service with persistent key
    class UUIDTransformationService {
      private readonly key: UUIDv47Key;

      constructor(keyMaterial?: Buffer) {
        if (keyMaterial) {
          this.key = UUIDv47.createKeyFromBuffer(keyMaterial);
        } else {
          this.key = UUIDv47.generateRandomKey();
        }
      }

      transformToPublic(internalV7: string): string {
        const uuid = UUIDv47.parseUUID(internalV7);
        const facade = UUIDv47.encodeV4Facade(uuid, this.key);
        return UUIDv47.formatUUID(facade);
      }

      transformFromPublic(publicV4: string): string {
        const uuid = UUIDv47.parseUUID(publicV4);
        const original = UUIDv47.decodeV4Facade(uuid, this.key);
        return UUIDv47.formatUUID(original);
      }
    }

    // Pattern 2: Multi-tenant key management
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

    // Demonstrate the patterns
    const service = new UUIDTransformationService();
    const testV7 = "01234567-89ab-7000-8000-123456789abc";
    const publicV4 = service.transformToPublic(testV7);
    const recoveredV7 = service.transformFromPublic(publicV4);

    console.log(colorize.success("Service pattern:"));
    console.log(`  ${colorize.label("Internal v7:")} ${colorize.uuid(testV7)}`);
    console.log(`  ${colorize.label("Public v4:")}   ${colorize.uuid(publicV4)}`);
    console.log(`  ${colorize.label("Recovered:")}   ${colorize.uuid(recoveredV7)}`);
    console.log(
      `  ${colorize.label("Match:")} ${testV7 === recoveredV7 ? colorize.success("true") : colorize.error("false")}`,
    );

    const multiTenantService = new MultiTenantUUIDService();
    const tenantKey = Buffer.from("0123456789abcdef0123456789abcdef", "hex");
    multiTenantService.setTenantKey("tenant-1", tenantKey);

    const tenantV4 = multiTenantService.encodeForTenant("tenant-1", testV7);
    const tenantRecovered = multiTenantService.decodeForTenant("tenant-1", tenantV4);

    console.log(colorize.success("Multi-tenant pattern:"));
    console.log(`  ${colorize.label("Tenant v4:")}   ${colorize.uuid(tenantV4)}`);
    console.log(`  ${colorize.label("Recovered:")}   ${colorize.uuid(tenantRecovered)}`);
    console.log(
      `  ${colorize.label("Match:")} ${testV7 === tenantRecovered ? colorize.success("true") : colorize.error("false")}`,
    );
    console.log("");
  }

  /**
   * Example 6: Security Considerations
   */
  static securityConsiderationsExample(): void {
    console.log(colorize.header("=== Security Considerations ==="));

    const key1 = UUIDv47.generateRandomKey();
    const key2 = UUIDv47.generateRandomKey();
    const testUUID = UUIDv47.parseUUID("01234567-89ab-7000-8000-123456789abc");

    // Demonstrate key isolation
    const facade1 = UUIDv47.encodeV4Facade(testUUID, key1);
    const facade2 = UUIDv47.encodeV4Facade(testUUID, key2);

    console.log(colorize.success("Key isolation:"));
    console.log(colorize.info("  Same UUID, different keys produce different facades:"));
    console.log(`  ${colorize.label("Key1:")} ${colorize.uuid(UUIDv47.formatUUID(facade1))}`);
    console.log(`  ${colorize.label("Key2:")} ${colorize.uuid(UUIDv47.formatUUID(facade2))}`);
    console.log(
      `  ${colorize.label("Facades differ:")} ${!facade1.equals(facade2) ? colorize.success("true") : colorize.error("false")}`,
    );

    // Demonstrate tampering detection
    const originalFacade = UUIDv47.encodeV4Facade(testUUID, key1);
    const tamperedFacade = Buffer.from(originalFacade);
    tamperedFacade[15] ^= 0x01; // Flip one bit

    const originalDecoded = UUIDv47.decodeV4Facade(originalFacade, key1);
    const tamperedDecoded = UUIDv47.decodeV4Facade(tamperedFacade, key1);

    console.log(colorize.success("Tampering detection:"));
    console.log(
      `  ${colorize.label("Original matches:")}  ${originalDecoded.equals(testUUID) ? colorize.success("true") : colorize.error("false")}`,
    );
    console.log(
      `  ${colorize.label("Tampered matches:")}  ${tamperedDecoded.equals(testUUID) ? colorize.error("true") : colorize.success("false")}`,
    );

    console.log("");
    console.log(colorize.security("Security Best Practices:"));
    console.log(
      `  ${colorize.warning("• Store keys securely (HSM, key vault, encrypted storage)")}`,
    );
    console.log(`  ${colorize.warning("• Use different keys per tenant/environment")}`);
    console.log(`  ${colorize.warning("• Rotate keys periodically with migration strategy")}`);
    console.log(`  ${colorize.warning("• Never log or transmit keys in plaintext")}`);
    console.log(`  ${colorize.warning("• Validate UUID versions before processing")}`);
    console.log(`  ${colorize.warning("• Consider key derivation from master secrets")}`);
    console.log("");
  }

  /**
   * Run all examples
   */
  static runAllExamples(): void {
    console.log(colorize.rocket("UUIDv47 TypeScript Implementation - Usage Examples\n"));

    this.basicExample();
    this.keyManagementExample();
    this.errorHandlingExample();
    this.batchProcessingExample();
    this.integrationPatternsExample();
    this.securityConsiderationsExample();

    console.log(colorize.rocket("All examples completed successfully! 🎉"));
  }
}

UUIDv47Examples.runAllExamples();
