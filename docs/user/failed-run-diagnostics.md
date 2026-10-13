---
sidebar_position: 7
title: Failed-Run Diagnostics
description: Inspect and recover failed jobs using logs, messages, errors, cost, traces, approvals, and events.
---

# Failed-Run Diagnostics

Use this page when a job or workflow run failed, stalled, or produced a result
that should not be trusted.

## First-pass triage

1. Open `Jobs`.
2. Select the failed or suspicious job.
3. Read the final status and current phase or step.
4. Read `Failure summary` when the run contains failure information. Select a
   failed step in the execution waterfall to open `Step details` and its `Errors`
   section when a failure is recorded.
5. Inspect the step's inputs, outputs, message, and generated files. These are
   readable execution projections, not an unfiltered raw-message browser.
6. Review `Decision history` when available and the active review workspace.
7. For raw logs, messages, or job events, use the authorized API/CLI paths in
   [CLI Reference](../reference/cli) and [API Reference](../reference/api).
   The current page has no `Advanced diagnostics` drawer, `Raw data` expansion,
   or dedicated `Overview`, `Runtime`, `Decisions`, `Causal`, `Messages`, `Logs`,
   or `Events` tabs. Backend diagnostics are not a promise of matching UI tabs.
8. Review approvals before judging whether the job was allowed to proceed.
9. Check generated artifacts and cost when the job used models or tools.

Viewers can inspect jobs within their authorized project scope but cannot decide
a gate, cancel, or restart a job. Admin/operator actions still depend on the
job's scope, current state, and available policy actions.

## Common failure shapes

| Symptom | Likely check |
|---|---|
| Missing model output | Provider key, model catalog, timeout, budget, or provider outage. |
| Tool call failed | MCP connector health, allowlist, token scope, extension health, or HTTP error. |
| Dataset query failed | Dataset enabled state, project connection, schema scope, query parameters. |
| Approval blocked progress | Approval packet, assignee, notification route, and user role. |
| Job restarted unexpectedly | Runtime journal, watchdog state, worker liveness, and lease history. |
| Step timed out | Step timeout policy, provider latency, worker load, and external endpoint health. |
| Output looks unsafe | Security policy, PII findings, prompt context, and artifact contents. |

## Recovery decision

| Action | Use it when |
|---|---|
| Retry step or job | The failure was transient and the step is safe to run again. |
| Restart | The original request is valid but a fresh attempt is cleaner than continuing. |
| Cancel | The job should not continue or was submitted to the wrong project. |
| Reject approval | The proposed action is unsafe, unclear, or based on bad context. |
| Fix dependency first | Credentials, provider routes, datasets, extensions, or workflow config are broken. |
| Leave failed | The evidence is needed as an incident record or duplicate side effects are likely. |

## Before retrying

Do not retry until you have answered:

- did the failed step already mutate an external system;
- will retry create duplicate tickets, comments, notifications, or files;
- is the credential or provider issue actually fixed;
- are workflow inputs still valid;
- does an approval need a new human decision;
- should the workflow stay disabled until a fix is tested.

## Example incident path

A job shows `retryable_interrupted_step` after an external connector timeout.
Open the failed step, then correlate its structured error with logs, connector
messages, events, runtime journal, decision overrides, and per-step artifacts. Check the provider for an idempotency key or created
object before assuming nothing happened. If no external effect occurred and
health/scope is now correct, use the action the job policy offers and confirm a
new attempt or resumed journal entry reaches a terminal state. If an object was
created, reconcile it first; an automatic retry could duplicate the effect.
Keep the original attempt as evidence and record why the chosen recovery was
safe.

## Related pages

- [Jobs And Approvals](jobs-and-approvals)
- [Monitoring And Troubleshooting](monitoring-and-troubleshooting)
- [Queues, Concurrency, Retries, And DLQ](../admin/queues-concurrency-retries-dlq)
- [Events And Redrive](../admin/events-and-redrive)
