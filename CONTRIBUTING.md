# Contributing to tackle2-ui

Thank you for your interest in contributing to the Konveyor UI. This document covers conventions, processes, and standards specific to this repository.

For initial setup (cloning, installing dependencies, running the dev server), see [README.md](README.md#quick-start).

## Coding Standards

### TypeScript and React

- Write functional components with hooks. Class components are not used in this codebase.
- Use `react-hook-form` with `yup` validation schemas for all forms.
- Use `@tanstack/react-query` (TanStack Query) for server state. Query hooks live in `client/src/app/queries/` and follow the `useFetch*` / `useCreate*` / `useUpdate*` / `useDelete*` naming pattern.
- Use explicit null/undefined checks for IDs (`id != null`) rather than truthy checks (`if (id)`). IDs in this project start at 1, but truthy checks can mask edge cases.
- Prefer `FilterSelectOptionProps` (`{ value, label }`) for select component options.

### File Naming, Styling, and Forms

See [docs/development.md](docs/development.md) for file naming conventions, styling guidelines, and the form development guide (react-hook-form + PatternFly wrappers).

### Import Order

ESLint enforces import ordering (via `eslint-plugin-import-x`):

1. Node.js built-ins
2. `react` (pinned first)
3. External libraries
4. `@patternfly/**` (pinned after external)
5. `@konveyor-ui/**` and `@app/**` (internal)
6. Parent and sibling imports

### Internationalization

All user-facing strings use `react-i18next`. Translation files live in `client/public/locales/{lang}/translation.json`. Use the `useTranslation` hook (`const { t } = useTranslation()`) to access translated strings. See [INTERNATIONALIZATION.md](INTERNATIONALIZATION.md) for adding new languages.

## Linting and Formatting

The project uses ESLint (flat config) and Prettier. Run from the repo root:

```bash
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format:check  # Prettier dry-run
npm run format        # Prettier auto-format
```

A `husky` + `lint-staged` pre-commit hook runs automatically on staged files.

## Testing

- **Unit tests** — see [docs/tests.md](docs/tests.md) for conventions, test environment, and commands.
- **End-to-end tests** — see [cypress/README.md](cypress/README.md) for Cypress setup, page object models, and CI integration.

## Pull Request Process

- PRs target the `main` branch for new features and bug fixes.
- CVE and security fixes are cherry-picked to active release branches (`release-0.8`, `release-0.9`) with the branch name prefixed in the PR title (e.g., `[release-0.9] :bug: Fix vulnerability`).
- All PRs require CI to pass and at least one approval from a [code owner](CODEOWNERS). Cypress test changes require additional approval from test maintainers.
- Follow the [Konveyor PR process](https://github.com/konveyor/release-tools/blob/main/VERSIONING.md#pull-request-pr-process) for versioning and branching conventions.

### PR Title Conventions

PR titles use a gitmoji prefix to categorize the change:

- `:sparkles:` -- new feature
- `:bug:` -- bug fix
- `:seedling:` -- dependency or infrastructure update
- `:ghost:` -- dependency bump (Dependabot)
- `:test_tube:` -- test addition or fix

### AI-Assisted Contributions

When AI tools assist with a PR, note this in the PR description using either:

- `Assisted-by: {tool-name}` (e.g., `Assisted-by: Claude Sonnet 4.6 (Anthropic)`)
- `AI Attribution: AIA Human-AI blend, Human-initiated, Reviewed, {model}`

## Versioning

The project follows [Konveyor's versioning guidelines](https://github.com/konveyor/release-tools/blob/main/VERSIONING.md). See [VERSIONING.md](VERSIONING.md) for details.
