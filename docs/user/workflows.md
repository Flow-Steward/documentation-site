---
sidebar_position: 6
title: Workflows
description: Create, run, test, and maintain Flow Steward workflows from the UI.
---

# Workflows

A workflow is an executable delivery plan made of phases, steps, conditions, and
runtime controls. Operators use workflows to turn repeatable work into a
controlled process.

## Create a workflow

[![Local workflow list showing workflow records and their states](/img/screenshots/2026-10-04/workflows-catalog.png)](/img/screenshots/2026-10-04/workflows-catalog.png)

*The local workflow list opens workflows already in this installation. Create workflow provides access to the separate Workflow Catalog. The records shown are synthetic test data.*

1. Open `Registry`.
2. Open `Workflows`.
3. Choose the create action or open an existing workflow to clone or edit.
4. Set a stable workflow ID, display name, and description.
5. Add phases that match the real work sequence.
6. Add steps inside each phase.
7. Configure project bindings when only some projects may run it.
8. Validate the workflow.
9. Run a test job before using the workflow for production work.

[![Workflow overview with status, validation, and workflow actions](/img/screenshots/2026-10-04/workflow-overview.png)](/img/screenshots/2026-10-04/workflow-overview.png)

*A draft workflow overview. A draft or disabled record is not evidence that validation, project binding, or a Test Run succeeded.*

## Start from the Workflow Catalog

The **Workflow Catalog** contains ready-made reusable workflows, including
operational automation and examples from Flow Steward and community contributors.
It is available through **Create workflow > From catalog**, with a **From scratch**
alternative. Operators can browse; creating a workflow requires an administrator.
Standard configuration uses the official catalog. If it is disabled, creation
opens the ordinary form.

Open an entry, review its requirements, then choose **Use this template**. Select
a project and resolve the dependency preflight before **Create draft**. Catalog
creation uses the import portability checks and saves independent disabled drafts,
including bundled children. Configure connections and credentials, validate, and
review triggers and effects before enabling and testing them. Later catalog
updates do not overwrite your local workflows.

See [Workflow and Extension Catalogs](workflow-and-extension-catalogs) for the
full procedure and how to contribute your own workflow.

A full export can carry invoked child workflows in the same bundle. Import
handles children before their callers and remaps references; review the entire
bundle and its dependency decisions, not just the root workflow. Clones also
start disabled.

## Use the canvas builder


Open the workflow `Overview`, then choose `Open builder`.

The builder lets you:

- add phases from the canvas;
- add steps inside a phase;
- drag paths from step outputs to phase entries;
- stage topology changes before saving;
- create branch phases for `if` and `switch` decisions;
- inspect selected steps and connections;
- save staged canvas changes when the graph is correct.

Canvas edits are staged until you press `Save`; leaving the builder does not
publish unsaved topology changes.

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

## Common step types

| Step kind | Use it when |
|---|---|
| `agent` | An AI role should reason, write, review, or decide. |
| `connector` | A registered tool or extension action should run. |
| `http_request` | The workflow must call an HTTP endpoint. |
| `dataset_query` | The workflow needs scoped data from a dataset. |
| `transform` | The workflow needs deterministic data shaping. |
| `tabular_feed` | The workflow needs bounded row-oriented feed processing. |
| `invoke_workflow` | A reusable child workflow should run. |
| `if` | One condition chooses between two paths. |
| `switch` | Several named cases route to different paths. |
| `set_variable` | The workflow needs to write state for later steps. |
| `for_each` | Execute a supported inline body for each collection item. |
| `batch` | Group collection data into chunks; it does not by itself execute an arbitrary operation per chunk. |
| `stop_success` | The workflow should end successfully at this point. |
| `stop_fail` | The workflow should end as failed at this point. |

See [Workflow Step Kinds](../reference/workflow-step-kinds) for the reference
view.

## Place approvals before later effects

A phase gate evaluates after that phase's steps complete. To require human
approval before an external action, put the review work and gate in one phase,
and put the action in the following phase. A gate cannot undo effects already
performed by steps in its own phase. Separate step-autonomy policy may impose
its own approvals; it does not change phase-gate timing.

## Run a workflow

Use the administrator **Test Run** in the workflow builder, the public
workflow-run API, built-in MCP `workflow_trigger`, or a configured webhook or
provider trigger. Each path requires the matching workflow trigger channel,
project binding, role, and declared inputs.

The public CLI has workflow discovery/validation commands but no task-submit or
workflow-run command.

## Test a workflow from the workflow page

This path requires an administrator because **Test Run** opens the guarded
builder route. Operators can launch a pre-provisioned enabled workflow through
the public API, MCP, or a configured trigger with the appropriate authority.

Use this path for the first run, after edits, and before enabling a workflow for
regular operators.

1. Open `Registry`.
2. Open `Workflows`.
3. Select the workflow.
4. Confirm the header shows the workflow as enabled and valid, or review any
   validation warnings first.
5. If the workflow needs a project context, check that a project is already
   linked in the URL or in the workflow page. If not, use the `Project context`
   selector in the test-run drawer.
6. Choose `Test Run` from the workflow header.
7. Fill `Test Run Summary` with the request you want the workflow to handle.
8. Fill any generated `Workflow inputs`. Required inputs are marked in the
   drawer.
9. Choose `Test Run`.
10. Follow the accepted job in the embedded **Job Details** view or open its
    full Job Details page.

The durable job view can show:

- final status;
- workflow ID and project ID;
- execution ID or ephemeral session label;
- final report;
- final result preview;
- approval decision controls;
- final outputs;
- final artifacts;
- per-step trace rows;
- raw payload details for debugging.

Submission returns a durable job/thread asynchronously. The older **Latest
workflow test run** result panel is a fallback only when no job ID is available;
do not rely on its approval controls for the normal queued-job path. Approval
labels in Job Details depend on the active gate kind.

`Test Run` can execute real model calls, tool calls, dataset queries, HTTP
requests, child workflows, and extension actions. Use demo data or a low-risk
project until the workflow contract is trusted.

Before choosing **Run workflow test run** or **Run step test run**, review the
selected steps, target URLs, credentials, and inputs. HTTP steps can send real
requests, including writes, and configured model calls may incur provider costs.
Only extension effects declared with `test_mode_behavior: suppress` are
suppressed through the host's effect-suppression path; this is not a universal
runtime sandbox and does not suppress every extension action or HTTP step.

## Start an explicit workflow run

1. Select an existing project and its bound, enabled workflow.
2. Inspect the workflow contract and fill its required inputs.
3. Use `POST /api/workflow-runs` or MCP `workflow_trigger`. The HTTP request uses
   `project_id`, `workflow_id`, and `inputs`; MCP uses `project_name`,
   `workflow_id`, and `payload`.
4. Ensure the workflow admits the `mcp` trigger channel and the token has
   `workflows.write` plus required project/workflow access.
5. Follow the returned `job_id` in Jobs or through the job-read tools.

The HTTP API supports a stable `Idempotency-Key` for identical retries.
`test_mode` can still invoke configured models, tools, connectors, and external
services. See the [Public API Quick Start](../integrations/public-api-quick-start).

## Manage scheduled runs

The project **Scheduled jobs** page lists existing schedules and recent runs.
It supports run-now, enable/disable, and deletion. Administrators can choose a
linked workflow there to open its schedule editor; workflow authoring controls
are not available to operators or viewers. The retired project submission
dialog is no longer a way to create a schedule.

To create or edit a schedule, open the linked workflow from its project and use
`Settings > Smart setup`. Enable its interface, allow the `Schedule` trigger,
and save those settings. The saved workflow and interface must be enabled;
an unsaved trigger selection is not sufficient. The `Schedules` section shows
`New schedule` and `Edit` only in a valid linked project context.

Enter values for the workflow inputs that need caller-supplied values; fixed
defaults are applied automatically. Input definitions belong in workflow
settings, not in the schedule editor. Choose a timezone and a friendly repeat
pattern or custom cron, and use `Preview next runs`. Leave the
schedule paused for a controlled setup check, then save it and inspect the
project's `Scheduled jobs` list. Saving workflow settings alone does not create
or enable a schedule. API clients can use the authenticated internal contract
for `/api/projects/{project_id}/scheduled-jobs`.

Scheduled runs need an explicit workflow and declared inputs admitted by its
`schedule` channel. The stored request is revalidated for execution; creating or
enabling a schedule does not bypass later workflow or credential changes.
Overlap protection is automatic for each schedule within its account and project.
There are no user-configurable concurrency scope/key, catch-up policy,
instructions, or task-summary fields in the schedule editor or its API request.
The runtime derives its run summary from the workflow. Review timezone and cron
validity, including daylight-saving boundaries, before relying on a schedule.

## Configure Automation rules

Open `Automation` at the workflow, phase, or step level and use `Add Rule`.
Choose the event, source, conditions, action, and target within that scope.
The action sets differ:

| Scope | Actions |
|---|---|
| Workflow | Resume job, Approve job, Reject job, Cancel job, Send notification. |
| Phase | Send notification. |
| Step | Retry step, Send notification. |

An enabled matching `Approve job` rule makes an automated approval decision;
it is not a request for another manual click. Approval-related reactions use the
job's thread and the event's `approval_id`, then pass through the canonical
approval service. Missing or stale gate identity does not authorize a new gate,
and the gate's allowed actions still apply. Do not use Resume job as a universal
replacement for an ordinary approval decision.

A phase's auto-approve gate setting is separate from an event-based Automation
rule. Review both before enabling automation. Start with a disabled rule and
synthetic inputs, then inspect one controlled matching event and its decision
before allowing timed work, notifications, or other external effects.

## Export and import workflows

[![Import workflow YAML page with project selection, YAML input, upload control, target ID, and disabled preflight action](/img/screenshots/2026-10-04/workflow-import-form.png)](/img/screenshots/2026-10-04/workflow-import-form.png)

*Import starts by choosing a project and supplying YAML. No file was uploaded and preflight was not run during capture.*

Use workflow export/import when you build or test a workflow in one Flow Steward
environment and then move it to another environment, such as local development,
staging, or production. For a step-by-step guide to copying workflows between environments, see
[Workflow Export and Import](workflow-promotion).

Typical export and import flow:

1. Build or update the workflow in the source environment.
2. Validate it and run at least one `Test Run`.
3. Open the workflow header and choose `Export YAML` when full export is
   available.
4. Save the exported YAML bundle outside the source environment.
5. Open the target environment.
6. Open `Registry`.
7. Open `Workflows`.
8. Choose `Import`.
9. Paste the YAML bundle into the import screen.
10. Choose `Preflight`.
11. Review dependency status before applying the import.
12. Resolve missing or conflicting references.
13. Choose `Import workflow`.
14. Open the imported workflow and run validation/preflight while it remains
    disabled.

The backend rejects an actual Test Run of a disabled workflow with HTTP 422.
This means validation can precede enablement, but execution cannot. Review
trigger channels, schedules, webhooks, bindings, credentials, and side effects
before enabling. Use an isolated provider-free fixture for target execution;
do not enable an effectful import merely to bypass the guard.

The import preflight can report these dependency states:

| State | What it means |
|---|---|
| `resolved` | The target environment already has the dependency. |
| `missing` | A referenced workflow, tool, dataset, extension, or connection is not present. |
| `conflict` | A target object exists but does not match the exported reference. |
| `requires_mapping` | You must map the exported reference to an existing target object. |
| `requires_extension_install` | Install or enable an extension before importing. |
| `requires_project_connection` | Create or map a project connection before the workflow can run. |
| `protected_reference` | The export only includes a safe reference for protected extension-owned structure. |
| `blocked` | The workflow cannot be imported until the blocking problem is fixed. |

Imported workflows are saved disabled and marked as draft portability state. That
is intentional: a workflow that works locally may point at different projects,
datasets, connections, provider credentials, or external URLs in staging or
production.

Protected extension workflows may expose `Export reference` instead of full
`Export YAML`. A reference export is useful for dependency mapping, but it does
not give operators permission to clone or edit extension-owned internals.

## Follow the run

After a browser launch:

1. Open `Jobs`.
2. Select the new job.
3. Watch status, current agent, messages, logs, errors, approvals, costs, and
   result artifacts.
4. If the job pauses for approval, read the approval packet before approving or
   rejecting.
5. If the job fails, inspect the failed step and fix the underlying dependency,
   input, or permission before retrying.

CLI equivalents are documented in [CLI Reference](../reference/cli), but the
normal operator path is through `Projects`, `Workflows`, and `Jobs`.

## Public workflow interface

The workflow interface is the contract between users, triggers, agents, and
automation. Configure it before exposing the workflow to operators or external
systems.

| Field | Purpose |
|---|---|
| `trigger_channels` | Where the workflow can be launched: UI, API, schedule, webhook, MCP, or another workflow. |
| `input_mode` | Whether inputs are free-form, schema-backed, or generated from workflow contracts. |
| `strict_inputs` | Rejects unknown or incomplete inputs when the workflow must be predictable. |
| `expected_inputs` | Named user inputs with type, label, requirement, default, and help text. |
| `output_mode` | How final outputs are exposed to the caller and UI. |
| `expected_outputs` | Named outputs that downstream users or child callers can rely on. |
| `expected_artifacts` | Files or structured artifacts the workflow should produce. |
| `side_effects` | Declares whether the workflow can write code, call external systems, send notifications, or mutate state. |

Good contracts make explicit workflow launches, `Test Run`, MCP calls, and nested workflow
invocation safer because the UI can generate the right fields and the runtime
can validate mappings earlier.

## Phases

Phases group related steps and define the control points in a workflow.

| Phase setting | Use it for |
|---|---|
| `display_name` | Human-readable phase label shown in the UI and job detail. |
| `phase_kind` | Planning, implementation, review, approval, automation, or custom phase grouping. |
| `expected_inputs` | Data that must be present before the phase runs. |
| `required_outputs` | Data or artifacts the phase must produce before it can complete. |
| `transitions_jsonb` | Allowed next phases and conditional routing. |
| `retry_policy_jsonb` | Retry count, backoff, and retryable failure classes. |
| `timeout_policy_jsonb` | Max runtime for the phase. |
| `sla_policy_jsonb` | Operator-visible timing expectations. |
| `form_config_jsonb` | UI form hints for phase inputs or approvals. |
| `on_failure` | `retry_previous`, `escalate`, or `skip`, with target/retry/replan fields where supported. |
| `gate` | Human approval, auto-approval, conditional approval, or no gate. |

Human-in-the-loop phases should show the approval packet, the proposed decision,
the data that produced the recommendation, and the consequences of approve or
reject.

## Data flow and variables

Workflow data moves through mappings rather than hidden shared state.

| Surface | What it contains |
|---|---|
| `workflow_data` | The run-level state available to later phases and steps. |
| `state.*` | Named variables written by prior steps or initialized from inputs. |
| `input_mapping_jsonb` | How a step reads workflow data into its local input contract. |
| `output_mapping_jsonb` | How a step writes local outputs back to workflow data. |
| `outputs` | User-facing or caller-facing final results. |
| `artifacts` | Files and structured outputs attached to the run. |
| `agent_messages` | Agent-visible context and trace messages. |

Agent and skill contracts are especially important: their input variables and
output variables are used by the frontend when building workflow forms and step
configuration panels.

### Small typed mapping example

Define a text workflow input named `release_version`. Map it into one step's
declared `version` input, then map that step's declared `summary` text output to
`state.release_summary`. A later step reads the named state value and the public
workflow maps it to a declared final `summary` output. Validate after every
contract or mapping change. Do not guess expression syntax or map an entire raw
provider response where one typed field is sufficient; nullability, arrays, and
object shape must match the selected step's current contract.

## Parallel lanes

Use parallel lanes only when branches have no undeclared ordering dependency.
Create the split, put independent steps in separate lanes, declare each lane's
inputs/outputs, and join them in a phase that maps both results. A lane failure
follows its configured policy; the join must not assume output from a skipped or
failed lane exists. Validate the graph, save it, then inspect per-lane results
and trace data in the job. Retired Git-worktree/parallel-merge records are not
current diagnostic surfaces. A visual parallel toggle is not
proof that the branches are data-independent or safely repeatable.

## Incoming webhooks

Incoming webhooks let external systems start a workflow without a human opening
the UI.

Use them for issue trackers, CI systems, support queues, monitoring alerts, or
any system that should trigger a workflow automatically.

Before creating the webhook:

1. Confirm the workflow is enabled.
2. Open `Workflow settings`.
3. Open the workflow interface or contract settings.
4. Add `Expected inputs` for every value the external system must provide.
5. Make sure the workflow is bound to an enabled project.
6. Confirm the deployment has a correct public base URL when callers are outside
   the local network.

Create the webhook:

1. Open the workflow.
2. Open `Workflow settings`.
3. Open `Triggers`.
4. In `Incoming Webhook`, choose `New webhook draft`.
5. Enable the webhook.
6. Add a description that names the source system, such as `GitHub issue intake`
   or `PagerDuty incident trigger`.
7. Choose an auth mode.
8. Choose allowed content types.
9. Set body, file, and file-count limits.
10. Choose whether the caller must send an `Idempotency-Key`.
11. Choose the response mode.
12. Add exact IPs or CIDR ranges when the caller has stable source addresses.
13. Map external payload fields to workflow inputs.
14. Choose `Create webhook`.
15. Copy the public URL and the one-time credential reveal.
16. Store the credential in the source system secret manager.
17. Use the generated cURL or the source system test delivery to send a low-risk
    payload.
18. Review the dry-run result or created job before enabling production traffic.

Webhook URLs use the public route
`/webhook/workflows/<entry_key>`. The entry key is generated by Flow Steward; do
not hand-author predictable keys.

Configuration fields:

| Setting | Purpose |
|---|---|
| `auth_mode` | Bearer token, HMAC SHA256, shared secret header, or basic auth. |
| `allowed_content_types` | JSON, multipart, form, or text payloads accepted by this webhook. |
| `source_restrictions` | Exact IP or CIDR allowlists when the caller is known. |
| `max_body_bytes` | Maximum request body size. |
| `max_file_bytes` | Maximum uploaded file size. |
| `max_files` | Maximum number of uploaded files. |
| `idempotency_mode` | How duplicate webhook deliveries are detected. |
| `input_mapping` | How payload fields become workflow inputs. |
| `response_mode` | Whether the caller receives only an accepted response or waits for a result. |

Supported mapping selector roots are:

| Root | Use it for |
|---|---|
| `body.` | JSON body fields. |
| `headers.` | Header values. Header lookup is case-insensitive at runtime. |
| `query.` | URL query parameters. |
| `form.` | Form fields. |
| `files` | Uploaded file references. |

After a webhook exists, the selected trigger panel lets you copy the public URL,
rotate the credential, regenerate the URL, dry-run a payload, or delete the
webhook.

Rotate the credential when it may have been exposed. Regenerate the URL when the
entry key itself should no longer be trusted. Deleting a webhook stops future
deliveries but does not remove historical jobs or delivery evidence.

Provider triggers are related but separate. They come from extensions that
declare `workflow_triggers[]` and should be used when the provider integration
owns the trigger lifecycle instead of a generic public webhook.

## HTTP request steps

Use `http_request` when a workflow needs to call an external API directly.

Configure:

- method and URL;
- headers and query parameters;
- body template;
- auth mode or credential reference;
- timeout;
- expected status codes;
- retry and error handling;
- output mapping for response status, headers, and body.

Do not put secrets directly in workflow text. Use project connections or
credential references so secrets can be rotated and redacted.

## Nested workflows

Use `invoke_workflow` when a reusable child workflow should run inside a parent
workflow.

Configure:

- child workflow id;
- input mapping from parent state to child inputs;
- output mapping from child result to parent state;
- artifact mapping;
- timeout and cancel behavior;
- inline or asynchronous execution behavior when supported.

Deployment-level controls include `FS_INVOKE_CHILD_TIMEOUT_SECONDS`,
`FS_INVOKE_CHILD_TIMEOUT_CAP_SECONDS`, `FS_INVOKE_CHILD_POLL_SECONDS`,
`FS_INVOKE_CHILD_CANCEL_ON_TIMEOUT`, and `FS_INVOKE_INLINE_EXECUTION`.

## Artifacts

Artifacts are files or structured outputs created by workflow steps. They can be
short-lived run evidence, audit material, or persistent deliverables.

Storage can be backed by in-memory storage, local filesystem storage, bundled
S3-compatible storage, or external S3-compatible storage. See
[Feature Configuration](feature-configuration#artifacts-and-storage) for the
operator settings.

## Notifications and automation

Notification routes can subscribe to workflow and job events such as started,
completed, failed, approval requested, approval decided, or artifact produced.
Routes can be scoped by project, workflow, event type, and severity.

Use notifications for approval handoffs, failed runs, production-sensitive
workflow completion, and scheduled-job reporting.
