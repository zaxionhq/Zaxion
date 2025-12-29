import js from "@eslint/js";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import securityPlugin from "eslint-plugin-security";

export default [
  // 1. Base JS Recommended Config
  js.configs.recommended,

  // 2. Base Configuration for all files
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.es2021,
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-empty": "warn",
      "no-useless-escape": "off",
      "no-useless-catch": "off",
      "no-unreachable": "off",
    },
  },

  // 3. TypeScript Configuration
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },

  // 4. Security Plugin Configuration (Scoped to src)
  {
    files: ["src/**/*.js", "src/**/*.ts"],
    plugins: {
      security: securityPlugin,
    },
    rules: {
      ...securityPlugin.configs.recommended.rules,
      "security/detect-unsafe-regex": "warn",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-non-literal-fs-filename": "warn",
    },
  },

  // 5. Test Overrides
  {
    files: ["**/*.test.js", "**/*.spec.js"],
    rules: {
      "security/detect-object-injection": "off",
    },
  },

  // 6. Global Ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/scripts/**",
      "**/src/migrations/**",
      "**/src/seeders/**",
    ],
  },
];
