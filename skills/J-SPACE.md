# J-Space: source and shared use

- Source: [Tiger3807861189/J-Space-Cognition-Suite](https://github.com/Tiger3807861189/J-Space-Cognition-Suite).
- Source commit: [`b2023124a1fa08278e3ee82aefa8ed9faeade995`](https://github.com/Tiger3807861189/J-Space-Cognition-Suite/tree/b2023124a1fa08278e3ee82aefa8ed9faeade995).
- Upstream edition: `SV1`.
- Review date: 2026-10-27.
- License: [Apache-2.0](j-space/LICENSE). The skill also retains [third-party notices](j-space/THIRD_PARTY_NOTICES.md).
- Local changes: none to the upstream skill files. The root license and notices accompany the complete `j-space/` directory.

The suite contains one skill, 13 modules, seven references, and standard-library Python helpers.
Keep one physical copy under `skills/j-space/`. The existing sync scripts expose it through the shared skill paths.

The [canonical J-Space rule](../instructions/global.md#j-space-task-control) applies across tasks and other skill workflows.
Keep shared selection policy in that file. Specialist skills retain their procedures and invocation restrictions.
Generated harness adapters receive the same rule through sync.

The suite provides task records, source receipts, and verification gates. Installation does not register event hooks or start agents.
A running agent must load the skill and call its helpers where required. File checks cannot prove runtime use or improved reasoning.

## Verification

Reading the skill needs no Python runtime. Its executable helpers require Python 3.10 or later.
Run these checks from the central root:

```sh
python3 skills/j-space/scripts/verify_suite.py
python3 skills/j-space/scripts/control.py --help
node scripts/validate-skills.js
node scripts/release-files.js
./scripts/sync.sh
./scripts/install.sh --skip-plugins
./scripts/doctor.sh
```

On Windows, use `py -3` for Python commands. Run `scripts/sync.ps1`, `scripts/install.ps1 -SkipPlugins`, and `scripts/doctor.ps1`.

Start a fresh harness session after sync. Check that its skill list includes `j-space`.
Check that the agent selects it during another skill workflow without an explicit J-Space request.
Check that a direct answer uses the lightweight level. Use a temporary task directory to exercise controller gates.

## Updates

Download a specific upstream revision separately. Inspect its instructions, helpers, notices, and license.
Compare the candidate with the installed directory. Back up the current directory under `backups/` before replacement.
Update this source record and `config/release-files.json`. Repeat verification and the runtime discovery check.
