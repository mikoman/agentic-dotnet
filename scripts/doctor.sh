#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
command -v node >/dev/null 2>&1 || { printf 'FAIL Node.js 18 or later is required.\n' >&2; exit 1; }
exec node "${SCRIPT_DIR}/doctor.js" "$@"
