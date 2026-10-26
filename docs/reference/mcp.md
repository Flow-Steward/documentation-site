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
2. `workflow_validate`
3. `workflow_contract`
4. `workflow_suggestions`
5. `workflow_trigger`
6. `job_status`
7. `job_logs`, `job_messages`, `job_errors`

Published webhook entrypoints are not an MCP surface: external systems call
`/webhook/workflows/{entry_key}`, and MCP clients launch a workflow directly by
project and workflow ID with `workflow_trigger`.

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
| `workflow_list(project_name, enabled_only=true, include_validation=false)` | List workflows linked to a project. |
| `workflow_validate(workflow_id, project_name="")` | Validate workflow readiness and contract issues. |
| `workflow_contract(workflow_id, project_name)` | Read the normalized public workflow contract. |
| `workflow_suggestions(workflow_id, project_name="")` | Get repair suggestions for one workflow. |
| `workflow_trigger(project_name, workflow_id, payload=None, client_context=None, test_mode=false, files=None)` | Start a workflow in a concrete project. Pass declared inputs in `payload`. File inputs go in `files` (`input_name`, `filename`, `mime_type`, strict `content_base64`; up to 10 files, 1 MiB decoded in total). Returns `job_id`. |
| `workflow_stats(project_name, workflow_id)` | Show run statistics of a workflow linked to the project. |

### Workflow Editing

`workflow_definition` needs `workflows.read` or a registry read scope. The
two change tools need `admin:all`.

| Tool signature | Purpose |
|---|---|
| `workflow_definition(workflow_id)` | Read the current steps, groups, execution graph and `revision`. |
| `workflow_apply_changes(workflow_id, expected_revision, operations, dry_run=false)` | Apply one atomic change set of step, group and graph operations; `dry_run` judges it without saving. A stale `expected_revision` is refused. |
| `workflow_convert_group(workflow_id, group_id, child_workflow_id, display_name, expected_revision, dry_run=true, preview_digest="")` | Preview extracting a group into a child workflow (the default); apply with `dry_run=false` and the current `preview_digest`. |

### Workflow Hooks

| Tool signature | Purpose |
|---|---|
| `workflow_hooks_list(project_name, workflow_id)` | List the hooks a workflow declares and their bindings in the project. |
| `workflow_hook_get(project_name, workflow_id, hook_id)` | Show one hook's contract and binding. |
| `workflow_hook_preview(...)` | Check a hook binding without saving it; returns every issue a save would refuse. Needs `admin:all`. |
| `workflow_hook_bind(...)` | Connect a callable workflow to a hook (next binding revision). Needs `admin:all`. |
| `workflow_hook_unbind(project_name, workflow_id, hook_id, expected_revision)` | Disconnect the hook's workflow; new runs pass the hook inputs through. Needs `admin:all`. |
| `workflow_hook_create_and_bind(project_name, workflow_id, hook_id, expected_revision, child_workflow_id, display_name="")` | Create the empty workflow that holds a hook's steps and connect it. Needs `admin:all`. |
| `workflow_where_used(project_name, workflow_id, locale="")` | List the Invoke steps and hook bindings in the account that call the workflow. |

`workflow_hook_preview` and `workflow_hook_bind` take `project_name`,
`workflow_id`, `hook_id`, `expected_revision`, `target_workflow_id`, and
optional `input_mapping`, `output_mapping`, `hook_contract_version`,
`hook_semantic_digest` and `release_id`; preview also accepts `sample`.

### Workflow Export And Import

| Tool signature | Purpose |
|---|---|
| `workflow_export(project_name, workflow_id, include_children=false)` | Export a workflow linked to the project as a YAML bundle, returned as `bundle_yaml` text. |
| `workflow_import(project_name, bundle_yaml, target_workflow_id="", resolutions=None)` | Import a YAML bundle into the project as disabled draft workflows. Needs `admin:all`. |

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

The current server registers 51 tools, matching
`core/entrypoints/mcp/server_tool_scopes.py`. Discovery is request-local and filters
tools by any-of token scopes before returning `tools/list`; the application API
still enforces role, tenant, project, workflow, and capability policy on every
call. Read families use `jobs.read`, `projects.read`, `workflows.read`,
`reports.read`, or `notify.read`; mutating families use
the corresponding write/dispatch scope. Wildcards and `admin:all` follow the
platform token rules.
