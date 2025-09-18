import { defineConfig } from "bunup";
import { shims, exports } from "bunup/plugins";
import { existsSync } from "fs";
import { execSync } from "child_process";
import { version, name as pkg_name } from "package.json" assert { type: "json" };

// Get git commit hash
let commitHash = "unknown";
try {
  if (existsSync(".git")) {
    commitHash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  }
} catch {
  // Fallback if git command fails
  commitHash = "dev";
}

// Get build timestamp
const buildTime = new Date().toISOString();

// Create footer with version and build info
const createFooter = () =>
  `
// 🚀 ${pkg_name} v${version} (${commitHash})
// Built on ${buildTime}
// Created with ❤️ by Ali Torki <ali_4286@live.com>
// https://github.com/ali-master/uuidv47
`.trim();

/**
 * @internal
 */
const config = defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    outDir: "./dist",
    target: "node",
    dts: true,
    footer: createFooter(),
    plugins: [shims(), exports()],
    clean: true,
    minify: true,
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true,
  },
]);

export default config;
