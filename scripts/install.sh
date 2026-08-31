#!/usr/bin/env bash
set -euo pipefail

USER_HOME="${HOME:?HOME is required}"
ROOT_DIR="${USER_HOME}/.agentic-dotnet"
PLUGIN_CONFIG="${ROOT_DIR}/config/plugins.yaml"
CACHE_ROOT="${USER_HOME}/.cache/agentic-dotnet"
DOTNET_SKILLS_CHECKOUT="${CACHE_ROOT}/dotnet-skills"

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

"${ROOT_DIR}/scripts/sync.sh"

if command -v codex >/dev/null 2>&1; then
  if ! codex plugin marketplace list 2>/dev/null | awk '{print $1}' | grep -qx 'dotnet-agent-skills'; then
    note 'adding dotnet/skills marketplace to Codex'
    codex plugin marketplace add dotnet/skills
  fi
  for plugin in "${PLUGINS[@]}"; do
    if codex plugin list --available --json 2>/dev/null | jq -e --arg plugin "$plugin" '.installed[]? | select(.name==$plugin and .marketplaceName=="dotnet-agent-skills" and .installed==true and .enabled==true)' >/dev/null; then
      note "Codex already has $plugin"
    else
      note "installing $plugin for Codex"
      codex plugin add "${plugin}@dotnet-agent-skills" || warn "Codex plugin failed: $plugin"
    fi
  done
  if ! codex mcp get microsoft-learn >/dev/null 2>&1; then
    note 'adding Microsoft Learn MCP to Codex'
    codex mcp add microsoft-learn --url https://learn.microsoft.com/api/mcp || warn 'Codex Microsoft Learn MCP setup failed'
  fi
else
  warn 'Codex is not installed'
fi

if command -v claude >/dev/null 2>&1; then
  if ! claude plugin marketplace list 2>/dev/null | grep -q 'dotnet-agent-skills'; then
    note 'adding dotnet/skills marketplace to Claude Code'
    claude plugin marketplace add --scope user dotnet/skills
  fi
  for plugin in "${PLUGINS[@]}"; do
    if claude plugin list --json 2>/dev/null | jq -e --arg plugin "$plugin" '.[]? | select((.name==$plugin or .id==($plugin+"@dotnet-agent-skills")) and (.enabled != false))' >/dev/null; then
      note "Claude already has $plugin"
    else
      note "installing $plugin for Claude Code"
      claude plugin install --scope user --yes "${plugin}@dotnet-agent-skills" || warn "Claude plugin failed: $plugin"
    fi
  done
  if ! claude mcp get microsoft-learn >/dev/null 2>&1; then
    note 'adding Microsoft Learn MCP to Claude Code'
    claude mcp add --scope user --transport http microsoft-learn https://learn.microsoft.com/api/mcp || warn 'Claude Microsoft Learn MCP setup failed'
  fi
else
  warn 'Claude Code is not installed'
fi

if [ -d '/Applications/Cursor.app' ] || command -v cursor-agent >/dev/null 2>&1; then
  mkdir -p "$CACHE_ROOT" "${USER_HOME}/.cursor/plugins/local"
  if [ ! -d "${DOTNET_SKILLS_CHECKOUT}/.git" ]; then
    note 'cloning official dotnet/skills cache for Cursor local plugins'
    git clone --depth 1 https://github.com/dotnet/skills.git "$DOTNET_SKILLS_CHECKOUT"
  elif git -C "$DOTNET_SKILLS_CHECKOUT" diff --quiet && git -C "$DOTNET_SKILLS_CHECKOUT" diff --cached --quiet; then
    note 'updating official dotnet/skills cache for Cursor'
    git -C "$DOTNET_SKILLS_CHECKOUT" pull --ff-only
  else
    warn "Cursor dotnet/skills cache is dirty; not updating: $DOTNET_SKILLS_CHECKOUT"
  fi
  for plugin in "${PLUGINS[@]}"; do
    source_path="${DOTNET_SKILLS_CHECKOUT}/plugins/${plugin}"
    link_path="${USER_HOME}/.cursor/plugins/local/${plugin}"
    if [ ! -d "$source_path" ]; then warn "official plugin missing: $plugin"; continue; fi
    if [ -L "$link_path" ]; then
      [ "$(readlink "$link_path")" = "$source_path" ] || { rm "$link_path"; ln -s "$source_path" "$link_path"; }
    elif [ -e "$link_path" ]; then
      warn "Cursor local plugin path already exists: $link_path"
    else
      ln -s "$source_path" "$link_path"
    fi
    note "Cursor local plugin ready: $plugin"
  done
else
  warn 'Cursor is not installed'
fi

if command -v copilot >/dev/null 2>&1; then
  note 'Copilot CLI detected; install official plugins interactively from dotnet/skills if required by this CLI version'
else
  warn 'Copilot CLI is not installed; global instructions, shared skills path, and Microsoft Learn MCP config are prepared'
fi

note 'installation pass complete'
