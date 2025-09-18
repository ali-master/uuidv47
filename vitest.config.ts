import { defineConfig } from "vitest/config";
import * as path from "node:path";

export default defineConfig({
  test: {
    server: {
      sourcemap: "inline",
    },
    fileParallelism: false, // Disable parallel execution to share Redis container
    name: "UUIDv47",
    environment: "node",
    typecheck: {
      enabled: true,
      checker: "vue-tsc",
      ignoreSourceErrors: true,
      tsconfig: path.resolve(process.cwd(), "./tsconfig.json"),
    },
    coverage: {
      all: false,
      clean: true,
      provider: "v8",
      cleanOnRerun: true,
      reportOnFailure: true,
      include: ["**/src/**"],
      reporter: ["clover", "json", "html", "html-spa"],
      reportsDirectory: path.resolve(__dirname, "./coverage"),
    },
    dir: path.resolve(__dirname, "./test"),
    cache: false,
    globals: true,
    pool: "forks",
    poolOptions: {
      threads: {
        singleThread: true,
      },
      forks: {
        singleFork: true,
      },
    },
  },
});
