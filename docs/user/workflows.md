---
sidebar_position: 6
title: Workflows
description: Create, run, test, and maintain Flow Steward workflows from the UI.
---

# Workflows

A workflow is a set of steps connected by one execution graph, with Groups,
parallel lanes, For each loops and hooks where needed. Operators use workflows to
turn repeatable work into a controlled process. The canvas itself is described in
[Workflow Builder](workflow-builder).

## Create a workflow

[![Local workflow list showing workflow records and their states](/img/screenshots/2026-10-04/workflows-catalog.png)](/img/screenshots/2026-10-04/workflows-catalog.png)

*The local workflow list opens workflows already in this installation. Create workflow provides access to the separate Workflow Catalog. The records shown are synthetic test data.*

1. Open **Workflows**.
2. Choose **Create workflow**, or open an existing workflow to edit it.
3. Set a display name, a stable workflow ID and a description. **Create**
   opens the empty canvas.
4. Add steps, Groups and loops on the canvas and **Apply changes**. See
   [Workflow Builder](workflow-builder).
5. Declare inputs and outputs under **Interface** (or the **Smart setup** tab).
6. Link the projects that may run it on the **Projects** tab.
7. Check **Diagnostics** for validation issues, then enable the workflow.
8. Run a test job before using the workflow for production work.

[![Workflow overview with status, validation, and workflow actions](/img/screenshots/2026-10-04/workflow-overview.png)](/img/screenshots/2026-10-04/workflow-overview.png)

*A draft workflow overview. A draft or disabled record is not evidence that validation, project binding, or a Test Run succeeded.*

## Start from the Workflow Catalog

The **Workflow Catalog** contains ready-made reusable workflows, including
operational automation and examples from Flow Steward and community contributors.
It is the **Catalog** tab next to **Workflows**; **Create workflow** starts from
scratch. Operators can browse; creating a workflow requires an administrator.
Standard configuration uses the official catalog. If it is disabled, creation
opens the ordinary form.

Open an entry, review its requirements, then choose **Use template**. Select
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

Open the workflow and choose **Open builder** (**View workflow (read-only)** for
a workflow an extension installs). The builder is described in its own page,
[Workflow Builder](workflow-builder): adding and connecting steps, Groups and
parallel lanes, For each loops, hooks, Undo/Redo, files returned from a
workflow, and the workflow page tabs.

Canvas structure stays local until **Apply changes**; leaving the builder asks
before discarding unapplied changes.

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

## Step kinds

The builder's **Add step** menu groups the kinds into Actions, Data, Flow,
Finish, Groups and Canvas. See the [step kinds table](workflow-builder#step-kinds)
and the [Workflow Step Kinds](../reference/workflow-step-kinds) reference.

## Place approvals before later effects

An **Approval** step pauses the run until a person approves or rejects; its
**Approved** and **Rejected** outcomes decide what runs next. To require human
approval before an external action, put the Approval step before the step that
performs it. An Approval cannot undo effects of steps that already ran. Separate
step-autonomy policy may impose its own approvals.

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

To create or edit a schedule, open the workflow's **Smart setup** tab, set
**Status** to enabled, tick **Schedule** under **Trigger channels** and choose
**Save workflow settings**. The **Schedules** tab then appears next to Smart
setup. Choose a linked project there; **New schedule** and **Edit** need a
linked project. An unsaved trigger selection is not sufficient.

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

Open **Automation** on the workflow page, or the **Automation** tab of a group
or step drawer in the builder, and add a rule (from a common one or a blank rule).
Choose the event, source, conditions, action, and target within that scope.
The action sets differ:

| Scope | Actions |
|---|---|
| Workflow | Resume job, Approve job, Reject job, Cancel job, Send notification. |
| Group | Send notification. |
| Step | Retry step, Send notification. |

An enabled matching `Approve job` rule makes an automated approval decision;
it is not a request for another manual click. Approval-related reactions use the
job's thread and the event's `approval_id`, then pass through the canonical
approval service. Missing or stale gate identity does not authorize a new gate,
and the gate's allowed actions still apply. Do not use Resume job as a universal
replacement for an ordinary approval decision.

Review every rule before enabling automation. Start with a disabled rule and
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
3. In the builder choose **More › Export YAML**.
4. Save the exported YAML bundle outside the source environment.
5. Open the target environment.
6. Open **Workflows**.
7. Choose **Import YAML**.
8. Paste the YAML bundle into the import screen.
9. Choose `Preflight`.
10. Review dependency status before applying the import.
11. Resolve missing or conflicting references.
12. Choose `Import workflow`.
13. Open the imported workflow and run validation/preflight while it remains
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

## Groups, loops and hooks

There are no phases. Steps that belong together go into a **Group** (run once,
one after another), work that can run side by side into **Parallel lanes**, and
work per item into a **For each**. A **hook** is a place where each project adds
its own steps. Each step or group can carry its own error policy and an
**On error** route. See [Workflow Builder](workflow-builder).

## Data flow and variables

Workflow data moves through mappings rather than hidden shared state.

| Surface | What it contains |
|---|---|
| `workflow_data` | The run-level state available to later steps. |
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

Use **Parallel lanes** only when the lanes have no ordering dependency on each
other. The group continues when all lanes finish. Each lane lands only the values
it changed; when two lanes write the same field, the later lane in lane order
wins. Lanes never read each other's results; the steps after the group read all
of them. If, Switch, Approval, Wait and Stop steps are refused in a lane. Inspect
per-lane results and trace data in the job. See
[Workflow Builder › Parallel lanes](workflow-builder#parallel-lanes).

## Incoming webhooks

Incoming webhooks let external systems start a workflow without a human opening
the UI.

Use them for issue trackers, CI systems, support queues, monitoring alerts, or
any system that should trigger a workflow automatically.

Before creating the webhook:

1. Confirm the workflow is enabled.
2. Open the workflow's **Smart setup** tab.
3. Tick **Incoming Webhook** under **Trigger channels**.
4. Add **Expected inputs** for every value the external system must provide,
   then **Save workflow settings**.
5. Make sure the workflow is linked to an enabled project.
6. Confirm the deployment has a correct public base URL when callers are outside
   the local network.

Create the webhook:

1. Open the workflow.
2. Open the **Webhook** tab (it appears once the Incoming Webhook channel is
   saved).
3. Under **Incoming webhooks**, choose **New webhook**.
4. Fill in the webhook form.
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
