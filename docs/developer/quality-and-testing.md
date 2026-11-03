---
sidebar_position: 4
title: Quality And Testing
description: Developer quality gates, test commands, security checks, and SonarQube workflows.
---

# Quality And Testing

This page is for developers changing Flow Steward itself. User-facing docs
should explain how to run the product; this page explains how contributors prove
that platform changes are safe. [Contributing Code](contributing) shows where
each tier fits in a pull request.

The behavior below describes the current public source on main; it does not
establish that a release containing it has been published.

## Verification tiers and evidence reuse

Use `./core/entrypoints/cli/scripts/lint.sh` for repeatable local Docker checks.
When started on the host, the gate runs in the on-demand `fs-audit` container by
default so runtime containers stay lean.

Each registered check has exactly one owning tier in
`infra/tooling/quality/check-registry.json`. Higher tiers run their own delta;
they do not establish correctness by rerunning every lower-tier check. A result
may be reused only when its check ID, owner tier, fingerprint, status, commit
scope, and required trust policy match.

| Tier | Command or evidence | Owned work |
|---|---|---|
| 1 — iteration | Targeted regression/owner/consumer tests | `targeted-tests`, `frontend-targeted-tests`; add specialized contract, database, security, frontend, workflow, or extension checks for the change. |
| 2 — intermediate commit | `lint.sh --fast` | Dependency audits, secret/Semgrep checks, environment artifacts, Python static checks, repository boundaries, frontend lint/build, and frontend SQL. |
| 3 — handoff/PR/merge | `lint.sh --full` | Refresh/validate Tier 2 for the exact candidate SHA, then run the Tier 3 test delta, external Tier 3 checks, and cumulative evidence validation. |

Tiers 1–3 can run locally in Docker; the registry has no Tier 4. The public
source also defines hosted quality and image-publication workflows in
`.github/workflows/remote-quality.yml` and `.github/workflows/release-images.yml`.
Their presence does not establish whether GitHub Actions is enabled remotely or
whether a particular run passed. `--audit` is a compatibility alias for the
local Tier 3 gate. Additional deep checks can be selected explicitly with
`--checks`.

The full gate requires a clean committed candidate. Evidence fingerprints bind
checks to their declared inputs, gate/toolchain definitions, and applicable
runtime inputs. Checks with the default `reuse_scope: "commit"` require the
same commit SHA. Checks declaring `reuse_scope: "inputs"` may reuse a pass
across commits when their fingerprint still matches; an unrelated edit does
not automatically invalidate those results. Missing, corrupt, failed,
incomplete, or infrastructure-failed evidence is never reusable as a pass.
Local evidence does not satisfy a policy requiring `trusted_ci` evidence.

Use `--audit --with-sonar` only when local or external SonarQube is configured.
Optional ZAP also requires `FS_ZAP_TARGET_URL`.

## Format before testing

After each coherent edit batch and before Tier 1 tests, format only the files
you changed and inspect the diff. Do not run repository-wide formatting for a
scoped change.

```bash
python -m ruff check --fix <changed-python-files>
python -m ruff format <changed-python-files>

cd assets/frontend
npx --no-install eslint --fix <changed-ts-or-tsx-files>
```

## Targeted checks

Use targeted checks for short fix/verify loops:

```bash
./core/entrypoints/cli/scripts/lint.sh --checks semgrep
./core/entrypoints/cli/scripts/lint.sh --checks pip-audit,bandit
./core/entrypoints/cli/scripts/lint.sh --checks tests
./core/entrypoints/cli/scripts/lint.sh --checks frontend-workspace
```

The registered checks and their owning tiers are listed in
`infra/tooling/quality/check-registry.json`. Tier 1: `targeted-tests`,
`frontend-targeted-tests`, `extension-static`, `extension-tests`,
`compact-p1-routing`, `compact-process-runtime`, `compact-p2-bootstrap`,
`compact-p3-extension-invocation`. Tier 2:
`pip-audit`, `frontend-audit`, `detect-secrets`, `semgrep`, `sonar-size`,
`env-artifacts`, `ruff`, `ruff-format`, `mypy`, `bandit`, `ci-excludes`,
`provider-neutral-core`, `repository-boundary`, `ui-i18n`, `frontend-lint`,
`frontend-build`, `frontend-sql`. Tier 3: `backend-tests`, `frontend-tests`,
`runtime-heartbeat-cross-profile`, `extension-oauth-browser`,
`quality-evidence-mixed-uid`, `clone-volume-disposable`. Entries marked
`execution: "external"` use separate orchestration; the host full gate runs
the external Tier 3 checks before cumulative validation. Additional audit
checks such as `vulture`, `deptry`, `pylint-dup`, `radon`, `xenon`,
`security-tests` and `zap` can be selected explicitly with `--checks`.

## Git hooks and local gates

Install the configured pre-commit hook once per clone:

```bash
pre-commit install --hook-type pre-commit
```

The automatic pre-commit hooks synchronize environment artifacts, enforce the
repository boundary, and run targeted backend and frontend tests with
`--test-paths auto:HEAD`. They do not run the fast gate. The full gate hook is
configured as a **manual** stage; run it explicitly. Do not infer a pre-push
full gate from this configuration. Run local gates for the exact candidate SHA;
a hook pass alone is not cumulative Tier 2 and Tier 3 evidence.

## Backend tests

Run focused regression, owner, and consumer tests through the disposable
`fs-audit` gate, not a host Python interpreter:

```bash
./core/entrypoints/cli/scripts/lint.sh --checks targeted-tests \
  --test-paths 'auto tests/unit/<regression-test>.py tests/integration/<consumer-test>.py'
```

`auto` derives impacted unit tests from the diff against the merge base with
`main` (`auto:<ref>` for another base), including staged, unstaged, and
untracked files. It selects changed unit tests, unit tests that import a
changed module or one of its direct importers, unit tests that name a changed
non-Python file, and unit tests under a changed unit-test `conftest.py`.
Automatic selection excludes `tests/unit/stress/`. Add explicit paths for
integration, runtime, database, extension, or other tests the selection cannot
see. A bug fix starts with a regression test that fails before the fix.

The Tier 1 loop is fail-fast and collects no coverage. The full backend suite
does not fail fast: retain all failures and group them by root cause before
the next coherent fix batch.

The full gate runs unit tests with coverage and writes unit coverage artifacts
under `logs/coverage/unit/`.

## Frontend tests

The React product workspace lives under `assets/frontend/`. Use Docker checks:

```bash
./core/entrypoints/cli/scripts/lint.sh --checks frontend-targeted-tests --test-paths auto
./core/entrypoints/cli/scripts/lint.sh --checks frontend-lint
./core/entrypoints/cli/scripts/lint.sh --checks frontend-build
```

With `--test-paths auto`, `frontend-targeted-tests` passes changed files under
`assets/frontend/src/` to `vitest related`, which follows direct and indirect
imports to affected tests. Use `auto:<ref>` for another merge-base reference.
Explicit targets are existing `src/` paths relative to `assets/frontend/` and
run with `vitest run`. Targeted runs are fail-fast and disable coverage.

The full gate owns frontend tests; the fast gate owns frontend lint, build,
and dependency audit.
Do not install or run the frontend toolchain on the host for gate evidence.

## Extension checkouts

A standalone extension repository is checked by the same gate, from the
application checkout, with an absolute path to the extension checkout:

```bash
./core/entrypoints/cli/scripts/lint.sh --checks extension-static,extension-tests \
  --extension-root /abs/path/to/extension-checkout
```

`extension-static` runs `scripts/validate_bundle.py` when present, compile,
ruff, ruff format, mypy and bandit. Compile and mypy include tests and scripts
when present; ruff checks the checkout, while bandit scans runtime modules.
`extension-tests` validates the manifest and runs the extension's tests in a
virtual environment installed offline from its `dev-wheels/` and `wheels/`.
Both stages require the bundle's `requirements-dev.txt`; dependency auditing
with `pip-audit` is not part of these checks. Selected `--test-paths`, relative
to the extension root, run fail-fast; without a selection the suite runs to
the end. The checkout is copied into the container, so commit first and cite
that commit. `--fast` and `--full` never select these checks: a green core gate
is not extension evidence. See [Publish an Extension](publish-extension).

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
`SONAR_TOKEN` in the active env file; the lint wrapper auto-loads Sonar settings
from that file. Every scan first runs the `sonar-size` precheck and stops if it
fails. Exports go to `SONAR_EXPORT_DIR`, defaulting to
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

`quality release-gate` validates retained Tier 2 and Tier 3 evidence against a
clean committed candidate; use `lint.sh --full` to execute the cumulative gate.
These CLI commands use the review/confirmation flow. For noninteractive use,
supply the required command inputs and `--confirm`.

Use [CLI Reference](../reference/cli) for the command catalog.
