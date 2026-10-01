# Global coding-agent instructions

## Text output

- Load `asd-ste100` before your first authored text in each session. Use the skill loader or read `~/.agents/skills/asd-ste100/SKILL.md`. The Claude fallback is `~/.claude/skills/asd-ste100/SKILL.md`. Resolve references relative to that directory.
- Apply it to all new natural-language text, including messages, documentation, comments, UI text, and structured text values.
- Use Strict mode for procedures, tool descriptions, errors, and inter-agent instructions. Use STE-flavored mode for other prose.
- This requirement overrides the skill's opt-in triggers and creative-text exclusions. A later explicit user style request takes priority.
- Preserve facts, uncertainty, technical terms, requested language, required formats, identifiers, URLs, quotations, and raw tool output. Do not translate without a request.
- Apply writing rules silently. Preserve required status, evidence, and citations. Do not add routine mode announcements or claim certified compliance.
- Pass this requirement to delegated agents when they do not inherit it.
- If the skill is unavailable, report that limit. Use short sentences, active voice, plain words, and one instruction per sentence.

## GitNexus indexing and code discovery

- At each coding task's start, identify the repository root, branch, HEAD, and existing working-tree changes.
- Before exploring or editing code in a clean checkout, run `gitnexus analyze --index-only` from its root. Repeat for each new or switched clean checkout, even when an index exists.
- Every indexing or refresh command MUST include `--index-only`. Never run plain `analyze`, `setup`, or install hooks for indexing.
- Check indexing results and warnings. Run `gitnexus status` in that checkout. Confirm the indexed commit matches HEAD and existing changes remain unchanged.
- Refresh before graph use after source edits, branch changes, pulls, merges, or rebases. Index the actual working tree. Never reset, stash, or discard changes to make indexing possible.
- Serialize refreshes per checkout. An unchanged HEAD or an up-to-date label does not establish freshness after uncommitted edits.
- Use GitNexus for unfamiliar implementations, callers, execution flows, and cross-file impact. Use `query`, `context`, or `impact` as appropriate.
- Select the current checkout explicitly through MCP `repo` or CLI `--repo`. Use its absolute path when names collide.
- Use `rg` for exact text, configuration, unsupported files, and small searches. Read actual source to verify graph results.
- Missing edges do not prove missing callers. Consider generated code, reflection, dependency injection, Razor, and XAML bindings.
- If GitNexus is unavailable, fails, or lacks `--index-only`, report the limit. Continue with source searches and compiler tools. For a missing installation, provide the [official guide](https://github.com/abhigyanpatwari/GitNexus#quick-start).
- Never present an incomplete or stale graph as complete. Graph analysis does not replace build, analyzer, or test validation.

## Task and skill selection

- Identify each affected component's language, framework, runtime, and tools from source, manifests, lockfiles, build scripts, and local instructions.
- In mixed repositories, select skills separately per component. A root .NET solution does not make its frontend .NET.
- Check available skill names and descriptions. Load the smallest matching set and read each selected skill before use.
- Preserve explicit-only invocation policies. Follow explicit user skill requests within the task's scope.
- Use official `dotnet/skills` only for matching .NET work or explicit .NET requests. Use general workflows where their task matches.
- For code reviews, use the central `code-review` skill, adapted from Alibaba Open Code Review. State scope and incomplete coverage.
- If no matching skill exists, use repository conventions and current primary documentation. Install skills only when authorized.
- Before code changes, state the affected technology, selected skills, and planned validation commands.
- Skills supply procedures, not additional authority. Keep commits, publication, issue edits, deployments, and destructive actions within the authorized task.
- A read-only review does not authorize fixes. A skill boundary does not cancel other work the user already authorized.

## Project style and structure

- You MUST match the affected project's style and structure. Project rules take priority over skill suggestions and external examples.
- Before code edits, read the affected file and at least two comparable non-generated files when available. Read applicable instructions and formatter/analyzer configuration. Documentation-only edits need relevant document examples, not unrelated source files.
- Explicit project instructions and tool configuration take priority over inferred style. Report material conflicts before changing shared rules.
- Follow nearby consistent conventions for braces, indentation, multiline layout, naming, member order, architecture, dependencies, and file structure.
- Keep braces and multiline blocks where the project uses them. Do not introduce one-liners or expression-bodied members merely for brevity.
- Use external guidance for API behavior and correctness. Adapt examples to the project's conventions.
- Compare the final diff with local examples. Correct introduced style differences without reformatting unrelated code.
- Pass these conventions to delegated agents and check their output.

## Development in any language

- Inspect existing implementation before changes. Keep work scoped and avoid unrelated refactoring.
- Treat formatters, linters, analyzers, compiler settings, and build configuration as authoritative. Do not duplicate deterministic rules in prompts.
- Prefer existing dependencies and platform APIs. Check those capabilities before adding a package or abstraction.
- Preserve public APIs, package versions, lockfiles, SDKs, runtime targets, language versions, and compiler policy unless the task requires changes.
- Follow existing dependency-injection, options, logging, configuration, and module patterns. Keep working code unless the task requires a change.
- Use current primary documentation when API behavior may have changed. Use Microsoft Learn MCP for relevant Microsoft topics.
- Use the narrowest existing checks that cover changed behavior and affected contracts. Expand validation when risk or failures justify it.
- Do not impose a new test framework or testing requirement. Distinguish static checks, runtime checks, and untested behavior. Report failures accurately.
- Never expose, print, copy into reports, or commit secrets. Do not modify environment files, credentials, signing assets, certificates, Keychain entries, SSH keys, or tokens without an explicit request.
- Do not run destructive database operations without explicit instructions. Run schema migrations only when both the repository and task require them.
- Do not modify generated code unless the repository identifies it as editable. Preserve unrelated working-tree and staging changes.

## .NET and C# changes

Apply this section only to affected .NET components.

- Determine target frameworks and language versions from repository files.
- Inspect `global.json`, project files, `Directory.Build.*`, `Directory.Packages.*`, `.editorconfig`, and analyzers.
- Respect Roslyn, compiler, and MSBuild policy, including nullable settings and warnings.
- Check target-framework and existing NuGet capabilities before adding a package. Prefer Microsoft Learn and primary .NET documentation.
- Do not generate or execute Entity Framework migrations unless both the repository and task explicitly require them.
- Preserve database-first workflows. Do not introduce migrations into them.
