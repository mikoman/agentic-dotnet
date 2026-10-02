# Changelog

All notable changes to this project are documented here.

## 1.2.2 - 2026-10-02

- Added one controlled retry for GitNexus invalid UTF-8 and FTS indexing failures. Preserved `--index-only` and serialized indexing.
- Required agents to distinguish failed refreshes, old status results, and successful indexes with degraded search.
- Added a GitNexus 1.6.12 minimum-version check to the shared doctor command, with version-comparison tests. GitNexus installation remains separate.
- Documented the reviewed CLI version, Node.js requirements, recovery limits, and long-running MCP restart requirement.

## 1.2.1 - 2026-10-01

- Added OMP harness integration: global `AGENTS.md` link into `~/.omp/agent`, shared skills through `~/.agents/skills`, official `dotnet/skills` plugins through OMP's Claude-compatible marketplace, and Microsoft Learn MCP merged into `~/.omp/agent/mcp.json` with other entries preserved.
- Included OMP merge tests in release packages and Windows release checks.

## 1.2.0 - 2026-10-01

- Replaced code review with a pinned Alibaba Open Code Review adaptation and generated shared review rules.
- Updated Impeccable to release 4.3.1. Recorded local scope changes and its native engine dependency.
- Clarified task authorization, review scope, language selection, and workflow boundaries.
- Added reviewed plugin versions and an explicit update command with backups.
- Replaced Cursor external plugin links with checked, backed-up deployments.
- Added bounded doctor checks and custom Copilot home support.
- Restricted packages and bootstrap to a reviewed file allowlist.
- Added shared Node.js validation and isolated installation tests for POSIX and Windows CI.
- Required Node.js 18 or later for the shared maintenance scripts.
- Fixed path comparisons for Windows short-name aliases in skill checks and installation tests.
- Updated GitHub Actions to their Node.js 24 runtime versions. Project tests still use Node.js 22.

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
