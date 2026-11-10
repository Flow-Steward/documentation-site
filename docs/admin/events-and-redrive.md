---
sidebar_position: 6
title: Events And Redrive
description: Inspect event delivery state and safely replay failed event dispatches.
---

# Events And Redrive

Use events when you need an audit-friendly timeline across jobs, workflows,
extensions, notifications, and system actions. Use redrive only after you know a
failed event can be replayed without duplicating an unsafe side effect.

## When to open Events

Open `Monitoring > Events` when:

- a notification, webhook, callback, or extension action did not arrive;
- a workflow appears stuck between runtime steps;
- a provider says it received a request but Flow Steward did not record the
  expected follow-up;
- an operator needs a timeline for an incident or approval decision;
- a dead-lettered message needs review.

## Useful filters

[![Monitoring Events tab with workflow, event-family, event-type, dispatch-status, and event filters](/img/screenshots/2026-10-04/monitoring-events.png)](/img/screenshots/2026-10-04/monitoring-events.png)

*The Events inspector contains synthetic delivered events. The monitoring summary request visibly returned 503 in this isolated fixture, so this image is evidence for the Events controls only, not overall monitoring readiness or a successful redrive.*

| Filter | Use it for |
|---|---|
| Workflow | Limit the timeline to one workflow definition. |
| Event family | Separate workflow, extension, notification, approval, and system events. |
| Category | Narrow broad event families into product areas; select a family first. |
| Event type | Find one exact emitted event. |
| Dispatch status | Filter the event's aggregate status: recorded, dispatching, succeeded, partially_failed, failed, or dead_lettered. Available options come from matching event records. |
| Period | Bound the event occurrence window using calendar days in your effective user timezone. |

Despite its Dispatch status label, the list filter uses event status. Individual
dispatches have their own statuses, including matched, skipped, and queued, in
the event's advanced diagnostics.

Job identity can appear in an event's detail context, but it is not a list
filter on the current Events inspector.

## Safe redrive checklist

Redrive requires operator-level access and access to the selected event's scope.
The action is available only for events whose aggregate status is `failed` or
`dead_lettered`; `partially_failed` events are not eligible.

1. Open the event and read the payload summary.
2. Confirm the event target is still enabled and points to the expected
   provider, callback, or route.
3. Check whether the original side effect may already have happened outside Flow
   Steward.
4. Review related job messages, logs, approvals, and extension health.
5. Fix missing credentials, disabled routes, network errors, or provider
   configuration before replaying.
6. Choose one eligible `failed` or `dead_lettered` event and click **Redrive
   failed dispatches**.
7. Treat **Redrive requested successfully** as acknowledgement that at least one
   dispatch was reset to `queued`, not completed delivery. The action attempts
   to reset eligible failed/dead-lettered dispatches for that selected event;
   it does not select one delivery or redrive multiple events. The service
   inspects at most 1,000 dispatch records for that event. Some updates can fail
   even when the request succeeds, so inspect each dispatch afterward.
8. Reopen the event to check updated dispatch history. Confirm delivery outcomes
   and investigate dispatches that remain queued or record another failure.
   The redrive endpoint changes stored dispatch state; it does not itself invoke
   provider delivery or guarantee that a replay consumer will complete it.

Do not redrive events that create external records, send user-visible messages,
approve work, or mutate production systems until the duplicate-effect risk is
understood. Confirm external outcomes with the target provider; a queued state
alone does not establish delivery or provider readiness.

## What to record during an incident

Capture:

- the event id and type;
- job id or workflow id;
- dispatch statuses before redrive, after requeue, and at final outcome;
- target route or provider;
- operator who performed the redrive;
- reason redrive was considered safe;
- follow-up action if replay failed again.

This evidence belongs with the job timeline or incident ticket, not only in chat
or ad hoc notes.

## Related pages

- [Monitoring](../user/monitoring)
- [Audit Trail](audit-trail)
- [API Reference](../reference/api)
