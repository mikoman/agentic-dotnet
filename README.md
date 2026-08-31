# Agentic .NET configuration

This repository is the source of truth for personal C#/.NET coding-agent configuration on this machine. It keeps always-on guidance small, delegates standard framework knowledge to the official [`dotnet/skills`](https://github.com/dotnet/skills) project, and uses MCP only for external documentation access.

To integrate another coding harness or tool, give its agent [`INSTALL_NEW_HARNESS.md`](INSTALL_NEW_HARNESS.md). The file is a complete, copy/paste-ready installation contract covering audit, backup, adapters, skills, official plugins, MCP, automation, and verification. Root [`AGENTS.md`](AGENTS.md) makes that contract discoverable to agents working directly in this repository.

## Architecture

- `instructions/global.md` is the only manually edited global .NET instruction set.
- `skills/` is the only physical home for personal reusable Agent Skills. It intentionally starts empty because the audit found no custom workflow that justified duplicating official or vendor knowledge.
- `config/plugins.yaml` declares which official .NET plugins should exist.
- `config/mcp.yaml` describes desired MCP services without credentials.
- `adapters/` contains generated or thin harness-specific representations.
- `scripts/` installs, synchronizes, diagnoses, and conservatively audits repositories.
- `reports/` contains inventories and migration reports. `backups/` contains timestamped, recoverable copies of changed material.

## Harness consumption

Codex reads `~/.codex/AGENTS.md`, which is a symlink to `instructions/global.md`. Personal skills are discovered from `~/.agents/skills`; Codex follows symlinked skill directories. Official .NET plugins are installed from the `dotnet/skills` Codex marketplace.

Claude Code reads `~/.claude/CLAUDE.md`, a one-line import of the canonical global file. Personal skill directories under `~/.claude/skills` link back to `skills/`. Official .NET plugins are installed from the `dotnet-agent-skills` marketplace.

Cursor loads the local `agentic-dotnet` plugin linked from `~/.cursor/plugins/local/agentic-dotnet`. `sync.sh` regenerates its always-on `.mdc` rule from the canonical Markdown. Desired official .NET plugins are linked from a shallow official checkout in `~/.cache/agentic-dotnet/dotnet-skills`; they are not copied into this repository.

Copilot CLI uses `~/.copilot/copilot-instructions.md`, symlinked to the canonical instructions, and discovers personal skills from `~/.agents/skills`. Its Microsoft Learn MCP file is also a symlink to the central adapter. The CLI was not installed during the initial migration, so official plugin installation is deferred until it exists.

## MCP policy

Microsoft Learn is the only newly configured global MCP service. It provides current Microsoft documentation through `https://learn.microsoft.com/api/mcp` and does not require credentials. Existing Claude account connectors were preserved. GitHub is not duplicated globally: Copilot CLI supplies GitHub capabilities natively, and no other existing reliable GitHub MCP configuration was found.

Filesystem, shell, generic search, database, and production-infrastructure MCP servers are not global defaults. Project-sensitive MCP remains project-specific. Playwright MCP is not installed globally; prefer Playwright CLI and Agent Skills when a repository actually needs browser automation.

## Add a personal skill

Create `skills/<skill-name>/SKILL.md` with a lowercase hyphenated name and a precise description. The skill must define its purpose, when to use it, when not to use it, workflow, and success criteria. Keep framework reference material out of personal skills when an official maintained skill exists. Run `scripts/sync.sh` to create or repair the `~/.agents/skills` and `~/.claude/skills` links.

## Add repository-specific instructions

Add a root `AGENTS.md` only when the repository has durable facts that are not obvious from source and deterministic configuration: special build commands, generated-code boundaries, database-first behavior, domain invariants, or unusual deployment constraints. If Claude needs an adapter, use a one-line root `CLAUDE.md` containing `@AGENTS.md`.

Do not add generic C# style advice, copied official .NET documentation, duplicated skill trees, global MCP servers, or deterministic settings already represented by `.editorconfig`, analyzers, MSBuild, or project files.

## Operations

- `scripts/install.sh` detects installed harnesses, synchronizes adapters, installs desired official plugins where supported, and configures Microsoft Learn MCP.
- `scripts/sync.sh` repairs instruction adapters, skill links, and the generated Cursor rule without overwriting unrelated regular files.
- `scripts/doctor.sh [development-root]` prints pass/warn/fail status for adapters, skills, plugins, SDKs, MCP, broken links, and remaining repository clutter.
- `scripts/clean-repos.sh --root PATH` is dry-run by default. Use `--apply` only after reviewing its output. A reviewed explicit manifest can be supplied with `--manifest FILE`; every applied path is moved into a timestamped backup rather than deleted.

For a new harness, start with the handoff prompt at the end of `INSTALL_NEW_HARNESS.md`. The integrating agent should extend these scripts rather than create standalone setup instructions elsewhere.

Backups live under `backups/YYYY-MM-DD-HHMMSS/` or `backups/clean-*`. They mirror the affected paths and can be copied back manually. The migration report names the exact backup used.

Local home-directory configuration and symlinks are not available to hosted/cloud agents. Those environments may require repository-level `AGENTS.md`, organization policy, marketplace installation, or account-level plugin configuration.
