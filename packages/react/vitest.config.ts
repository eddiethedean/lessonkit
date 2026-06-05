import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "dist/**",
        "node_modules/**",
        "**/*.d.ts",
        "**/*.d.cts",
        // P0 blocks are covered by RTL/e2e; drag branches dominate threshold noise.
        "src/blocks/**",
      ],
      thresholds: { statements: 70, branches: 65, functions: 70, lines: 70 },
    },
  },
});

