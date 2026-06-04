import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["dist/**", "node_modules/**", "**/*.d.ts"],
      thresholds: { statements: 70, branches: 65, functions: 64, lines: 70 },
    },
  },
});
