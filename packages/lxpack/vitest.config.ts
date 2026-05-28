import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      all: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "dist/**",
        "node_modules/**",
        "**/*.d.ts",
        "**/*.d.cts",
        "src/types.ts",
        "src/bridge.ts",
      ],
      thresholds: { lines: 90 },
    },
  },
});
