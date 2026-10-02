# Maintenance and validation

The central source controls instructions, skills, desired plugins, and generated adapters. Node.js 18 or later is required on all platforms.

## Sources and local changes

| Component | Source record |
| --- | --- |
| Code review | [Alibaba source, local changes, and provider boundary](skills/CODE-REVIEW.md) |
| Impeccable | [Released skill and engine versions](skills/IMPECCABLE.md) |
| Matt Pocock workflows | [Retained inventory and local changes](skills/MATTPOCOCK.md) |
| ASD-STE100 | [Source, metadata change, and limits](skills/ASD-STE100.md) |
| Official .NET plugins | `config/plugins.yaml` selects plugins. `config/plugin-versions.json` records reviewed versions and the cache commit. |
| Optional review executable | `config/tools.json` records the reviewed OCR package. |
| GitNexus CLI | `config/tools.json` records the minimum stable version. Installation remains separate. See [Use GitNexus](README.md#use-gitnexus). |

Do not replace pins with an unreviewed `main` snapshot. Download candidates separately. Compare them with the installed source. Preserve local changes and licenses. Back up replaced files.

## Native plugin updates

Run `scripts/update.sh` or `scripts/update.ps1` for an audit. Add `--apply` or `-Apply` to update enabled plugins. The update command backs up installed official plugin files and version records. It preserves disabled plugins.

Native marketplaces choose the available version. The reviewed version file is an audit baseline, not a native marketplace lockfile. It also records skill-content hashes, because upstream can change content without a version bump. Run doctor after updating. Investigate reported drift before accepting it.

For same-version Claude content drift, apply can reinstall the affected plugin through Claude's CLI. It keeps persistent plugin data and does not prune dependencies. A failed reinstall is reported. The prior official files remain in the backup.

The official Cursor/Kilo cache is pinned to the reviewed commit. Install prepares that cache. Sync does not fetch upstream changes.

## Optional review tool

Run `scripts/install.sh --with-ocr` or `scripts/install.ps1 -WithOcr` to install the reviewed OCR executable. Existing executables are preserved. Installation does not configure credentials or choose a provider.

Preview runs do not call a model. Model-backed reviews need an approved provider. Direct source review remains available without one. See the [review skill](skills/code-review/SKILL.md).

## Validation

Run these checks from the central root:

```sh
node scripts/validate-skills.js
node --test tests/managed.test.js tests/omp-mcp-merge.test.js tests/sync.test.js
node scripts/release-files.js
```

Run the platform sync, install, and doctor scripts after configuration changes. Use `--skip-plugins` or `-SkipPlugins` for isolated skill changes.

The skill validator checks this repository's metadata conventions, entry-file links, and 14 explicit-only policies. It is not a general YAML validator. `--portable` reports unsupported extension fields. Do not remove invocation restrictions to make an export pass. Confirm equivalent destination support first.

The isolated tests cover Cursor deployment, backups, local-edit preservation, release allowlists, command time limits, GitNexus version comparisons, custom Copilot homes, OMP MCP merging, and repeated synchronization. Windows CI exercises the PowerShell sync path. POSIX tests do not prove Windows junction behavior.

Doctor distinguishes file configuration, native CLI status, and unverified runtime behavior. Its command timeout defaults to ten seconds. Set `AGENTIC_DOTNET_CHECK_TIMEOUT_MS` between 100 and 60000 when needed. Credentials are not inspected.

Doctor reads the GitNexus version but does not refresh an index. After a CLI upgrade, use a temporary checkout to test initial and incremental `gitnexus analyze --index-only` runs. Check exit codes, warnings, status, and unchanged source files. A small smoke test does not prove that a failure in another repository is fixed. Follow the [central recovery rules](instructions/global.md#gitnexus-indexing-and-code-discovery) for that repository.

## Release safety

`config/release-files.json` lists every distributable file. Add intended files explicitly. Packaging and bootstrap reject symlink sources, secret-like filenames, private output directories, and traversal paths. Bootstrap refuses linked destination paths for manual review.

Use a clean release checkout. Inspect archive contents and checksums. The allowlist limits accidental inclusion. It does not detect secrets inside an allowed file.

## Runtime checks

Start a fresh harness session after skill or plugin changes. Confirm skill discovery and one representative behavior. Check Cursor Customize for local plugin loading. Do not equate files present with instructions followed.

Cursor can also discover Claude plugin components. The current app showed duplicate official MSBuild entries from Claude and Cursor installations. Keep both native installations until a supported Cursor-only exclusion is confirmed. Removing Claude's files would break its installation. Personal review skills still use one central source.

Cloud agents require their own supported installation. Local symlinks do not transfer to hosted environments. No installer can supply account access or authorize source-code disclosure to a provider.
