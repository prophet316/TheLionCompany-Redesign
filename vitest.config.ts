import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
      "tests/components/**/*.test.tsx",
      "tests/integration/**/*.test.ts",
      "tests/integration/**/*.test.tsx"
    ],
    setupFiles: ["tests/setup.ts"],
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "server-only": new URL("./tests/stubs/server-only.ts", import.meta.url).pathname,
      "@": new URL(".", import.meta.url).pathname,
    },
  },
});
