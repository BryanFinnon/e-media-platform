import path from "node:path";
import { defineConfig } from "vitest/config";

const projectRoot = path.resolve(import.meta.dirname, "..");

export default defineConfig({
  resolve: {
    alias: {
      "@": projectRoot,
      vitest: path.resolve(import.meta.dirname, "node_modules/vitest/dist/index.js"),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    pool: "threads",
    fileParallelism: false,
    maxWorkers: 1,
  },
});
