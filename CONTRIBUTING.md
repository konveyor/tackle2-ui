# Contributing to tackle2-ui

Thank you for your interest in contributing to the Konveyor UI. This document covers conventions, processes, and standards specific to this repository.

For development setup (cloning, installing dependencies, running the dev server), see [docs/development.md](docs/development.md).

## Coding Standards

### TypeScript and React

- Write functional components with hooks. Class components are not used in this codebase.
- Use `react-hook-form` with `yup` validation schemas for all forms.
- Use `@tanstack/react-query` (TanStack Query) for server state. Query hooks live in `client/src/app/queries/` and follow the `useFetch*` / `useCreate*` / `useUpdate*` / `useDelete*` naming pattern.
- Use explicit null/undefined checks for IDs (`id != null`) rather than truthy checks (`if (id)`). IDs in this project start at 1, but truthy checks can mask edge cases.
- Prefer `FilterSelectOptionProps` (`{ value, label }`) for select component options.

### File Naming, Styling, and Forms

See [docs/development.md](docs/development.md) for file naming conventions, styling guidelines, and the form development guide (react-hook-form + PatternFly wrappers).

### Internationalization

See [INTERNATIONALIZATION.md](INTERNATIONALIZATION.md) for translation conventions and adding new languages.

## Testing

- **Unit tests** — see [docs/tests.md](docs/tests.md) for conventions, test environment, and commands.
- **End-to-end tests** — see [cypress/README.md](cypress/README.md) for Cypress setup, page object models, and CI integration.

## Pull Requests and Versioning

Follow the [Konveyor PR process](https://github.com/konveyor/release-tools/blob/main/VERSIONING.md#pull-request-pr-process) for branching, versioning, and PR conventions. See [VERSIONING.md](VERSIONING.md) for project-specific versioning details.
