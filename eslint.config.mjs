import js from "@eslint/js";
import tanstackQuery from "@tanstack/eslint-plugin-query";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";

export default defineConfig([
  // Base ESLint recommended rules for all files
  js.configs.recommended,

  // Main configuration for all files
  {
    files: [
      "*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}",     // Root level files
      ".*.{js,cjs,mjs}",                       // Root dotfiles (.prettierrc.mjs, etc)
      ".*/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}",  // Dotfile directories (like .husky/)
      "**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}",  // All files in sub-directories
    ],

    languageOptions: {
      ecmaVersion: 2022, // keep in sync with tsconfig.json
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.jest,
      },
    },

    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },

    plugins: {
      "@typescript-eslint": tsPlugin,
      react: react,
      "react-hooks": reactHooks,
      import: importPlugin,
      "unused-imports": unusedImports,
      prettier: prettierPlugin,
      "@tanstack/query": tanstackQuery,
    },

    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },

    rules: {
      // React rules
      ...react.configs.recommended.rules,
      "react/jsx-key": "warn",
      "react/no-unknown-property": ["error", { ignore: ["cy-data"] }],
      "react/react-in-jsx-scope": "off", // Not needed with React 17+

      // React Hooks rules
      ...reactHooks.configs.recommended.rules,
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",

      // General rules
      "prefer-const": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

      // TanStack Query rules
      "@tanstack/query/exhaustive-deps": "error",
      "@tanstack/query/stable-query-client": "error",

      // Import rule
      "unused-imports/no-unused-imports": ["warn"],
      "import/order": [
        "warn",
        {
          groups: [
            "builtin", // Node.js built-in modules
            "external", // React then 3rd party libraries
            "internal", // @app imports
            "parent",
            "sibling", // ../ and ./
            "index", // ./index
          ],
          pathGroups: [
            {
              pattern: "react",
              group: "external",
              position: "before",
            },
            {
              pattern: "@patternfly/**",
              group: "external",
              position: "after",
            },
            {
              pattern: "@konveyor-ui/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@app/**",
              group: "internal",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          distinctGroup: false,
          "newlines-between": "always",
          named: true,
          alphabetize: {
            order: "asc",
          },
        },
      ],
    },
  },

  // TypeScript-specific configuration
  {
    files: [
      "*.{ts,tsx,cts,mts}",     // Root level TS files
      ".*.{ts,tsx,cts,mts}",    // Root TS dotfiles
      ".*/*.{ts,tsx,cts,mts}",  // TS files in Dotfile directories (like .husky/)
      "**/*.{ts,tsx,cts,mts}",  // All TS files in sub-directories
    ],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    rules: {
      // Disable base ESLint rules that are covered by TypeScript
      "no-unused-vars": "off",
      "no-undef": "off", // TypeScript handles this
      "no-redeclare": "off",

      // Enable TypeScript-specific rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-redeclare": "error",
    },
  },

  // Cypress-specific overrides
  {
    files: ["cypress/**/*.{ts,js}"],
    rules: {
      "@typescript-eslint/no-var-requires": "warn",
      "@typescript-eslint/no-namespace": "warn",
    },
  },

  // Server-specific overrides
  {
    files: ["server/**/*.{js,cjs,mjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Prettier config (MUST be last to disable formatting rules)
  prettierConfig,
  {
    rules: {
      "prettier/prettier": ["warn"],
    },
  },

  // Ignore patterns
  globalIgnores([
    "**/dist/",
    "**/generated/",
    "**/node_modules/",
    "**/coverage/",
    "cypress/cypress/",
    "cypress/run/",
  ]),
]);
