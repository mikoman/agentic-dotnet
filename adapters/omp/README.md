# OMP adapter

OMP (oh-my-pi) is integrated through its native configuration mechanisms; no copied adapter is stored here.

- Global instructions: `~/.omp/agent/AGENTS.md` is a symlink to `instructions/global.md`. OMP's native context-file provider loads that user file at session start, so no copy is maintained. Windows falls back to a managed generated file when symbolic links are unavailable.
- Personal skills: OMP discovers `~/.agents/skills` through its `agents` skill provider (`skills.enableAgentsUser` defaults to true). `scripts/sync.sh` links personal skills from `skills/` there, so they are shared with every harness. No OMP-specific skill path is required.
- Official .NET skills: OMP has a Claude Code-compatible plugin marketplace. `scripts/install-native.js` registers the `dotnet/skills` marketplace (`dotnet-agent-skills`) and installs the plugins declared in `config/plugins.yaml` with `omp plugin install --scope user <name>@dotnet-agent-skills`.
- Microsoft Learn MCP: configured once in `~/.omp/agent/mcp.json` under `mcpServers.microsoft-learn` (streamable HTTP), merged by `scripts/omp-mcp-merge.js` from the policy in `config/mcp.yaml`. The merge preserves all other servers and settings.

Limitations:

- The integration targets the default OMP profile. A named profile (`omp --profile <name>`) uses its own agent directory (`~/.omp/profiles/<name>/agent`) and does not inherit these instructions or MCP entries; run the profile's setup separately if needed.
- `~/.omp/agent/mcp.json` is strict JSON and cannot carry a comment marker. The managed entry is `mcpServers.microsoft-learn`; edit `config/mcp.yaml` and rerun sync instead of editing that entry by hand.
- Marketplace plugin state lives in `~/.omp/plugins`; `scripts/sync.sh` does not manage it. Removal is done with `omp plugin uninstall`.
