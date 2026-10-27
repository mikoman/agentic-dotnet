# Matt Pocock skills: installed source and usage

This repository retains **18 engineering and productivity skills** from [mattpocock/skills](https://github.com/mattpocock/skills).
The user selected the main collection on 2026-09-08. On 2026-10-01, its review skill gave way to [Alibaba-based code review](CODE-REVIEW.md).
The overlap review on 2026-10-27 removed six more skills. Miscellaneous and in-progress skills remain excluded.

- Source commit: [`3cca18b368ae95cdbdebbff572ccafa662551015`](https://github.com/mattpocock/skills/tree/3cca18b368ae95cdbdebbff572ccafa662551015), dated 2026-09-04.
- Selection: 18 retained paths from that revision's [25-skill plugin manifest](https://github.com/mattpocock/skills/blob/3cca18b368ae95cdbdebbff572ccafa662551015/.claude-plugin/plugin.json), version `1.2.3`.
- Licence: MIT, copyright (c) 2026 Matt Pocock. The upstream `LICENSE` is included in every installed skill directory.
- Local changes: `research` permits direct research without delegation. `prototype` requires authorization for commits and publication. `resolving-merge-conflicts` preserves unrelated staging and unresolved intent. `tdd` accepts an existing approved test boundary. The setup template refers directly to retained domain skills. Invocation policies remain unchanged for retained skills. Each directory includes its upstream license. Upstream category directories are flattened into `skills/<skill-name>/`.
- Installation: Codex's bundled `install-skill-from-github.py`, with the commit above and `--dest` pointing to this repository's `skills/` directory. No separate marketplace plugin was registered.

## Overlap review

The review covered all 24 installed Matt Pocock entries, their skill calls, J-Space, and the other shared and installed specialist workflows.
A retained skill supplies a distinct procedure or deliverable. J-Space supplies shared task control and evidence records.
Impeccable supplies UI design procedures. ASD-STE100 supplies text rules. The central review skill supplies change review.

| Removed skill | Replacement | Reason |
| --- | --- | --- |
| `ask-matt` | J-Space and central skill selection | A second workflow router duplicated shared task selection. |
| `implement` | J-Space repository control, with `tdd` and `code-review` when applicable | The entry only composed implementation, checks, review, and commit authority. |
| `handoff` | J-Space state and the canonical portable-handoff rule | Both retain goals, evidence, open work, and continuation pointers. |
| `grill-me` | `grilling` | The entry only loaded `grilling`. |
| `grill-with-docs` | `grilling` with `domain-modeling` | The entry only loaded those two skills. |
| `wait-what` | ASD-STE100 and an ordinary clarification request | The entry repeated the shared text rule and glossary use. |

The retained skills below cover specialist work. Debugging supplies reproduction and regression procedures.
TDD supplies test-first development. Architecture and domain skills supply interface design, glossary, and ADR procedures.
Tracker skills supply specifications, ticket dependencies, triage, and decision maps.
Prototypes, cited research reports, teaching workspaces, questionnaires, and interactive Bash guides remain distinct deliverables.
Agent-document authoring retains its guidance on context pointers and information hierarchy.

## Retained inventory

Paths refer to the pinned upstream repository. Local links refer to this document. **Explicit** skills require a user request.
**Automatic or explicit** skills also support relevant agent selection. Retained frontmatter and `agents/openai.yaml` preserve those invocation policies.
Enforcement depends on the harness.

| Skill | Upstream directory | Invocation | Use when |
| --- | --- | --- | --- |
| [codebase-design](codebase-design/SKILL.md) | `skills/engineering/codebase-design` | Automatic or explicit | Design module interfaces and testable boundaries. |
| [diagnosing-bugs](diagnosing-bugs/SKILL.md) | `skills/engineering/diagnosing-bugs` | Automatic or explicit | Investigate a difficult bug or performance regression. |
| [domain-modeling](domain-modeling/SKILL.md) | `skills/engineering/domain-modeling` | Automatic or explicit | Clarify domain terminology and record glossary entries or decisions. |
| [improve-codebase-architecture](improve-codebase-architecture/SKILL.md) | `skills/engineering/improve-codebase-architecture` | Explicit | Survey architectural problems and explore a selected improvement. |
| [prototype](prototype/SKILL.md) | `skills/engineering/prototype` | Automatic or explicit | Answer a design question with a disposable logic or UI prototype. |
| [research](research/SKILL.md) | `skills/engineering/research` | Automatic or explicit | Gather primary-source evidence and write cited findings. |
| [resolving-merge-conflicts](resolving-merge-conflicts/SKILL.md) | `skills/engineering/resolving-merge-conflicts` | Automatic or explicit | Resolve an active merge or rebase using both sides' intent. |
| [setup-matt-pocock-skills](setup-matt-pocock-skills/SKILL.md) | `skills/engineering/setup-matt-pocock-skills` | Explicit | Configure an application's tracker, labels, and domain document layout. |
| [tdd](tdd/SKILL.md) | `skills/engineering/tdd` | Automatic or explicit | Develop behavior through a failing test and a minimal passing implementation. |
| [to-spec](to-spec/SKILL.md) | `skills/engineering/to-spec` | Explicit | Turn the current discussion into a specification on the configured tracker. |
| [to-tickets](to-tickets/SKILL.md) | `skills/engineering/to-tickets` | Explicit | Split a plan into complete, verifiable tickets with dependencies. |
| [triage](triage/SKILL.md) | `skills/engineering/triage` | Explicit | Assess incoming issues and prepare them for implementation. |
| [wayfinder](wayfinder/SKILL.md) | `skills/engineering/wayfinder` | Explicit | Plan a large effort through linked decision tickets across sessions. |
| [wizard](wizard/SKILL.md) | `skills/engineering/wizard` | Automatic or explicit | Generate a Bash guide for a procedure requiring human interaction. |
| [grilling](grilling/SKILL.md) | `skills/productivity/grilling` | Automatic or explicit | Supply the interview process used by other planning skills. |
| [teach](teach/SKILL.md) | `skills/productivity/teach` | Explicit | Learn a topic through lessons and a persistent learning workspace. |
| [to-questionnaire](to-questionnaire/SKILL.md) | `skills/productivity/to-questionnaire` | Explicit | Prepare questions for someone who holds missing information. |
| [writing-for-agents](writing-for-agents/SKILL.md) | `skills/productivity/writing-for-agents` | Automatic or explicit | Write instructions, skills, and reference documents for agents. |

## Central installation and use

All six local harnesses share these files. Codex, Copilot CLI, Cursor, Kilo, and OMP use `~/.agents/skills`. Claude Code uses `~/.claude/skills`.
Both sync scripts link each complete canonical directory. This source record sits outside the individual skill directories and is not a discoverable skill.

Request a retained skill by name, such as `$grilling` or `$tdd` in Codex. Add `domain-modeling` when an interview needs glossary or ADR updates.
Use `to-spec` and `to-tickets` when the task needs tracker artifacts. J-Space controls execution and continuation state.
Choose only the specialist steps needed for the task.

Run `setup-matt-pocock-skills` only when adopting workflows that need its project-specific tracker and document conventions. Ordinary code reviews do not require it. Central installation does not execute it. Existing instructions, repository constraints, and harness permissions govern skill use.

See [PORTABLE_INSTALL.md](../PORTABLE_INSTALL.md#shared-skills-including-matt-pococks-collection) for restoration, pinned downloads, optional skills, backups, updates, dependencies, and verification. See [INSTALL_NEW_HARNESS.md](../INSTALL_NEW_HARNESS.md) when connecting another harness. Update this source record whenever the installed selection, revision, or local modifications change.
