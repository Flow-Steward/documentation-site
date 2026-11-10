---
sidebar_position: 1
title: Dashboard
description: Understand Flow Steward's first operational screen and the signals it exposes.
---

# Dashboard

The dashboard is the fastest way to see whether Flow Steward needs attention.
Use it before opening individual jobs, workflows, or settings pages.

## What to check first

| Signal | What it tells you |
|---|---|
| Operational overview | Running work, queued work, waiting jobs, approvals, failures, and completed work. |
| Attention queue | A preview of individual jobs that need investigation or a human decision. |
| Model spend | Recorded model spend, with project, workflow, and agent breakdowns. |
| Move the work forward | Shortcuts available to your role, such as projects and workflow building. |

The dashboard starts with a `24h` range; select `7d` or `30d` to widen the
completed-work, success-rate, and spend summaries. Current queue and waiting
signals are snapshots independent of that range. Selecting an operational card
opens `Jobs` filtered by status; the dashboard's time range does not carry over.
The dashboard requests refreshed data every 15 seconds and shows the snapshot's
update age.

The attention queue displays up to five jobs from a bounded server preview.
Open a row to inspect its job, or use `Resolve attention` to open the filtered
job list with acknowledged runs hidden. The preview is not a complete inventory
of outstanding work.

Model spend shows up to five rows for the selected project, workflow, or agent
breakdown. A value marked `(partial)` has missing cost information;
`Unavailable` means a measured value is unavailable. Do not interpret either as
zero spend.

`Move the work forward` includes projects, with workflow and guardrail links
shown when you can read the registry. Monitoring and trash links require the
platform administration capability.

## Common actions

| Need | Go to |
|---|---|
| Follow a running job | Open `Jobs` and filter the queue by its current state. |
| Decide a gate | Open the awaiting-approval job and read the approval packet. |
| Investigate a failure | Open the failed job, then review errors, logs, messages, events, and artifacts. |
| Check system health | Open `Monitoring`. |
| Continue project work | Open `Projects` and select the project. |
| Tune provider behavior | Open `Settings > Model Providers`. |

## Reading the dashboard safely

Dashboard signals are summaries. Do not approve, retry, cancel, redrive, or
delete work based only on the summary. Open the underlying job, event, route, or
project before taking an irreversible action.

If `Dashboard load failed` appears, treat the displayed summaries as potentially
stale or unavailable and open the relevant underlying page to investigate.

## Related pages

- [Jobs And Approvals](jobs-and-approvals)
- [Failed-Run Diagnostics](failed-run-diagnostics)
- [Monitoring](monitoring)
