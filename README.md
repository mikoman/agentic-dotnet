# agentic-dotnet

[![Build status](https://github.com/mikoman/agentic-dotnet/actions/workflows/validate.yml/badge.svg)](https://github.com/mikoman/agentic-dotnet/actions/workflows/validate.yml)

`agentic-dotnet` keeps your local coding-agent configuration in one directory. It supports Codex, Claude Code, GitHub Copilot CLI, Cursor, and Kilo.

A **harness** is the application that runs an agent. This repository gives supported harnesses shared instructions, reusable skills, and selected external tools.

The package contains:

- One instruction source for text output, development across languages, and conditional .NET/C# rules.
- 27 shared skills: ASD-STE100, Impeccable, and 25 Matt Pocock skills.
- A list of official .NET plugins to install where the harness supports them.
- A minimal Model Context Protocol (MCP) policy for external tools.
- Install, sync, check, and package scripts for macOS, Linux, and Windows.

The package configures existing applications. Install your agent applications, development tools, and account credentials separately.

## Contents

- [Requirements](#requirements)
- [Install](#install)
- [Harness support](#harness-support)
- [Check the installation](#check-the-installation)
- [Use the shared skills](#use-the-shared-skills)
- [Work in other languages](#work-in-other-languages)
- [Use GitNexus](#use-gitnexus)
- [Change the configuration](#change-the-configuration)
- [Update and recover](#update-and-recover)
- [Solve common problems](#solve-common-problems)
- [Build packages and contribute](#build-packages-and-contribute)

## Requirements

Choose the harnesses that you want to use. You do not need all five.

| Requirement | When you need it |
| --- | --- |
| An installed agent application | To use the shared instructions and skills. |
| Git | To clone or update this repository. The POSIX installer also uses Git for the official .NET cache. |
| Bash and standard Unix tools | To run the macOS/Linux scripts. |
| PowerShell | To run the Windows scripts. Use PowerShell 7 where possible. The scripts target Windows PowerShell 5.1 syntax. |
| Network access | To download the package, install official plugins, or use Microsoft Learn MCP. |
| Node.js | To merge Kilo configuration on macOS/Linux. Some skills also use Node.js scripts. |
| Python 3 | To run the ASD-STE100 linter or Codex's GitHub skill installer. |
| `jq` | Recommended on macOS/Linux for plugin detection and status checks. |
| A suitable .NET SDK | To work on .NET applications. This package does not install an SDK. |

The CLI installer commands require the relevant executables on `PATH`. Sign in to each harness through its normal account process.

## Install

The default central directory is `$HOME/.agentic-dotnet` on macOS/Linux and `$HOME\.agentic-dotnet` on Windows.

Keep this directory after installation. Harness links refer to its files.

### Install from Git

Use these commands for a new installation. If the central directory already exists, follow [Update and recover](#update-and-recover).

**macOS/Linux:**

```sh
git clone https://github.com/mikoman/agentic-dotnet.git "$HOME/.agentic-dotnet"
cd "$HOME/.agentic-dotnet"
./bootstrap.sh
```

**Windows:**

```powershell
git clone https://github.com/mikoman/agentic-dotnet.git "$HOME\.agentic-dotnet"
Set-Location "$HOME\.agentic-dotnet"
powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1
```

Bootstrap installs the central files, runs the installer, and runs the doctor check. If the checkout already occupies the target directory, bootstrap uses it directly.

If you run bootstrap from another directory, it copies the package to the central directory. Edit the installed central copy afterward.

### Install from a release

1. Open [GitHub Releases](https://github.com/mikoman/agentic-dotnet/releases).
2. Download the `.tar.gz` for macOS/Linux or the `.zip` for Windows.
3. Download `SHA256SUMS` from the same release.
4. Compare the archive's SHA-256 hash with its entry in `SHA256SUMS`.
5. Extract the archive.
6. Open a terminal in the extracted directory.
7. Run the bootstrap command for your platform from the previous section.

For release `v1.1.3`, these commands calculate the archive hash:

```sh
# macOS
shasum -a 256 agentic-dotnet-1.1.3.tar.gz

# Linux
sha256sum agentic-dotnet-1.1.3.tar.gz
```

```powershell
Get-FileHash .\agentic-dotnet-1.1.3.zip -Algorithm SHA256
```

Use the actual archive name for another release. Continue only when the hash matches.

### Installation options

| macOS/Linux option | Windows option | Effect |
| --- | --- | --- |
| `--dry-run` | `-DryRun` | List planned file copies without installing harness configuration. Windows can create the empty target directory. |
| `--skip-plugins` | `-SkipPlugins` | Skip plugin and MCP CLI commands. Sync still prepares skills, instruction adapters, and MCP configuration files. |
| `--no-verify` | `-NoVerify` | Skip the final doctor check. |
| `--target PATH` | `-TargetRoot PATH` | Choose the central directory. |
| `--replace-existing` | `-ReplaceExisting` | Permit replacement of conflicting regular harness files after backup. |

For example, install shared skills and adapters without plugin CLI commands:

```sh
./bootstrap.sh --skip-plugins
```

```powershell
.\bootstrap.ps1 -SkipPlugins
```

This option is not a complete offline mode. It does not disable MCP configuration or network access during later skill use.

### Use a custom central directory

Set `AGENTIC_DOTNET_HOME` to the chosen path before bootstrap. For example:

```sh
export AGENTIC_DOTNET_HOME="$HOME/Tools/agentic-dotnet"
./bootstrap.sh
```

```powershell
$env:AGENTIC_DOTNET_HOME = 'D:\Tools\agentic-dotnet'
.\bootstrap.ps1
```

Keep the same setting for later bootstrap runs. If you also pass a target option, use the same path in both settings.

### Preserve existing configuration

Review each warning before using the replacement option. Sync normally preserves unrelated regular files and reports conflicts. It can replace existing links at managed paths.

Bootstrap saves changed central files under `backups/bootstrap-<timestamp>/package-overwrite/`. Sync saves conflicting harness paths under `backups/sync-<timestamp>/`.

After you inspect a conflict and its backup, you can permit replacement:

```sh
./bootstrap.sh --replace-existing
```

```powershell
.\bootstrap.ps1 -ReplaceExisting
```

## Harness support

The scripts use links, imports, or generated adapters to distribute the central instructions. They keep one physical copy of each shared skill.

| Harness | Instruction and tool setup | Shared skill path |
| --- | --- | --- |
| Codex | Global `AGENTS.md`, official .NET marketplace plugins, and Microsoft Learn MCP. | `~/.agents/skills/<skill-name>` |
| Claude Code | Global `CLAUDE.md` import, official .NET marketplace plugins, and Microsoft Learn MCP. | `~/.claude/skills/<skill-name>` |
| GitHub Copilot CLI | Global instructions and Microsoft Learn MCP configuration. This installer does not automate official .NET plugin installation for Copilot. | `~/.agents/skills/<skill-name>` |
| Cursor | POSIX scripts prepare a local instruction/MCP plugin and links to official .NET plugins. | `~/.agents/skills/<skill-name>` |
| Kilo | POSIX scripts prepare global instructions, Microsoft Learn MCP, and official .NET skill paths. | `~/.agents/skills/<skill-name>` |

`~` means your home directory. Windows uses the equivalent paths under your user profile.

Windows tries symbolic links first. Without link permission, sync uses generated instruction files and directory junctions for skills.

Both platform scripts expose the shared skills to all five harnesses. The PowerShell scripts configure the remaining instructions, plugins, and MCP integration for Codex, Claude Code, and Copilot CLI.

**Windows Cursor/Kilo support is partial.** Shared skill paths do not establish full Windows instruction, plugin, or MCP support for those two harnesses.

On macOS/Linux, Kilo setup requires an existing `~/.config/kilo` directory. Official Kilo skills use a shared cache through `skills.paths`. Kilo does not receive the official plugins' language servers through this mechanism.

Missing applications produce warnings. Install the application separately. Then run bootstrap again.

### Hosted and remote agents

Local links do not make skills available to cloud agents or remote machines. Configure their instructions and skills through a supported repository, account, organization, or marketplace mechanism.

## Check the installation

Run the doctor from the central directory:

```sh
./scripts/doctor.sh
```

```powershell
.\scripts\doctor.ps1
```

The doctor checks adapters, shared skill paths, and available plugin/MCP status. It reports `PASS`, `WARN`, and `FAIL` results. A warning can indicate an absent application or an unavailable status check. Inspect every failure before using the configuration.

On macOS/Linux, supply a development directory to scan for duplicate agent configuration:

```sh
./scripts/doctor.sh /path/to/development/root
```

This scan reports files. It does not delete application files. Without a directory argument, the doctor skips this scan.

Then check the running harness:

1. Start a fresh agent session.
2. Check that its skill list contains `asd-ste100` and `ask-matt`.
3. Ask it to identify the shared text-output rule.
4. Check a normal answer for clear sentences and preserved technical meaning.

In Copilot CLI, use `/skills reload`, `/skills list`, and `/skills info asd-ste100`. See the [Copilot skill guide](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills).

In Cursor, open the Skills view under Customize. See the [Cursor skill guide](https://cursor.com/docs/skills). Use the current skill picker or reload command in other harnesses.

Correct file paths prove configuration. They do not prove that every running agent loaded or followed the instructions.

## Use the shared skills

The repository includes 27 skills. Bootstrap installs their files without a separate download from each skill author.

| Collection | Purpose | Start here |
| --- | --- | --- |
| ASD-STE100 | Clear text for people and agents. The shared instructions require it for all authored text. | [Source and use](skills/ASD-STE100.md) |
| Matt Pocock, 25 skills | Planning, debugging, testing, reviews, teaching, and handover documents. | [Inventory and workflow guide](skills/MATTPOCOCK.md) |
| Impeccable | Interface design, audits, and visual changes. | [Skill instructions](skills/impeccable/SKILL.md) |

### ASD-STE100

The [text-output rule](instructions/global.md#text-output) requires agents to load `asd-ste100` before their first authored text. It covers answers, questions, progress messages, documentation, comments, commit messages, and UI text.

Agents use Strict mode for procedures and tool instructions. They use STE-flavored mode for other prose. They must preserve facts, uncertainty, technical terms, and the requested language.

Delegated agents must receive the same requirement when their harness does not pass the central instructions to them. A later explicit user style request can override the style.

To check a document with the included linter:

```sh
python3 skills/asd-ste100/scripts/ste-lint.py path/to/document.md
```

On Windows, use `py` instead of `python3`. The linter uses simple text patterns. Review each finding before changing text, identifiers, or URLs.

The skill guides writing. It does not intercept responses or prove certified ASD-STE100 compliance.

### Matt Pocock skills

Use `$ask-matt` in Codex or `/ask-matt` in a harness with slash commands. You can also ask the agent to use the skill by name.

Before adopting the engineering workflows, run `setup-matt-pocock-skills` inside the application repository. That skill configures the project's issue tracker, triage labels, and domain documents.

Central installation does not run this project setup. Miscellaneous and unfinished upstream skills remain opt-in. Install the complete shared collection once to avoid duplicate plugins or separate harness copies.

### Impeccable

Use `$impeccable` in Codex or a command such as `/impeccable audit` in a compatible harness.

The shared skill does not enable project hooks automatically. If a project needs edit-detection hooks, follow the included [hook guide](skills/impeccable/reference/hooks.md). Review the project changes and any harness trust prompt.

### Skill dependencies

A skill can need tools that bootstrap does not install. Impeccable scripts need Node.js. The `wizard` and `diagnosing-bugs` templates need Bash, including Git Bash or WSL on Windows.

Tracker workflows need the chosen tracker tool and account access. Matt Pocock's setup also supports local Markdown files.

## Work in other languages

The directory name `agentic-dotnet` does not limit the languages you can use. The [shared instructions](instructions/global.md#task-and-skill-selection) select skills by task and affected component.

The agent follows this process before code changes:

1. Identify the component's language, framework, runtime, and build tools from its files.
2. Inspect the available skill names and descriptions in the current harness.
3. Load relevant skills according to their invocation rules.
4. State the selected skills and planned validation commands.
5. Use the repository's tools to check the change.

The shared library already contains workflows for debugging, reviews, module design, and research. Those workflows can apply across languages. Check their examples and tool requirements against the repository. See the [skill inventory](skills/MATTPOCOCK.md) for their invocation rules.

These examples describe selection, not an additional installation list:

| Affected work | Skill selection and validation |
| --- | --- |
| C# API or EF Core code | Use the relevant official .NET skill. Check the affected .NET projects. |
| TypeScript UI in a repository with a C# backend | Use a suitable UI or TypeScript skill when available. Use the frontend's scripts and lockfile to select checks. |
| Python, Rust, or Go code | Use a relevant installed skill or general workflow. Use that component's tools and primary documentation. |
| A change to both frontend and backend | Select skills separately for each component. Check both components and their shared contract. |

Installed skills remain available. The instructions select which skills the agent uses for a task. They do not unload plugins or remove skill descriptions from the harness. Actual selection depends on the running agent.

The .NET rules apply only to affected .NET components. Microsoft Learn MCP remains available for Microsoft APIs and services. Other work uses the relevant maintainers' documentation.

If no suitable skill exists, the agent can continue with repository conventions and primary documentation. Additional skill installation requires task authorization. Use [Add or update a skill](#add-or-update-a-skill) to add a selected skill globally.

The installer still uses the .NET plugin selection in `config/plugins.yaml`. It does not automatically install another language's plugins when you open a project.

## Use GitNexus

GitNexus builds an index of code relationships. The [central GitNexus rules](instructions/global.md#gitnexus-indexing-and-code-discovery) tell agents when to index, search, and refresh a checkout.

This package distributes those rules. It does not install GitNexus or register a GitNexus MCP server.

For a separate CLI installation, follow the [official installation guide](https://github.com/abhigyanpatwari/GitNexus#quick-start). With a supported Node.js version available:

```sh
npm install --global gitnexus
gitnexus --version
```

From the relevant repository or worktree, use:

```sh
gitnexus analyze --index-only
gitnexus status
```

Always keep `--index-only`. Plain indexing and setup commands can create competing instructions, skills, or hooks.

Keep each index in its own checkout. Check freshness after source changes or branch changes. When GitNexus is unavailable or cannot index relevant files, use source searches and compiler tools.

The CLI supports this workflow without MCP. Review the upstream [license](https://github.com/abhigyanpatwari/GitNexus/blob/main/LICENSE) and [commercial options](https://github.com/abhigyanpatwari/GitNexus#enterprise) before commercial adoption.

## Change the configuration

Edit the central source for the behavior you want to change:

| Path | Purpose |
| --- | --- |
| `instructions/global.md` | Text output, GitNexus, shared development rules, skill selection, and conditional .NET/C# instructions. |
| `skills/<skill-name>/` | One complete copy of a personal or third-party skill. |
| `config/plugins.yaml` | Official .NET plugin selection and harness policy. |
| `config/mcp.yaml` | External tool policy without credentials. |
| `adapters/` | Links, imports, and generated harness files. |
| `scripts/` | Install, sync, check, and package commands. |
| `backups/` | Local recovery files outside Git. |
| `reports/` | Local reports outside Git. |
| `dist/` | Generated archives outside Git. |

Keep shared behavior in `instructions/global.md`. Sync regenerates adapters, so direct edits to generated files can disappear.

### Select official .NET plugins

The installer reads the `core`, `standard`, and `optional` groups in [config/plugins.yaml](config/plugins.yaml). **It installs entries from all three groups.** The `optional` group is not an interactive prompt.

The current selection contains:

- `dotnet`, `dotnet-aspnetcore`, `dotnet-data`, and `dotnet-nuget`.
- `dotnet-msbuild`, `dotnet-diag`, `dotnet-upgrade`, `dotnet-maui`, `dotnet-blazor`, and `dotnet-ai`.

The installer excludes the `excluded_by_default` group. That group contains testing, advanced, template-engine, and .NET 11 plugins.

Edit the selection before installation if you need a smaller set. Deleting an entry does not uninstall an existing marketplace plugin. Use the harness's supported uninstall command when needed.

Official content stays in the harness marketplace or shared cache. Keep it outside the personal `skills/` directory. See the [official .NET skills project](https://github.com/dotnet/skills).

### Configure external tools

The current MCP setup uses Microsoft Learn at `https://learn.microsoft.com/api/mcp`. It preserves existing GitHub integration and avoids duplicate GitHub servers.

The [MCP policy](config/mcp.yaml) excludes global filesystem, shell, generic search, database, production-infrastructure, and Playwright defaults.

The scripts and adapters implement this policy. Editing the YAML alone does not generate arbitrary server configurations. Follow [INSTALL_NEW_HARNESS.md](INSTALL_NEW_HARNESS.md) when extending tool integration.

Keep credentials outside this repository. Use each harness's normal authentication mechanism.

### Add or update a skill

1. Inspect the skill instructions, scripts, hooks, and supporting files.
2. Check for an existing skill with the same name.
3. Choose a specific upstream commit for a third-party skill.
4. Place the complete directory under `skills/<skill-name>/`.
5. Retain its license and source record.
6. Run the platform sync script.
7. Run the platform installer with its plugin-skip option.
8. Run the doctor.
9. Start a fresh harness session.

For your own skill, create `skills/<skill-name>/SKILL.md`. Keep its references and scripts in the same directory.

For GitHub downloads, use Codex's bundled installer with an explicit central destination. Replace the uppercase placeholders before running this example:

```sh
python3 "$HOME/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo OWNER/REPOSITORY \
  --ref COMMIT_SHA \
  --path PATH/TO/SKILL \
  --dest "$HOME/.agentic-dotnet/skills"
```

Use your actual Codex and central paths if they differ. Without Codex, copy the reviewed skill directory from a downloaded or cloned upstream revision.

The installer refuses an existing destination. Save the installed directory under `backups/` before replacing it. Preserve local changes during an update.

See [PORTABLE_INSTALL.md](PORTABLE_INSTALL.md#shared-skills-including-matt-pococks-collection) for Windows commands, selected downloads, licenses, and update steps.

### Apply central changes

From the central directory, run:

```sh
./scripts/sync.sh
./scripts/install.sh
./scripts/doctor.sh
```

```powershell
.\scripts\sync.ps1
.\scripts\install.ps1
.\scripts\doctor.ps1
```

Sync updates instructions and shared links. Install also configures supported plugins and tools. Doctor checks the result.

For a skill-only update, `install.sh --skip-plugins` or `install.ps1 -SkipPlugins` avoids plugin CLI commands. Start a fresh session after changes.

### Keep project facts in the project

Use a project `AGENTS.md` for facts that source code and tooling cannot explain. Examples include unusual build commands, generated-code boundaries, database-first behavior, and deployment constraints.

Keep `.editorconfig`, analyzers, compiler settings, and MSBuild configuration authoritative. Avoid repeating their rules in agent instructions.

To connect another harness, use [INSTALL_NEW_HARNESS.md](INSTALL_NEW_HARNESS.md) as the installation contract.

## Update and recover

### Update a Git installation

Open the central checkout. Check local changes before pulling:

```sh
git status --short
git pull --ff-only
```

Preserve any local changes before resolving an update conflict. Run the platform bootstrap after the pull:

```sh
./bootstrap.sh
```

```powershell
.\bootstrap.ps1
```

For a custom directory, retain the same `AGENTIC_DOTNET_HOME` value.

### Update an archive installation

1. Download the new archive and its checksums.
2. Check the archive hash.
3. Extract it into a separate directory.
4. Run its bootstrap against the existing central directory.

Bootstrap saves overwritten central files under `backups/`. It does not automatically delete obsolete files or uninstall retired plugins.

### Restore a previous configuration

1. Inspect the relevant timestamped directory under `backups/`.
2. Save any newer changes that you need to retain.
3. Restore only the affected central or harness paths.
4. Run sync if you restored central source files.
5. Run the doctor.

If you restore an unrelated harness file, sync can report a conflict again. Review that conflict before permitting replacement.

There is no automatic uninstall script. To disconnect a harness:

1. Delete only this package's managed links or adapters.
2. Restore its previous configuration from the matching backup.
3. Check remaining references before moving or deleting the central directory.

## Solve common problems

| Symptom | Action |
| --- | --- |
| A harness is missing. | Install it separately. Check its executable on `PATH`. Run bootstrap again. |
| A skill does not appear. | Check its central `SKILL.md` and shared link. Run sync. Start a fresh session. |
| The writing rule does not apply. | Check the instruction adapter and `asd-ste100` path. Check a fresh session. |
| Sync preserves a conflicting file. | Inspect the file and its backup. Use the replacement option only after review. |
| A link is broken. | Check that the central directory still exists at the configured path. Run sync. |
| Windows cannot create a skill link. | Check symbolic-link or directory-junction permissions. Inspect the sync warning. |
| A plugin or MCP check fails. | Check the harness CLI version, account access, and network connection. Inspect the installer output. |
| Kilo configuration does not update. | Check Node.js and the existing Kilo config directory on macOS/Linux. |
| An update leaves an old plugin. | Uninstall that plugin through its harness. Selection changes do not uninstall existing plugins. |

Keep backups and local reports outside Git. Never include credentials, private keys, or tokens in a public issue. Follow [SECURITY.md](SECURITY.md) for security reports.

## Build packages and contribute

The package scripts write archives and `SHA256SUMS` under `dist/`.

**macOS/Linux:**

```sh
COPYFILE_DISABLE=1 ./scripts/package.sh
```

This creates a `.tar.gz` and, when `zip` is available, a `.zip`. `COPYFILE_DISABLE=1` prevents macOS from adding AppleDouble metadata to the tar archive.

**Windows:**

```powershell
.\scripts\package.ps1
```

This creates a `.zip` and its checksum. Use a clean release checkout for distribution. Package scripts exclude backups, reports, Git metadata, and existing `dist/` output.

GitHub Actions checks Bash, PowerShell, bootstrap dry runs, packaging, and checksums on macOS, Linux, and Windows. CI does not prove live behavior in every harness.

| Document | Use it for |
| --- | --- |
| [PORTABLE_INSTALL.md](PORTABLE_INSTALL.md) | Detailed installation, shared skills, and platform behavior. |
| [INSTALL_NEW_HARNESS.md](INSTALL_NEW_HARNESS.md) | Connecting another harness or developer tool. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution rules and required checks. |
| [RELEASING.md](RELEASING.md) | Version changes, release tags, and publication. |
| [CHANGELOG.md](CHANGELOG.md) | Changes in each release. |
| [SECURITY.md](SECURITY.md) | Reporting security problems without exposing secrets. |

Release tags must match [VERSION](VERSION). The release workflow builds and publishes archives from the tagged commit.

Bundled third-party skills retain their own license files. Check those licenses before redistributing or changing the skills.
