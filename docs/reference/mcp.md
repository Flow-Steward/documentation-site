---
sidebar_position: 3
title: MCP Reference
description: Built-in Flow Steward MCP tool groups and how they are used.
---

# MCP Reference

Flow Steward exposes an MCP server for agents and developer tools that need
structured access to projects, workflows, agents and skills, jobs, reports, and
notifications.

This page describes the built-in Flow Steward MCP tools. The user-facing guide
for registering external MCP catalogs is [Tools And MCP](../user/tools-and-mcp).
`tools/list` is the exact JSON Schema source for MCP clients. The tables below
are a human navigation map, not a replacement for the live tool schemas.

## Authentication and scope

Clients on your computer (Claude Code, Codex, Cursor, Gemini CLI) authenticate
with a personal access token or a machine token sent as
`Authorization: Bearer <token>`. Cloud apps (Claude.ai, Cowork, ChatGPT) sign in
through OAuth and receive short-lived access tokens bound to this installation's
`/mcp` address; they need a public HTTPS address and an administrator's
permission. See [Connect AI Agents](../integrations/connect-ai-agents).

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
| `project_jobs(project_name, limit=10, page=1, status="")` | List the project's jobs you may see, newest first, one page of `limit` (at most 50). `status` takes one status, a comma list or a status group key; `total` and `total_pages` tell whether more pages exist. |

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
| `workflow_export(project_name, workflow_id, include_children=false, reference_only=false)` | Export a workflow linked to the project as a YAML bundle, returned as `bundle_yaml` text. |
| `workflow_import(project_name, bundle_yaml, target_workflow_id="", resolutions=None)` | Import a YAML bundle into the project as disabled draft workflows. Needs `admin:all`. |

### Agents, Skills And Models

These tools manage the account's agents and skills, the same objects as
**Registry > Agents** and **Registry > Skills**. Every call needs an
administrator user, and a token needs `admin:all`, reads included. The two
schema tools need `read:*` or `admin:all`; `model_options` needs
`registry.read`, `registry:*` or `admin:all`.

| Tool signature | Purpose |
|---|---|
| `agent_authoring_schema()` | JSON Schemas of the agent create body and the `changes` patch, with the merge rules. |
| `skill_authoring_schema()` | JSON Schemas of the skill create body and patch, and the item schema of inputs and outputs. |
| `agent_list(search=None, enabled_only=false)` | List agents, disabled ones included by default. |
| `agent_get(agent_id)` | Read one agent's editable settings with its assigned skills and tools, even when it is disabled. |
| `agent_create(agent)` | Create one agent under exactly `agent["agent_id"]`; it is saved disabled by default. |
| `agent_update(agent_id, changes)` | Change only the fields in `changes`. `null` never clears a field; `config` and `prompts` merge shallowly; empty `config.provider`/`config.model` inherit the project route. |
| `agent_validate(agent_id)` | Check readiness without changing anything. |
| `agent_set_enabled(agent_id, enabled)` | Set the enabled state exactly (never a toggle). Enabling needs a valid readiness result; disabling is refused while enabled workflows run the agent. |
| `agent_skill_assign(agent_id, skill_id, skill_prompt=None)` | Assign a skill, with optional agent-specific instructions. |
| `agent_skill_unassign(agent_id, skill_id)` | Remove a skill from an agent. |
| `agent_skill_set_instructions(agent_id, skill_id, skill_prompt)` | Replace the instructions of one assigned skill. |
| `skill_list(search=None, enabled_only=false)` | List skills, disabled ones included by default. |
| `skill_get(skill_id)` | Read one skill's editable settings, even when it is disabled. |
| `skill_create(skill)` | Create one skill under exactly `skill["skill_id"]`; it is saved disabled by default. |
| `skill_update(skill_id, changes)` | Change only the fields in `changes`; every field sent replaces the stored value. |
| `skill_inputs_set(skill_id, inputs)` / `skill_outputs_set(skill_id, outputs)` | Replace the whole expected input or output list. Invalid items are refused and nothing changes. |
| `skill_validate(skill_id)` | Check readiness without changing anything. |
| `skill_set_enabled(skill_id, enabled)` | Set the enabled state exactly. Disabling is refused while enabled workflows depend on an agent using the skill. |
| `workflow_set_enabled(workflow_id, enabled, expected_revision)` | Enable or disable a workflow at the revision read with `workflow_definition`. Enabling needs a valid readiness result and does not run the workflow. |
| `model_options()` | List the LLM providers and models the account may select, without secrets. |

A create keeps the requested ID. A taken ID is refused with
`registry_id_conflict`, and a display name that a visible object of the same
type already uses with `registry_name_conflict`; renames are checked the same
way. Both answers carry the existing `matches` and a suggested free ID or name
that nothing reserves. Nothing is renamed or retried automatically. Fields have
no version check: read the object right before changing it. A valid
`*_validate` result is a static check, not proof that a run succeeds.

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
inspect conflicts rather than automatically renaming: a display name already
used by another workflow is refused with `registry_name_conflict` and its
matches. Drafts are inspected with
`workflow_list(..., enabled_only=false)` or the editor: project-scoped
`capability_describe` and `workflow_contract` currently return 404 for disabled workflows.
These tools do not install dependencies, enable or run drafts. Enable deliberately
after human review before editor Test Run, which may cause external effects.

### Job Diagnostics

| Tool | Purpose |
|---|---|
| `job_list(project_id="", workflow_id="", status="", group_by="", search="", page=1, per_page=25)` | List scoped jobs. `group_by="attention"` groups them for triage and pages like the plain list; `has_more=true` means the groups hold only this page of `total` runs. |
| `job_approvals_pending(page=1, per_page=25)` | Find pending approvals in the current scope, one page at a time (`per_page` at most 200); `total` counts the whole queue. Failures remain errors. |
| `job_result(job_id, include_messages_limit=100, include_logs_limit=50)` | Read the final or partial result. `completed` is true only for a successful run; `terminal` and `outcome` say how it ended or where it stands; `truncated` flags lists cut by the limits. |
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

`status` takes one status, a comma list (`failed,stuck`) or a status group key
that selects its whole group: `stuck` also lists `orphaned` runs, `failed` also
lists `max_iterations` and `triage_needed`. For a complete inventory, follow
`total_pages`.
The tool has no date arguments: filter returned timestamps locally, identify the
queued/started/finished timestamp defining the interval, and disclose partial
pages or changing results. Constrain pending-approval results to the requested
project/workflow; read errors do not establish an empty list.

### Job Controls

| Tool | Purpose |
|---|---|
| `job_cancel(job_id, comment="Cancelled via MCP")` | Cancel a pending, running or waiting job; the comment is kept as the reason. |
| `job_acknowledge(job_id, actor="")` | Acknowledge a job for triage. The token's user is recorded; `actor` is journaled beside it. |
| `job_unacknowledge` | Remove acknowledgement. |
| `job_restart(job_id)` | Re-enqueue a finished job with the same inputs as a new run. A run that is still running, queued or waiting (timer, child workflow, approval) is refused with `job_restart_active`; cancel it first. |
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

## Errors

A refused call is a tool error with `ok: false` and an `error` object. Its
`code` is the application's own domain code when the route has one, so the agent
can tell what to fix, for example:

| Code | Meaning |
|---|---|
| `job_restart_active` | The run is still active; cancel it before restarting. |
| `registry_id_conflict`, `registry_name_conflict` | The ID or display name is taken; `details.matches` lists the visible objects and `details.suggested_id` or `details.suggested_display_name` a free value. |
| `workflow_id_conflict` | A workflow with that ID already exists. |
| `workflow_revision_conflict` | The workflow changed since you read it; read it again and reapply. |

Otherwise `code` names the HTTP outcome: `invalid_request` (400),
`unauthorized` (401), `forbidden` (403), `not_found` (404), `conflict` (409),
`validation_error` (422),
`rate_limited` (429) or `service_unavailable` (503). `message` is a readable
sentence, `status_code` the HTTP status and `details` the route's own error
payload, such as validation `issues`. `workflow_import` returns only its
blocking dependencies. Report a permission error as an error; do not retry with
a wider token unless a person decides to.

## Safety

Treat MCP tools as operational capabilities. Use read tools first, inspect
context, then call write/control tools only when the role, scope, and expected
effect are clear.

The server registers 72 tools as of 0.9.7, matching
`core/entrypoints/mcp/server_tool_scopes.py`. Discovery is request-local and filters
tools by any-of token scopes before returning `tools/list`; the application API
still enforces role, tenant, project, workflow, and capability policy on every
call. Read families use `jobs.read`, `projects.read`, `workflows.read`,
`reports.read`, or `notify.read`; mutating families use
the corresponding write/dispatch scope. Agent and skill tools and
`workflow_set_enabled` need `admin:all`. Wildcards and `admin:all` follow the
platform token rules.
