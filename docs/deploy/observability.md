---
sidebar_position: 9
title: Observability
description: Configure Sentry, Prometheus metrics, OpenTelemetry export, readiness checks, and runtime evidence for production operations.
---

# Observability

Use observability to answer two questions: is the platform healthy, and what
happened when work failed? External observability services are optional.

The behavior below is supported by the current source on main; this does not
establish that it is included in a published release. Check your deployed revision.

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

Monitoring distinguishes readiness, reporting freshness, and measured component
health. Unknown, stale, or not-measured observations are not passing health
checks. Use **Download diagnostics** to collect the redacted installation report.

Then open the job detail page for logs, messages, errors, approvals, costs,
artifacts, and traces.

## Sentry

Sentry is optional production observability for runtime exceptions, error-level
logs, traces, and profiling samples. Configure:

| Variable | Purpose |
|---|---|
| `SENTRY_DSN` | Backend/runtime DSN; without it Sentry is disabled. |
| `SENTRY_ENVIRONMENT` | Environment label. |
| `SENTRY_RELEASE` | Release identifier. |
| `SENTRY_TRACES_SAMPLE_RATE` | Backend trace sample rate; defaults to `0.0`. |
| `SENTRY_PROFILES_SAMPLE_RATE` | Backend profiling sample rate; defaults to `0.0`. |
| `SENTRY_SEND_DEFAULT_PII` | Default PII behavior. Keep `0` unless approved. |
| `SENTRY_AUTO_ENABLING_INTEGRATIONS` | Automatic SDK integrations; defaults to `0`. |

Sentry integration is backend-only. No browser Sentry SDK or browser tracing is
initialized. Sentry is independent of OpenTelemetry export.

## Prometheus metrics

Flow Steward exposes Prometheus-compatible metrics from the app and process
exporters:

| Surface | Path |
|---|---|
| App/API metrics | `/metrics` on the app HTTP service. |
| Scalable worker exporter | `/metrics` on `FS_WORKER_METRICS_PORT`. |
| Scalable control-plane exporter | `/metrics` on `FS_CONTROL_METRICS_PORT`. |

No MCP Prometheus pull exporter is started. MCP can export metrics through OTLP.

Set `FS_METRICS_TOKEN` through the installation's runtime configuration and restart
the affected services. Scrapers can send either `X-Metrics-Token: <token>` or
`Authorization: Bearer <token>`. The app route also accepts authenticated admins
and operators; process exporters require a nonempty metrics token.

For standalone process exporters, a port of `0` disables the exporter and
`FS_PROCESS_METRICS_HOST` defaults to `0.0.0.0`. Scalable Compose defaults are
`9101` for workers and `9102` for control, exposed to the container network rather
than published on the host. Collect each replica separately.

Application metrics include readiness, current job counts by status, active
leases, ready queue depth, and 24-hour SLO gauges. `platform_jobs_total` is a
gauge, not a monotonic counter; queue depth `-1` means unavailable. App and
process exporters have different coverage. A successful scrape does not prove
that all runtime components are healthy, and an empty app response can mean its
database logger is unavailable.

## OpenTelemetry export

The app, workers, control plane, and MCP server support optional traces, metrics,
and logs over OTLP/HTTP Protobuf. Export is off by default and has no default
endpoint. Configure each required signal and a receiver, for example:

```bash
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
```

The base endpoint has `/v1/traces`, `/v1/metrics`, or `/v1/logs` appended.
`OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, and
`OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` override it with a full URL for one signal.
Only the `http/protobuf` protocol is supported. An unset or `none` exporter
disables that signal; `OTEL_SDK_DISABLED=true` disables all signals.

Each signal sends to one receiver. Operate a Collector separately if needed,
including routing to multiple destinations. Receiver reachability and successful
external ingestion must be verified for your installation.

OTLP logs contain only explicitly allowlisted operational events, not the full
local log stream or exception text. Keep local logs and job evidence for incident
investigation.

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

Compact's role exporters bind to loopback inside the runtime container, with
ports assigned by the supervisor. Use the app `/metrics` endpoint for external
collection. A process exporter port being configured does not mean the public
ingress exposes it. For Scalable process exporters, use an intentionally
configured private route and verify the collector's actual reachability and
authentication. Do not publish database/broker ports or all runtime process ports
to make metrics accessible.

Check public `/health` and `/health/ready` separately from a trusted client.
`/health` is a liveness alias; `/health/ready` returns `200` when ready and `503`
when not ready. A private backend check does not verify an external proxy's TLS,
public DNS or streaming routes. See the [installer walkthrough](installer-walkthrough).

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
