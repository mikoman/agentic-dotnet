# Releasing

Releases are built by GitHub Actions from tags and contain no local backups, reports, Git metadata, or credentials.

A push to `main` runs validation. It does not publish a release or update the latest release. Publication requires a separate version tag.

## Prepare a release

1. Update `VERSION`.
2. Update `CHANGELOG.md`.
   Review `config/release-files.json` for every added or removed distributable file.
   Run `node scripts/validate-skills.js` and `node --test tests/managed.test.js tests/sync.test.js`.
3. Run `./scripts/package.sh`.
4. Verify `dist/SHA256SUMS`.
5. Run `./scripts/doctor.sh` with an appropriate development root.
6. Commit and push `main`.
7. Wait for the Validate workflow to pass on that commit, including Windows, Linux, and macOS.

## Publish

Create and push an annotated tag matching `VERSION`:

```sh
version=$(tr -d '[:space:]' < VERSION)
git tag -a "v$version" -m "agentic-dotnet $version"
git push origin "v$version"
```

The release workflow validates Bash and PowerShell, builds the tarball and zip, verifies checksums, and creates the GitHub release with generated notes.

Wait for the Release workflow to finish. Confirm that the release page contains the matching `.tar.gz`, `.zip`, and `SHA256SUMS`. Do not move or replace a published version tag.

Do not upload the local `backups/`, `reports/`, or an existing `dist/` directory manually.

The package scripts use the explicit release allowlist. Unlisted files stay local. Inspect both archive listings before publication. This check does not replace a content-level secret review.
