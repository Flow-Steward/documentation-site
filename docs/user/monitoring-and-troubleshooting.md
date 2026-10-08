---
sidebar_position: 12
title: Monitoring And Troubleshooting
description: Check system health, queues, events, and common operator issues.
---

# Monitoring And Troubleshooting

Use monitoring when Flow Steward is running but work is slow, blocked, failing,
or not visible where expected.

The system Monitoring UI is admin-only. Operators and viewers should start with
the jobs available in their project scope; admin/operator job diagnostics are a
separate permission from system Monitoring.

## Start with these checks

1. Open `Monitoring`.
2. Check `Services`.
3. Check queue and runtime status.
4. Check storage summary.
5. Open `Events` and filter by the affected workflow, job, family, category, or
   dispatch status.
6. Open the job detail page and review approvals and, when your role permits it,
   `Advanced diagnostics > Errors`, `Runtime`, `Decisions`, and `Causal`.
7. Check extension health if the failure involves an external provider.

## Common issues

| Symptom | Check |
|---|---|
| Job is stuck awaiting approval | Open the job approval packet and decide it. |
| Job failed after a connector step | Check extension health, tool credentials, and job messages. |
| Workflow cannot query data | Confirm dataset is enabled, project is linked, and schema scope includes the resource. |
| MCP tool is missing | Sync the MCP connector and check the allowlist. |
| User cannot perform an action | Check role, active status, account scope, and project/workflow scope. |
| Project context is outdated | Review project rules and assigned connections; public KB editing and reindex commands are unavailable. |
| Notification did not send | Check project notification routes, extension health, and event dispatch state. |
| Job appears stuck or orphaned | Review job runtime journal, then inspect watchdog scan results. |
| Storage is growing too quickly | Review retention settings, trash, artifacts, and log retention. |

## Event filters

Use `Events` when you need a timeline across jobs and providers. Useful filters
include:

- workflow;
- event family;
- category;
- exact event type;
- dispatch status;
- dead-lettered messages.

Select an event to open its drawer. Expand `Advanced event diagnostics` for
`Dispatches`, `Commands`, and `Metadata`. These are event diagnostics, not job
detail tabs; event visibility does not imply permission to redrive a dispatch.

## Production telemetry

Flow Steward can send production errors and traces to Sentry and expose
Prometheus-compatible metrics for external monitoring.

Use backend Sentry when you want exception capture outside the Flow Steward UI. Set
`SENTRY_DSN` and deployment labels such as `SENTRY_ENVIRONMENT` and
`SENTRY_RELEASE`. Keep `SENTRY_SEND_DEFAULT_PII=0` unless your production policy
explicitly allows default PII capture. This release does not provide a frontend
Sentry integration.

Use Prometheus when you want platform health and process metrics in your
monitoring stack. The app exposes `/metrics`; worker and control-plane processes
have separate exporters when their metrics ports are enabled. Do not rely on an
MCP metrics exporter in this release. Set `FS_METRICS_TOKEN` in production so
scrapes must send either
`x-metrics-token` or `Authorization: Bearer`.

Useful metrics include readiness, readiness checks, jobs by status, queue depth,
active leases, 24-hour SLO values, process liveness, process start time, thread
count, and component-specific worker/control state.

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

Watchdog can be configured to detect stuck, orphaned, interrupted, or abandoned
jobs. Deployments can run it in review-first mode or allow auto-apply depending
on `FS_WATCHDOG_AUTO_APPLY`.

Related settings include `FS_WATCHDOG_ENABLED`,
`FS_WATCHDOG_INTERVAL_SECONDS`, `FS_WATCHDOG_STUCK_SECONDS`,
`FS_WATCHDOG_ORPHAN_GRACE_SECONDS`, `FS_WATCHDOG_PICKUP_GRACE_SECONDS`, and
`FS_WATCHDOG_MAX_JOURNAL_ENTRIES`.

## Retention and cleanup

Use retention settings when storage or audit policy needs predictable cleanup.

Retention affects logs, job messages, trash, jobs, events, and retry queue
records. Keep enough history to debug incidents, but avoid retaining sensitive
or high-volume evidence longer than needed.

Typical cleanup path:

1. Open `Settings > Retention`.
2. Review action log, job log, and trash retention.
3. Check artifact storage and monitoring storage summary.
4. Review `Trash` before permanent deletion windows expire.
5. Run retention cleanup from the approved operator runbook.
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
