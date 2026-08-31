#!/usr/bin/env bash
set -euo pipefail

USER_HOME="${HOME:?HOME is required}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
ROOT_DIR="${AGENTIC_DOTNET_HOME:-$(cd "${SCRIPT_DIR}/.." && pwd -P)}"
DEV_ROOT="${AGENTIC_DOTNET_DEV_ROOT:-$PWD}"
MODE="dry-run"
MANIFEST=""
BACKUP_DIR=""

usage() {
  printf 'Usage: %s [--root PATH] [--manifest FILE] [--backup PATH] [--apply]\n' "$0"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --root) DEV_ROOT="$2"; shift 2 ;;
    --manifest) MANIFEST="$2"; shift 2 ;;
    --backup) BACKUP_DIR="$2"; shift 2 ;;
    --apply) MODE="apply"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) printf 'unknown argument: %s\n' "$1" >&2; usage >&2; exit 2 ;;
  esac
done

DEV_ROOT=$(cd "$DEV_ROOT" && pwd -P)
[ "$DEV_ROOT" != "/" ] || { printf 'refusing filesystem root\n' >&2; exit 2; }
[ "$DEV_ROOT" != "$USER_HOME" ] || { printf 'refusing home directory\n' >&2; exit 2; }

# Automatic discovery is intentionally report-only: filenames do not prove that
# content is generic. Applying changes therefore requires an audited manifest.
if [ "$MODE" = "apply" ] && [ -z "$MANIFEST" ]; then
  printf 'refusing --apply without a reviewed --manifest FILE\n' >&2
  exit 2
fi

if [ -n "$MANIFEST" ]; then
  [ -f "$MANIFEST" ] || { printf 'manifest not found: %s\n' "$MANIFEST" >&2; exit 2; }
  CANDIDATES=()
  while IFS= read -r candidate; do CANDIDATES+=("$candidate"); done < <(sed -e '/^[[:space:]]*#/d' -e '/^[[:space:]]*$/d' "$MANIFEST")
else
  CANDIDATES=()
  while IFS= read -r -d '' candidate; do CANDIDATES+=("$candidate"); done < <(
    find "$DEV_ROOT" \
      \( -type d \( -name .git -o -name bin -o -name obj -o -name node_modules -o -name packages -o -name vendor -o -name .venv -o -name venv -o -name dist -o -name build \) -prune \) -o \
      \( -type d \( -path '*/.cursor/rules' -o -path '*/.agents/skills' -o -path '*/.claude/skills' -o -path '*/.codex' -o -path '*/.qoder/repowiki' -o -path '*/.qoder/better-harness' -o -path '*/.kilo' -o -path '*/.kilocode' -o -path '*/.opencode' \) -print0 -prune \) -o \
      \( -type f \( -name '*.instructions.md' -o -name '*.mdc' -o -name '.mcp.json' -o -name 'mcp.json' -o -path '*/.github/copilot-instructions.md' -o \( -path '*/.cursor/*' -a -name '.DS_Store' \) \) -print0 \) \
      2>/dev/null
  )
fi

printf 'Mode: %s\nRoot: %s\n' "$MODE" "$DEV_ROOT"
for path in "${CANDIDATES[@]:-}"; do
  [ -n "$path" ] || continue
  case "$path" in
    "$DEV_ROOT"/*) ;;
    *) printf 'SKIP outside root: %s\n' "$path"; continue ;;
  esac
  case "$path" in
    */.git|*/.git/*|*/bin|*/bin/*|*/obj|*/obj/*|*/node_modules/*|*/packages/*|*/vendor/*|*/.venv/*|*/venv/*)
      printf 'SKIP protected/generated path: %s\n' "$path"; continue ;;
  esac
  if [ ! -e "$path" ] && [ ! -L "$path" ]; then
    printf 'MISSING: %s\n' "$path"
    continue
  fi
  if [ "$MODE" = "dry-run" ]; then
    printf 'REVIEW CANDIDATE (no change): %s\n' "$path"
    continue
  fi
  if [ -z "$BACKUP_DIR" ]; then
    BACKUP_DIR="${ROOT_DIR}/backups/clean-$(date '+%Y-%m-%d-%H%M%S')"
  fi
  relative="${path#${DEV_ROOT}/}"
  destination="${BACKUP_DIR}/repos/${relative}"
  mkdir -p "$(dirname "$destination")"
  if [ -e "$destination" ] || [ -L "$destination" ]; then
    printf 'SKIP backup destination exists: %s\n' "$destination"
    continue
  fi
  mv "$path" "$destination"
  printf 'BACKED UP AND REMOVED: %s -> %s\n' "$path" "$destination"
done

[ -z "$BACKUP_DIR" ] || printf 'Backup: %s\n' "$BACKUP_DIR"
