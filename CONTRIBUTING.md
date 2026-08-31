# Contributing

Keep changes focused on maintaining one portable source of truth for coding-agent configuration.

- Do not duplicate `instructions/global.md` into harness adapters.
- Keep personal skills small and workflow-oriented.
- Prefer official `dotnet/skills` over copied framework knowledge.
- Preserve unrelated user configuration and credentials.
- Keep Bash and PowerShell behavior aligned where the harness is cross-platform.
- Do not add global filesystem, shell, database, or production-infrastructure MCP servers.

Before submitting a change:

```sh
bash -n bootstrap.sh scripts/*.sh
git diff --check
./scripts/package.sh
```

Also parse and exercise the PowerShell scripts on Windows or PowerShell 7, and run the relevant doctor.
