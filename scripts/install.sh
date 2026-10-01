#!/usr/bin/env bash
set -euo pipefail

USER_HOME="${HOME:?HOME is required}"
USER_HOME="${AGENTIC_DOTNET_USER_HOME:-$USER_HOME}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
ROOT_DIR="${AGENTIC_DOTNET_HOME:-$(cd "${SCRIPT_DIR}/.." && pwd -P)}"
PLUGIN_CONFIG="${ROOT_DIR}/config/plugins.yaml"
CACHE_ROOT="${USER_HOME}/.cache/agentic-dotnet"
DOTNET_SKILLS_CHECKOUT="${CACHE_ROOT}/dotnet-skills"
SKIP_PLUGINS=0
WITH_OCR=0

for argument in "$@"; do
  case "$argument" in
    --skip-plugins) SKIP_PLUGINS=1 ;;
    --with-ocr) WITH_OCR=1 ;;
    -h|--help)
      printf 'Usage: %s [--skip-plugins] [--with-ocr]\n' "$0"
      exit 0
      ;;
    *) printf 'unknown argument: %s\n' "$argument" >&2; exit 2 ;;
  esac
done

note() { printf '[install] %s\n' "$*"; }
warn() { printf '[install] WARN: %s\n' "$*" >&2; }

PLUGINS=()
while IFS= read -r plugin; do
  PLUGINS+=("$plugin")
done < <(awk '
  /^(core|standard|optional):/ { active=1; next }
  /^[A-Za-z_][A-Za-z0-9_-]*:/ { active=0 }
  active && /^[[:space:]]*-[[:space:]]+/ { sub(/^[[:space:]]*-[[:space:]]+/, ""); print }
' "$PLUGIN_CONFIG")

ensure_dotnet_skills_cache() {
  node "${ROOT_DIR}/scripts/official-cache.js"
}

NEED_CACHE=0
if [ "$SKIP_PLUGINS" -eq 0 ]; then
  if [ -d '/Applications/Cursor.app' ] || command -v cursor-agent >/dev/null 2>&1; then NEED_CACHE=1; fi
  if [ -d "${USER_HOME}/.config/kilo" ]; then NEED_CACHE=1; fi
fi

"${ROOT_DIR}/scripts/sync.sh"
if [ "$WITH_OCR" -eq 1 ]; then node "${ROOT_DIR}/scripts/install-tools.js" --apply; fi

if [ "$SKIP_PLUGINS" -eq 1 ]; then
  note 'skipping plugin and MCP CLI installation by request'
  exit 0
fi

if [ "$NEED_CACHE" -eq 1 ]; then ensure_dotnet_skills_cache; fi

node "${ROOT_DIR}/scripts/install-native.js"

if [ -d '/Applications/Cursor.app' ] || command -v cursor-agent >/dev/null 2>&1; then
  node "${ROOT_DIR}/scripts/cursor-adapter.js"
else
  warn 'Cursor is not installed'
fi

if [ -d "${USER_HOME}/.config/kilo" ]; then
  for plugin in "${PLUGINS[@]}"; do
    source_path="${DOTNET_SKILLS_CHECKOUT}/plugins/${plugin}/skills"
    if [ -d "$source_path" ]; then
      note "Kilo official skills ready: $plugin"
    else
      warn "Kilo official skills missing in cache: $plugin"
    fi
  done
  note 'Kilo has no native dotnet/skills plugin marketplace; official skills are exposed via skills.paths in ~/.config/kilo/kilo.jsonc'
else
  warn 'Kilo config directory not present; official skills not wired'
fi

if command -v copilot >/dev/null 2>&1; then
  note 'Copilot CLI detected; install official plugins interactively from dotnet/skills if required by this CLI version'
else
  warn 'Copilot CLI is not installed; global instructions, shared skills path, and Microsoft Learn MCP config are prepared'
fi

note 'installation pass complete'
