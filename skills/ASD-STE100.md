# ASD-STE100: source and use

The central skill directory contains the complete upstream snapshot of [danyuchn/asd-ste100-skill](https://github.com/danyuchn/asd-ste100-skill).

- Skill name: `asd-ste100`.
- Skill version: `0.4.0`.
- Source commit: [`7d4a135a199a5d7447c4886bcd7ffe742a627bc9`](https://github.com/danyuchn/asd-ste100-skill/tree/7d4a135a199a5d7447c4886bcd7ffe742a627bc9).
- License: [MIT](asd-ste100/LICENSE), copyright 2026 Dustin Yuchen Teng.
- Review date: 2026-09-10.

The seven upstream files retain their original content. They include `SKILL.md`, `README.md`, `LICENSE`, both example files, the writing rules, and the linter.

## Shared use

Keep one physical copy under `skills/asd-ste100/`. The existing sync scripts expose it through `~/.agents/skills/asd-ste100` and `~/.claude/skills/asd-ste100`.

The [canonical text-output rule](../instructions/global.md#text-output) requires this skill for all authored text. It expands the upstream triggers, including creative and marketing text. Keep that requirement in the canonical instructions. Preserve the upstream skill files when changing local policy.

Delegated agents must receive the same requirement. Their task instructions must include it when the harness does not pass the canonical instructions to them.

Use the harness's skill loader. If the loader is unavailable, read `SKILL.md` through either shared path. Resolve its supporting files relative to the skill directory. `$asd-ste100` or the harness's equivalent invocation can also select the skill explicitly.

## Verification

Run these commands from the central root after installation:

```sh
./scripts/sync.sh
./scripts/install.sh --skip-plugins
./scripts/doctor.sh
python3 skills/asd-ste100/scripts/ste-lint.py --selftest
```

On Windows:

```powershell
.\scripts\sync.ps1
.\scripts\install.ps1 -SkipPlugins
.\scripts\doctor.ps1
py skills/asd-ste100/scripts/ste-lint.py --selftest
```

The linter needs Python 3. Reading and applying the skill does not require running it for each response. To check a document:

```sh
python3 skills/asd-ste100/scripts/ste-lint.py path/to/document.md
```

Start a fresh session in each installed harness. Check that it can load the skill and identify the all-text rule. Check a normal answer without an explicit skill request. It should use clear sentences and preserve technical terms, facts, and uncertainty.

The linter checks selected structural rules. It cannot prove factual accuracy or full ASD-STE100 compliance. The skill does not include the official ASD dictionary.

Shared links prepare discovery for Codex, Claude Code, Copilot CLI, Cursor, and Kilo. They do not prove runtime use. See [platform limits](../PORTABLE_INSTALL.md#harness-behavior) for Windows Cursor/Kilo instruction support. Hosted agents need a separate supported distribution path.

## Updates

Review a specific upstream commit before replacing the skill. Compare all seven files and retain the MIT license. Back up the current central directory under `backups/` before replacement. Update this source record. Then run sync, install, doctor, and the linter self-test again.
