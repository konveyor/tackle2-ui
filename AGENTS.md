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

### Data Flow

1. **API layer** (`api/rest.ts` and `api/rest/*.ts`) -- Axios-based REST client. The monolithic `rest.ts` is being refactored into entity-specific modules under `api/rest/` (e.g., `rest/applications.ts`, `rest/tags.ts`). All hub endpoints use the `hub` tagged template literal (e.g., `hub`/applications``). Responses are typed against `api/models.ts`.
2. **Query layer** (`queries/*.ts`) -- TanStack Query hooks wrap every API call. Query keys are exported constants (e.g., `ApplicationsQueryKey`). Mutations use `useMutation` with `onSuccess` cache invalidation.
3. **Table controls** (`hooks/table-controls/`) -- A composable hook system for filtering, sorting, pagination, and expansion. Hub-side filtering serializes filter state into hub request params via `getHubRequestParams`.
4. **Components** -- Pages compose shared components with table controls hooks. Forms use `react-hook-form` with PatternFly wrappers.

### Component Conventions

- **Select components** use the PatternFly 6 `Select` and `MenuToggle`:
  - `SimpleSelect` -- single-value selection
  - `TypeaheadSelect` -- single-value with search (`MultiSelectBase` with `showSelectedInToggle`)
  - `MultiSelect` -- multi-value selection with chips
  - All use `FilterSelectOptionProps` (`{ value: string, label: string }`) for options
- **Filter components** in `FilterToolbar/` handle both client-side and server-side (hub) filtering. The `categoryKey` prop drives HTML IDs and test selectors.
- **Access control** is scope-based, using OAuth2 resource:verb pairs (e.g., `applications:get`, `businessservices:put`). The `ScopeGate` component or the `useHasSomeScopes` / `useHasAllScopes` hooks gate protected UI sections. Scope constants are grouped in `scopes.ts`; the role-to-scope mapping lives in `auth/roles-to-scopes.ts`.

### Testing Patterns

- **Unit tests** cover two areas:
  - **Data processing tests** — pure function and data handling tests. High priority — these protect correctness guarantees.
  - **Component render tests** — `@testing-library/react` with jsdom. Lower priority than data tests and e2e tests. Select elements by role, not by test-specific IDs.
- **E2E tests** use page object models: `cypress/e2e/models/{domain}/{feature}.ts` encapsulates interactions. Shared selectors live in `cypress/e2e/views/`. Test specs are in `cypress/e2e/tests/`.
- Cypress `.tsx` test patterns rely on `data-ouia-component-id` (PatternFly OUIA) for stable selectors.

### Environment Variables

Types and documentation are defined in `common/src/env-types.ts`. Key variables summarized below.

Server-side variables (used by the Express proxy, not sent to the client):

| Variable            | Purpose                        | Default                      |
| ------------------- | ------------------------------ | ---------------------------- |
| `TACKLE_HUB_URL`    | Hub REST API endpoint          | `http://localhost:9002`      |
| `KAI_LLM_PROXY_URL` | LLM proxy endpoint for Kai     | (none)                       |
| `PORT`              | Server listen port             | `9000` (dev) / `8080` (prod) |
| `BRANDING`          | Path to custom branding assets | `branding/`                  |

Client-side variables (injected into `window._env` via the HTML template):

| Variable         | Purpose                    | Default  |
| ---------------- | -------------------------- | -------- |
| `AUTH_REQUIRED`  | Enable OIDC authentication | `false`  |
| `OIDC_CLIENT_ID` | OIDC client identifier     | `web-ui` |
| `VERSION`        | Application version string | `99.0.0` |

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
