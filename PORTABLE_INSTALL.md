# Portable installation

The distribution installs the same canonical configuration on macOS, Linux, and Windows. It does not install Codex, Claude Code, Copilot CLI, Git, Node, .NET, or an IDE. It configures whichever supported harnesses are already present and prepares adapters for absent harnesses.

The default destination is:

- macOS/Linux: `$HOME/.agentic-dotnet`
- Windows: `$HOME\.agentic-dotnet`

Set `AGENTIC_DOTNET_HOME` or pass `--target`/`-TargetRoot` to choose another destination.

## Build distributable archives

On macOS or Linux:

```sh
./scripts/package.sh
```

This creates a `.tar.gz`, a Windows-friendly `.zip`, and `SHA256SUMS` under `dist/`.

On Windows:

```powershell
.\scripts\package.ps1
```

This creates the zip package and checksum under `dist/`.

## Install on macOS or Linux

Extract the archive, enter its directory, and run:

```sh
./bootstrap.sh
```

Useful options:

- `--dry-run`: list package files that would be installed.
- `--skip-plugins`: install adapters without invoking plugin or MCP CLIs.
- `--no-verify`: skip the final doctor run.
- `--target PATH`: use a non-default central directory.
- `--replace-existing`: after backup, replace conflicting pre-existing harness instruction files. Without this flag they are preserved and reported.

The bootstrap copies only package-owned files, excludes reports/backups/Git metadata, backs up overwritten central files, runs the idempotent installer, and then runs the doctor.

## Install on Windows

Extract the zip, open PowerShell in its directory, and run:

```powershell
powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1
```

PowerShell 7 is recommended, but the scripts target Windows PowerShell 5.1-compatible syntax.

Useful options:

```powershell
.\bootstrap.ps1 -DryRun
.\bootstrap.ps1 -SkipPlugins
.\bootstrap.ps1 -NoVerify
.\bootstrap.ps1 -ReplaceExisting
.\bootstrap.ps1 -TargetRoot D:\Tools\.agentic-dotnet
```

Windows tries file symbolic links first. If the account cannot create them, the sync script uses managed generated files for instruction/MCP adapters and directory junctions for skills. Unrelated existing files are backed up and preserved rather than overwritten.

## Harness behavior

- Codex receives its global `AGENTS.md`, official `dotnet/skills` marketplace plugins, shared personal skills, and Microsoft Learn MCP.
- Claude Code receives a generated import of the canonical instructions, official marketplace plugins, linked personal skills, and Microsoft Learn MCP.
- Copilot CLI receives global instructions, shared personal skills, and the centrally managed MCP configuration. The installer does not invent a `dotnet/skills` marketplace command when the installed Copilot version exposes no supported plugin mechanism.
- Cursor consumes shared skills through `~/.agents/skills`; the POSIX installer also prepares its generated instruction/MCP plugin and official .NET plugin links.
- Kilo consumes shared skills through `~/.agents/skills`; the POSIX installer also configures its instructions, Microsoft Learn MCP, and official .NET skill paths when its config directory exists.

Both platform sync scripts expose shared skills to all five harnesses. The PowerShell scripts currently configure the remaining instruction/plugin/MCP integration for Codex, Claude Code, and Copilot CLI; full Windows Cursor/Kilo adapter parity is not implied by shared skill availability.

Missing harnesses produce warnings, not installation failures. Run the bootstrap again after installing a harness; the process is idempotent.

## Shared skills, including Matt Pocock's collection

This package includes [ASD-STE100](skills/ASD-STE100.md), Impeccable, and the **25 main engineering/productivity skills** from [mattpocock/skills](https://github.com/mattpocock/skills). The complete inventory, source paths, pinned commit, invocation settings, and usage guide are in [skills/MATTPOCOCK.md](skills/MATTPOCOCK.md). The miscellaneous and in-progress buckets are excluded unless explicitly selected later.

### Restore on another machine

Clone this repository or extract a package built from a revision containing the collection, then run the platform bootstrap above. All bundled skill files are included, so restoring them needs no separate upstream download, Node package, or Matt Pocock plugin installation. `--skip-plugins` / `-SkipPlugins` still installs the bundled skills and their links.

There is one physical copy under `<central-root>/skills/<skill-name>/`. Both sync scripts expose it through:

| Harness | Discovery path, relative to the user's home directory |
| --- | --- |
| Codex | `.agents/skills/<skill-name>` |
| Claude Code | `.claude/skills/<skill-name>` |
| GitHub Copilot CLI | `.agents/skills/<skill-name>` |
| Cursor | `.agents/skills/<skill-name>` |
| Kilo | `.agents/skills/<skill-name>` |

These are symlinks, or directory junctions on Windows when required. Current [Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills), [Cursor](https://cursor.com/docs/skills), and [Kilo](https://kilo.ai/docs/customize/skills) documentation describes shared skill discovery. Installing the same collection again through a native plugin or a per-harness installer would create competing installations.

### ASD-STE100 for all text output

`asd-ste100` follows the same central storage and discovery paths. The [canonical text-output rule](instructions/global.md#text-output) requires it for all authored text. Other skills retain their normal triggers.

The requirement also applies to delegated agents. The parent agent must include it in their task instructions if the harness does not pass it to them.

After sync, start a fresh session in each installed harness. Check that it can load `asd-ste100` and identify the text-output rule. Then check a normal answer for short sentences, clear actions, and preserved uncertainty. A configured path alone does not prove that a running session loaded the rule.

The existing Windows Cursor/Kilo instruction limits above still apply. Shared skill discovery alone cannot impose a global writing rule. Hosted agents need their own supported instruction and skill distribution. See [the source and verification guide](skills/ASD-STE100.md).

### Use the skills when needed

In Codex, the new skills are available on the next turn; if an existing session retains an old list, start a new session. Other harnesses may need a new session or reload. In Copilot CLI use `/skills reload`, `/skills list`, and `/skills info ask-matt`; in Cursor check Customize → Skills; in Kilo use `/reload` or start a new session. Check the skill picker/list where the installed harness provides one.

Invoke `$ask-matt` in Codex, `/ask-matt` in a harness with slash commands, or ask the agent to use the `ask-matt` skill. It helps choose a workflow. Before using the engineering workflows in an application repository, invoke `setup-matt-pocock-skills` **inside that repository**. It configures the issue tracker, triage labels, and domain document layout, using project-local `docs/agents/*.md` and an existing `AGENTS.md` or `CLAUDE.md`. Review that project's proposed setup in its own session. The global installation only makes the skills available.

The included Bash templates in `wizard` and `diagnosing-bugs` need Bash when invoked, including Git Bash or WSL on Windows. Tracker workflows need the chosen tracker tooling and authorization; local Markdown is supported. Skill discovery alone does not install those dependencies or execute the templates.

### Add selected skills later

First inspect the desired skill and its supporting files at a specific upstream commit, check for name collisions, and identify any companion skills it invokes. Keep each skill as a complete directory directly under the central `skills/` tree. For example, these commands restore `ask-matt` only if its central directory is missing; it is already included in this package.

macOS/Linux, with Codex's bundled installer:

```sh
agentic_root="${AGENTIC_DOTNET_HOME:-$HOME/.agentic-dotnet}"
matt_ref=3cca18b368ae95cdbdebbff572ccafa662551015
python3 "$HOME/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo mattpocock/skills --ref "$matt_ref" \
  --path skills/engineering/ask-matt \
  --dest "$agentic_root/skills" && \
curl --fail --location "https://raw.githubusercontent.com/mattpocock/skills/$matt_ref/LICENSE" \
  --output "$agentic_root/skills/ask-matt/LICENSE"
```

Windows:

```powershell
$AgenticRoot = if ($env:AGENTIC_DOTNET_HOME) { $env:AGENTIC_DOTNET_HOME } else { Join-Path $HOME '.agentic-dotnet' }
$MattRef = '3cca18b368ae95cdbdebbff572ccafa662551015'
py "$HOME\.codex\skills\.system\skill-installer\scripts\install-skill-from-github.py" `
  --repo mattpocock/skills --ref $MattRef `
  --path skills/engineering/ask-matt `
  --dest (Join-Path $AgenticRoot 'skills')
if ($LASTEXITCODE -ne 0) { throw 'Skill installation failed; preserve the existing directory and inspect the error.' }
Invoke-WebRequest "https://raw.githubusercontent.com/mattpocock/skills/$MattRef/LICENSE" `
  -OutFile (Join-Path $AgenticRoot 'skills/ask-matt/LICENSE')
```

Use the actual configured Codex home if it differs from the default. Replace the `--path` value and licence destination with the chosen skill's paths. Multiple directories can follow `--path`. For an explicitly requested miscellaneous skill, an example at this pinned commit is `skills/misc/scaffold-exercises`; for an unfinished skill, use its reviewed `skills/in-progress/<name>` path. Include `LICENSE` from the same upstream revision in every added skill directory. Record the added skill, source path, and commit in `skills/MATTPOCOCK.md`.

If Codex or Python is unavailable, clone/download the pinned upstream revision into a temporary directory, copy only the selected complete skill directories and upstream licence into the canonical tree, and retain the same source record. Do not copy upstream's `.agents`, plugin registration, repository hooks, or Git metadata into the central repository.

### Update, sync, and verify

The downloader refuses existing destination directories. For an update, download the reviewed revision to a staging directory first, compare it with the installed skills, and move each replaced central directory into `backups/mattpocock-update-<timestamp>/` before installing its replacement. Preserve local edits, update the source record and licences, and select any new/retired skills explicitly. Normal bootstrap restores the vendored snapshot; it does not track upstream `main` or run `npx skills update`.

After an addition or update, run all three scripts from the central root:

```sh
./scripts/sync.sh
./scripts/install.sh
./scripts/doctor.sh
git diff --check
git status --short
```

```powershell
.\scripts\sync.ps1
.\scripts\install.ps1
.\scripts\doctor.ps1
git diff --check
git status --short
```

Verify every selected skill's `SKILL.md` and supporting files through both shared link trees, then reload the installed harnesses. Preserve unrelated skills when a discovery path conflicts. Commit the skill files, licences, source record, and documentation to this central Git repository; keep backups and staging data out of Git. Hosted/cloud agents require their own supported distribution mechanism and cannot rely on these local links.

## Updates and recovery

Run the bootstrap from a newer extracted package to update package-owned files. Existing central files that differ are copied into:

`~/.agentic-dotnet/backups/bootstrap-<timestamp>/package-overwrite/`

Harness configuration replaced by sync is backed up separately under:

`~/.agentic-dotnet/backups/sync-<timestamp>/`

The installer never stores credentials in this repository and does not modify application repositories.
