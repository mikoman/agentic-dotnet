# Code review source and integration

- Source: [Alibaba Open Code Review](https://github.com/alibaba/open-code-review).
- Skill revision: `a758d9cbfb689937c7857ad64b2dd66adb58c0c2`.
- Upstream skill name: `open-code-review`. Central name: `code-review`.
- CLI: `@alibaba-group/open-code-review@1.12.11`.
- License: Apache-2.0. The license is retained in the skill directory.
- Local changes: concise discovery, explicit scope selection, safe fallback, credential boundaries, and accurate partial-result reporting.

The pinned upstream entry is retained as a conditional CLI reference. The central entry defines local safety and task authority.
It replaces Matt Pocock's review workflow without breaking existing `code-review` references.

`references/review-policy.md` is the review instruction source. Sync generates `adapters/code-review/rule.json` from it.
The global OCR rule link uses `~/.opencodereview/rule.json`. Existing project rules retain OCR's normal precedence.
Sync preserves a conflicting regular user rule. It reports the conflict instead of overwriting it.

Install the optional CLI with `scripts/install.sh --with-ocr` or `scripts/install.ps1 -WithOcr`.
Use OCR's own provider setup when no approved provider exists. Never copy Codex, Claude, or Copilot credentials into OCR.
Preview does not call a model. A full OCR review can send source code to its configured provider and incur usage costs.

The skill is available through the canonical shared discovery paths. A fresh harness turn or session may be required.
