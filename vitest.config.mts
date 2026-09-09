import { defineConfig } from "vitest/config";
import path from "path";

const rootDir = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
      // The real package throws unconditionally outside Next.js's own
      // server-component bundler condition; tests run in plain Node.
      "server-only": path.resolve(rootDir, "./src/lib/test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
