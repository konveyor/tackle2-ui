import js from "@eslint/js";
import tanstackQuery from "@tanstack/eslint-plugin-query";
import { defineConfig, globalIgnores } from "eslint/config";
import prettierConfig from "eslint-config-prettier";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import * as importX from "eslint-plugin-import-x";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import * as tseslint from "typescript-eslint";

const allSources = [
  "*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}", // Root level sourcefiles
  ".*.{js,cjs,mjs}", // Root level source dotfiles (.prettierrc.mjs, etc)
  ".*/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}", // Source files inside Dotfile directories (like .husky/)
  "**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}", // Source files in sub-directories
];

const allTypescriptSources = [
  "*.{ts,tsx,cts,mts}", // Root level TypeScript files
  ".*.{ts,tsx,cts,mts}", // Root level TypeScript dotfiles
  ".*/*.{ts,tsx,cts,mts}", // TypeScript files inside Dotfile directories (like .husky/)
  "**/*.{ts,tsx,cts,mts}", // TypeScript files in sub-directories
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
      "no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  {
    name: "project/typescript sources/@typescript-eslint rules",
    files: allTypescriptSources,
    extends: [tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-empty-object-type": [
        "warn",
        { allowInterfaces: "always" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-redeclare": "error",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^(_|React)" },
      ],
    },
  },

  {
    name: "project/all sources/import rules",
    files: allSources,
    extends: [importX.flatConfigs.recommended, importX.flatConfigs.typescript],
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          noWarnOnMultipleProjects: true,
          project: "*/tsconfig.json",
        }),
        importX.createNodeResolver(),
      ],
      "import-x/internal-regex": "^(?:@app|@konveyor-ui)",
    },
    rules: {
      "import-x/order": [
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
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "@typescript-eslint/no-namespace": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },

  // Prettier config (MUST be last to disable conflicting formatting rules)
  prettierConfig,

  globalIgnores([
    "**/node_modules/",
    "**/coverage/",
    "**/dist/",
    "**/generated/",
    "cypress/cypress/",
    "cypress/run/",
  ]),
]);
