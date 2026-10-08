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
| Operational overview | Running work, queued work, and jobs that need attention. |
| Attention queue | Individual jobs that need investigation or a human decision. |
| Model spend | Recorded model spend, with project, workflow, and agent breakdowns. |
| Move the work forward | Shortcuts available to your role, such as projects and workflow building. |

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

## Related pages

- [Jobs And Approvals](jobs-and-approvals)
- [Failed-Run Diagnostics](failed-run-diagnostics)
- [Monitoring And Troubleshooting](monitoring-and-troubleshooting)
