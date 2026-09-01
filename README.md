# agentic-dotnet

[![Validate](https://github.com/mikoman/agentic-dotnet/actions/workflows/validate.yml/badge.svg)](https://github.com/mikoman/agentic-dotnet/actions/workflows/validate.yml)

A portable, centralized configuration for .NET coding agents. It gives Codex, Claude Code, GitHub Copilot CLI, Cursor, and Kilo one concise instruction source, one personal Agent Skills tree, official .NET skills where supported, and a minimal MCP policy.

The package configures installed tools. It does not install agent CLIs, IDEs, .NET, Git, Node, or credentials.

## Quick start

### macOS and Linux

Clone the repository and run:

```sh
git clone https://github.com/mikoman/agentic-dotnet.git
cd agentic-dotnet
./bootstrap.sh
```

Or download the latest `.tar.gz` from [GitHub Releases](https://github.com/mikoman/agentic-dotnet/releases), verify it against `SHA256SUMS`, extract it, and run `./bootstrap.sh`.

### Windows

Clone or extract the release zip, open PowerShell in the repository directory, and run:

```powershell
powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1
```

PowerShell 7 is recommended. The scripts retain Windows PowerShell 5.1-compatible syntax.

### Existing harness configuration

Existing unrelated instruction or MCP files are backed up and preserved by default. If you have reviewed the warnings and want this package to take ownership:

```sh
./bootstrap.sh --replace-existing
```

```powershell
.\bootstrap.ps1 -ReplaceExisting
```

Rerunning the bootstrap updates package-owned files and repairs adapters idempotently.

## What it configures

- Codex: global `AGENTS.md`, shared personal skills, official `dotnet/skills` marketplace plugins, and Microsoft Learn MCP.
- Claude Code: a generated import of the canonical instructions, linked personal skills, official marketplace plugins, and Microsoft Learn MCP.
- GitHub Copilot CLI: global instructions, shared personal skills, and centrally managed Microsoft Learn MCP configuration. The installer does not invent an unsupported plugin marketplace command.
- Cursor: a generated local plugin and links to a shallow checkout of the official .NET plugins.
- Kilo: global instructions, shared personal skills, Microsoft Learn MCP, and official skill paths from the shallow cache.

Missing harnesses produce warnings rather than installation failures. Install the desired harness separately and rerun the bootstrap.

## Design principles

1. Deterministic repository configuration remains authoritative.
2. Durable repository-specific facts belong in a concise root `AGENTS.md`.
3. Standard .NET knowledge comes from the official [`dotnet/skills`](https://github.com/dotnet/skills) project.
4. Personal Agent Skills remain small and physically live in one tree.
5. Global instructions have one manually edited source.
6. MCP is used only for external capabilities that need it.
7. Harness-specific files are symlinks, imports, junctions, or generated adapters.

## Repository layout

```text
.
├── instructions/global.md       # Canonical always-on .NET/C# behavior
├── skills/                      # Canonical personal Agent Skills
├── config/
│   ├── plugins.yaml             # Desired official .NET plugins
│   └── mcp.yaml                 # Credential-free MCP policy
├── adapters/                    # Thin/generated harness representations
├── scripts/
│   ├── install.sh / install.ps1
│   ├── sync.sh / sync.ps1
│   ├── doctor.sh / doctor.ps1
│   └── package.sh / package.ps1
├── bootstrap.sh                 # macOS/Linux entry point
├── bootstrap.ps1               # Windows entry point
└── PORTABLE_INSTALL.md
```

The default installation root is `~/.agentic-dotnet`. Set `AGENTIC_DOTNET_HOME` or pass `--target`/`-TargetRoot` to use another path.

## Safety

- Package updates back up changed central files.
- Sync backs up harness files before replacement.
- Existing unrelated harness files are preserved unless replacement is explicitly requested.
- Local backups, reports, build archives, credentials, and machine state are excluded from Git and release packages.
- No script modifies application source repositories.
- No credentials are stored in declarative MCP configuration.

See [PORTABLE_INSTALL.md](PORTABLE_INSTALL.md) for installation options, recovery paths, and platform behavior.

## Personal skills

Create `skills/<skill-name>/SKILL.md`, then run the platform sync script:

```sh
./scripts/sync.sh
```

```powershell
.\scripts\sync.ps1
```

The sync exposes the same physical skill to compatible harnesses. Do not copy framework reference material that is already maintained by official .NET skills.

### Installing a third-party skill

Audit a third-party skill's `SKILL.md`, scripts, hooks, and referenced resources before installing it. Skills run with the permissions granted to the harness.

When Codex is installed, its bundled skill installer can download a skill directory from GitHub directly into the canonical tree. On macOS or Linux:

```sh
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo OWNER/REPOSITORY \
  --path PATH/TO/SKILL \
  --dest ~/.agentic-dotnet/skills

~/.agentic-dotnet/scripts/sync.sh
```

On Windows:

```powershell
py "$env:USERPROFILE\.codex\skills\.system\skill-installer\scripts\install-skill-from-github.py" `
  --repo OWNER/REPOSITORY `
  --path PATH/TO/SKILL `
  --dest "$env:USERPROFILE\.agentic-dotnet\skills"

& "$env:USERPROFILE\.agentic-dotnet\scripts\sync.ps1"
```

The installer refuses to overwrite an existing skill directory. Review upstream changes before replacing or updating an installed skill. If Codex is unavailable, download or clone the same skill directory into `~/.agentic-dotnet/skills/<skill-name>/`, preserving its complete directory structure, and then run the sync script.

Sync keeps one physical copy and exposes it through:

- `~/.agents/skills/<skill-name>` for Codex, Copilot CLI, and other compatible Agent Skills clients;
- `~/.claude/skills/<skill-name>` for Claude Code;
- harness adapters where the target tool needs a different discovery mechanism.

Start a new agent session after installation. In Copilot CLI, run `/skills reload` and `/skills list` to reload and verify personal skills. Local home-directory skills are not available to hosted/cloud agents; install those at repository, organization, marketplace, or account scope as supported by that service.

### Example: Impeccable

[Impeccable](https://github.com/pbakaus/impeccable) provides frontend-design guidance and commands. Install its official portable skill into the canonical tree on macOS or Linux:

```sh
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo pbakaus/impeccable \
  --path .agents/skills/impeccable \
  --dest ~/.agentic-dotnet/skills

~/.agentic-dotnet/scripts/sync.sh
~/.agentic-dotnet/scripts/doctor.sh
```

The global skill can be invoked with `$impeccable` or the harness's skill-command syntax, such as `/impeccable init` or `/impeccable audit`.

Impeccable's provider-native edit-detection hooks are project-local. Installing the global skill does not silently enable those hooks in every repository. For a project that needs the complete detector integration, run `npx impeccable install` from that project's root, review the proposed files, and approve any harness-specific hook trust prompt. This project-local integration is an intentional exception to the central-only skill layout.

## Repository-specific instructions

Add a project `AGENTS.md` only for durable facts that are not clear from source or deterministic configuration, such as unusual build commands, generated-code boundaries, database-first behavior, domain invariants, or deployment constraints.

Do not add generic C# style advice already represented by `.editorconfig`, analyzers, compiler settings, MSBuild, or project files.

## Validation

Run:

```sh
./scripts/doctor.sh /path/to/development/root
```

Or on Windows:

```powershell
.\scripts\doctor.ps1
```

GitHub Actions validates shell syntax, PowerShell syntax, bootstrap dry runs, packaging, and checksums on macOS, Linux, and Windows.

## Releases

`scripts/package.sh` creates the release tarball, Windows zip, and checksums under ignored `dist/`. `scripts/package.ps1` builds the zip on Windows.

Tags matching `v*` trigger the release workflow. The tag must match the value in `VERSION`. See [RELEASING.md](RELEASING.md).

## Extending to another harness

[INSTALL_NEW_HARNESS.md](INSTALL_NEW_HARNESS.md) is an agent-ready integration contract. Give it to an agent operating on the development machine; it covers discovery, backup, adapters, plugins, MCP, automation, and verification.

## Hosted agents

Cloud and hosted agents cannot automatically access a local home directory or its symlinks. Configure those environments through their repository, organization, account, or marketplace mechanism.
