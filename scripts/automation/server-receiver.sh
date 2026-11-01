#!/usr/bin/env bash
# Install outside site/; this file is the deploy key's SSH forced command.
set -euo pipefail
case "${SSH_ORIGINAL_COMMAND:-}" in
  verify-docs-target)
    printf '%s\n' 'flow-steward-docs:/home/admin/docs-flowsteward/site'
    ;;
  'rsync --server '*)
    exec /usr/bin/rrsync -wo -munge /home/admin/docs-flowsteward/site
    ;;
  *)
    echo 'Only the restricted documentation receiver is available' >&2
    exit 126
    ;;
esac
