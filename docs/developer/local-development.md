---
sidebar_position: 1
title: Local Development
description: Common commands for developing Flow Steward locally.
---

# Local Development

Use the Flow Steward application repository for these commands.

## Compose helpers

The canonical Compose project name is `flow-steward`.

```bash
fs-compose() {
  docker compose -p flow-steward -f infra/docker/docker-compose.yaml "$@"
}

fs-compose-dev() {
  docker compose -p flow-steward \
    -f infra/docker/docker-compose.yaml \
    -f infra/docker/docker-compose.dev.yaml "$@"
}
```

Start the standard stack:

```bash
fs-compose up -d --build
```

Start the development stack:

```bash
fs-compose-dev up -d --build
```

## CLI

Host virtualenv:

```bash
.venv/bin/python -m core.entrypoints.cli --help
```

Docker app container:

```bash
fs-compose exec fs-app python -m core.entrypoints.cli --help
```

## Frontend

Set `FS_AUTO_RELOAD=1` in `.env`, then rebuild the stack. This starts:

- `fs-app` with `uvicorn --reload`
- `fs-frontend` with Vite HMR at `http://localhost:5173/app/`
- `fs-tailwind` to keep generated Tailwind CSS fresh for legacy templates

Frontend workspace commands:

```bash
cd assets/frontend
npm ci
npm run lint
npm run test
npm run build
npm run test:e2e
```

## Test runner

Use the dedicated runner for long E2E, UI, and workflow-matrix packs:

```bash
fs-compose run --rm -T fs-test-runner \
  python -m pytest tests/e2e/test_workflow_matrix.py -q -rs
```

Convenience wrapper:

```bash
core/entrypoints/cli/scripts/run_test_runner.sh \
  python -m pytest tests/e2e/test_workflow_matrix.py -q -rs
```

## Quality gate

Fast local iteration:

```bash
./core/entrypoints/cli/scripts/lint.sh --fast
```

Full quality and security gate:

```bash
./core/entrypoints/cli/scripts/lint.sh
```

Deep production-readiness audit:

```bash
./core/entrypoints/cli/scripts/lint.sh --audit
```
