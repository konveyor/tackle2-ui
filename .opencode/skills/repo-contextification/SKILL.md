---
name: repo-contextification
description: Audit a repository for foundational docs (README, CONTRIBUTING, AGENTS, ARCHITECTURE) and AI tooling config, then scaffold missing files in one pass
user-invocable: true
disable-model-invocation: false
---

Audit a repository for documentation completeness and AI-readiness, then scaffold missing files in one pass. Skips already-complete files.

## Usage

```bash
/repo-contextification <path-or-owner/repo>
```

**Argument (optional):** the target to contextify — a local directory path (e.g., `/home/user/projects/my-app`) or a GitHub `owner/repo` identifier (e.g., `acme/widget-api`). If omitted, defaults to the current working directory.

## What This Does

Launches the `repo-contextification` agent which:

1. Uses the provided path/repo (or prompts if none given)
2. Scans for required documentation files and checks their completeness
3. Presents a gap analysis with AI-readiness score
4. Reads the codebase deeply to understand patterns and conventions
5. Generates all missing docs and AI tooling config in one pass
6. Validates all generated files for completeness and link integrity
7. Reviews content quality, cross-file accuracy, and suggests agent improvements

## Expected Output

- Gap analysis report showing present/missing files with completeness scores
- Generated documentation files: README.md, CONTRIBUTING.md, AGENTS.md, ARCHITECTURE.md
- AI tooling config: .coderabbit.yaml
- Final summary with updated AI-readiness score

## Critical Rules

- Generates all files in one pass — no per-file approval prompts
- Never fabricates architectural details — asks when unsure
- Preserves existing content when updating files
- No secrets, internal URLs, or PII in generated documentation
