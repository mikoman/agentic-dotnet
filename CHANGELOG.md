# Changelog

All notable changes to this project are documented here.

## 1.1.3 - 2026-09-10

- Added ASD-STE100 version 0.4.0 from a pinned upstream commit, with its MIT license, references, examples, and linter.
- Required the skill for all authored text through the canonical instructions and shared harness adapters.
- Required parent agents to pass the text-output rule to delegated agents when the harness does not pass it to them.
- Updated the installation guides with shared skill paths, checks, and platform limits.

## 1.1.2 - 2026-09-09

- Added mandatory GitNexus indexing and code-discovery guidance to the shared harness instructions, including `analyze --index-only`, branch/worktree freshness checks, and source-search fallbacks.
- Added the 25 Matt Pocock engineering and productivity skills to the canonical shared skills tree.
- Added the Impeccable global skill for frontend design workflows.
- Documented portable third-party skill installation and shared discovery across supported local harnesses.
- Added GitNexus CLI installation instructions and upstream links to the shared workflow documentation.

## 1.1.0 - 2026-08-31

- Added portable bootstrap installers for macOS, Linux, and Windows.
- Added native PowerShell sync, install, doctor, and packaging scripts.
- Added backed-up conflict preservation and explicit replacement mode.
- Added versioned tar/zip packaging with SHA-256 checksums.
- Removed machine-specific paths from distributable configuration.
- Added Kilo integration through shared instructions, skills paths, and Microsoft Learn MCP.

## 1.0.0 - 2026-08-31

- Created the canonical global .NET/C# instruction source.
- Added declarative official-plugin and MCP policies.
- Added Codex, Claude Code, Cursor, and Copilot adapters.
- Installed the selected official .NET Agent Skills.
- Added idempotent install, sync, doctor, and conservative repository-cleanup scripts.
