# tackle2-ui

Konveyor UI -- React + PatternFly frontend for the application modernization platform.

## Context Files

- [AGENTS.md](AGENTS.md) -- Directory structure, code patterns, review checklist
- [ARCHITECTURE.md](ARCHITECTURE.md) -- System design, data flow, deployment
- [CONTRIBUTING.md](CONTRIBUTING.md) -- Coding standards, PR process, testing

## Quick Reference

- **Stack:** React, TypeScript, PatternFly (PF5/PF6 migration in progress), TanStack Query, react-hook-form + yup, Axios, Express proxy, Cypress E2E
- **Workspaces:** `common/` (shared), `client/` (React app), `server/` (Express proxy), `cypress/` (E2E tests)
- **Path alias:** `@app/` -> `client/src/app/` (TS paths in `client/tsconfig.json`)
- **Workspace package:** `@konveyor-ui/common` -> `common/` (npm workspace, not a TS path alias)
- **API pattern:** `pages/ -> queries/*.ts (TanStack hooks) -> api/rest.ts (Axios) -> /hub/* (proxy)`
- **Forms:** Always use `react-hook-form` + `yup`. Wrappers in `components/HookFormPFFields/`
- **Selects:** `SimpleSelect` (single), `TypeaheadSelect` (single + search), `MultiSelect` (multi + chips)
- **RBAC roles:** `tackle-admin`, `tackle-architect`, `tackle-migrator`

## Key Rules

- Use `id != null` for ID checks, never truthy (`if (id)`)
- File names use kebab-case
- All user-facing strings go through `react-i18next` (`useTranslation` hook)
- Import order: react -> external -> @patternfly -> @konveyor-ui/@app -> relative

## Commands

```bash
npm run start:dev      # Dev server (port 9000) with port forwarding
npm run test           # Unit tests (Jest)
npm run lint           # ESLint
npm run format:check   # Prettier check
```
