---
sidebar_position: 3
title: MCP Reference
description: Built-in Flow Steward MCP tool groups and how they are used.
---

# MCP Reference

Flow Steward exposes an MCP server for agents and developer tools that need
structured access to projects, workflows, jobs, reports, and
notifications.

This page describes the built-in Flow Steward MCP tools. The user-facing guide
for registering external MCP catalogs is [Tools And MCP](../user/tools-and-mcp).
`tools/list` is the exact JSON Schema source for MCP clients. The tables below
are a human navigation map, not a replacement for the live tool schemas.

## Authentication and scope

MCP clients authenticate with a platform PAT or machine token:

```bash
export MCP_BEARER_TOKEN=<platform_pat_or_machine_token>
```

Tools forward the original bearer token to the application API, which enforces
the operation's role/capability policy, account/tenant boundary, and project
and workflow allowlists. Request-local discovery uses any-of token scopes from
the canonical tool-scope mapping. A listed tool can still reject an argument
the caller is not authorized to use.

## Recommended tool order

Start with `project_list` to select an accessible project. Project-profile and
Knowledge Base tools are not part of the current built-in server.

For workflow work:

1. `workflow_list`
2. `workflow_entrypoint_list`
3. `workflow_validate`
4. `workflow_contract`
5. `workflow_suggestions`
6. `workflow_trigger` or `trigger_workflow_entrypoint`
7. `job_status`
8. `job_logs`, `job_messages`, `job_errors`

## Project context boundary

The built-in server does not expose `kb_search`, `kb_write`,
`project_profile_get`, or `project_profile_update`. Project rules and assigned
data connections can still feed internal runtime context; this does not create
a public knowledge-management API. Repository code-index/search/graph and
database-schema index tools are also absent.

See [Project Context](../user/project-knowledge-and-code-intelligence) for the
current boundary.

## Tool groups

### Projects

| Tool | Purpose |
|---|---|
| `project_list` | List visible projects. |
| `project_jobs` | List jobs for a project. |

### Workflows

| Tool | Purpose |
|---|---|
| `workflow_list` | List workflows. |
| `workflow_entrypoint_list` | List workflow entrypoints. |
| `workflow_validate` | Validate a workflow. |
| `workflow_contract` | Read workflow contract details. |
| `workflow_suggestions` | Get workflow improvement suggestions. |
| `workflow_trigger` | Start an explicit project/workflow with declared inputs in `payload`, or invoke a published `entry_key`. |
| `trigger_workflow_entrypoint` | Trigger a named entrypoint. |

### Workflow Authoring

| Tool signature | Purpose |
|---|---|
| `capability_search(project_name, query, kinds=None, limit=12)` | Search permitted local components and report knowledge freshness. |
| `capability_describe(project_name, ref, operation_id="")` | Inspect live contracts and permitted connection readiness. |
| `workflow_examples_search(project_name, query, limit=5)` | Find accessible local workflows for reuse; exports follow existing policy. |
| `workflow_authoring_schema(step_kind=None)` | Return the canonical bundle sample and persisted step fields. |
| `workflow_draft_validate(project_name, bundle_yaml, resolutions=None)` | Validate without persistence or execution. |
| `workflow_draft_save(project_name, bundle_yaml, resolutions=None)` | Atomically create one disabled draft; never overwrite. |

Use the existing `platform.workflow_bundle.v1` format with one explicit workflow ID
and only `use_existing` or `map_existing` resolutions. Validation and save share
application preparation and validation. Save requires administrator creation
authority; an admin user's scoped PAT needs `admin:all`, project-name resolution
needs `projects.read`, and machine tokens remain operators. Keep the same ID on retry;
inspect conflicts rather than automatically renaming. Drafts are inspected with
`workflow_list(..., enabled_only=false)` or the editor: project-scoped
`capability_describe` and `workflow_contract` currently return 404 for disabled workflows.
These tools do not install dependencies, enable or run drafts. Enable deliberately
after human review before editor Test Run, which may cause external effects.

### Job Diagnostics

| Tool | Purpose |
|---|---|
| `job_list(project_id="", workflow_id="", status="", group_by="", search="", page=1, per_page=25)` | List scoped jobs; `group_by="attention"` returns a bounded triage snapshot and ignores pagination. |
| `job_approvals_pending()` | Find pending approvals in the current scope; failures remain errors. |
| `job_result` | Read normalized job result. |
| `job_status` | Read current job status. |
| `job_runtime_journal` | Read runtime journal. |
| `job_decision_overrides` | Read durable decision overrides applied to the job. |
| `job_errors` | Read job errors. |
| `job_trace` | Read execution trace. |
| `job_incident` | Read incident-oriented context. |
| `job_cost_breakdown` | Read job cost data. |
| `job_events` | Read job events. |
| `job_messages` | Read agent and connector messages. |
| `job_logs` | Read logs. |
| `job_approval` | Read active approval state. |
| `job_approvals` | List approval history. |

For a complete inventory, use ungrouped `job_list` and follow `total_pages`.
The tool has no date arguments: filter returned timestamps locally, identify the
queued/started/finished timestamp defining the interval, and disclose partial
pages or changing results. Constrain pending-approval results to the requested
project/workflow; read errors do not establish an empty list.

### Job Controls

| Tool | Purpose |
|---|---|
| `job_cancel` | Cancel a job. |
| `job_acknowledge` | Acknowledge a job or alert state. |
| `job_unacknowledge` | Remove acknowledgement. |
| `job_restart` | Restart a job. |
| `job_approval_decide` | Approve or reject an approval gate. |

### Reports And Notifications

| Tool | Purpose |
|---|---|
| `report_generate(report_type, params=None, persist=true)` | Generate a report; `params.workflow_id` filters `activity_daily`, `project_summary` and `project_stats` alongside project/date filters. |
| `report_get` | Fetch a persisted report. |
| `project_notification_routes` | Read project notification routes. |
| `project_notification_deliveries` | Read notification deliveries. |
| `dispatch_project_notification` | Dispatch a project notification. |

### Operational report periods

Use `activity_daily`, `project_summary` or `project_stats` with
`params.project_id`, exact `params.workflow_id`, and either `params.range` or
both ISO `params.start_date`/`params.end_date`. `job_summary` uses `params.job_id`.
These are operational reports; incidental cost fields do not establish complete
financial reporting. `report_get(report_id)` reads an accessible persisted report.

`range="7d"` (also the default) is a rolling 168-hour UTC window. Explicit dates
cover inclusive UTC calendar days, including the end date through the next midnight
UTC. Set the requested period explicitly and label its timezone. For exact local
“today”, convert that local day to UTC and filter complete ungrouped job pages;
UTC-day aggregates cannot establish an exact local-day result.

`report_generate` requires `reports.write` or an accepted broader scope even
with `persist=false`. That flag avoids storage; it is not an authorization bypass.
Return actual filters, window, coverage and report ID when persisted.

## Safety

Treat MCP tools as operational capabilities. Use read tools first, inspect
context, then call write/control tools only when the role, scope, and expected
effect are clear.

The current server registers 40 tools, matching
`core/entrypoints/mcp/server_tool_scopes.py`. Discovery is request-local and filters
tools by any-of token scopes before returning `tools/list`; the application API
still enforces role, tenant, project, workflow, and capability policy on every
call. Read families use `jobs.read`, `projects.read`, `workflows.read`,
`reports.read`, or `notify.read`; mutating families use
the corresponding write/dispatch scope. Wildcards and `admin:all` follow the
platform token rules.
