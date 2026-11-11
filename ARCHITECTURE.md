# Architecture

This document describes the system design and component relationships for tackle2-ui. For the full directory layout and code patterns, see [AGENTS.md](AGENTS.md).

## System Context

tackle2-ui is the frontend for [Konveyor](https://konveyor.io), an application modernization platform that runs on Kubernetes. The UI does not manage data directly -- it communicates with backend services through proxied API calls.

```text
+-------------------+        +-----------------+        +------------------+
|   Browser         | <----> | tackle2-ui      | <----> | tackle2-hub      |
|   (React SPA)     |        | (Caddy proxy)   |        | (REST API +      |
+-------------------+        +-----------------+        |  OIDC provider)  |
                                                        +------------------+
```

- **Browser** -- Serves the React + PatternFly single-page application.
- **tackle2-ui server** -- Caddy serves static assets and runtime configuration in production, and proxies API requests to the Hub and LLM proxy. In development it forwards non-API traffic to the rspack dev server.
- **tackle2-hub** -- The Konveyor Hub REST API. Manages applications, assessments, analyses, tasks, identities, and all domain entities. Also hosts the OIDC provider for authentication. The [OpenAPI spec](https://github.com/konveyor/tackle2-hub/blob/main/docs/openapi3.json) documents the API contract but may lag behind the implementation — the [Go API source](https://github.com/konveyor/tackle2-hub/tree/main/api) is the authoritative reference.

When `AUTH_REQUIRED` is enabled, the Hub's built-in OIDC provider handles authentication. Access control is scope-based, using OAuth2 resource:verb pairs (e.g., `applications:get`). The legacy Keycloak SSO integration has been removed.

When `AGENTIC_ENABLED` is `true`, the UI also renders the agentic console, which launches and observes [konveyor/agentic-controller](https://github.com/konveyor/agentic-controller) runs through the Hub's `/agentic/*` API. It is off by default and only useful against a Hub that serves that API. See [Agentic Console](#agentic-console).

## Monorepo Structure

The project is an npm workspaces monorepo with three packages:

| Workspace  | Package                | Purpose                                                                    |
| ---------- | ---------------------- | -------------------------------------------------------------------------- |
| `common/`  | `@konveyor-ui/common`  | Branding configuration and assets. Built first; the client depends on it.  |
| `client/`  | `@konveyor-ui/client`  | React application bundled with rspack, including client environment types. |
| `cypress/` | `@konveyor-ui/cypress` | End-to-end test suite using page object models.                            |

Build order: `common` -> `client`; `cypress` is test-only. `container/caddy/` holds web-server configuration; `container/entrypoint/` is a standalone, standard-library-only Go module. A binary entrypoint is necessary because the hardened Caddy image has no shell.

## Client Architecture

### Routing

The application uses `react-router-dom` with three route groups gated by scopes, plus one gated by a feature flag:

- **Developer perspective** (`DevPaths`) -- Analysis profiles, applications, archetypes, assessments, analysis, migration waves, issues, insights, dependencies, reports, migration targets. Accessible with standard read scopes.
- **Administrator perspective** (`AdminPaths`) -- General settings, identities, repositories (Git/SVN/Maven), proxies, assessment/questionnaire management, Jira integration, source platforms, asset generators. Requires admin-level scopes.
- **Universal paths** (`UniversalPaths`) -- Tasks. Accessible to all authenticated users.
- **Agentic console** (`agenticRoutes`, paths under `DevPaths`) -- Agent runs, agents, skills, workflows, workflow runs. The list is built at module load from `AGENTIC_ENABLED` and is empty when the flag is off, so a deployment without an agentic backend gets no routes and no sidebar group rather than pages that fail on load. See [Agentic Console](#agentic-console).

Pages are lazy-loaded with `React.lazy()` and wrapped in `ErrorBoundary` + `Suspense`.

### State Management

- **Server state** -- TanStack Query manages all API data. Each domain entity has a query file in `queries/` exporting `useFetch*`, `useCreate*`, `useUpdate*`, and `useDelete*` hooks. Query keys are exported constants for consistent cache invalidation.
- **Form state** -- `react-hook-form` manages form values, validation, and submission. Forms are validated against `yup` schemas.
- **Table state** -- The `hooks/table-controls/` system provides composable hooks for filtering, sorting, pagination, active item tracking, and row expansion. Supports both client-side and hub-side (server) operations.
- **Wizard state** -- Multi-step wizards use a react/immerjs reducer pattern to collect form state from each step and drive wizard behavior (navigation, validation, submission).
- **UI state** -- React context provides global state for notifications (`NotificationsProvider`) and background tasks (`TaskManagerProvider`). Persistent UI state uses `usePersistentState` (URL params or localStorage).

## Data Flow

Requests flow from page components through TanStack Query hooks to the Hub API. Caddy proxies `/hub`, `/oidc`, and `/kai` to the Hub. It automatically handles WebSocket upgrades, including ACP sessions under `/hub/agentic/` and rspack HMR in development. `container/caddy/proxy-routes.caddy` preserves existing `Forwarded` headers or synthesizes them from ingress forwarding headers; the ingress must sanitize client-supplied forwarding headers.

### API Layer

```text
pages/{feature}/          queries/{feature}.ts        api/rest.ts              Hub API
  Component               useFetchApplications()      getApplications()        GET /hub/applications
    |                         |                            |                        |
    +--- useQuery hook -------+---- axios call ------------+---- HTTP proxy --------+
```

- `api/models.ts` -- TypeScript interfaces for all Hub domain entities. The `New<T>` utility type omits `id` for creation payloads. The `WithUiId<T>` utility adds a client-generated unique ID for table row selection when hub entities lack one.
- `api/rest.ts` and `api/rest/*.ts` -- Axios wrapper functions. The monolithic `rest.ts` is being refactored into per-entity modules under `api/rest/` (e.g., `rest/applications.ts`, `rest/tags.ts`). The `hub` tagged template builds `/hub`-prefixed paths. Request params for hub-side filtering, sorting, and pagination are serialized by `serializeRequestParamsForHub`.
- `api/schemas.ts` -- Validation schemas for API payloads.

### Branding

The UI supports build-time branding via the `BRANDING` environment variable. The `common` package processes branding assets (strings, favicon, manifest) through EJS templating and rollup bundling. See [BRANDING.md](BRANDING.md) for details.

## Agentic Console

A feature-flagged section of the UI for launching and watching [konveyor/agentic-controller](https://github.com/konveyor/agentic-controller) runs through the Hub: agent runs and workflow runs (lists, launch from the application inventory, a live session panel), and catalog pages for agents, skills, and workflows. It is a dev preview and is dark by default.

### Feature flags

Both flags are included in `window._env` with the rest of `ClientEnv` (`client/src/env/types.ts`), and exposed as `isAgenticEnabled` / `isAgenticSteerEnabled` in `client/src/app/Constants.ts`. Production uses Caddy's `/.env` JSON template; development uses the same environment builder for `/.env` and HTML injection. They are evaluated once, at page load.

| Variable                | Production default | Dev server default | Gates                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------------- | ------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AGENTIC_ENABLED`       | `false`            | `false`            | The console itself: the `agenticRoutes` route group, the **Agentic** sidebar group, the **Run agent workflow** actions in the application inventory (bulk and per-row; shown with application write access, for applications that have a repository), and the **Workflow runs** link in the application detail drawer. Off means none of that exists -- no routes, no navigation, no requests to `/hub/agentic/*`. |
| `AGENTIC_STEER_ENABLED` | `false`            | `false`            | Intervention in a live run from the chat panel: free-text instructions and **Stop the agent's turn**. Off leaves the panel read-only; the agent's own questions stay answerable because an unanswered ask blocks the run. No effect unless `AGENTIC_ENABLED` is also `true`.                                                                                                                                       |

Enabling the console is a deployment decision. Its pages talk to the Hub's `/agentic/*` API -- REST through the `/hub` proxy, plus one ACP WebSocket per live run at `/hub/agentic/agentruns/{name}/acp`, authorized by the Hub's one-time-nonce handshake -- which exists only on a Hub built with the agentic endpoints ([konveyor/tackle2-hub#1119](https://github.com/konveyor/tackle2-hub/pull/1119)) and backed by an agentic-controller in the cluster. Against any other Hub every page in the section fails on load, so leave the flag off. The server side is unconditional -- the `/hub` proxy always accepts WebSocket upgrades under `/hub/agentic/` -- the flags only shape what the browser renders and requests.

Set the flags on the UI container's environment. On an operator-managed install, use the Tackle CR: the [Konveyor operator](https://github.com/konveyor/operator) exposes `spec.agentic_enabled` and `spec.agentic_steer_enabled` (both default `false`, [konveyor/operator#596](https://github.com/konveyor/operator/pull/596)); direct Deployment edits are reconciled away. Local console work uses `AGENTIC_ENABLED=true AGENTIC_STEER_ENABLED=true npm run start:dev`.

### Code map

- `api/agentic/contract.ts` -- Browser-safe types and helpers for the `konveyor.io/v1alpha1` agent surface (`AgentRun`, `AgentResource`, `AgentWorkflow`, `AgentWorkflowRun`, `Gateway`, `SkillCard`), mirrored from the agentic-controller's `api/v1alpha1/*.go`.
- `api/agentic/acp.ts` -- The ACP (Agent Client Protocol) session over WebSocket: JSON-RPC 2.0 frames with requests in both directions (`session/prompt`, `session/update`, `session/request_permission`, `elicitation/create`) plus goose's steer extension.
- `api/rest/agent-runs.ts` and `queries/{agent-runs,agents,skills,workflows,workflow-runs,agentic-catalog}.ts` -- REST wrappers and TanStack Query hooks in the usual per-entity pattern.
- `pages/{agent-runs,agents,skills,workflows,workflow-runs}/` -- The console pages. `pages/agent-runs/components/ChatPanel.tsx` is the live session panel and the only consumer of `AGENTIC_STEER_ENABLED`.

## Dependencies

| Category             | Key Libraries                      |
| -------------------- | ---------------------------------- |
| UI framework         | React 18, PatternFly 6             |
| Routing              | react-router-dom 5                 |
| Server state         | TanStack Query 4, Axios            |
| Form state           | react-hook-form, yup               |
| Internationalization | i18next, react-i18next             |
| Auth                 | oidc-client-ts, react-oidc-context |
| Code editor          | Monaco Editor                      |
| Charts               | @patternfly/react-charts           |
| Drag & drop          | @dnd-kit/core, @dnd-kit/sortable   |
| Server               | Caddy, Go startup entrypoint       |
| E2E testing          | Cypress                            |
| Unit testing         | Jest, @testing-library/react       |

The `common` package is built first and consumed by `client`. PatternFly version is pinned across all `@patternfly/*` packages to avoid style conflicts.

## Deployment

### Container Image

The Dockerfile uses a multi-stage build:

1. **Client builder** (`ubi10/nodejs-22`) -- Installs dependencies, builds npm workspaces, and assembles static assets with `npm run dist`.
2. **Entrypoint builder** (`hi/go`) -- Runs CA regression tests and compiles the static Go entrypoint.
3. **Runtime** (`hi/caddy`) -- Contains static assets, configuration, and public CA roots copied from the client builder. The entrypoint combines those roots with optional mounted trust, then execs Caddy. No Node.js, shell, or package manager is required at runtime. Caddy configuration is validated during the image build.

The image is published to `quay.io/konveyor/tackle2-ui` and deployed by the [Konveyor Operator](https://github.com/konveyor/operator) as a pod within the Konveyor deployment.

### CI/CD

GitHub Actions workflows handle:

- **`ci-repo.yml`** -- Repo-level CI: linting, unit tests, build verification. Runs on push and PR.
- **`ci-e2e-tests.yml`** -- Run e2e CI: deploys the operator with the UI image and runs e2e tests.
- **`image-build.yaml`** -- Multi-architecture container image build and push on merge to main and release branches.
- **`pr-checks.yml`** -- PR-specific checks (file change detection, label validation).
- **Nightly workflows** -- Scheduled CI and e2e runs for `main` and `release-*` branches.

### Release Branches

Active release branches follow the `release-X.Y` naming convention. CVE remediation and critical fixes are cherry-picked from `main` to active release branches. The current active branches are `main`, `release-0.9`, and `release-0.8`.
