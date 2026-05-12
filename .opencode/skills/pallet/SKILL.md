---
name: pallet
type: skill
governance: governed
---

# Pallet — AI Agent Configuration Manager

Pallet syncs and places AI agent configuration (skills, rules, agents) from organizational sources into your workspace.

## Commands

- `pallet sync .` — Sync resources from all configured sources into the current workspace
- `pallet sync . --locked` — Reproduce exact state from `pallet.lock` (deterministic build)
- `pallet config show` — Show current configuration
- `pallet config add-source <name> --type git --url <url>` — Add a git source
- `pallet config remove-source <name>` — Remove a source
- `pallet auth <hub_url> --user <user> --password <pass>` — Authenticate with a Konveyor hub

## How It Works

1. **Sources** are configured in `pallet.yaml` (git repos, local paths, or Konveyor hub)
2. `pallet sync .` fetches resources from all sources, merges them by layer priority, and writes them to each detected agent's config directory
3. **Layer hierarchy**: sources are ordered by index — lower index = more authoritative (org-wide), higher index = more specific (team/project)
4. **Governance**: `governed` resources cannot be overridden by less-authoritative sources; `federated` resources can be

## Supported Agents

Pallet detects and places resources for all agents present in the workspace:
- **Claude Code** — `.claude/rules/`, `.claude/skills/`, `.claude/agents/`
- **Cursor** — `.cursor/rules/*.mdc`
- **Goose** — `.goose/instructions.md`
- **OpenCode** — `.opencode/instructions.md`
- **OpenAI Codex** — `codex.md`, `.codex/agents/`

## Tips

- Run `pallet sync .` after pulling to get the latest organizational rules and skills
- Add your own project-specific rules directly to your agent's config directory — they coexist with synced resources
- Use `pallet sync . --locked` in CI for reproducible builds
- Check `pallet.lock` to see exactly what was synced and from where
