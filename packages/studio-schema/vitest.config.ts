import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["dist/**", "node_modules/**", "**/*.d.ts"],
      thresholds: { statements: 50, branches: 50, functions: 46, lines: 52 },
    },
  },
});
