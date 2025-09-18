import { defineConfig } from "bunup";
import { shims, exports } from "bunup/plugins";

/**
 * @internal
 */
const config = defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    outDir: "./dist",
    target: "node",
    dts: true,
    plugins: [shims(), exports()],
    clean: true,
    minify: true,
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true,
  },
]);

export default config;
