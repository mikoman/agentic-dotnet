#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
ROOT_DIR=$(cd "${SCRIPT_DIR}/.." && pwd -P)
VERSION=$(tr -d '[:space:]' < "${ROOT_DIR}/VERSION")
DIST_DIR="${ROOT_DIR}/dist"
PACKAGE_NAME="agentic-dotnet-${VERSION}"
STAGING_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/agentic-dotnet-package.XXXXXX")

cleanup() {
  case "$STAGING_ROOT" in
    "${TMPDIR:-/tmp}"/agentic-dotnet-package.*) rm -rf "$STAGING_ROOT" ;;
    *) printf '[package] WARN: refusing unexpected temporary path: %s\n' "$STAGING_ROOT" >&2 ;;
  esac
}
trap cleanup EXIT

mkdir -p "${DIST_DIR}" "${STAGING_ROOT}/${PACKAGE_NAME}"

(cd "$ROOT_DIR" && tar \
  --exclude='./.git' \
  --exclude='./backups' \
  --exclude='./reports' \
  --exclude='./dist' \
  --exclude='./.DS_Store' \
  -cf - .) | (cd "${STAGING_ROOT}/${PACKAGE_NAME}" && tar -xf -)

tar -C "$STAGING_ROOT" -czf "${DIST_DIR}/${PACKAGE_NAME}.tar.gz" "$PACKAGE_NAME"

if command -v zip >/dev/null 2>&1; then
  (cd "$STAGING_ROOT" && zip -qr "${DIST_DIR}/${PACKAGE_NAME}.zip" "$PACKAGE_NAME")
else
  printf '[package] WARN: zip not found; Windows zip package not created\n' >&2
fi

checksum_file="${DIST_DIR}/SHA256SUMS"
: > "$checksum_file"
for artifact in "${DIST_DIR}/${PACKAGE_NAME}.tar.gz" "${DIST_DIR}/${PACKAGE_NAME}.zip"; do
  [ -f "$artifact" ] || continue
  if command -v sha256sum >/dev/null 2>&1; then
    (cd "$DIST_DIR" && sha256sum "$(basename "$artifact")") >> "$checksum_file"
  else
    digest=$(shasum -a 256 "$artifact" | awk '{print $1}')
    printf '%s  %s\n' "$digest" "$(basename "$artifact")" >> "$checksum_file"
  fi
done

printf '[package] created %s\n' "${DIST_DIR}/${PACKAGE_NAME}.tar.gz"
[ ! -f "${DIST_DIR}/${PACKAGE_NAME}.zip" ] || printf '[package] created %s\n' "${DIST_DIR}/${PACKAGE_NAME}.zip"
printf '[package] checksums %s\n' "$checksum_file"
