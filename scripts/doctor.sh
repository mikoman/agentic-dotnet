#!/usr/bin/env bash
set -u

USER_HOME="${HOME:?HOME is required}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
ROOT_DIR="${AGENTIC_DOTNET_HOME:-$(cd "${SCRIPT_DIR}/.." && pwd -P)}"
DEV_ROOT="${1:-${AGENTIC_DOTNET_DEV_ROOT:-}}"
PASS=0
WARN=0
FAIL=0

pass() { printf 'PASS  %s\n' "$*"; PASS=$((PASS + 1)); }
warn() { printf 'WARN  %s\n' "$*"; WARN=$((WARN + 1)); }
fail() { printf 'FAIL  %s\n' "$*"; FAIL=$((FAIL + 1)); }

check_link() {
  local link="$1" target="$2" label="$3"
  if [ -L "$link" ] && [ "$(readlink "$link")" = "$target" ] && [ -e "$link" ]; then pass "$label"; else fail "$label ($link)"; fi
}

[ -s "${ROOT_DIR}/instructions/global.md" ] && pass 'canonical global instructions' || fail 'canonical global instructions'
check_link "${USER_HOME}/.codex/AGENTS.md" "${ROOT_DIR}/instructions/global.md" 'Codex global AGENTS.md adapter'
if [ -f "${USER_HOME}/.claude/CLAUDE.md" ] && grep -Fq "@${ROOT_DIR}/instructions/global.md" "${USER_HOME}/.claude/CLAUDE.md"; then pass 'Claude global instructions adapter'; else fail 'Claude global instructions adapter'; fi
check_link "${USER_HOME}/.copilot/copilot-instructions.md" "${ROOT_DIR}/instructions/global.md" 'Copilot global instructions adapter'
check_link "${USER_HOME}/.cursor/plugins/local/agentic-dotnet" "${ROOT_DIR}/adapters/cursor" 'Cursor global plugin adapter'
[ -s "${ROOT_DIR}/adapters/cursor/rules/global-dotnet.mdc" ] && pass 'Cursor generated .mdc rule' || fail 'Cursor generated .mdc rule'

broken=$(find "${USER_HOME}/.agents/skills" "${USER_HOME}/.claude/skills" "${USER_HOME}/.cursor/plugins/local" -type l ! -exec test -e {} \; -print 2>/dev/null)
[ -z "$broken" ] && pass 'no broken managed/global symlinks' || { warn "broken symlinks:\n$broken"; }

skill_link_failures=''
for skill_dir in "${ROOT_DIR}"/skills/*; do
  [ -d "$skill_dir" ] || continue
  skill_name=$(basename "$skill_dir")
  for link in "${USER_HOME}/.agents/skills/${skill_name}" "${USER_HOME}/.claude/skills/${skill_name}"; do
    if [ ! -L "$link" ] || [ "$(readlink "$link")" != "$skill_dir" ] || [ ! -e "$link" ]; then
      skill_link_failures="${skill_link_failures}${link}\n"
    fi
  done
done
[ -z "$skill_link_failures" ] && pass 'custom Agent Skills links' || fail "custom Agent Skills links:\n$skill_link_failures"

if command -v dotnet >/dev/null 2>&1; then
  sdks=$(dotnet --list-sdks 2>/dev/null)
  [ -n "$sdks" ] && pass "dotnet SDKs: $(printf '%s' "$sdks" | paste -sd ';' -)" || fail 'dotnet SDK discovery'
else warn 'dotnet executable unavailable'; fi

PLUGINS=()
while IFS= read -r plugin; do
  PLUGINS+=("$plugin")
done < <(awk '
  /^(core|standard|optional):/ { active=1; next }
  /^[A-Za-z_][A-Za-z0-9_-]*:/ { active=0 }
  active && /^[[:space:]]*-[[:space:]]+/ { sub(/^[[:space:]]*-[[:space:]]+/, ""); print }
' "${ROOT_DIR}/config/plugins.yaml")

if command -v codex >/dev/null 2>&1; then
  if command -v jq >/dev/null 2>&1; then
    codex_json=$(codex plugin list --available --json 2>/dev/null || printf '[]')
    for plugin in "${PLUGINS[@]}"; do
      printf '%s' "$codex_json" | jq -e --arg p "$plugin" '.installed[]? | select(.name==$p and .marketplaceName=="dotnet-agent-skills" and .installed==true and .enabled==true)' >/dev/null 2>&1 && pass "Codex plugin $plugin" || warn "Codex plugin not confirmed: $plugin"
    done
  else
    warn 'jq unavailable; Codex plugin status not parsed'
  fi
  codex mcp get microsoft-learn >/dev/null 2>&1 && pass 'Codex Microsoft Learn MCP' || warn 'Codex Microsoft Learn MCP'
else warn 'Codex not installed'; fi

if command -v claude >/dev/null 2>&1; then
  if command -v jq >/dev/null 2>&1; then
    claude_json=$(claude plugin list --json 2>/dev/null || printf '[]')
    for plugin in "${PLUGINS[@]}"; do
      printf '%s' "$claude_json" | jq -e --arg p "$plugin" '.[]? | select(.name==$p or .id==($p+"@dotnet-agent-skills"))' >/dev/null 2>&1 && pass "Claude plugin $plugin" || warn "Claude plugin not confirmed: $plugin"
    done
  else
    warn 'jq unavailable; Claude plugin status not parsed'
  fi
  claude mcp get microsoft-learn >/dev/null 2>&1 && pass 'Claude Microsoft Learn MCP' || warn 'Claude Microsoft Learn MCP'
else warn 'Claude Code not installed'; fi

if [ -d '/Applications/Cursor.app' ]; then
  for plugin in "${PLUGINS[@]}"; do
    [ -e "${USER_HOME}/.cursor/plugins/local/${plugin}" ] && pass "Cursor plugin $plugin" || warn "Cursor plugin missing: $plugin"
  done
  grep -Fq 'https://learn.microsoft.com/api/mcp' "${ROOT_DIR}/adapters/cursor/mcp.json" && pass 'Cursor Microsoft Learn MCP' || fail 'Cursor Microsoft Learn MCP'
else warn 'Cursor not installed'; fi

if command -v copilot >/dev/null 2>&1; then pass 'Copilot CLI installed'; else warn 'Copilot CLI unavailable (prepared config only)'; fi
grep -Fq 'https://learn.microsoft.com/api/mcp' "${ROOT_DIR}/adapters/copilot/mcp-config.json" && pass 'Copilot Microsoft Learn MCP adapter' || fail 'Copilot Microsoft Learn MCP adapter'

if [ -d "${USER_HOME}/.config/kilo" ]; then
  check_link "${USER_HOME}/.config/kilo/AGENTS.md" "${ROOT_DIR}/instructions/global.md" 'Kilo global AGENTS.md adapter'
  if [ -f "${USER_HOME}/.config/kilo/kilo.jsonc" ] && grep -Fq 'https://learn.microsoft.com/api/mcp' "${USER_HOME}/.config/kilo/kilo.jsonc"; then
    pass 'Kilo Microsoft Learn MCP'
  else
    warn 'Kilo Microsoft Learn MCP'
  fi
  for plugin in "${PLUGINS[@]}"; do
    [ -d "${USER_HOME}/.cache/agentic-dotnet/dotnet-skills/plugins/${plugin}/skills" ] && pass "Kilo official skills $plugin" || warn "Kilo official skills missing: $plugin"
  done
else
  warn 'Kilo not installed'
fi

if [ -n "$DEV_ROOT" ] && [ -d "$DEV_ROOT" ]; then
duplicates=$(find "$DEV_ROOT" \
  \( -type d \( -name .git -o -name bin -o -name obj -o -name node_modules -o -name packages -o -name vendor -o -name .venv -o -name venv -o -name worktrees \) -prune \) -o \
  \( -type f \( -path '*/.cursor/rules/*' -o -path '*/.agents/skills/*' -o -path '*/.claude/skills/*' -o -path '*/.codex/config.toml' -o -name '*.instructions.md' -o -path '*/.github/copilot-instructions.md' \) -print \) 2>/dev/null)
[ -z "$duplicates" ] && pass 'no known obsolete repository-level agent duplication' || warn "remaining repository agent configuration:\n$duplicates"

exact_global_duplicates=''
while IFS= read -r -d '' candidate; do
  if cmp -s "${ROOT_DIR}/instructions/global.md" "$candidate"; then
    exact_global_duplicates="${exact_global_duplicates}${candidate}\n"
  fi
done < <(find "$DEV_ROOT" \
  \( -type d \( -name .git -o -name bin -o -name obj -o -name node_modules -o -name packages -o -name vendor -o -name .venv -o -name venv -o -name worktrees \) -prune \) -o \
  \( -type f \( -name AGENTS.md -o -name CLAUDE.md -o -path '*/.github/copilot-instructions.md' \) -print0 \) 2>/dev/null)
[ -z "$exact_global_duplicates" ] && pass 'no copied canonical global instructions in repositories' || warn "copied canonical global instructions:\n$exact_global_duplicates"
else
  warn 'repository duplicate scan skipped (pass a development root to enable it)'
fi

printf '\nSummary: %s pass, %s warn, %s fail\n' "$PASS" "$WARN" "$FAIL"
[ "$FAIL" -eq 0 ]
