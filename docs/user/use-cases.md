---
sidebar_position: 2
title: Use Cases
description: Common ways teams use Flow Steward.
---

# Use Cases

Flow Steward is useful when repeatable workflow operations should be automated,
but not hidden. The platform keeps work visible through jobs, workflows, agents, tools,
datasets, events, and approval gates.

## Manage one client with several projects

Use this when one client, department, or team has several systems that should be
managed together but controlled separately.

Example: one client workspace can contain a CRM project, public website project,
billing service project, and reporting pipeline project. Each project can have
its own workflows, jobs, project rules, notification routes, and dataset bindings.
The workspace keeps shared data connections and registry context in one place.

Typical flow:

1. Create a workspace for the client or operating boundary.
2. Add one project for each delivery target.
3. Add workspace data connections for shared sources such as CRM, analytics,
   issue tracker, or warehouse data.
4. Create datasets with narrow resource and column selections.
5. Use `All workspace projects` only for data that every project can safely
   query.
6. Use `Specific projects only` for data that belongs to one service, team, or
   workflow family.
7. Bind workflows to the projects where they are allowed to run.
8. Review scoped project rules and data connections so workflow agents get the
   intended context.
9. Move projects between workspaces only when the ownership boundary changes,
   then review datasets, data connections, workflow bindings, and notification
   routes.

Why it matters:

- client-level context stays organized;
- project-level automation remains precise;
- shared sources can be reused without exposing every table to every workflow;
- lifecycle actions such as trash, restore, and reassignment are easier to
  reason about.

Useful docs:

- [Workspaces And Projects](workspaces-and-projects)
- [Datasets And Data Connections](datasets-and-data-connections)
- [Workflows](workflows)
- [Trash And Lifecycle](trash-and-lifecycle)

## Automate a controlled operation

Use this when a repeated process needs visible execution and human review,
such as data enrichment, validation, notification, or an external-system action.

1. Register the project and review its rules and assigned data connections.
2. Configure the required extensions and project connections.
3. Create a workflow with explicit input/output and side-effect contracts.
4. Validate it and use only disposable data for an initial test.
5. Start an explicit workflow through the API, MCP, or a configured entrypoint.
6. Review job logs, artifacts, and approval gates.
7. Preserve verified lessons in your team's documentation.

Core orchestrates declared agents, steps, and provider operations. It does not
write application code or offer built-in repository search/indexing. An external
provider's abilities are not implicit core capabilities.

## Reuse project context

Maintain project rules and assigned data connections through project settings.
Inspect current job evidence and workflow contracts before relying on an earlier
result. Internal memory supports the runtime, but the public project KB page and
`kb_search`/`kb_write` tools are no longer available.

See [Project Context](project-knowledge-and-code-intelligence),
[Workspaces And Projects](workspaces-and-projects), and
[Jobs And Approvals](jobs-and-approvals).

## Start with a ready-made workflow

Use the **Workflow Catalog** when you want to start from reusable automation
instead of building every phase and step yourself. Catalog entries can cover real
operational tasks as well as examples. Demo data is not required.

Typical flow:

1. Open `Registry > Workflows > Create workflow > From catalog`.
2. Find a workflow and review its purpose, included child workflows, integrations,
   compatibility, and setup requirements.
3. As an administrator, choose **Use this template**, select a project, and
   resolve the dependency preflight and workflow-ID conflicts.
4. Create the disabled draft or drafts and open the resulting workflow.
5. Configure connections and credentials, validate, and review bindings, triggers,
   and declared external effects before enabling it.
6. Run an administrator **Test Run** in a suitable project, then open `Jobs`
   and inspect messages, logs, approvals, artifacts, and final output. Test mode
   can still call real external services.
7. Operators use the administrator-provisioned workflow through API, MCP, or
   configured triggers with the required authority.

The **Extension Catalog**, available under `Extensions > Marketplace`, supplies
separately installable integrations and capabilities. Install and configure the
extensions required by your workflow. Catalog contents grow as Flow Steward and
community contributors publish new releases; the current list is shown in the
application. A local workflow remains your independent copy when the catalog changes.

Useful docs:

- [Workflow and Extension Catalogs](workflow-and-extension-catalogs)
- [First Workflow](first-workflow)
- [Workflows](workflows)
- [Extensions](extensions)

## Run a controlled QA or review pass

Use this when a human wants evidence before authorizing an operational change.

Typical flow:

1. Choose a validation, evidence review, or readiness workflow.
2. Confirm the workflow has the needed tools.
3. Run the workflow against a target project or job.
4. Review findings, test results, and generated reports.
5. Convert accepted findings into follow-up work.

Useful docs:

- [Agents And Skills](agents-and-skills)
- [Tools And MCP](tools-and-mcp)
- [Monitoring And Troubleshooting](monitoring-and-troubleshooting)

## Author a disabled workflow through MCP

Connect an external agent using the [MCP quick start](../integrations/built-in-mcp-quick-start).
Use local workflows before composing new structure:

1. Call `workflow_examples_search(project_name, query)` and inspect suitable workflows.
2. Use `capability_search(project_name, query)` and `capability_describe(project_name, ref, operation_id)` to obtain live contracts and permitted connection readiness.
3. Get `workflow_authoring_schema(step_kind)` and author exactly one explicit workflow ID in the existing `platform.workflow_bundle.v1` format.
4. Call `workflow_draft_validate(project_name, bundle_yaml, resolutions)`; only `use_existing` and `map_existing` resolutions are supported.
5. When validation permits saving and the user requests a draft, call `workflow_draft_save` with the same bundle and ID.

Save creates a disabled draft atomically and does not overwrite existing workflows,
install dependencies, enable, execute, schedule or publish. Creation requires existing
administrator authority; machine tokens remain operators. Read access and launch grants
are not creation grants. Validation reports unperformed execution checks separately.
Inspect a saved draft in the manual editor or `workflow_list` with `enabled_only=false`.
A user reviews and enables it when appropriate before Test Run; Test Run can cause
external effects. See [MCP Reference](../reference/mcp#workflow-authoring) for exact arguments.

## Operate long-running AI work

Use this when jobs may run for minutes or hours and need human oversight.

Operators can:

- see current job status;
- inspect logs and messages;
- acknowledge attention states;
- approve or reject gates;
- cancel unsafe work;
- restart recoverable failures;
- review events and traces.

Useful docs:

- [Jobs And Approvals](jobs-and-approvals)
- [Monitoring And Troubleshooting](monitoring-and-troubleshooting)
- [MCP Reference](../reference/mcp#job-diagnostics)

## Recover stuck or interrupted work with watchdog

Use this when a worker crashes, a job stops making progress, an approval is left
unhandled, or a long-running job looks orphaned.

Typical flow:

1. Open `Monitoring`.
2. Check services, queues, and process health.
3. Open the affected job and read messages, logs, runtime journal, and errors.
4. Run or inspect the watchdog scan.
5. Confirm whether the job is stuck, orphaned, interrupted, or healthy.
6. Choose a recovery action only after reading the evidence.
7. Retry recoverable work or cancel unsafe work.
8. Reopen the job and confirm the new lifecycle state.

Why it matters:

- long-running AI jobs can fail because the worker or host failed, not because
  the task itself is invalid;
- watchdog separates detection from recovery so operators can review evidence;
- runtime journal entries make recovery auditable.

Useful docs:

- [Monitoring And Troubleshooting](monitoring-and-troubleshooting#watchdog)
- [Jobs And Approvals](jobs-and-approvals)
- [Feature Configuration](feature-configuration#logs-retention-trash-and-watchdog)

## Add structured data to workflows

Use this when a workflow needs access to databases or structured sources, but the
team wants scoped data exposure.

Typical flow:

1. Install or enable an extension that provides dataset connectors.
2. Add a data connection.
3. Test and introspect the connection.
4. Create a dataset from selected resources and columns.
5. Attach the dataset to one or more projects.
6. Use a `dataset_query` workflow step.

Useful docs:

- [Datasets And Data Connections](datasets-and-data-connections)
- [Workflow Step Kinds](../reference/workflow-step-kinds)

## Protect sensitive data in jobs and logs

Use this when tasks, webhook payloads, datasets, tool calls, or agent messages
may include personal identifiers or secrets.

Typical flow:

1. Open security or project policy settings.
2. Enable security policy for the relevant project or account.
3. Choose a policy level such as minimal, standard, or strict.
4. Choose how PII should be handled: pseudonymize, hard redact, or allow with
   detection.
5. Enable detectors such as person name, email, phone, SSN, credit card, IPv4,
   or IPv6.
6. Add custom regex rules for organization-specific identifiers.
7. Configure deployment-level redaction keys for extension payloads and traces.
8. Run a low-risk workflow with sample sensitive values.
9. Inspect job messages, logs, traces, and artifacts to confirm redaction.

Use pseudonymization when agents still need stable references across a run. Use
hard redaction when sensitive values should not be visible in persisted logs or
messages.

Useful docs:

- [Feature Configuration](feature-configuration#pii-and-security-policy)
- [Environment Variables](../reference/environment-variables)
- [Monitoring And Troubleshooting](monitoring-and-troubleshooting)

## Copy a workflow between environments

Use this when a workflow was created locally or in staging and should move to a
shared development or production Flow Steward instance.

Typical flow:

1. Finish the workflow in the source environment.
2. Validate it and run a workflow test run.
3. Export the workflow YAML from the workflow header.
4. Open the target environment.
5. Import the YAML from `Registry > Workflows > Import`.
6. Run preflight and resolve missing dependencies.
7. Map environment-specific projects, child workflows, datasets, connections,
   extensions, or tools.
8. Import the workflow as a disabled draft.
9. Validate and review settings, credentials, trigger channels, project
   bindings, schedules, webhooks, and side effects.
10. Do not promise an execution Test Run while disabled: the backend rejects it
    with HTTP 422. Use an isolated provider-free fixture for target execution,
    or wait for the application limitation to be resolved.

Useful docs:

- [Workflows](workflows#export-and-import-workflows)
- [Workflow Step Kinds](../reference/workflow-step-kinds)
- [Developer Integrations](../developer/integrations)

## Receive an incoming webhook

Use this when an external system should start a Flow Steward workflow, for
example an issue tracker, CI pipeline, support queue, monitoring system, or
provider callback.

Typical flow:

1. Define the workflow's expected inputs.
2. Bind the workflow to an enabled project.
3. Open `Workflow settings > Triggers`.
4. Create an incoming webhook.
5. Choose auth, content-type, payload-size, idempotency, and source-IP policy.
6. Map payload selectors such as `body.title` or `headers.X-Request-Id` to
   workflow inputs.
7. Copy the generated public URL and one-time credential reveal.
8. Configure the source system.
9. Dry-run a sample payload.
10. Watch the created job and webhook delivery evidence.

Useful docs:

- [Workflows](workflows#incoming-webhooks)
- [Jobs And Approvals](jobs-and-approvals)
- [Developer Integrations](../developer/integrations)

## Connect external tools through MCP

Use this when another system exposes a tool catalog and Flow Steward should call
selected tools from workflows or agents.

Typical flow:

1. Register an MCP connector.
2. Sync the remote catalog.
3. Health-check the connector.
4. Open the connector detail page.
5. Allowlist only the tools that should be available.
6. Run a low-risk workflow to confirm behavior.

Useful docs:

- [Tools And MCP](tools-and-mcp)
- [MCP Reference](../reference/mcp)

## Clean up logs, trash, and old runtime evidence

Use this when the system should keep enough evidence for audit and debugging
without keeping everything forever.

Typical flow:

1. Open `Settings > Retention`.
2. Set how long to keep action logs, job logs, trash, events, messages, jobs, and
   retry queue records.
3. Confirm the values match your compliance and support needs.
4. Use `Trash` to restore accidental deletes before the trash retention window
   expires.
5. Plan permanent deletion only after checking dependent workflows, projects,
   datasets, connections, and jobs.
6. Run or schedule retention cleanup according to your operator runbook.
7. Review monitoring and storage health after cleanup.

Why it matters:

- logs and runtime evidence are useful during incidents;
- old evidence can become costly or sensitive;
- trash gives operators a recovery window before permanent deletion;
- retention settings make cleanup predictable instead of ad hoc.

Useful docs:

- [Trash And Lifecycle](trash-and-lifecycle)
- [Feature Configuration](feature-configuration#logs-retention-trash-and-watchdog)
- [Settings And Model Providers](settings-and-model-providers)

## Safely delete or reorganize workspaces and projects

Use this when a team, workspace, project, or workflow ownership model changes.

Typical flow:

1. Open the workspace or object you want to remove.
2. Choose the delete or lifecycle action.
3. Review the generated plan before confirming.
4. For a workspace, decide whether each active child project should move to
   another workspace or move to trash with the workspace.
5. For hard delete, review the dependency tree and selected nodes.
6. Unselect anything that should not be permanently deleted.
7. Resolve direct dependency conflicts before executing the plan.
8. Confirm deletion only after the plan matches the intended ownership change.
9. Use `Trash` to restore soft-deleted objects when needed.

Examples:

- delete an empty workspace;
- move selected projects to another workspace before trashing the old workspace;
- restore a deleted workflow, skill, tool, dataset, or project;
- hard-delete only after linked workflows, datasets, jobs, and connections no
  longer need the object.

Useful docs:

- [Trash And Lifecycle](trash-and-lifecycle)
- [Workspaces And Projects](workspaces-and-projects)
- [Registry Management](registry-management)

## Build a provider integration

Use this when a team needs task intake, notification delivery, callbacks, tool
actions, or dataset connectors from a provider.

Typical flow:

1. Scaffold an extension.
2. Define the manifest and schemas.
3. Validate and test the extension.
4. Install it in Flow Steward.
5. Enable it and run health checks.
6. Configure callbacks or routes.

Useful docs:

- [Extensions](extensions)
- [Developer Extensions](../developer/extensions)
- [CLI Reference](../reference/cli)

## Administer access and automation identities

Use this when the platform owner needs to control who can read, operate, or
administer Flow Steward.

Typical flow:

1. Create users.
2. Assign viewer, operator, or admin roles.
3. Create service accounts for automation.
4. Scope service account tokens by project, workflow, and permission.
5. Rotate tokens and revoke retired credentials.

Useful docs:

- [Users, Roles, And Access](users-roles-and-access)
- [Settings And Model Providers](settings-and-model-providers)
