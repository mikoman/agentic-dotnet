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

Missing harnesses produce warnings, not installation failures. Run the bootstrap again after installing a harness; the process is idempotent.

## Updates and recovery

Run the bootstrap from a newer extracted package to update package-owned files. Existing central files that differ are copied into:

`~/.agentic-dotnet/backups/bootstrap-<timestamp>/package-overwrite/`

Harness configuration replaced by sync is backed up separately under:

`~/.agentic-dotnet/backups/sync-<timestamp>/`

The installer never stores credentials in this repository and does not modify application repositories.
