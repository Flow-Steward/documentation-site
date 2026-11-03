---
sidebar_position: 1
title: Local Development
description: Common commands for developing Flow Steward locally.
---

# Local Development

Use the Flow Steward application repository for these commands. This page
describes the reviewed source on main; it does not establish availability in a
published release.

This page is for contributors changing Flow Steward code. Operators installing
or updating a stack should use
[Installation And Updates](../user/installation-and-updates). For the whole
contribution sequence, from the issue to a merged pull request, see
[Contributing Code](contributing).

## Install the Development environment

Develop on a Development installation, never on a production one. From a full
clone of the application repository, explicitly select the Scalable topology;
Compact is production-only:

```bash
./install.sh --environment development --deployment-profile scalable --file-storage bundled
./flow-steward status
./flow-steward doctor
```

Development is one complete preset: the core plus the frontend, and the
`fs-test-runner` and `fs-audit` containers kept ready for tests and quality
gates. Mailpit and SonarQube are available on demand. The container workflow
requires Docker with Compose v2, a Bash/POSIX shell environment, and standard
POSIX utilities. Run the installer as a non-root deployment owner with Docker
access. On Windows, use Git Bash or WSL. The quality gates and tests run in
containers.

Check or change the installed environment with:

```bash
./flow-steward environment show
./flow-steward environment switch development
```

The environment switch preserves the installed release and does not change the
deployment topology; use a Scalable installation for Development.

With `pre-commit` available on the host, install the hook once per clone. The
configured hooks synchronize environment artifacts, check the repository
boundary, and run Tier 1 affected backend and frontend tests against `HEAD`:

```bash
pre-commit install --hook-type pre-commit
```

## Installer vs development Compose

`./install.sh` is the installation/resume entrypoint; it does not expose
`configure` or `up` subcommands. Contributors should use the direct Compose
helpers below when actively debugging Compose,
working on frontend hot reload, running test packs, or iterating on service
configuration. Keep production-like setup instructions in the Deploy & Run lane,
not in developer workflow notes.

## Compose helpers

The helpers below use the `flow-steward` Compose project name. Use them for the
local Scalable development stack.

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

Start the development stack with frontend hot reload:

```bash
FS_AUTO_RELOAD=1 fs-compose-dev --profile development up -d --build
```

The development override is a thin compatibility layer that defaults
`FS_MCP_AUTH_DISABLED` to `1` for `fs-app` and `fs-mcp`. The frontend service and
its reload setting live in the base Compose file.

## CLI

From the development host:

```bash
./flow-steward --help
```

The launcher requires Docker and delegates management commands to the managed
CLI runtime. Do not invoke it inside `fs-app`.

## Installer and build image overrides

These are local contributor controls, not production runtime settings:

| Variable | Default | Contract |
|---|---|---|
| `FS_INSTALLER_IMAGE` | `flow-steward-installer:local` | Exact local installer-bootstrap image used by `install.sh`; a pinned SHA-256 image ID is reused without rebuilding. |
| `FS_INSTALLER_USE_HOST_PYTHON` | `0` | Development-only escape hatch. Exactly `1` runs installer bootstrap through host Python; all other values use Docker. Use only with the pinned application dependencies available. |

`FS_FRONTEND_BUILD_IMAGE` is a manifest-only name at this revision: no
implementation reader or owning shipped build command was found. Do not expect
setting it to change a frontend build. The development Compose target uses the
Dockerfile's fixed Node base, while `FS_FRONTEND_IMAGE` names the resulting
service image; these are distinct contracts.

Set a supported installer override before invoking `install.sh`. It affects
that next invocation and does not reconfigure running application services.

## Frontend

Set `FS_AUTO_RELOAD=1` and enable the `development` profile to start
`fs-frontend` with Vite HMR on host
`http://localhost:${FRONTEND_HOST_PORT:-15173}/app/` (container port `5173`).
Without the reload setting, the frontend container remains idle.

The backend startup script supports `uvicorn --reload` when
`FS_AUTO_RELOAD=1` reaches its container environment. At this revision, the base
and development Compose files forward this variable only to `fs-frontend`;
the command above does not enable backend reload. Backend reload requires an
explicit local Compose override supplying `FS_AUTO_RELOAD=1` to `fs-app`.

There is no `fs-tailwind` service in the pinned Compose contract.

Frontend workspace commands, when Node and npm are available in your shell:

```bash
cd assets/frontend
npm ci
npm run lint
npm run test
npm run build
npm run test:e2e
```

For the container workflow, use the registered frontend quality checks below
and the checks described in [Quality And Testing](quality-and-testing).

## Test runner

Run focused regression, owner, and consumer tests through the registered Tier 1
Docker check. `auto` selects tests from your diff against `main` (`auto:<ref>`
for another base); add by path what the import graph cannot see. Do not copy a
historical E2E filename from documentation.

```bash
./core/entrypoints/cli/scripts/lint.sh --checks targeted-tests \
  --test-paths 'auto tests/unit/<regression-test>.py'
./core/entrypoints/cli/scripts/lint.sh --checks frontend-targeted-tests --test-paths auto
```

Frontend automatic selection uses Vitest's related-test graph. To select
frontend targets explicitly, pass existing `src/` paths relative to
`assets/frontend`; do not combine those paths with `auto` in the frontend
check.

For a long current E2E or UI pack, use the dedicated
`core/entrypoints/cli/scripts/run_test_runner.sh` wrapper only after confirming
the pack still exists in the checkout. It runs the supplied command in
`fs-test-runner`, targeting the live app at `http://fs-app:8099` by default.
The canonical selection and evidence rules live in the repository's `AGENTS.md`
and `docs/standards/testing-standard.md`; see
[Quality And Testing](quality-and-testing) for contributor-facing examples.

## Quality gate

See [Quality And Testing](quality-and-testing) for the full gate matrix,
targeted checks, CI behavior, security scans, and SonarQube workflow.

Tier 1 focused fix loop:

```bash
./core/entrypoints/cli/scripts/lint.sh --checks targeted-tests \
  --test-paths 'auto tests/unit/<regression-test>.py'
```

Tier 2 intermediate gate:

```bash
./core/entrypoints/cli/scripts/lint.sh --fast
```

Final local gate from the final committed state. The wrapper refreshes or
reuses Tier 2 evidence for the same commit SHA, runs the Tier 3 delta, and
validates cumulative evidence:

```bash
./core/entrypoints/cli/scripts/lint.sh --full
```

`--audit` is a compatibility alias for that same final gate, not a separate
production-readiness, CI, or Tier 4 audit:

```bash
./core/entrypoints/cli/scripts/lint.sh --audit
```
