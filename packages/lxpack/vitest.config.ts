import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "dist/**",
        "node_modules/**",
        "**/*.d.ts",
        "**/*.d.cts",
        "src/types.ts",
        "src/bridge.ts",
      ],
      thresholds: { statements: 85, branches: 85, functions: 85, lines: 85 },
    },
  },
});
