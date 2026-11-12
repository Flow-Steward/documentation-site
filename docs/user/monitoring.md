---
sidebar_position: 12
title: Monitoring
description: Check system health, queues, events, telemetry, watchdog, and retention.
---

# Monitoring

Use monitoring when Flow Steward is running but work is slow, blocked, failing,
or not visible where expected.

The system Monitoring UI is admin-only. Operators and viewers should start with
the jobs available in their project scope. Job read access is separate from
system Monitoring access and does not authorize job mutations.

## Start with these checks

1. Open `Monitoring`.
2. Check `Services`.
3. Check queue and runtime status in `Overview` and `Processes`.
4. Check `Storage`.
5. Open `Events` and filter by the affected workflow, family, category, or
   dispatch status.
6. Open the job detail page and review `Failure summary`, the execution waterfall
   and `Step details`, recorded `Decision history`, and any active approval.
   See [Failed-Run Diagnostics](failed-run-diagnostics) for the current path and
   the distinction between UI projections and raw API records.
7. Check extension health if the failure involves an external provider.

Check observation freshness as well as readiness and health. Missing or stale
runtime observations do not establish that a service is healthy. Use
`Download diagnostics` in Monitoring to collect the redacted installation report
for a bug report.

## Common issues

Symptom-by-symptom fixes live on one page: [Troubleshooting](../troubleshooting).

## Event filters

Use `Events` when you need a timeline across jobs and providers. Useful filters
include:

- workflow;
- event family;
- category;
- exact event type;
- dispatch status, including dead-lettered messages;
- date range.

Select an event to open its drawer. Expand `Advanced event diagnostics` for
`Dispatches`, `Commands`, and `Metadata` when present. These are event diagnostics,
not job detail tabs; event visibility does not imply permission to redrive a dispatch.

## Production telemetry

Flow Steward provides built-in monitoring and Prometheus-compatible metrics,
with optional backend Sentry integration and OpenTelemetry export. The behavior
below is available on main; availability in a particular published release and
operation of an external monitoring provider must be checked separately.

Use backend Sentry when you want exception capture outside the Flow Steward UI. Set
`SENTRY_DSN` and deployment labels such as `SENTRY_ENVIRONMENT` and
`SENTRY_RELEASE`. Keep `SENTRY_SEND_DEFAULT_PII=0` unless your production policy
explicitly allows default PII capture. Trace sampling is controlled separately by
`SENTRY_TRACES_SAMPLE_RATE` and defaults to zero. The supported integration is
backend-side.

Use Prometheus when you want platform health and process metrics in your
monitoring stack. The app exposes `/metrics`; worker and control-plane processes
have separate exporters when their metrics ports are enabled. Do not rely on an
MCP Prometheus endpoint. Set `FS_METRICS_TOKEN` for unattended scrapes and send it
in either `x-metrics-token` or `Authorization: Bearer <token>`. The application
endpoint also accepts an authenticated admin or operator. Process exporters
require a nonempty metrics token.

Useful metrics include readiness, readiness checks, jobs by status, queue depth,
active leases, 24-hour SLO values, process liveness, process start time, thread
count, and component-specific worker/control state. A successful scrape alone
does not establish that every runtime component is healthy.

Optional OpenTelemetry export sends traces, metrics, and logs over OTLP/HTTP
Protobuf. Each signal is disabled by default. Enable a signal with
`OTEL_TRACES_EXPORTER=otlp`, `OTEL_METRICS_EXPORTER=otlp`, or
`OTEL_LOGS_EXPORTER=otlp`, and configure `OTEL_EXPORTER_OTLP_ENDPOINT` or the
corresponding signal-specific endpoint. There is no default destination;
Flow Steward does not install an OpenTelemetry Collector. This export is
independent of Sentry and Prometheus scraping.

See [Operations Internals](../developer/operations-internals) for exact ports,
paths, token behavior, and Sentry variables.

## Watchdog

Watchdog helps operators detect and recover work that stopped progressing. It is
useful when a worker crashed, a subprocess was interrupted, a job lease became
orphaned, or long-running work stopped emitting progress.

Use watchdog carefully:

1. Open the affected job first.
2. Read messages, logs, runtime journal, and structured errors.
3. Open Monitoring and review watchdog state.
4. Run or inspect the watchdog scan.
5. Confirm the detection reason before applying recovery.
6. Retry only when the job can safely re-enter the queue.
7. Kill or cancel only when continuing would be unsafe or impossible.

Applying watchdog scan results and executing watchdog recovery actions require
an admin. Job read access alone does not authorize these actions.

Watchdog can be configured to detect stuck, orphaned, interrupted, or abandoned
jobs. Deployments can run it in review-first mode or allow auto-apply depending
on `FS_WATCHDOG_AUTO_APPLY`.

Related settings include `FS_WATCHDOG_ENABLED`,
`FS_WATCHDOG_INTERVAL_SECONDS`, `FS_WATCHDOG_STUCK_SECONDS`,
`FS_WATCHDOG_ORPHAN_GRACE_SECONDS`, `FS_WATCHDOG_PICKUP_GRACE_SECONDS`, and
`FS_WATCHDOG_MAX_JOURNAL_ENTRIES`.

## Retention and cleanup

Use retention settings when storage or audit policy needs predictable cleanup.

Retention affects logs, job messages, trash, jobs, events, retry queue records,
terminal-job checkpoints, and retained revisions. Keep enough history to debug
incidents, but avoid retaining sensitive or high-volume evidence longer than needed.

The control plane runs retention cleanup using each account's policy. Its default
interval is one day, controlled by `FS_RETENTION_INTERVAL_SECONDS`; a separate
host cron is not required for retention.

Typical cleanup path:

1. Open `Settings > Retention`.
2. Review action log, job log, trash, terminal-job checkpoint retention, and the
   number of revisions to keep.
3. Check artifact storage and monitoring storage summary.
4. Review `Trash` before permanent deletion windows expire.
5. Check the scheduled retention pass, or run manual cleanup from the approved
   operator runbook when needed.
6. Recheck monitoring storage after cleanup.

## CLI diagnostics

Useful commands:

```bash
./flow-steward jobs health-snapshot
./flow-steward jobs errors <job-id>
./flow-steward jobs logs <job-id>
./flow-steward doctor
```

Use [CLI Reference](../reference/cli) for the full command map.
