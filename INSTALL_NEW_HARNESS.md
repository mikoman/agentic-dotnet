# Install a new coding harness into the centralized setup

This file is an execution contract for an AI coding agent integrating a new local harness or developer tool with `~/.agentic-dotnet`.

Do not create a parallel configuration system. Extend this repository and keep it as the source of truth.

## Requested outcome

Connect the named harness to:

- `instructions/global.md` for always-on .NET/C# behavior;
- `skills/` for personal Agent Skills;
- the official `dotnet/skills` plugins declared in `config/plugins.yaml`;
- the minimal external services declared in `config/mcp.yaml`.

Use the harness's current supported native mechanisms. Prefer a symlink or import, then a generated thin adapter. Never maintain a second manually edited copy.

## Safety and authority

You may inspect and update this central repository and the named harness's user-level configuration.

Before replacing anything:

1. Inspect and classify the existing configuration.
2. Preserve unrelated settings, plugins, connectors, and permissions.
3. Back up every changed path under a new timestamped directory in `backups/`.
4. Do not print, copy, transform, or commit credentials or secret values.

Do not modify application repositories, source code, build behavior, `.env` files, credentials, Keychain entries, certificates, SSH configuration, tokens, or production infrastructure while installing a harness.

If an existing setting is ambiguous, preserve it and report it for manual review.

## Integration workflow

### 1. Inspect the harness

- Determine whether it is installed, its exact version and executable/application location.
- Inspect its current `--help`, plugin/extension help, MCP help, and configuration status before invoking installation commands.
- Consult current official documentation when local help does not establish a supported mechanism.
- Determine whether it supports global instructions, `AGENTS.md`, Agent Skills, plugins, imports, symlinks, and MCP.
- Do not install an entire IDE or application merely because its configuration can be prepared.

### 2. Audit existing user configuration

- Locate the harness's user-level configuration and plugin directories.
- Record existing instruction files, skills, plugins, MCP servers, and adapters without exposing values that may contain secrets.
- Preserve unrelated configuration.
- Detect whether the desired official plugins or Microsoft Learn MCP are already present.

### 3. Add a thin central adapter

Create `adapters/<harness>/` only when the harness needs its own representation.

Use this preference order:

1. Directly consume `instructions/global.md`.
2. Symlink the harness's global instruction file to it.
3. Use the harness's supported import syntax.
4. Generate a minimal adapter from it in `scripts/sync.sh`.

Generated adapters must contain a managed marker and direct maintainers to edit `instructions/global.md`. Do not add generic .NET advice to the adapter.

### 4. Expose personal skills

Personal reusable skills physically live only under `skills/<skill-name>/`.

- Prefer the portable `~/.agents/skills` discovery path when supported.
- Add a harness-specific skill symlink only when required.
- Extend `scripts/sync.sh` to create and repair links idempotently.
- Do not copy skill contents.
- Do not centralize standard .NET knowledge already maintained by the official `dotnet/skills` project.

An empty personal skill library is valid.

### 5. Install official .NET capabilities

- Treat `config/plugins.yaml` as the declaration of what is desired.
- Use the harness's current official marketplace/plugin mechanism.
- Check current status before installing anything.
- Make installation idempotent.
- If native plugin installation is unsupported, prefer a shallow official cache plus symlinks when the harness explicitly supports local plugins.
- Do not copy official skills into this repository.
- Do not install excluded testing or preview plugins automatically.
- Report each desired plugin as installed, already present, unavailable, unsupported, or failed.

### 6. Configure MCP minimally

- Treat `config/mcp.yaml` as the policy source.
- Configure Microsoft Learn MCP only when the harness supports it sensibly.
- Preserve reliable existing GitHub integration without duplicating it.
- Do not add global filesystem, shell, generic search, database, production-infrastructure, or Playwright MCP servers.
- Never store secrets in `config/mcp.yaml` or generated adapters.
- Leave project- or security-sensitive MCP configuration project-specific.

### 7. Extend automation

Update the central tooling so the integration remains maintainable:

- `scripts/install.sh`: detect the harness and install/configure supported components idempotently.
- `scripts/sync.sh`: repair instruction adapters and skill links.
- `scripts/doctor.sh`: verify the adapter, links, official plugins where status is exposed, MCP, and broken links.
- `README.md`: document how the harness consumes the central sources and any hosted/cloud limitation.
- `config/plugins.yaml`: record the harness implementation mechanism if appropriate.

Do not weaken the conservative behavior of `scripts/clean-repos.sh`.

### 8. Verify

Run:

```sh
~/.agentic-dotnet/scripts/sync.sh
~/.agentic-dotnet/scripts/install.sh
~/.agentic-dotnet/scripts/doctor.sh
```

Also verify:

- every new symlink resolves;
- generated adapters match the canonical source;
- repeated installation produces no duplicate plugin or MCP entries;
- unrelated harness configuration is unchanged;
- no secret appears in Git changes or reports;
- `git -C ~/.agentic-dotnet diff --check` passes;
- `git -C ~/.agentic-dotnet status --short` contains only the intended central changes.

Do not commit application repositories. A commit inside `~/.agentic-dotnet` is allowed after verification.

## Success criteria

The integration is complete when:

- the harness receives the canonical global instructions without a maintained copy;
- it can discover personal skills from the canonical tree where supported;
- desired official .NET plugins are installed or accurately reported as unsupported;
- Microsoft Learn MCP is configured once where supported;
- install, sync, and doctor cover the harness idempotently;
- unrelated settings and secrets remain untouched;
- limitations and any manual action are explicitly reported.

Hosted or cloud agents may not see local home-directory files. Report that limitation and use the harness's account, organization, marketplace, or repository-level mechanism rather than pretending local symlinks are available remotely.

## Copy/paste handoff prompt

Replace `<HARNESS>` and give this prompt to an agent operating on the development machine:

```text
Integrate <HARNESS> with my existing centralized .NET coding-agent setup.

Read ~/.agentic-dotnet/INSTALL_NEW_HARNESS.md completely and execute it as the installation contract. Treat ~/.agentic-dotnet as the source of truth. Inspect current local help and official documentation before choosing configuration or plugin commands. Preserve unrelated configuration and secrets, create a timestamped backup before replacement, make the integration idempotent, extend install/sync/doctor and documentation, run verification, and report unsupported capabilities accurately. Do not modify or commit application repositories.
```
