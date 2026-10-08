---
sidebar_position: 9
title: Observability
description: Configure Sentry, Prometheus metrics, readiness checks, and runtime evidence for production operations.
---

# Observability

Use observability to answer two questions: is the platform healthy, and what
happened when work failed?

## In-product monitoring

Start in `Monitoring` for:

- service health;
- queue depth;
- active leases;
- stuck jobs;
- storage summary;
- events and dispatch state;
- extension health;
- watchdog state.

Then open the job detail page for logs, messages, errors, approvals, costs,
artifacts, and traces.

## Sentry

Sentry is optional production observability for runtime exceptions, error-level
logs, traces, and profiling samples. Configure:

| Variable | Purpose |
|---|---|
| `SENTRY_DSN` | Backend/runtime DSN. |
| `SENTRY_ENVIRONMENT` | Environment label. |
| `SENTRY_RELEASE` | Release identifier. |
| `SENTRY_TRACES_SAMPLE_RATE` | Backend trace sample rate. |
| `SENTRY_PROFILES_SAMPLE_RATE` | Backend profiling sample rate. |
| `SENTRY_SEND_DEFAULT_PII` | Default PII behavior. Keep `0` unless approved. |

Sentry integration is backend-only in this release. No browser Sentry SDK or
browser tracing is initialized.

## Prometheus metrics

Flow Steward exposes Prometheus-compatible metrics from the app and process
exporters:

| Surface | Path |
|---|---|
| App/API metrics | `/metrics` on the app HTTP service. |
| Worker exporter | `/metrics` on `FS_WORKER_METRICS_PORT`. |
| Control-plane exporter | `/metrics` on `FS_CONTROL_METRICS_PORT`. |

No MCP metrics exporter is started in this release.

Set `FS_METRICS_TOKEN` in production so scrapes must send either
`x-metrics-token` or `Authorization: Bearer`.

## Profile and network boundaries

Run `./flow-steward status` and read-only `./flow-steward doctor` from a
Docker-host checkout. Doctor explains installation findings and offers targeted
repair IDs; use the [diagnostic guide](diagnostics-and-migration) before applying
`--fix`. An intentionally maintained installation should not have its maintenance
finding repaired until you intend to reopen work.

On Scalable, `./flow-steward stack status` and `stack logs --tail 200` inspect
separate service containers. Compact has no retained `stack` command; inspect
the runtime container through the host's Docker tools or the hosting provider's
service logs. Standalone provider Compact cannot perform Docker-host doctor
checks; **NOT CHECKED** is not a successful check.

Compact's role exporters are inside the runtime container. A process exporter
port being configured does not mean the public ingress exposes it. Keep metrics
scraping on an intentionally configured private route and verify the collector's
actual reachability and authentication. Do not publish database/broker ports or
all runtime process ports to make metrics accessible.

Check public `/health` and `/health/ready` separately from a trusted client.
A private backend check does not verify an external proxy's TLS, public DNS or
streaming routes. See the [installer walkthrough](installer-walkthrough).

## Incident evidence

For an incident, collect:

- release version and deployment time;
- app, worker, database, queue, MCP, and extension health;
- queue depth and active lease state;
- job ids and event ids;
- final structured errors;
- Sentry issue links if enabled;
- Prometheus graphs for latency, retry rate, dead-letter rate, and stuck jobs;
- operator actions such as retry, cancel, restart, or redrive.

## Related pages

- [Monitoring And Troubleshooting](../user/monitoring-and-troubleshooting)
- [Events And Redrive](../admin/events-and-redrive)
- [Queues, Concurrency, Retries, And DLQ](../admin/queues-concurrency-retries-dlq)
- [Operations Internals](../developer/operations-internals)
