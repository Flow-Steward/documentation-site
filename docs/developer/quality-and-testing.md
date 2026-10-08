---
sidebar_position: 4
title: Quality And Testing
description: Developer quality gates, test commands, security checks, and SonarQube workflows.
---

# Quality And Testing

This page is for developers changing Flow Steward itself. User-facing docs
should explain how to run the product; this page explains how contributors prove
that platform changes are safe.

## Verification tiers and evidence reuse

Use `./core/entrypoints/cli/scripts/lint.sh` for repeatable local Docker checks.
When started on the host, the gate runs in the on-demand `fs-audit` container by
default so runtime containers stay lean.

Each check has exactly one owning tier in
`infra/tooling/quality/check-registry.json`. Higher tiers run their own delta;
they do not establish correctness by rerunning every lower-tier check. A result
may be reused only when its check ID, owner tier, input fingerprint, runtime
identity, status, and trust level match.

| Tier | Command or evidence | Owned work |
|---|---|---|
| 1 — iteration | Targeted regression/owner/consumer tests | `targeted-tests`; add specialized contract, database, security, frontend, workflow, or extension checks for the change. |
| 2 — intermediate commit | `lint.sh --fast` | Dependency audits, secret/Semgrep checks, environment artifacts, Python static checks, repository boundaries, frontend lint/build, and frontend SQL. |
| 3 — handoff/PR/merge | `lint.sh --full` | Refresh/validate exact-SHA Tier 2, then run the Tier 3 test delta and validate cumulative evidence; specialized Clone/runtime checks retain their registry contracts. |

Tiers 1–3 are local Docker gates. There is no Tier 4 or GitHub CI evidence
prerequisite; GitHub Actions are disabled. `--audit` is a compatibility alias
for the local Tier 3 gate. Additional deep checks can be selected explicitly
with `--checks`.

Evidence must remain bound to commit SHA, image digests, Compose project,
runtime identity, and environment; a later code or configuration change
invalidates it. Missing, corrupt, failed, incomplete, or infrastructure-failed
evidence is never reusable as a pass.

Use `--audit --with-sonar` only when local or external SonarQube is configured.
Optional ZAP also requires `FS_ZAP_TARGET_URL`.

## Targeted checks

Use targeted checks for short fix/verify loops:

```bash
./core/entrypoints/cli/scripts/lint.sh --checks semgrep
./core/entrypoints/cli/scripts/lint.sh --checks pip-audit,bandit
./core/entrypoints/cli/scripts/lint.sh --checks tests
./core/entrypoints/cli/scripts/lint.sh --checks frontend-workspace
```

Supported check names include `ruff`, `ruff-format`, `mypy`, `bandit`,
`pip-audit`, `semgrep`, `detect-secrets`, `ci-excludes`, `tests`,
`frontend-lint`, `frontend-test-build`, `frontend-audit`, `vulture`, `deptry`, `pylint-dup`,
`radon`, `xenon`, `frontend-sql`, `security-tests`, and `zap`.

## Git hooks and local gates

Install the configured pre-commit hook once per clone:

```bash
pre-commit install --hook-type pre-commit
```

The automatic pre-commit hooks synchronize environment artifacts, enforce the
repository boundary, and run the fast gate against the index. The full gate
hook is configured as a **manual** stage; run it explicitly. Do not infer a
pre-push full gate from this configuration. Run local gates for the exact
candidate SHA; do not wait for a GitHub Actions result.

## Backend tests

Run focused regression, owner, and consumer tests through the disposable
`fs-audit` gate, not a host Python interpreter:

```bash
./core/entrypoints/cli/scripts/lint.sh --checks targeted-tests \\
  --test-paths 'tests/unit/<owning-test>.py tests/integration/<consumer-test>.py'
```

The Tier 1 loop is fail-fast and collects no coverage. The full backend suite
does not fail fast: retain all failures and group them by root cause before
the next coherent fix batch.

The full gate runs unit tests with coverage and writes unit coverage artifacts
under `logs/coverage/unit/`.

## Frontend tests

The React product workspace lives under `assets/frontend/`. Use Docker checks:

```bash
./core/entrypoints/cli/scripts/lint.sh --checks frontend-lint
./core/entrypoints/cli/scripts/lint.sh --checks frontend-test-build
```

The full gate owns frontend tests; the fast gate owns frontend lint, build,
and dependency audit.
Do not install or run the frontend toolchain on the host for gate evidence.

## Isolated test runner

Use the dedicated `fs-test-runner` service for long E2E, UI, and workflow-matrix
packs so a backend restart does not kill the test process:

```bash
core/entrypoints/cli/scripts/run_test_runner.sh \
  python -m pytest tests/e2e/test_workflow_parallelism.py -q -rs
```

The wrapper runs the command in the `fs-test-runner` Compose service, which talks
to the live app at `http://fs-app:8099` by default.

## SonarQube

Local SonarQube uses the Compose `quality` profile and the lint wrapper. It is a
developer tool, not an `install.sh` subcommand sequence.

Useful Sonar commands:

```bash
./core/entrypoints/cli/scripts/lint.sh --sonar
./core/entrypoints/cli/scripts/lint.sh --sonar-js
./core/entrypoints/cli/scripts/lint.sh --sonar-py
./core/entrypoints/cli/scripts/lint.sh --sonar-full
./core/entrypoints/cli/scripts/lint.sh --sonar-issues
./core/entrypoints/cli/scripts/lint.sh --sonar-backlog
```

Set `SONAR_LOCAL=0` and `SONAR_HOST_URL` when using external SonarQube. Store
`SONAR_TOKEN` in `.env`; the lint wrapper auto-loads Sonar settings from the
active env file. Exports go to `SONAR_EXPORT_DIR`, defaulting to
`logs/quality/sonar`, and generated backlog Markdown defaults to
`logs/quality/sonar/sonar-dev-backlog.md`.

## CLI automation surface

The grouped CLI exposes quality and testing commands for automation:

```bash
./flow-steward quality release-gate
./flow-steward quality sonar-export-issues
./flow-steward quality sonar-generate-backlog
./flow-steward testing smoke-test
./flow-steward testing fuzz-api
./flow-steward testing fuzz-mcp
```

Use [CLI Reference](../reference/cli) for the command catalog.
