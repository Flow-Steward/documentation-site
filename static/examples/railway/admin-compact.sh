#!/usr/bin/env bash
# Run the packaged Flow Steward CLI inside a linked Railway Compact service.
# Requires Railway CLI access and a Railway-registered local SSH key.
set -euo pipefail

command -v railway >/dev/null || {
  printf 'Railway CLI is required.\n' >&2
  exit 127
}

remote_python=$(cat <<'PY'
import json
import os
import sys
from pathlib import Path

from core.infrastructure.runtime.compact.runtime_secrets import self_minted_secret_names

state_path = Path('/data/state/runtime-secrets.json')
try:
    state = json.loads(state_path.read_text(encoding='utf-8'))
except (OSError, ValueError) as exc:
    raise SystemExit(f'Compact runtime secret state is unavailable: {type(exc).__name__}')
if state.get('version') != 1 or not isinstance(state.get('minted'), dict):
    raise SystemExit('Compact runtime secret state has an unsupported format')

for name in self_minted_secret_names():
    if os.environ.get(name):
        continue
    value = state['minted'].get(name)
    if not isinstance(value, str) or not value:
        raise SystemExit(f'Compact runtime secret is unavailable: {name}')
    os.environ[name] = value

from core.entrypoints.cli.click_app import _runtime, click_app
from core.entrypoints.cli.compact_platform_runtime import CompactPlatformRuntime

_runtime._runtime = CompactPlatformRuntime()
click_app.main(args=sys.argv[1:] or ['--help'], prog_name='flow-steward')
PY
)
remote_payload=$(printf '%s' "$remote_python" | base64 | tr -d '\n')
remote_entrypoint="exec(__import__('base64').b64decode('$remote_payload'))"

railway_args=(ssh --service "${FS_RAILWAY_SERVICE:-compact}")
if [[ -n "${FS_RAILWAY_PROJECT:-}" ]]; then
  railway_args+=(--project "$FS_RAILWAY_PROJECT")
fi
if [[ -n "${FS_RAILWAY_ENVIRONMENT:-}" ]]; then
  railway_args+=(--environment "$FS_RAILWAY_ENVIRONMENT")
fi
if [[ -n "${FS_RAILWAY_IDENTITY_FILE:-}" ]]; then
  railway_args+=(--identity-file "$FS_RAILWAY_IDENTITY_FILE")
fi

# Railway SSH joins command arguments into a remote shell command. Quote each
# argument before handing it to Railway so flags and user-supplied values keep
# their boundaries and are not interpreted by the remote shell.
printf -v remote_shell '%q ' python -c "$remote_entrypoint" "$@"
exec railway "${railway_args[@]}" -- "$remote_shell"
