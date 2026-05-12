# AI Agent Guide for tackle2-ui

This document provides structural context and conventions for AI agents working on the tackle2-ui codebase. For setup instructions, see [README.md](README.md). For coding standards and PR process, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Repository Structure

```text
tackle2-ui/
  client/                     # React frontend (webpack, PatternFly)
    src/app/
      api/                    # API models (models.ts), REST client (rest.ts), schemas
      components/             # ~66 shared components
        FilterToolbar/        # Table filtering: MultiSelect, TypeaheadSelect, SimpleSelect
        HookFormPFFields/     # react-hook-form + PatternFly integration wrappers
      hooks/                  # Custom hooks (table-controls, selection, persistence)
        table-controls/       # Filtering, sorting, pagination, expansion hooks
      layout/                 # App shell: DefaultLayout, HeaderApp, SidebarApp
      pages/                  # Feature pages (one directory per domain area)
        applications/         # Application inventory, analysis, assessment
        archetypes/           # Archetype management and target profiles
        controls/             # Business services, stakeholders, tags, job functions
        dependencies/         # Dependency tracking
        issues/               # Analysis issues viewer
        insights/             # Analysis insights viewer
        migration-targets/    # Custom migration targets
        migration-waves/      # Migration wave planning
        reports/              # Adoption reports
        tasks/                # Background task management
      queries/                # TanStack Query hooks (~28 files, one per domain)
      Paths.ts                # Route path constants (DevPaths, AdminPaths, UniversalPaths)
      Routes.tsx              # React Router config with lazy-loaded pages
      rbac.ts                 # Role and scope definitions (tackle-admin, tackle-architect, tackle-migrator)
      i18n.ts                 # i18next configuration (English default, HTTP backend)
    public/locales/en/        # Translation JSON files
  server/                     # Express.js proxy server
    src/
      index.js                # Server entry point
      proxies.js              # Proxy routes: /hub -> Hub API, /auth -> Keycloak SSO
  common/                     # Shared package (@konveyor-ui/common)
    src/
      branding.ts             # Branding configuration types
      environment.ts          # Runtime environment decoding
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

1. **API layer** (`api/rest.ts`) -- Axios-based REST client. All hub endpoints use the `hub` tagged template literal (e.g., `hub`/applications``). Responses are typed against `api/models.ts`.
2. **Query layer** (`queries/*.ts`) -- TanStack Query hooks wrap every API call. Query keys are exported constants (e.g., `ApplicationsQueryKey`). Mutations use `useMutation` with `onSuccess` cache invalidation.
3. **Table controls** (`hooks/table-controls/`) -- A composable hook system for filtering, sorting, pagination, and expansion. Hub-side filtering serializes filter state into hub request params via `getHubRequestParams`.
4. **Components** -- Pages compose shared components with table controls hooks. Forms use `react-hook-form` with PatternFly wrappers.

### Component Conventions

- **Select components** are in active migration from PF4 to PF5/PF6. The current hierarchy:
  - `SimpleSelect` -- single-value selection (PF5 `Select` + `MenuToggle`)
  - `TypeaheadSelect` -- single-value with search (`MultiSelectBase` with `showSelectedInToggle`)
  - `MultiSelect` -- multi-value selection with chips
  - All use `FilterSelectOptionProps` (`{ value: string, label: string }`) for options
- **Filter components** in `FilterToolbar/` handle both client-side and server-side (hub) filtering. The `categoryKey` prop drives HTML IDs and test selectors.
- **RBAC** is enforced through roles (`tackle-admin`, `tackle-architect`, `tackle-migrator`) and fine-grained scopes. The `RBAC` component wraps protected UI sections.

### Testing Patterns

- **Unit tests** use `@testing-library/react`. Select elements by role, not by test-specific IDs.
- **E2E tests** use page object models: `cypress/e2e/models/{domain}/{feature}.ts` encapsulates interactions. Shared selectors live in `cypress/e2e/views/`. Test specs are in `cypress/e2e/tests/`.
- Cypress `.tsx` test patterns rely on `data-ouia-component-id` (PatternFly OUIA) for stable selectors.

### Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `TACKLE_HUB_URL` | Hub REST API endpoint | `http://localhost:9002` |
| `SSO_SERVER_URL` | Keycloak SSO endpoint | `http://localhost:9001` |
| `BRANDING` | Path to custom branding assets | `branding/` (default Konveyor brand) |
| `AUTH_REQUIRED` | Enable Keycloak authentication | Environment-dependent |

## Review Guidelines

When reviewing or generating code changes, verify:

- [ ] No truthy checks on IDs -- use `id != null` or `id !== undefined`
- [ ] Select components use `FilterSelectOptionProps` with `value` and `label`
- [ ] Import order follows the ESLint config (react first, then external, @patternfly, @app)
- [ ] New strings are added to `client/public/locales/en/translation.json` and accessed via `t()`
- [ ] Forms use `react-hook-form` with `yup` schemas, not manual state management
- [ ] Table data uses the `table-controls` hook system, not manual filtering/sorting
- [ ] Cypress selectors scope to the active element (listbox, modal) rather than the full page
- [ ] API types in `models.ts` match the [Hub OpenAPI spec](https://github.com/konveyor/tackle2-hub/blob/main/docs/openapi3.json)

## Dependencies

| Package | Purpose |
|---|---|
| `react` / `react-dom` | UI framework |
| `@patternfly/react-core` | Component library (migrating from PF4 to PF6) |
| `@tanstack/react-query` | Server state management |
| `react-hook-form` / `yup` | Form management and validation |
| `axios` | HTTP client |
| `react-i18next` / `i18next` | Internationalization |
| `react-router-dom` | Client-side routing |
| `monaco-editor` | Code snippet viewer (analysis issues/insights) |
| `express` | Dev/prod server with proxy capabilities |
| `cypress` | End-to-end testing framework |
