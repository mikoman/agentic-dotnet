# OpenCode adapter

This package connects OpenCode through its native configuration mechanisms. It stores no copied adapter here.

- Global instructions: `~/.config/opencode/AGENTS.md` is a symlink to `instructions/global.md`. OpenCode loads that file as its global instruction source. Without the link, OpenCode 2.2.5 does not send the shared instructions to the model. The `@` import in `~/.claude/CLAUDE.md` does not reach OpenCode. Windows uses a managed generated file when symbolic links are unavailable.
- Personal skills: OpenCode discovers `~/.agents/skills` natively. `scripts/sync.sh` links personal skills from `skills/` there, so every harness shares them. After a start, the first skill list can be empty while OpenCode scans.
- Official .NET skills: OpenCode has no native `dotnet/skills` plugin marketplace. The `skills` list in `opencode.json` carries them instead. `scripts/opencode-config-merge.js` adds the skills directory of each plugin in `config/plugins.yaml`. The directories come from the official cache (`~/.cache/agentic-dotnet/dotnet-skills`). The merge lists only directories that exist. OpenCode 2.2.5 loads no skills when the first listed path is missing. Each run removes stale managed entries.
- Microsoft Learn MCP: configured once in `opencode.json` under `mcp.servers.microsoft-learn` with type `remote`. `scripts/opencode-config-merge.js` writes it from the policy in `config/mcp.yaml`.

Limitations:

- The entries target OpenCode 2.x. Doctor warns about older versions.
- Sync configures OpenCode only when `~/.config/opencode` exists. It does not follow `XDG_CONFIG_HOME` or `OPENCODE_CONFIG_DIR`.
- The merge manages `opencode.json` and keeps every other setting, including provider keys. It stops with a warning when the file is not strict JSON. Comments cause that stop. The file stays unchanged. It does not read `opencode.jsonc`.
- A running OpenCode background service keeps its old configuration. Run `opencode reload` or restart it. Servers that T3 Code starts read the files at start.
- OpenCode does not use the LSP servers in `dotnet/skills` plugins. OpenCode exposes only `SKILL.md` skills.
- Backups of `opencode.json` under `backups/` use mode 0600. They can contain provider keys. Git ignores them. Keep them local.
