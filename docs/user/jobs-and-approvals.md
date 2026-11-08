---
sidebar_position: 5
title: Jobs And Approvals
description: Follow running work, review evidence, and control job lifecycle.
---

# Jobs And Approvals

A job is a tracked unit of work. It may come from a submitted task, a workflow
trigger, a webhook, an MCP tool, or an operator action.

## Job lifecycle

The following describes lifecycle states. Jobs list filters and badges group
several states under shared labels, as explained below.

| State key | Description | Meaning |
|---|---|---|
| `pending` / `queued` | Queued | Accepted but not executing. |
| `in_progress` | In progress | A worker is executing workflow steps. |
| `awaiting_approval` | Waiting for approval | Human input is required. |
| `awaiting_timer` | Waiting for timer | Paused on a Wait step until its due time. |
| `awaiting_child` | Waiting for child workflow | Paused until the child workflow finishes. |
| `resume_pending` | Resume queued | A durable approval/resume was accepted and is waiting for execution. |
| `blocked` | Blocked | The job cannot proceed without external action. |
| `external_wait` | Waiting on an external system | A declared external dependency has not completed. |
| `retryable_interrupted_step` | Stopped on a retryable step | Terminal attempt; inspect policy before retry/restart. |
| `completed` | Completed successfully | Terminal success. |
| `failed` | Failed | Terminal unrecovered error. |
| `triage_needed` | Needs triage | Terminal result requires operator diagnosis. |
| `cancelled` | Cancelled | Terminal operator/system cancellation. |
| `max_iterations` | Stopped after repeated retries | Terminal loop/retry cap. |

On current main, the Jobs list groups `pending`, `resume_pending`, and
`in_progress` as **In progress**; timer, child, and external waits as **Waiting**;
`stuck` and `orphaned` as **Stuck**; `blocked` and
`retryable_interrupted_step` as **Interrupted**; and `failed`, `max_iterations`,
and `triage_needed` as **Failed**. The other groups are **Waiting for approval**,
**Completed**, and **Cancelled**. Unknown or legacy codes outside these groups
have no group; `queued` is not included in the current group table.

Restart is an action that creates a new attempt; it is not a canonical status.
Available actions also depend on role, current attempt state, and runtime policy,
so a status label alone does not promise that retry, restart, replay, resume, or
cancel is permitted.

## Inspect a job

[![Jobs page with list controls used to find and triage workflow runs](/img/screenshots/2026-10-04/jobs-list.png)](/img/screenshots/2026-10-04/jobs-list.png)

*Jobs list in the isolated screenshot fixture. Approval packets, failed-run diagnostics, and job-detail actions require a job in the corresponding state and are not demonstrated by this image.*

1. Open `Jobs`.
2. Select the job.
3. Review the summary and current agent. When available, inspect the executed
   definition's pinned revision and graph. `Open the current workflow` opens the
   current definition, which may differ from what ran. A run without a pinned
   definition shows an availability warning. Timer waits show their due time;
   child-workflow waits link to the child run when that information is available.
4. Review the run's Result. When the workflow returns a [report](workflows#reports),
   it is shown there first, with the other outputs below it.
5. Review `Failure summary` when the run includes failure information.
6. Select a step in the execution waterfall to open `Step details`. Inspect its
   inputs, outputs, message, generated files, and `Errors` when those are present.
7. Review `Decision history` when recorded decisions are available, and the
   review workspace when a human gate is active.
8. Use authorized API/CLI access for raw logs, messages, and job events. The
   current job page has no `Advanced diagnostics` drawer or dedicated
   `Overview`, `Runtime`, `Decisions`, `Causal`, `Messages`, `Logs`, or `Events`
   tabs. Backend diagnostic fields and runtime message projections do not imply
   named UI controls. Viewers can read scoped jobs, but cannot decide a gate,
   cancel, or restart them; admin/operator actions still depend on state and policy.
9. Check cost breakdown when model or tool usage matters.

[![Historical completed provider-free job detail with status, timing, execution waterfall, restart, report, and diagnostics controls](/img/screenshots/2026-10-04/job-detail-completed.png)](/img/screenshots/2026-10-04/job-detail-completed.png)

*Historical capture from 2026-10-04 of a pre-existing synthetic provider-free run with no billable model usage. Its diagnostics controls are not the current page layout. No restart or diagnostic action was invoked during capture. These historical observations do not verify current provider availability.*

## Handle an approval

1. Open the job detail page.
2. Read the approval packet and proposed next action.
3. Check generated artifacts, logs, messages, and project context.
4. Follow the gate's configured action labels rather than assuming every gate is
   a generic approve/reject dialog.
5. Approve only when the proposed action is safe.
6. Reject when the request is unclear, unsafe, or based on bad assumptions.
7. Complete every required field. Some gates require **Comment for rejection**
   and refuse an empty submission; add useful context even when the comment is
   optional. Clarifying-answer gates require an answer, and supported override
   actions require override content.

A decision applies to the current approval gate. If another operator has already
resolved it or the gate has changed, the server rejects the stale decision;
review the refreshed job before deciding again. An accepted decision can leave
the job in `resume_pending` while it waits for a worker.

## Restart or cancel

Cancel a job when it should not continue. Restart when the original request is
still valid but the previous attempt failed for a recoverable reason.

Restart creates a new job. The server refuses restart while the original run is
queued, running, or paused for approval, a timer, or a child workflow; cancel it
first or wait for it to finish.

Common examples:

- Restart after fixing a missing credential or service dependency.
- Cancel when a task was submitted to the wrong project.
- Reject approval when a generated change touches the wrong files.

On current main, admins and operators can use **Acknowledge** on job details in
the **Failed** or **Stuck** groups, and **Unacknowledge** to remove that mark.
Acknowledgment records that an operator has seen the job; it does not change the
run's lifecycle status, restart it, or resolve an approval gate.

CLI equivalents are documented in [CLI Reference](../reference/cli).
