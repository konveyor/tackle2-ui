# tackle2-ui

Konveyor UI -- React + PatternFly frontend for the application modernization platform.

## Context Files

- [AGENTS.md](AGENTS.md) -- Directory structure, review checklist, dependencies
- [ARCHITECTURE.md](ARCHITECTURE.md) -- System design, data flow, deployment
- [CONTRIBUTING.md](CONTRIBUTING.md) -- Coding standards, PR process, testing

Conventions: see [.cursor/rules/tackle2-ui.mdc](.cursor/rules/tackle2-ui.mdc) or [AGENTS.md](AGENTS.md) for the full list.

## Key Rules

- Use `id != null` for ID checks, never truthy (`if (id)`)
- File names use kebab-case
- All user-facing strings go through `react-i18next` (`useTranslation` hook)
- Import order: react -> external -> @patternfly -> @konveyor-ui/@app -> relative

## AI Principles

1. **Think before coding** — state assumptions, ask when uncertain, suggest simpler approaches
2. **Simplicity first** — minimum code that solves the problem, no speculative features or abstractions
3. **Surgical changes** — touch only what the task requires, match existing style, don't refactor uninvited
4. **Goal-driven execution** — define success criteria upfront, verify each step before moving on

## Commands

```bash
npm run start:dev      # Dev server (port 9000) with port forwarding
npm run test           # Unit tests (Jest)
npm run lint           # ESLint
npm run format:check   # Prettier check
```
