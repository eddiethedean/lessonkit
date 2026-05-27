import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["dist/**", "node_modules/**", "**/*.d.ts", "**/*.d.cts"],
      thresholds: { lines: 100 },
    },
  },
});

