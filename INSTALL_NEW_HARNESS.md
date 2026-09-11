# Install a new coding harness into the centralized setup

This file is an execution contract for an AI coding agent integrating a new local harness or developer tool with `~/.agentic-dotnet`.

Do not create a parallel configuration system. Extend this repository and keep it as the source of truth.

## Requested outcome

Connect the named harness to:

- `instructions/global.md` for shared coding behavior, skill selection, and conditional .NET rules;
- `skills/` for personal and reviewed third-party Agent Skills, including ASD-STE100, Impeccable, and Matt Pocock's main collection;
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

Include the complete canonical instructions, including [GitNexus indexing and code discovery](instructions/global.md#gitnexus-indexing-and-code-discovery). Preserve those mandatory indexing and freshness rules when integrating third-party skills, hooks, or MCP tools; keep the rules in the canonical source instead of maintaining harness-specific copies. Preparing a harness does not run indexing in application repositories.

Include the [text-output rule](instructions/global.md#text-output) in every instruction adapter. It requires `asd-ste100` for all authored text. Keep this rule in the canonical source. It overrides the skill's narrower upstream triggers.

Include the [task and skill selection rules](instructions/global.md#task-and-skill-selection) in every adapter. Select skills from the affected component's technology and the requested task. Keep .NET rules conditional on .NET work. Preserve the skill's invocation policy. Report available skills separately from skills selected for a task.

Check whether delegated agents inherit the canonical instructions. If they do not, the parent agent must include the text-output requirement in their task instructions.

### 4. Expose personal skills

Personal and reviewed third-party reusable skills physically live only under `skills/<skill-name>/`.

- Prefer the portable `~/.agents/skills` discovery path when supported.
- Add a harness-specific skill symlink only when required.
- Extend `scripts/sync.sh` and `scripts/sync.ps1` to create and repair links idempotently on supported platforms.
- Do not copy skill contents.
- Do not centralize standard .NET knowledge already maintained by the official `dotnet/skills` project.

The checked-in library includes [ASD-STE100](skills/ASD-STE100.md), Impeccable, and the 25 Matt Pocock engineering/productivity skills in [skills/MATTPOCOCK.md](skills/MATTPOCOCK.md). Expose the entire canonical tree, including future additions, rather than hard-coding that list in a harness adapter. Keep each complete skill directory, including `agents/openai.yaml`, references, templates, and `LICENSE`.

The existing discovery paths are:

| Harness | User-level skill path maintained by sync |
| --- | --- |
| Codex | `~/.agents/skills/<skill-name>` |
| Claude Code | `~/.claude/skills/<skill-name>` |
| GitHub Copilot CLI | `~/.agents/skills/<skill-name>` |
| Cursor | `~/.agents/skills/<skill-name>` |
| Kilo | `~/.agents/skills/<skill-name>` |

Every entry points to the same `skills/<skill-name>` directory. Windows uses symlinks or directory junctions. Verify the new harness's current discovery support before adding another path, and preserve unrelated skills with colliding names for review.

When a skill is missing or a new upstream skill is requested, follow [PORTABLE_INSTALL.md](PORTABLE_INSTALL.md#shared-skills-including-matt-pococks-collection): review a pinned upstream revision, install into the central tree, retain the licence and source record, then sync and verify every harness. Do not also install the Matt Pocock marketplace plugin or run an installer that creates separate per-harness copies. Miscellaneous and in-progress skills remain opt-in.

Keep Matt Pocock's per-project `setup-matt-pocock-skills` workflow separate from harness installation. It belongs in an application repository when the user requests that setup; tracker choices and `docs/agents/*.md` do not belong in the global instructions. Preserve upstream invocation settings and use the harness's equivalent skill-loading mechanism when the text refers to a `Skill` tool it does not provide.

An empty personal skill library is also valid for a deliberately minimal installation.

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
- `scripts/install.ps1`, `scripts/sync.ps1`, and `scripts/doctor.ps1`: keep equivalent Windows behavior when the harness supports Windows.
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

On Windows, run the equivalent PowerShell scripts or rerun `bootstrap.ps1`:

```powershell
& "$HOME\.agentic-dotnet\scripts\sync.ps1"
& "$HOME\.agentic-dotnet\scripts\install.ps1"
& "$HOME\.agentic-dotnet\scripts\doctor.ps1"
```

Also verify:

- every new symlink resolves;
- every installed canonical skill is discoverable through the harness's supported skill path, with supporting files intact; check the skill picker/list in installed harnesses and report prepared paths separately when a harness is absent;
- generated adapters match the canonical source;
- the harness receives the text-output rule and can load `asd-ste100`, including its references and linter;
- a fresh session can identify this rule and apply the skill to a normal answer without an explicit skill request;
- each harness's instruction link, import, or generated adapter includes the canonical GitNexus workflow; distinguish configured paths from instructions loaded in a running session;
- each adapter includes component-level skill selection and conditional .NET rules;
- repeated installation produces no duplicate plugin or MCP entries;
- unrelated harness configuration is unchanged;
- no secret appears in Git changes or reports;
- `git -C ~/.agentic-dotnet diff --check` passes;
- `git -C ~/.agentic-dotnet status --short` contains only the intended central changes.
- Windows machines without symbolic-link permission use managed generated files or directory junctions and still pass the platform doctor.

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
Integrate <HARNESS> with my existing centralized coding-agent setup.

Preserve language-aware skill selection from instructions/global.md. Apply .NET rules only to affected .NET components.

Read ~/.agentic-dotnet/INSTALL_NEW_HARNESS.md completely and execute it as the installation contract. Treat ~/.agentic-dotnet as the source of truth. Inspect current local help and official documentation before choosing configuration or plugin commands. Expose the entire central skills tree, including ASD-STE100, Impeccable, and the Matt Pocock collection listed in skills/MATTPOCOCK.md, through supported discovery paths without separate copies or duplicate plugins. Distribute the canonical text-output rule so the harness must use asd-ste100 for all authored text. Preserve unrelated configuration and secrets, create a timestamped backup before replacement, make the integration idempotent, extend install/sync/doctor and documentation, run verification, and report unsupported capabilities accurately. Do not modify or commit application repositories or run per-project skill setup as part of harness installation.
```
