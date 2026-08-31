# Releasing

Releases are built by GitHub Actions from tags and contain no local backups, reports, Git metadata, or credentials.

## Prepare a release

1. Update `VERSION`.
2. Update `CHANGELOG.md`.
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
