---
name: code-review
description: Review committed or local Git changes with Alibaba Open Code Review. Use for code reviews, pull requests, branch comparisons, or staged and unstaged changes. Fix findings only when requested.
license: Apache-2.0
compatibility: OCR reviews require the ocr CLI and an approved configured model provider. Direct source review remains available without a provider.
metadata:
  upstream: alibaba/open-code-review
  upstream-skill: open-code-review
  revision: a758d9cbfb689937c7857ad64b2dd66adb58c0c2
  version: "1.0.0-local.1"
---

# Code review

Produce evidence-backed findings for the requested Git changes. This is a central adaptation of Alibaba's Open Code Review skill.

Use this workflow for reviews. Do not invoke it merely because a normal implementation task modifies code.

## Establish scope

1. Read [review policy](references/review-policy.md) and applicable repository instructions.
2. Record the checkout, branch, HEAD, and working-tree status. Preserve existing changes and staging state.
3. Identify the requested comparison: workspace, staged, unstaged, commit, branch, or branch plus local changes.
4. Gather concise requirements and business context from the request and repository. An issue tracker or separate specification is not required.

## Run the review

Check `ocr review --help` when its installed behavior is unknown. Do not install or upgrade tools during a review without authorization.

Use the repository's approved provider. Never select an external provider, copy credentials, or upload secret files to make a review work.

Use `OCR_NO_UPDATE=1` in the command environment to prevent an automatic tool update. Preview scope before a model-backed run.

| Scope | OCR arguments |
| --- | --- |
| All local changes | No revision arguments. Workspace mode includes staged, unstaged, and untracked files. |
| One commit | `--commit <ref>` |
| Branch | `--from <base> --to <branch>` |
| Scope preview | Add `--preview`. This does not run the model. |

Inspect the preview for excluded files, generated material, credentials, and unrelated changes. Exclude unsafe paths before a model call.

OCR has no staged-only or unstaged-only flag in the validated version. For these scopes, review the corresponding Git diff directly. Inspect relevant untracked files separately. Never stage, stash, or reset files to change the tool's scope.

For a branch-plus-local review, account for both comparisons. Do not mistake the committed branch diff for all work in progress.

For a configured model-backed review, use:

```sh
OCR_NO_UPDATE=1 ocr review --audience agent --background "requirements and constraints" --format json --output <private-result-file> <scope-arguments>
```

Keep output in a private temporary directory or ignored report directory. Read all findings. Do not truncate output with `head` or `tail`.

In PowerShell, set `$env:OCR_NO_UPDATE = '1'` before the command. Omit the POSIX environment prefix there.

Use the existing provider and budget settings. Set a bounded budget for a large review. Report skipped files and budget limits.

If OCR or its provider is unavailable, report that limit. Continue with a direct source review when possible. Never label that fallback as a successful OCR run.

For advanced flags, rule precedence, and recovery, consult [the pinned upstream reference](references/upstream.md). The local scope, credential, and installation rules above take priority over its automatic-install and staging advice.

## Validate and report

- Check command status, warnings, failed files, skipped files, and budget exhaustion. Exit code zero alone does not prove complete coverage.
- Verify each finding against current source and the requested behavior. Resolve missing line positions before citing them.
- Report actionable findings by severity, with a file, line, consequence, and correction. Separate uncertain concerns from confirmed defects.
- Omit unsupported style preferences and false positives. Do not disclose the tool's raw `thinking` field.
- State the exact reviewed scope, coverage limits, and validation performed. A partial review must not become a clean bill of health.
- Fix only when the user requested fixes. Check each fix with the repository's existing tools. Commit or publish only when separately authorized.

Success means the requested scope is accounted for and each retained finding has evidence. Report incomplete coverage explicitly.
