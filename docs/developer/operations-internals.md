---
sidebar_position: 5
title: Operations Internals
description: Runtime files, logs, backups, retention jobs, prompt debug logs, and local operational paths.
---

# Operations Internals

This page is for developers and operators who need the technical runtime
boundaries behind Flow Steward operations. The User Guide explains what to do in
the UI; this page explains where operational evidence lives and which scripts
own it.

## Runtime directories

Scalable production Compose mounts host-visible mutable state into the app
containers as shown below. Compact uses its `/data` volume instead, including
`/data/extensions` and role logs under `/data/logs/<role>`. See
[Deployment Architecture](../deploy/architecture) before using a path in an
operator procedure.
Keep these directories outside the versioned image so upgrades can replace code
without deleting operator data.

| Env variable | Container path or purpose | Default example |
|---|---|---|
| `FS_EXTENSIONS_DIR` | Mounted to `/app/extensions` for self-hosted extensions. | `../../extensions` |
| `FS_LOGS_DIR` | Mounted to `/app/logs` for runtime logs and generated evidence. | `../../logs` |
| `FS_BACKUPS_DIR` | Installer manifest host path; current backup scripts resolve `${FS_ARTIFACT_ROOT:-repository}/backups`. | `../../backups` |
| `FS_DB_SCHEMA_DIR` | Mounted into Postgres init scripts. | `../../db/schema` |
| `FS_ARTIFACT_ROOT` | Root used by scheduled ops scripts for `logs/` and `backups/`. | repo root when unset |

Generated development and audit artifacts are intentionally routed under
`logs/`, including `logs/quality/`, `logs/coverage/`, `logs/health/`,
`logs/runtime/`, `logs/workspaces/`, and `logs/tool-cache/`.

## Runtime logging

Long-running services use shared runtime logging with stderr plus an optional
daily file sink.

| Variable | Purpose |
|---|---|
| `FS_LOG_LEVEL` | Default runtime log level. |
| `FS_LOG_FILE_LEVEL` | File sink log level. |
| `FS_LOG_STDERR_LEVEL` | Stderr sink log level. |
| `FS_LOG_FORMAT` | `text` or `json`. |
| `FS_LOG_DIR` | In-container runtime log directory, default `/app/logs` in ops templates. |
| `FS_LOG_FILE_BASENAME` | Daily log file basename, default `platform`. |
| `FS_SERVICE_NAME` | Service label attached to runtime records. |
| `FS_LOG_FILE_ENABLED` | Enables daily file sink. |
| `FS_LOG_STDERR_ENABLED` | Enables stderr sink. |
| `FS_LOG_RETENTION_DAYS` | Deletes old daily log files after the retention window. |
| `FS_LOG_CAPTURE_WARNINGS` | Routes Python warnings into logging. |
| `FS_LOG_UTC` | Uses UTC timestamps for runtime logs. |

Daily file names follow `<basename>-YYYY-MM-DD.log`, for example
`platform-2026-06-16.log`.

Job evidence is not only file-based. Job logs, messages, events, runtime journal,
errors, approvals, artifacts, cost, and incident records are persisted through
the platform database and exposed through UI, CLI, API, and MCP surfaces.

## Sentry

Sentry is optional production observability for runtime exceptions, error-level
logs, traces, and profiling samples. If `SENTRY_DSN` is empty, initialization is
skipped and the process continues normally.

Sentry is initialized in the FastAPI app, worker, control-plane, worker manager,
and MCP server paths. Runtime records are tagged with a `component` value such
as `serve`, `worker`, `control`, `worker_manager`, or `mcp_server`.

| Variable | Purpose |
|---|---|
| `SENTRY_DSN` | Backend/runtime Sentry DSN. |
| `SENTRY_ENVIRONMENT` | Environment label; falls back to `ENVIRONMENT` when unset. |
| `SENTRY_RELEASE` | Release identifier attached to events. |
| `SENTRY_TRACES_SAMPLE_RATE` | Backend trace sample rate. Defaults to `0.0`. |
| `SENTRY_PROFILES_SAMPLE_RATE` | Backend profiling sample rate. Defaults to `0.0`. |
| `SENTRY_SEND_DEFAULT_PII` | Whether Sentry may send default PII. Keep `0` unless explicitly approved. |
| `SENTRY_AUTO_ENABLING_INTEGRATIONS` | Lets Sentry auto-enable integrations. Defaults to `0`. |

This release initializes no browser Sentry SDK or browser tracing; the backend
integration remains supported.

The runtime adds logging integration with `event_level=ERROR`. FastAPI and
Starlette integrations are used for the app process when available.

## Prometheus metrics

Flow Steward exposes Prometheus-compatible text metrics from the app and from
long-running process exporters. The table below describes Scalable defaults.
Compact allocates worker exporters from port `9200 + worker_index` inside its
runtime rather than using the Scalable worker default universally.

| Surface | Path | Default port |
|---|---|---|
| App/API metrics | `/metrics` on the app HTTP service | Same as app port |
| Worker process metrics | `/metrics` | `FS_WORKER_METRICS_PORT`, default `9101` |
| Control-plane process metrics | `/metrics` | `FS_CONTROL_METRICS_PORT`, default `9102` |
| Process liveness | `/health/live` on worker/control exporters | Same exporter port |

`FS_PROCESS_METRICS_HOST` controls the exporter bind host. Worker and control
exporters must be reachable through the deployment's private network or configured
collector route. No MCP process metrics server is started in this release.

Set `FS_METRICS_TOKEN` in production to require either:

- `x-metrics-token: <token>`
- `Authorization: Bearer <token>`

When the token is empty, `/metrics` is reachable without a metrics-specific
token. Use network policy, reverse proxy rules, or the token for production
hardening.

The app `/metrics` payload includes readiness, readiness checks, total projects,
jobs by status, active project leases, ready queue depth, and 24-hour SLO values
such as p95 latency, retry rate, dead-letter rate, stuck jobs, and per-agent
failure rate. Process exporters add process liveness, process info, start time,
thread count, CPU time, and component-specific worker/control metrics.

## Backups and restore

The built-in backup is PostgreSQL-only; it is not a full installation backup.
Restore drops and recreates an explicitly confirmed target database, repairs the
AGE graph catalog, and leaves writer services stopped. The helper requires both
`--target-compose-project '<exact-project>'` and `--confirm`; parity capture and
verification also require `--confirm` where documented. Continue only after the
helper reports `[restore] done`.

Do not keep a second abbreviated restore recipe here. Follow the canonical
[Backups And Restore runbook](../deploy/backups-and-restore) for container-based
decryption, preflight, maintenance, writer shutdown, target replacement, parity
evidence, and restart checks.

## Scheduled ops wrapper

`core/entrypoints/cli/scripts/ops_schedule.sh` runs recurring maintenance tasks
and writes rolling plus per-run logs under `logs/runtime/`.

```bash
core/entrypoints/cli/scripts/ops_schedule.sh backup
core/entrypoints/cli/scripts/ops_schedule.sh retention
core/entrypoints/cli/scripts/ops_schedule.sh health
core/entrypoints/cli/scripts/ops_schedule.sh workspace-prune
core/entrypoints/cli/scripts/ops_schedule.sh all
```

It writes:

| Output | Purpose |
|---|---|
| `backups/flow_steward_<timestamp>.dump.enc` | Scheduled PostgreSQL backup. |
| `logs/runtime/backup.log` | Rolling backup task log. |
| `logs/runtime/retention.log` | Rolling retention cleanup log. |
| `logs/runtime/health.log` | Rolling health snapshot log. |
| `logs/runtime/workspace_prune.log` | Rolling workspace prune log. |
| `logs/health/health_<timestamp>.json` | Health snapshot output. |

## Retention cleanup

Retention cleanup removes old records from observability and lifecycle tables.
Use dry-run first:

```bash
python -m core.application.tooling.ops.retention_cleanup --dry-run
```

Override windows when needed:

```bash
python -m core.application.tooling.ops.retention_cleanup \
  --jobs-days 14 \
  --job-logs-days 21 \
  --action-logs-days 30 \
  --events-days 30 \
  --retry-queue-days 14 \
  --trash-days 30 \
  --terminal-job-checkpoints-days 30
```

Defaults come from account retention settings and these deployment variables:
`FS_RETENTION_JOBS_DAYS`, `FS_RETENTION_MESSAGES_DAYS`,
`FS_RETENTION_LOGS_DAYS`, `FS_RETENTION_EVENTS_DAYS`,
`FS_RETENTION_RETRY_QUEUE_DAYS`, `FS_RETENTION_TRASH_DAYS`, and
`FS_RETENTION_TERMINAL_JOB_CHECKPOINTS_DAYS`.

The cleanup prints counts for jobs, agent messages, action log, events, retry
queue, terminal job checkpoints, trash, and failed trash purges. Job artifact
purge uses the configured artifact storage adapter.

## Workspace artifact pruning

Workspace pruning targets stale child directories inside the selected workspace
root. It does not prune a separate `projects/` bucket and does not accept
`--projects-root`.

Run this module inside a dependency-complete developer/tooling container with
the intended workspace directory mounted at `/workspace-artifacts`. The following
is a container-native dry run, not a host command or a Compact command:

```bash
python -m core.application.tooling.ops.prune_workspace_artifacts \
  --workspace-root /workspace-artifacts \
  --max-age-days 7 \
  --dry-run
```

`FS_WORKSPACES_ROOT` changes the default workspace root, and
`FS_WORKSPACE_MAX_AGE_DAYS` changes the default max age.

Compact does not ship this cleanup module. The CLI image copies the ops package,
so do not describe cleanup modules as absent from every image. Package presence
alone does not verify dependencies, database access, or workspace mounts in a
particular installed CLI; check that exact context before dropping `--dry-run`.

## Artifact storage

Workflow artifacts can use memory, local filesystem, or S3-compatible storage:

| Variable | Purpose |
|---|---|
| `ARTIFACT_STORAGE_BACKEND` | `memory`, `local_fs`, or `s3`. |
| `ARTIFACT_LOCAL_ROOT_DIR` | Local filesystem root, default `/data/artifacts` when local storage is used. |
| `ARTIFACT_S3_ENDPOINT_URL` | S3-compatible endpoint. |
| `ARTIFACT_S3_BUCKET` | Bucket name. |
| `ARTIFACT_S3_ACCESS_KEY` | Access key. |
| `ARTIFACT_S3_SECRET_KEY` | Secret key. |
| `ARTIFACT_S3_REGION` | Region. |
| `ARTIFACT_S3_KEY_PREFIX` | Optional key prefix. |
| `ARTIFACT_S3_USE_SSL` | SSL toggle. |
| `ARTIFACT_S3_PRESIGN_TTL_SECONDS` | Presigned URL lifetime. |

Retention cleanup uses the same artifact storage configuration when purging job
artifacts for expired jobs.
