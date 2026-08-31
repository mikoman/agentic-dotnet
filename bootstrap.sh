#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
TARGET_DIR="${AGENTIC_DOTNET_HOME:-${HOME:?HOME is required}/.agentic-dotnet}"
SKIP_PLUGINS=0
NO_VERIFY=0
DRY_RUN=0
REPLACE_EXISTING=0

usage() {
  printf 'Usage: %s [--target PATH] [--skip-plugins] [--no-verify] [--dry-run] [--replace-existing]\n' "$0"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --target) TARGET_DIR="$2"; shift 2 ;;
    --skip-plugins) SKIP_PLUGINS=1; shift ;;
    --no-verify) NO_VERIFY=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --replace-existing) REPLACE_EXISTING=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) printf 'unknown argument: %s\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
done

case "$TARGET_DIR" in
  /*) ;;
  *) TARGET_DIR="${PWD}/${TARGET_DIR}" ;;
esac

note() { printf '[bootstrap] %s\n' "$*"; }

copy_package() {
  local backup_dir relative source destination
  backup_dir="${TARGET_DIR}/backups/bootstrap-$(date '+%Y-%m-%d-%H%M%S')/package-overwrite"

  while IFS= read -r -d '' source; do
    relative="${source#${SOURCE_DIR}/}"
    destination="${TARGET_DIR}/${relative}"

    if [ -f "$destination" ] && cmp -s "$source" "$destination"; then
      continue
    fi

    if [ "$DRY_RUN" -eq 1 ]; then
      printf '[bootstrap] WOULD INSTALL %s\n' "$destination"
      continue
    fi

    if [ -e "$destination" ] || [ -L "$destination" ]; then
      mkdir -p "${backup_dir}/$(dirname "$relative")"
      cp -a "$destination" "${backup_dir}/${relative}"
      note "backed up existing $destination"
    fi

    mkdir -p "$(dirname "$destination")"
    cp -p "$source" "$destination"
  done < <(
    find "$SOURCE_DIR" \
      \( -type d \( -name .git -o -name backups -o -name reports -o -name dist \) -prune \) -o \
      \( -type f ! -name '.DS_Store' -print0 \)
  )
}

resolved_target_parent=$(dirname "$TARGET_DIR")
if [ "$DRY_RUN" -eq 0 ]; then mkdir -p "$resolved_target_parent"; fi
if [ -d "$TARGET_DIR" ]; then
  resolved_target=$(cd "$TARGET_DIR" && pwd -P)
else
  resolved_target=''
fi

if [ "$SOURCE_DIR" != "$resolved_target" ]; then
  note "installing package into $TARGET_DIR"
  copy_package
else
  note "package is already at $TARGET_DIR"
fi

if [ "$DRY_RUN" -eq 1 ]; then
  note 'dry run complete; no files or harness settings changed'
  exit 0
fi

chmod +x "${TARGET_DIR}/bootstrap.sh" "${TARGET_DIR}"/scripts/*.sh

install_arguments=()
if [ "$SKIP_PLUGINS" -eq 1 ]; then install_arguments+=(--skip-plugins); fi
AGENTIC_DOTNET_HOME="$TARGET_DIR" AGENTIC_DOTNET_REPLACE_EXISTING="$REPLACE_EXISTING" "${TARGET_DIR}/scripts/install.sh" "${install_arguments[@]}"

if [ "$NO_VERIFY" -eq 0 ]; then
  AGENTIC_DOTNET_HOME="$TARGET_DIR" "${TARGET_DIR}/scripts/doctor.sh"
fi

note "installation complete: $TARGET_DIR"
