import js from "@eslint/js";
import tanstackQuery from "@tanstack/eslint-plugin-query";
import { defineConfig, globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

const allSources = [
  "*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}",     // Root level files
  ".*.{js,cjs,mjs}",                       // Root dotfiles (.prettierrc.mjs, etc)
  ".*/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}",  // Dotfile directories (like .husky/)
  "**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}",  // All files in sub-directories
];

const allTypescriptSources = [
  "*.{ts,tsx,cts,mts}",     // Root level files
  ".*.{ts,tsx,cts,mts}",    // Root dotfiles (.prettierrc.mjs, etc)
  ".*/*.{ts,tsx,cts,mts}",  // Dotfile directories (like .husky/)
  "**/*.{ts,tsx,cts,mts}",  // All files in sub-directories
];

export default defineConfig([
  js.configs.recommended,
  {
    name: "project",
    languageOptions: {
      ecmaVersion: 2022, // keep in sync with tsconfig.json
      sourceType: "module",
    },
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
  },

  {
    name: "project/all sources",
    files: allSources,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    rules: {
      "prefer-const": "warn",
    },
  },

  {
    name: "project/typescript sources/@typescript-eslint rules",
    files: allTypescriptSources,
    extends: [
      tseslint.configs.recommended,
    ],
    rules: {
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-empty-object-type": ["warn", { allowInterfaces: "always" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-redeclare": "error",
      "@typescript-eslint/no-unused-expressions": "warn",
    },
  },

  {
    name: "project/all sources/import rules",
    files: allSources,
    plugins: {
      "unused-imports": unusedImports,
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },
    rules: {
      // Disable the base rules that conflict -- they need to be added before this config block
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",

      // Enable the import rules
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [ // replaces other no-unused-vars rules
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
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

  {
    name: "project/all sources/react and react-hooks rules",
    files: allSources,
    extends: [
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
      reactHooks.configs.flat.recommended,
    ],
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React rules
      "react/jsx-key": "warn",
      "react/no-unknown-property": ["error", { ignore: ["cy-data"] }],
      "react/react-in-jsx-scope": "off", // Not needed with React 17+

      // React Hooks rules
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/refs": "warn",
    },
  },

  {
    name: "project/all sources/@tanstack query rules",
    files: allSources,
    plugins: {
      "@tanstack/query": tanstackQuery,
    },
    rules: {
      "@tanstack/query/exhaustive-deps": "error",
      "@tanstack/query/stable-query-client": "error",
    },
  },

  {
    name: "project/workspace/client jest overrides",
    files: ["client/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },

  {
    name: "project/workspace/server overrides",
    files: ["server/**/*.{js,cjs,mjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  {
    name: "project/workspace/cypress overrides",
    files: ["cypress/**/*.{ts,js}"],
    rules: {
      "@typescript-eslint/no-namespace": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-var-requires": "warn",
    },
  },

  // Prettier config (MUST be last to disable conflicting formatting rules)
  prettierRecommended,
  {
    name: "project/prettier",
    rules: {
      "prettier/prettier": ["warn"],
    },
  },

  globalIgnores([
    "**/node_modules/",
    "**/coverage/",
    "**/dist/",
    "**/generated/",
    "cypress/cypress/",
    "cypress/run/",
  ]),
]);
