# Impeccable source and local changes

- Source: [pbakaus/impeccable](https://github.com/pbakaus/impeccable).
- Release: `skill-v4.3.1`.
- Commit: `cd12f8660e2dde57b9615c8a6b8ea674101f9cfc`.
- Bundled engine requirement: `0.1.5`, recorded in `scripts/VERSION`.
- License: Apache-2.0. The central directory retains `LICENSE` and `NOTICE.md`.
- Local changes: shorter trigger description and task-scoped design wording. The entry no longer claims to grant permission.

The complete released skill replaces the earlier Node-helper package. The launcher can download a pinned engine on first use.
It verifies new downloads against their SHA-256 sidecar. It uses a Windows launcher when a POSIX shell is unavailable.
No project hooks are enabled by central installation. The `4.4.0` main-branch snapshot is not installed.

Keep the canonical copy in `skills/impeccable`. Do not run a provider installer that creates additional harness copies.
Review the complete file diff, binary download behavior, permissions, and license before another update.
