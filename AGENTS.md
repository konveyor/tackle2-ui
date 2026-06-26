# AI Agent Guide for tackle2-ui

This document provides structural context and conventions for AI agents working on the tackle2-ui codebase. For setup instructions, see [README.md](README.md). For coding standards and PR process, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Repository Structure

```text
tackle2-ui/
  client/                     # React frontend (webpack, PatternFly)
    src/app/
      api/                    # API models (models.ts), REST clients (rest.ts + rest/*.ts), schemas
      components/             # ~60 shared components (FilterToolbar, HookFormPFFields, select wrappers, etc.)
      hooks/                  # Custom hooks (table-controls, selection, persistence)
        table-controls/       # Filtering, sorting, pagination, expansion hooks
      layout/                 # App shell: DefaultLayout, HeaderApp, SidebarApp
      pages/                  # Feature pages organized by domain (applications, archetypes, controls, etc.)
      queries/                # TanStack Query hooks (~28 files, one per domain)
      Paths.ts                # Route path constants (DevPaths, AdminPaths, UniversalPaths)
      Routes.tsx              # React Router config with lazy-loaded pages
      scopes.ts               # Scope constants and ScopeGate component (OAuth2 resource:verb pairs)
      auth/                   # AuthProvider, OIDC integration, masquerade, role-to-scope mapping
      i18n.ts                 # i18next configuration (English default, HTTP backend)
    public/locales/en/        # Translation JSON files
  server/                     # Express.js proxy server
    src/
      index.js                # Server entry point
      serverConfig.js         # Server-side and client-side config from process.env
      proxies.js              # Proxy routes: /hub -> Hub API, /oidc -> Hub OIDC, /kai -> Kai, /llm-proxy -> LLM proxy
  common/                     # Shared package (@konveyor-ui/common)
    src/
      branding.ts             # Branding configuration and string types
      env-types.ts            # ClientEnv and ServerConfig type definitions
  cypress/                    # E2E test suite (Cypress)
    e2e/
      models/                 # Page object models (one class per feature area)
      tests/                  # Test specs organized by domain
      types/                  # Shared types, constants, selectors
      views/                  # View selectors for each page
  branding/                   # Default branding assets (favicon, manifest, logos)
  docs/                       # Additional documentation
  .github/workflows/          # CI/CD: repo-level CI, image builds, nightly runs, e2e
```

## Key Patterns

For data flow (API layer, query hooks, table controls), see [ARCHITECTURE.md](ARCHITECTURE.md#data-flow). For component conventions (selects, filters, access control), see [docs/development.md](docs/development.md#component-conventions). For testing patterns and priorities, see [docs/tests.md](docs/tests.md). Environment variable types are defined in `common/src/env-types.ts`; for dev setup, see [README.md](README.md).

## Review Guidelines

When reviewing or generating code changes, verify:

- [ ] No truthy checks on IDs -- use `id != null` or `id !== undefined`
- [ ] Select components use `FilterSelectOptionProps` with `value` and `label`
- [ ] All changed files pass lint and format:check checks without adding more warnings
- [ ] New strings are added to `client/public/locales/en/translation.json` and accessed via `t()`
- [ ] Forms use `react-hook-form` with `yup` schemas, not manual state management
- [ ] Table data uses the `table-controls` hook system, not manual filtering/sorting
- [ ] Cypress selectors scope to the active element (listbox, modal) rather than the full page
- [ ] API types in `models.ts` match the [Hub OpenAPI spec](https://github.com/konveyor/tackle2-hub/blob/main/docs/openapi3.json)
- [ ] Access control uses `ScopeGate`, `useHasSomeScopes`, or `useHasAllScopes` with scope constants from `scopes.ts`, not role checks

## Dependencies

| Package                                 | Purpose                                        |
| --------------------------------------- | ---------------------------------------------- |
| `react` / `react-dom`                   | UI framework                                   |
| `@patternfly/react-core`                | Component library (PatternFly 6)               |
| `@tanstack/react-query`                 | Server state management                        |
| `react-hook-form` / `yup`               | Form management and validation                 |
| `axios`                                 | HTTP client                                    |
| `react-i18next` / `i18next`             | Internationalization                           |
| `react-router-dom`                      | Client-side routing                            |
| `oidc-client-ts` / `react-oidc-context` | OIDC authentication                            |
| `monaco-editor`                         | Code snippet viewer (analysis issues/insights) |
| `express`                               | Dev/prod server with proxy capabilities        |
| `cypress`                               | End-to-end testing framework                   |
