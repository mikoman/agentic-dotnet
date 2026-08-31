# Kilo adapter

Kilo is integrated through its native config mechanisms; no copied adapter is stored here.

- Global instructions: `~/.config/kilo/AGENTS.md` is a symlink to `instructions/global.md`. Kilo auto-loads `AGENTS.md` from its config directories, so no copy is maintained.
- Personal skills: Kilo discovers `~/.agents/skills` natively. `scripts/sync.sh` links personal skills from `skills/` there, so they are shared with every harness.
- Official .NET skills: Kilo has no native `dotnet/skills` plugin marketplace and no local-plugin packaging for this project. Its native skill mechanism (`skills.paths`) is used instead: `scripts/sync.sh` writes the desired plugins' `skills` directories from the official cache (`~/.cache/agentic-dotnet/dotnet-skills`) into `~/.config/kilo/kilo.jsonc`. Edit `config/plugins.yaml` to change the set.
- Microsoft Learn MCP: configured once in `~/.config/kilo/kilo.jsonc` under `mcp.microsoft-learn`, managed by `scripts/sync.sh` from the policy in `config/mcp.yaml`.

Limitations:

- Kilo does not consume the `dotnet/skills` `plugin.json` LSP servers; only the open-standard `SKILL.md` skills are exposed.
- `mcp` and `skills` are written into the user's `~/.config/kilo/kilo.jsonc`; `scripts/sync.sh` merges only those two sections and preserves all other user settings.
