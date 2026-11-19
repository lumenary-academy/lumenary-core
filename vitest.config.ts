import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      // The pure parts are tested outside a React Server Components bundler.
      "server-only": path.resolve(import.meta.dirname, "node_modules/server-only/empty.js"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
