# Releasing

Releases are built by GitHub Actions from tags and contain no local backups, reports, Git metadata, or credentials.

## Prepare a release

1. Update `VERSION`.
2. Update `CHANGELOG.md`.
   Review `config/release-files.json` for every added or removed distributable file.
   Run `node scripts/validate-skills.js` and `node --test tests/managed.test.js tests/sync.test.js`.
3. Run `./scripts/package.sh`.
4. Verify `dist/SHA256SUMS`.
5. Run `./scripts/doctor.sh` with an appropriate development root.
6. Commit and push `main`.

## Publish

Create and push an annotated tag matching `VERSION`:

```sh
version=$(tr -d '[:space:]' < VERSION)
git tag -a "v$version" -m "agentic-dotnet $version"
git push origin "v$version"
```

The release workflow validates Bash and PowerShell, builds the tarball and zip, verifies checksums, and creates the GitHub release with generated notes.

Do not upload the local `backups/`, `reports/`, or an existing `dist/` directory manually.

The package scripts use the explicit release allowlist. Unlisted files stay local. Inspect both archive listings before publication. This check does not replace a content-level secret review.
