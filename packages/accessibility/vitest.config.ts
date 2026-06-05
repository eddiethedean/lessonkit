import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["dist/**", "node_modules/**", "**/*.d.ts", "**/*.d.cts"],
      thresholds: { statements: 85, branches: 85, functions: 85, lines: 85 },
    },
  },
});

