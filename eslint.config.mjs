import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const sourceFiles = [
  "packages/*/src/**/*.{ts,tsx}",
  "packages/*/test/**/*.{ts,tsx}",
  "packages/*/stories/**/*.{ts,tsx}",
  "apps/*/src/**/*.{ts,tsx}",
  "examples/*/src/**/*.{ts,tsx}",
  "examples/*/test/**/*.{ts,tsx}",
  "templates/*/src/**/*.{ts,tsx}",
  "e2e/**/*.{ts,tsx}",
  "integration/**/*.{ts,tsx}",
];

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/storybook-static/**",
      "**/docs/_build/**",
      "**/docs/_static/**",
      "packages/cli/template/**",
      "packages/react/storybook-static/**",
      "**/coverage/**",
      "e2e/.artifacts/**",
    ],
  },
  {
    files: sourceFiles,
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "**/test/**/*.{ts,tsx}", "e2e/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
);
