# T3 Code adapter

T3 Code is a desktop host. It has no instruction, skill, or MCP settings of its own. It starts provider agents and sends them your messages. Each provider agent reads its own user configuration. This package prepares that configuration. It stores no copied adapter here.

| T3 provider | Configuration it reads | Prepared by |
| --- | --- | --- |
| `claudeAgent` | `~/.claude/CLAUDE.md`, `~/.claude/skills`, Claude Code plugins | Claude Code adapter |
| `codex` | `~/.codex/AGENTS.md`, `~/.agents/skills`, Codex plugins | Codex adapter |
| `opencode` | `~/.config/opencode/AGENTS.md`, `opencode.json`, `~/.agents/skills` | [OpenCode adapter](../opencode/README.md) |
| `cursor` | `~/.cursor/plugins/local`, `~/.agents/skills` | Cursor adapter |

Other T3 providers have no adapter in this package. Doctor reports each enabled one.

What the scripts do:

- `scripts/install.sh` and `scripts/install.ps1` run `scripts/t3code.js`. It prints the T3 Code version and the providers that T3 Code runs. It changes no file.
- `scripts/doctor.js` runs the same checks as findings. It reports providers without an adapter, providers with a custom home path, and shared skills missing from the T3 skill cache.
- `scripts/sync.sh` and `scripts/sync.ps1` write nothing for T3 Code. They prepare the provider configuration.

Limitations:

- T3 Code reads provider configuration at provider start. Start a new thread after sync.
- Doctor reads the T3 settings file and the provider caches. It reads only whitelisted, non-secret fields. It never opens the `secrets` or `clerk` directories. It never prints a settings value.
- The skill caches show what T3 Code last saw. Open T3 Code to refresh them. T3 Code 0.1.x lists no skills for OpenCode. OpenCode still loads them. Doctor checks the OpenCode files.
- A provider instance with a custom home path (`CODEX_HOME` or `CLAUDE_CONFIG_DIR`) reads another directory. Sync configures default homes only. Doctor warns about such an instance.
- The MCP server that T3 Code offers to outside agents is separate. This package does not configure it.
- A remote T3 environment runs providers on its own machine. Run this package on the machine that hosts the T3 server.
- Set `T3CODE_HOME` when T3 Code uses a directory other than `~/.t3`.
