import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["dist/**", "node_modules/**", "**/*.d.ts"],
      thresholds: { statements: 70, branches: 70, functions: 80, lines: 68 },
    },
  },
});
