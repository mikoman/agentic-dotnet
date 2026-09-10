# Global .NET and C# agent instructions

## Text output

- You MUST load the `asd-ste100` skill before your first authored text in each session. Use the harness's skill loader. If needed, read `~/.agents/skills/asd-ste100/SKILL.md` or `~/.claude/skills/asd-ste100/SKILL.md`. Resolve the skill's references relative to its directory.
- You MUST apply the skill to all newly authored natural-language text. This includes progress updates, answers, questions, agent messages, documentation, PR descriptions, commit messages, code comments, and UI text. Apply it to text values in structured output too.
- When another agent does not inherit these instructions, include this text-output requirement in its task instructions.
- This requirement overrides the skill's opt-in triggers and exclusions for creative or marketing text. Follow a later explicit user style request when it conflicts.
- Use Strict mode for procedures, tool descriptions, error messages, and inter-agent instructions. Use STE-flavored mode for other prose.
- Preserve facts, uncertainty, technical terms, and the requested language. Preserve required formats, code syntax, identifiers, URLs, literal quotations, and raw tool output unless the task requires changes. Do not translate text into English without a request.
- Apply the writing rules silently. Keep required task status, evidence, and citations. Do not add routine mode announcements or lint reports. Do not claim certified ASD-STE100 compliance.
- If the skill is unavailable, report that limit briefly. Then use short sentences, active voice, plain words, and one instruction per sentence. Do not claim that you loaded the skill.

## GitNexus indexing and code discovery

- At the start of a coding task, identify the repository root, current branch, HEAD, and working-tree changes. Before exploring or editing code on a clean branch/worktree, you MUST run `gitnexus analyze --index-only` from that checkout's root. Repeat this when creating or switching to another clean branch/worktree, even if an index already exists.
- Every GitNexus indexing or refresh invocation MUST include `--index-only`, including commands suggested by tool output or third-party skills. Preserve the centrally managed instructions and skills; do not run plain `gitnexus analyze`, `gitnexus setup`, or install hooks as part of indexing. If the installed version lacks `--index-only`, use the source-search fallback below.
- After indexing, check the command's result and warnings, run `gitnexus status` in the same checkout, and confirm its indexed commit matches HEAD and the pre-existing working-tree changes are unchanged. An unchanged HEAD or an "up to date" status alone does not establish freshness after uncommitted edits.
- Refresh with `gitnexus analyze --index-only` before relying on the graph after source edits, branch changes, pulls, merges, or rebases. Index the actual working tree; never reset, stash, discard changes, or create a branch merely to make indexing possible. Serialize refreshes for the same checkout.
- Use GitNexus when finding unfamiliar implementations, following callers/callees, tracing execution flows, or assessing the impact of a cross-file change. Prefer `query` for concept searches, `context` for a symbol's relationships, and `impact` for affected dependants. Use `rg` for exact text, configuration, unsupported files, and small searches where a graph adds no value.
- Use the harness's GitNexus MCP tools when available, otherwise the installed CLI equivalents (`gitnexus query`, `gitnexus context`, `gitnexus impact`). Explicitly select the current checkout with MCP `repo` or CLI `--repo`; use its absolute path when repository names collide. A main-checkout index is not a substitute for the active worktree's index.
- Read the actual source before changing it and verify graph results against the current code. Missing graph edges or search results do not prove there are no callers; account for generated code, reflection, dependency injection, Razor, and XAML bindings. Graph analysis does not replace compiler, analyzer, or test validation.
- If GitNexus is unavailable, indexing fails, or relevant files are unsupported, report that limitation briefly and continue with source searches and available language/compiler tools. For a missing installation, provide the [official repository and installation guide](https://github.com/abhigyanpatwari/GitNexus#quick-start). Do not present a stale or incomplete graph as current or complete.

## .NET and C# changes

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
