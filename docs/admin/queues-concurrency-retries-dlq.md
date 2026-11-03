---
sidebar_position: 8
title: Queues, Concurrency, Retries, And DLQ
description: Operate Flow Steward queues and recover failed or stuck work safely.
---

# Queues, Concurrency, Retries, And DLQ

Queues control when accepted work can run. Retries and dead-letter queues help
Flow Steward recover from transient failures without hiding persistent problems.

The controls and delivery behavior below are supported by the reviewed main
source; availability in a published release depends on the version you deploy.

## Signals to watch

| Signal | Why it matters |
|---|---|
| Ready queue depth | A growing backlog can indicate insufficient worker capacity or work waiting for project execution slots. |
| Active leases | Unexpired project execution slots currently held by workers; this is not a count of individual steps. |
| Stuck jobs | Work stopped progressing past the expected runtime window. |
| Retry rate | A dependency may be flaky or a workflow may be misconfigured. |
| Dead-letter rate | Events or runtime tasks exceeded retry policy or failed permanently. |
| Worker liveness | No worker can make progress if the process is down or isolated. |

## Triage order

[![Monitoring Processes tab used to inspect runtime process state](/img/screenshots/2026-10-04/monitoring-processes.png)](/img/screenshots/2026-10-04/monitoring-processes.png)

*The Processes tab in the isolated fixture. Its monitoring summary endpoint returned 503 during capture, so use the screenshot to locate controls, not as a health attestation.*

1. Open `Monitoring`.
2. Check services and worker liveness.
3. Compare ready queue depth with active leases. In the Overview's **Queue delivery** card, distinguish queued, retrying, dead-lettered, and failed-after-delivery jobs. Open attention jobs to inspect their failure details and delivery retry counts.
4. Open the oldest pending or running jobs.
5. Inspect job logs, messages, runtime journal, and structured errors.
6. Check extension health, model provider status, dataset availability, and
   external endpoints.
7. Review recent deployments, configuration changes, and provider credential
   rotations.
8. Decide whether to retry, cancel, restart, or leave the job paused for human
   review.

## Retry safely

RabbitMQ delivery retries are separate from workflow execution retries. The
project policy's `retry_max_attempts` controls delivery retries after the first
attempt and defaults to `2`. Delivery failures before execution retry up to that
limit, then become dead-lettered and require intervention. Permanent delivery
failures can be dead-lettered immediately. Delivery failures recorded by the
worker mark the job `triage_needed` when dead-lettered.

The project policy fields `retry_strategy`, `retry_backoff_initial_seconds`, and
`retry_backoff_max_seconds` do not control RabbitMQ delivery retries; delivery
retry backoff timing is not applied. A workflow failure after a worker claims the
job is a separate execution failure, not evidence that delivery failed.

Retry when the failure was transient and the step is safe to run again. Examples
include provider timeouts, temporary network failures, missing worker capacity,
or a credential that has been fixed.

Do not retry blindly when the failed step may have already changed an external
system. Check for duplicate issue creation, repeated notifications, repeated
approval callbacks, or repeated writes before replaying work.

## Dead-letter review

Dead-lettered records need operator attention because normal retry policy has
been exhausted or a permanent failure prevents normal delivery.

There is no universal record-level DLQ requeue control in the current
Monitoring UI. Recovery is owned by the affected subsystem:

- for an eligible event, open its Events detail and use **Redrive failed
  dispatches**; this requires operator-level authorization, a `failed` or
  `dead_lettered` event, and at least one failed or dead-lettered dispatch.
  The action requeues eligible dispatches for that event; see
  [Events And Redrive](events-and-redrive);
- for a job, use the state- and policy-specific retry, restart, cancel, or
  watchdog recovery exposed on that job;
- watchdog kill/retry is administrator-only, and retrying an active job can
  conflict unless the owning recovery contract explicitly permits force.

For each dead-lettered record:

1. Read the final error.
2. Identify the owning job, event, route, or provider.
3. Fix the root cause before requeueing.
4. Use the owning event/job recovery path for one item first when duplicate side
   effects are possible; do not look for a generic queue requeue button.
5. Leave unrecoverable records in the DLQ with an incident note.

## Concurrency changes

The project's Policy form exposes **Concurrency cap** (`concurrency_cap`, minimum
`1`). Workers acquire project execution leases, and a new lease is refused when
the project's active lease count reaches its cap. Raising the cap permits more
project execution slots; actual throughput also depends on available workers.

Treat concurrency as a production control, not a tuning trick. Increasing it can
raise provider load, model cost, database pressure, queue contention, and the
number of simultaneous approval decisions.

Before increasing concurrency:

- confirm workers have CPU and memory headroom;
- confirm providers and extensions can handle parallel calls;
- confirm rate limits and model budgets are not already saturated;
- run a low-risk workflow after the change;
- watch retry and dead-letter rates for at least one normal work cycle.

## Related pages

- [Monitoring And Troubleshooting](../user/monitoring-and-troubleshooting)
- [Failed-Run Diagnostics](../user/failed-run-diagnostics)
- [Events And Redrive](events-and-redrive)
- [Observability](../deploy/observability)
