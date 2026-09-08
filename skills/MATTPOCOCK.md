# Matt Pocock skills: installed source and usage

This repository vendors the **25 engineering and productivity skills** in the main [mattpocock/skills](https://github.com/mattpocock/skills) collection. The user selected this collection on 2026-09-08; miscellaneous and in-progress skills are not installed.

- Source commit: [`3cca18b368ae95cdbdebbff572ccafa662551015`](https://github.com/mattpocock/skills/tree/3cca18b368ae95cdbdebbff572ccafa662551015), dated 2026-09-04.
- Selection: the 25 paths in that revision's [plugin manifest](https://github.com/mattpocock/skills/blob/3cca18b368ae95cdbdebbff572ccafa662551015/.claude-plugin/plugin.json), version `1.2.3`.
- Licence: MIT, copyright (c) 2026 Matt Pocock. The upstream `LICENSE` is included in every installed skill directory.
- Local changes: none to upstream skill files. Only the root licence was added to each skill directory for redistribution. Upstream category directories are flattened into `skills/<skill-name>/` for existing central discovery; each skill's internal structure is unchanged.
- Installation: Codex's bundled `install-skill-from-github.py`, with the commit above and `--dest` pointing to this repository's `skills/` directory. No separate marketplace plugin was registered.

## Inventory

Paths in this table are relative to the pinned upstream repository. Local links are relative to this document. **Explicit** skills are intended to be requested by the user; **automatic or explicit** skills can also be selected by an agent when relevant. The upstream frontmatter and `agents/openai.yaml` invocation policies are retained; enforcement depends on the harness.

| Skill | Upstream directory | Invocation | Use when |
| --- | --- | --- | --- |
| [ask-matt](ask-matt/SKILL.md) | `skills/engineering/ask-matt` | Explicit | Choose a skill or workflow for the task. |
| [code-review](code-review/SKILL.md) | `skills/engineering/code-review` | Automatic or explicit | Review changes against repository standards and the originating specification. |
| [codebase-design](codebase-design/SKILL.md) | `skills/engineering/codebase-design` | Automatic or explicit | Design module interfaces and testable boundaries. |
| [diagnosing-bugs](diagnosing-bugs/SKILL.md) | `skills/engineering/diagnosing-bugs` | Automatic or explicit | Investigate a difficult bug or performance regression. |
| [domain-modeling](domain-modeling/SKILL.md) | `skills/engineering/domain-modeling` | Automatic or explicit | Clarify domain terminology and record glossary entries or decisions. |
| [grill-with-docs](grill-with-docs/SKILL.md) | `skills/engineering/grill-with-docs` | Explicit | Refine a plan through questions while capturing terminology and decisions. |
| [implement](implement/SKILL.md) | `skills/engineering/implement` | Explicit | Implement a specification or ticket with testing and review. |
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
| [grill-me](grill-me/SKILL.md) | `skills/productivity/grill-me` | Explicit | Examine an idea or decision through detailed questions. |
| [grilling](grilling/SKILL.md) | `skills/productivity/grilling` | Automatic or explicit | Supply the interview process used by other planning skills. |
| [handoff](handoff/SKILL.md) | `skills/productivity/handoff` | Explicit | Save a concise continuation document for another agent session. |
| [teach](teach/SKILL.md) | `skills/productivity/teach` | Explicit | Learn a topic through lessons and a persistent learning workspace. |
| [to-questionnaire](to-questionnaire/SKILL.md) | `skills/productivity/to-questionnaire` | Explicit | Prepare questions for someone who holds missing information. |
| [wait-what](wait-what/SKILL.md) | `skills/productivity/wait-what` | Explicit | Ask the agent to explain its last message more clearly. |
| [writing-for-agents](writing-for-agents/SKILL.md) | `skills/productivity/writing-for-agents` | Automatic or explicit | Write instructions, skills, and reference documents for agents. |

## Central installation and use

All five local harnesses share these files: Codex, Copilot CLI, Cursor, and Kilo discover the links in `~/.agents/skills`; Claude Code uses `~/.claude/skills`. Both platform sync scripts link each complete canonical directory. This source record is a Markdown file outside the individual skill directories, so it is not another discoverable skill.

Use `$ask-matt` in Codex, `/ask-matt` where slash commands are supported, or request the skill by name. The collection's usual planning flow is `grill-with-docs` → `to-spec` → `to-tickets` → `implement`; choose only the steps needed for the work. Individual tools such as `diagnosing-bugs`, `tdd`, and `handoff` can be requested directly. Companion skills remain available because the entire main collection is installed.

Run `setup-matt-pocock-skills` in each application repository when adopting its engineering workflows. It writes project-specific configuration; central installation does not execute it or impose an issue tracker on every project. Existing user instructions, repository constraints, and harness permissions continue to govern skill use.

See [PORTABLE_INSTALL.md](../PORTABLE_INSTALL.md#shared-skills-including-matt-pococks-collection) for restoration, pinned downloads, optional skills, backups, updates, dependencies, and verification. See [INSTALL_NEW_HARNESS.md](../INSTALL_NEW_HARNESS.md) when connecting another harness. Update this source record whenever the installed selection, revision, or local modifications change.
