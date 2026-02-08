import js from "@eslint/js";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import securityPlugin from "eslint-plugin-security";
import importPlugin from "eslint-plugin-import";

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

  // 6. Security Exceptions for Hardened Regexes
  // These are centrally managed and verified safe.
  {
    files: [
      "src/parsers/pythonAST.parser.js",
      "src/services/codeAnalyzer.service.js",
    ],
    rules: {
      "security/detect-unsafe-regex": "off",
    },
  },

  // 7. Boundary Enforcement (Phase A: Structural Safeguards)
  {
    files: ["src/controllers/**/*.js", "src/routes/**/*.js"],
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/controllers",
              from: "./src/models",
              message: "❌ Security Breach: Controllers are strictly forbidden from importing Models directly. Use DTOs or Services instead.",
            },
            {
              target: "./src/routes",
              from: "./src/models",
              message: "❌ Security Breach: Routes are strictly forbidden from importing Models directly. Use DTOs or Services instead.",
            },
            {
              target: "./src/controllers",
              from: "./src/app.js",
              message: "❌ Architectural Violation: Controllers must not import from app.js (which initializes DB). Use a factory pattern or services.",
            },
          ],
        },
      ],
    },
  },

  // 7. Global Ignores
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
