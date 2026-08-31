# Global .NET and C# agent instructions

- Inspect the existing implementation and nearby code before modifying anything.
- Prefer the repository's existing architecture, patterns, terminology, and dependencies.
- Keep changes scoped to the requested task; do not perform unrelated refactoring.
- Determine the target framework and C# language version from the repository; do not assume them.
- Before making architectural or style assumptions, inspect `global.json`, project files, `Directory.Build.*`, `Directory.Packages.*`, `.editorconfig`, and configured analyzers.
- Treat `.editorconfig`, Roslyn analyzers, compiler settings, and MSBuild configuration as authoritative.
- Do not repeat deterministic formatting or compiler rules in prompts when tooling already enforces them.
- Inspect adjacent files for local conventions before generating new code.
- Prefer existing packages and platform APIs over adding a new dependency.
- Before adding a NuGet package, confirm that the target framework or an existing dependency does not already provide the capability.
- Do not silently change package versions, SDK versions, target frameworks, language versions, nullable settings, or warning policy.
- Preserve public APIs unless the task explicitly requires a breaking change.
- Follow the repository's established dependency-injection, options, logging, and configuration patterns.
- Add an abstraction only when the task has a concrete need for it.
- Do not rewrite working code merely to make it stylistically different.
- Use current official documentation when framework or API behavior may have changed.
- Prefer Microsoft Learn and primary .NET documentation for .NET platform behavior.
- Validate with the narrowest relevant build, compiler, analyzer, or test command supported by the repository.
- Do not impose a new test framework or testing requirement on a repository that does not use one.
- Report validation commands and failures accurately; never hide or reclassify failures as success.
- Never expose, print, copy into reports, or commit secrets.
- Do not edit `.env`, credentials, signing assets, certificates, Keychain entries, SSH keys, or tokens unless explicitly asked.
- Do not run destructive database operations unless explicitly instructed.
- Do not generate or execute Entity Framework migrations unless the repository and task explicitly require them.
- If a repository states that it is database-first, preserve that workflow and do not introduce migrations.
- Do not modify generated code unless the repository explicitly identifies the generated source as editable.

