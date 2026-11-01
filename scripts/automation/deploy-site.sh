#!/usr/bin/env bash
set +x
set -euo pipefail

build_dir="${1:?provide the production build directory}"
revision="${2:?provide the exact documentation revision}"
known_hosts="${3:?provide the reviewed server host-key file}"
host="${DOCS_DEPLOY_HOST:?configure DOCS_DEPLOY_HOST}"
deploy_user="${DOCS_DEPLOY_USER:?configure DOCS_DEPLOY_USER}"
: "${DOCS_DEPLOY_SSH_KEY:?configure DOCS_DEPLOY_SSH_KEY}"

if [[ ! "$revision" =~ ^[a-f0-9]{40}$ || ! "$host" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ || ! "$deploy_user" =~ ^[a-z_][a-z0-9_-]*$ ]]; then
  echo 'invalid deployment identity' >&2
  exit 2
fi
if [[ ! -f "$build_dir/index.html" || ! -f "$build_dir/404.html" || ! -d "$build_dir/assets" || ! -s "$known_hosts" ]]; then
  echo 'missing production build or reviewed SSH host key' >&2
  exit 2
fi
if [[ -n "$(find "$build_dir" -type l -print -quit)" ]]; then
  echo 'production build may not contain a symlink' >&2
  exit 2
fi

umask 077
deploy_temp="$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/fs-docs-deploy.XXXXXX")"
trap 'rm -rf -- "$deploy_temp"' EXIT
printf '%s\n' "$DOCS_DEPLOY_SSH_KEY" > "$deploy_temp/key"
cp "$known_hosts" "$deploy_temp/known_hosts"
chmod 600 "$deploy_temp/key" "$deploy_temp/known_hosts"
ssh_args=(-i "$deploy_temp/key" -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$deploy_temp/known_hosts" -o BatchMode=yes -o ConnectTimeout=20)

# An unrestricted administrator key must fail before rsync is allowed to write.
target="$(ssh "${ssh_args[@]}" "$deploy_user@$host" verify-docs-target)"
if [[ "$target" != 'flow-steward-docs:/home/admin/docs-flowsteward/site' ]]; then
  echo 'SSH key does not use the expected restricted receiver' >&2
  exit 2
fi
printf '%s\n' "$revision" > "$build_dir/deployment-revision.txt"
printf -v transport '%q ' ssh "${ssh_args[@]}"
rsync --recursive --times --checksum --delay-updates --delete-delay --safe-links \
  --chmod=D755,F644 '--filter=P assets/***' "--rsh=$transport" \
  "$build_dir/" "$deploy_user@$host:./"

observed="$(curl --fail --silent --show-error --retry 3 --retry-delay 2 \
  https://docs.flowsteward.org/deployment-revision.txt)"
if [[ "$observed" != "$revision" ]]; then
  echo 'public site did not report the deployed documentation revision' >&2
  exit 1
fi
printf 'Published documentation revision %s to https://docs.flowsteward.org\n' "$revision"
