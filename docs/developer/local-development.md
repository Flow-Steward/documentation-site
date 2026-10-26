---
sidebar_position: 1
title: Local Development
description: Common commands for developing Flow Steward locally.
---

# Local Development

Use the Flow Steward application repository for these commands.

This page is for contributors changing Flow Steward code. Operators installing
or updating a stack should use
[Installation And Updates](../user/installation-and-updates). For the whole
contribution sequence, from the issue to a merged pull request, see
[Contributing Code](contributing).

## Install the Development environment

Develop on a Development installation, never on a production one. From a full
clone of the application repository:

```bash
./install.sh --environment development --file-storage bundled
./flow-steward status
./flow-steward doctor
```

Development is one complete preset: the core plus the frontend, and the
`fs-test-runner` and `fs-audit` containers kept ready for tests and quality
gates. Mailpit and SonarQube are available on demand. Docker with Compose v2 is
the only host requirement; the quality gates and tests run in containers.

Check or change the installed environment with:

```bash
./flow-steward environment show
./flow-steward environment switch development
```

Install the pre-commit hook once per clone; it runs the Tier 2 gate before each
commit:

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
FS_AUTO_RELOAD=1 fs-compose-dev --profile development up -d --build
```

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

Set `FS_AUTO_RELOAD=1` and enable the `development` profile. This starts:

- `fs-app` with `uvicorn --reload`
- `fs-frontend` with Vite HMR on host
  `http://localhost:${FRONTEND_HOST_PORT:-15173}/app/` (container port `5173`).

There is no `fs-tailwind` service in the pinned Compose contract.

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

Run focused regression, owner, and consumer tests through the registered Tier 1
Docker check. `auto` selects tests from your diff against `main` (`auto:<ref>`
for another base); add by path what the import graph cannot see. Do not copy a
historical E2E filename from documentation.

```bash
./core/entrypoints/cli/scripts/lint.sh --checks targeted-tests \
  --test-paths 'auto tests/unit/<regression-test>.py'
./core/entrypoints/cli/scripts/lint.sh --checks frontend-targeted-tests --test-paths auto
```

For a long current E2E or UI pack, use the dedicated `fs-test-runner` wrapper
only after confirming the pack still exists in the checkout. The canonical
selection and evidence rules live in the repository's `AGENTS.md` and
`docs/standards/testing-standard.md`; see
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

Tier 3 final local gate:

```bash
./core/entrypoints/cli/scripts/lint.sh --full
```

`--audit` is a compatibility alias for the same Tier 3 gate, not a separate
production-readiness, CI, or Tier 4 audit:

```bash
./core/entrypoints/cli/scripts/lint.sh --audit
```
