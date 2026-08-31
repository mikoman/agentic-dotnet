# Central configuration repository instructions

This repository is the source of truth for local coding-agent configuration.

- Read `README.md` before changing the architecture.
- Edit global .NET/C# behavior only in `instructions/global.md`.
- Edit desired plugins and MCP policy only in `config/plugins.yaml` and `config/mcp.yaml`.
- Treat files under `adapters/` as thin or generated harness representations.
- Keep personal skills physically under `skills/`; do not copy official .NET skills here.
- Preserve unrelated harness configuration and back up replaced paths under `backups/`.
- Never add credentials or secret values to configuration, reports, adapters, or commits.
- After changes, run `scripts/sync.sh`, `scripts/install.sh`, and `scripts/doctor.sh`.
- When adding a harness or tool, follow `INSTALL_NEW_HARNESS.md` completely.
