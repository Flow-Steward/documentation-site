---
sidebar_position: 5
title: Jobs And Approvals
description: Follow running work, review evidence, and control job lifecycle.
---

# Jobs And Approvals

A job is a tracked unit of work. It may come from a submitted task, a workflow
trigger, a webhook, an MCP tool, or an operator action.

## Job lifecycle

| State key | UI label | Meaning |
|---|---|---|
| `pending` / `queued` | Queued | Accepted but not executing. |
| `in_progress` | In progress | A worker is executing workflow steps. |
| `awaiting_approval` | Waiting for approval | Human input is required. |
| `resume_pending` | Resume queued | A durable approval/resume was accepted and is waiting for execution. |
| `blocked` | Blocked | The job cannot proceed without external action. |
| `external_wait` | Waiting on an external system | A declared external dependency has not completed. |
| `retryable_interrupted_step` | Stopped on a retryable step | Terminal attempt; inspect policy before retry/restart. |
| `completed` | Completed successfully | Terminal success. |
| `failed` | Failed | Terminal unrecovered error. |
| `triage_needed` | Needs triage | Terminal result requires operator diagnosis. |
| `cancelled` | Cancelled | Terminal operator/system cancellation. |
| `max_iterations` | Stopped after repeated retries | Terminal loop/retry cap. |

Restart is an action that creates a new attempt; it is not a canonical status.
Available actions also depend on role, current attempt state, and runtime policy,
so a status label alone does not promise that retry, restart, replay, resume, or
cancel is permitted.

## Inspect a job

[![Jobs page with list controls used to find and triage workflow runs](/img/screenshots/2026-10-04/jobs-list.png)](/img/screenshots/2026-10-04/jobs-list.png)

*Jobs list in the isolated screenshot fixture. Approval packets, failed-run diagnostics, and job-detail actions require a job in the corresponding state and are not demonstrated by this image.*

1. Open `Jobs`.
2. Select the job.
3. Review the summary and current agent.
4. As an admin or operator, open `Advanced diagnostics`. Its tabs are `Overview`,
   `Errors`, `Runtime`, `Decisions`, and `Causal`.
5. Inspect `Runtime` records and available message projections; expand `Raw data`
   on a selected record when you need its underlying fields.
6. Inspect `Errors` or the failed step's inspector for failure details.
7. Use authorized API/CLI access for raw logs, messages, and job events. These are
   not dedicated job-detail tabs. Viewers do not see `Advanced diagnostics` or
   `Restart`, even when they can read the job.
8. Check cost breakdown when model or tool usage matters.

[![Completed provider-free job detail with status, timing, execution waterfall, restart, report, and diagnostics controls](/img/screenshots/2026-10-04/job-detail-completed.png)](/img/screenshots/2026-10-04/job-detail-completed.png)

*A pre-existing synthetic provider-free run completed with no billable model usage. No restart or diagnostic action was invoked during capture.*

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
   optional.

## Restart or cancel

Cancel a job when it should not continue. Restart when the original request is
still valid but the previous attempt failed for a recoverable reason.

Common examples:

- Restart after fixing a missing credential or service dependency.
- Cancel when a task was submitted to the wrong project.
- Reject approval when a generated change touches the wrong files.

CLI equivalents are documented in [CLI Reference](../reference/cli).
