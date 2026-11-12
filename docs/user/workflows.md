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

This page describes behavior supported on main. Availability in published
releases has not been verified; installed releases may differ.

## Create a workflow

[![Local workflow list showing workflow records and their states](/img/screenshots/2026-10-04/workflows-catalog.png)](/img/screenshots/2026-10-04/workflows-catalog.png)

*The workflow list captured on 2026-10-04 shows synthetic test data. In the current UI, Create workflow opens a blank form; the separate Catalog tab provides templates.*

1. Open **Workflows**.
2. Choose **Create workflow**, or open an existing workflow to edit it.
3. Set a display name, a stable workflow ID and a description. **Create**
   opens the empty canvas.
4. Add steps, Groups and loops on the canvas and **Apply changes**. See
   [Workflow Builder](workflow-builder).
5. Declare inputs and outputs under **Interface** (or the **Smart setup** tab).
6. Link the projects that may run it on the **Projects** tab.
7. Check **Diagnostics** and resolve validation issues.
8. Run a test job while the workflow remains disabled, then review trigger
   channels and effects before enabling it for production work.

[![Workflow overview with status, validation, and workflow actions](/img/screenshots/2026-10-04/workflow-overview.png)](/img/screenshots/2026-10-04/workflow-overview.png)

*A draft workflow overview. A draft or disabled record is not evidence that validation, project binding, or a Test Run succeeded.*

## Start from the Workflow Catalog

The **Workflow Catalog** lets operators browse reusable workflow templates.
It is the **Catalog** tab next to **Workflows**; **Create workflow** starts from
scratch. Operators can browse; creating a workflow requires an administrator.
Standard configuration uses the official catalog. If it is disabled, the Catalog
tab is absent and the ordinary creation form remains available. Live catalog
contents and availability depend on the configured catalog and have not been
verified here.

Open an entry, review its requirements, then choose **Use template**. Select
a project and resolve the dependency preflight before **Create draft**. Catalog
creation uses the import portability checks and saves independent disabled drafts,
including bundled children. Configure connections and credentials, validate, and
review triggers and effects before testing and enabling them. Later catalog
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
3. Get `workflow_authoring_schema(step_kind)` and author exactly one explicit workflow ID with an explicit execution graph in the current `platform.workflow_bundle.v2` format.
4. Call `workflow_draft_validate(project_name, bundle_yaml, resolutions)`; only `use_existing` and `map_existing` resolutions are supported.
5. When validation permits saving and the user requests a draft, call `workflow_draft_save` with the same bundle and ID.

Save creates a disabled draft atomically and does not overwrite existing workflows,
install dependencies, enable, execute, schedule or publish. Creation requires existing
administrator authority; machine tokens remain operators. Read access and launch grants
are not creation grants. Validation reports unperformed execution checks separately.
Inspect a saved draft in the manual editor or `workflow_list` with `enabled_only=false`.
An administrator can Test Run a valid disabled draft before enabling it; Test Run
can cause external effects. Draft authoring does not restore hook bindings; use
workflow import for bundles that carry them. See [MCP Reference](../reference/mcp#workflow-authoring)
for exact arguments.

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

Use the administrator builder's **Test Run** or **Run workflow**, the public
workflow-run API, built-in MCP `workflow_trigger`, or a configured webhook or
provider trigger. Ordinary runs require the matching workflow trigger channel,
project binding, role, and declared inputs. The administrator Test Run path can
test a valid disabled draft without enabling its ordinary trigger channels.

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
3. Select the workflow and open its builder.
4. Apply pending changes and resolve validation errors. The workflow may remain
   disabled for Test Run.
5. Choose the linked project context. If one is not already selected, use the
   `Project context` selector.
6. Choose `Test Run` from the builder toolbar.
7. Fill `Test Run Summary` with the request you want the workflow to handle.
8. Fill any generated `Workflow inputs`. Required inputs are marked in the
   launch dialog. Review configured test files and any kept test outputs.
9. Choose `Start test run`.
10. Follow the accepted job on the canvas and in the builder's results view, or
    open its full Job Details page.

The durable job view can show:

- final status;
- workflow ID and project ID;
- execution ID;
- final report;
- final result preview;
- approval decision controls;
- final outputs;
- final artifacts;
- per-step trace rows;
- raw payload details for debugging.

Submission returns a durable job/thread asynchronously. The builder shows compact
results for the selected, verified test job. Legacy payload results are a fallback;
use the selected job's current approval gate when making decisions. Approval
labels depend on the active gate kind.

A kept test output replaces an eligible step's execution with stored output
values during a workflow test. It does not affect real runs and is not included
in workflow exports. Decision and control-flow steps still run. A successful test
that uses kept outputs does not prove that the replaced steps work against their
real dependencies.

`Test Run` can execute real model calls, tool calls, dataset queries, HTTP
requests, child workflows, and extension actions. Use demo data or a low-risk
project until the workflow contract is trusted.

Before choosing **Run workflow test run** or **Run step test run**, review the
selected steps, target URLs, credentials, and inputs. HTTP steps can send real
requests, including writes, and configured model calls may incur provider costs.
Only extension effects declared with `test_mode_behavior: suppress` are
suppressed through the host's effect-suppression path; this is not a universal
runtime sandbox and does not suppress every extension action or HTTP step.

### Start an ordinary run from the builder

The launch dialog also offers **Run workflow** to administrators. This requires
an enabled workflow, an enabled project link, and an enabled interface admitting
the `ui` trigger channel. Apply edits first: the request pins the saved revision
and refuses a revision conflict.

Fill the workflow inputs and summary, upload actual files for declared file
inputs, and acknowledge that the run can create external changes and use live
credentials. Choose **Run workflow**, then open the returned job in Job Details.
This path uses the saved workflow and actual uploads; it does not use test files
or kept test outputs and does not enter Test Run history.

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
13. Open the imported workflow, validate it, and use a controlled Test Run while
    it remains disabled.

Current main allows an administrator Test Run of a valid disabled workflow.
Ordinary runs still require enablement. Review trigger channels, schedules,
webhooks, bindings, credentials, and side effects before enabling. Test Run can
cause external effects even while the workflow is disabled; use an isolated
provider-free fixture for target execution.

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
| `enabled` | Enables the public interface; separate from the workflow's own enabled state. |
| `trigger_channels` | Where the workflow can be launched: UI, API, schedule, webhook, MCP, or another workflow. The public workflow-run API uses the MCP channel. |
| `input_mode` | Form fields (`fields`), custom JSON schema (`json_schema`), or raw JSON payload (`passthrough`). |
| `strict_inputs` | Rejects undeclared fields in form-field mode. Required inputs remain governed by their declarations. |
| `expected_inputs` | Named user inputs with type, label, requirement, default, and help text. |
| `input_schema` | The custom input schema in JSON-schema mode; the public contract also exposes a schema generated for the selected input mode. |
| `output_mode` | Derived from the declared variable outputs and returned files. |
| `expected_outputs` | Named outputs that downstream users or child callers can rely on. |
| `returned_files` | File outputs derived from step results marked **Return from workflow**, with stable output keys and source steps. |

Declare returned files on the producing step's result. Existing
`expected_artifacts` declarations are legacy compatibility data and must resolve
to exactly one producing result; they are not the current file-authoring surface.
The old descriptive `side_effects` rows do not provide an enforced safety boundary.
Review the actual steps and their configured effects.

Good contracts make explicit workflow launches, `Test Run`, MCP calls, and nested workflow
invocation safer because the UI can generate the right fields and the runtime
can validate mappings earlier.

## Reports

A Template step with `format: report` builds a structured report for people to
read instead of a text. The workflow returns it as an output, and the job page
and connected AI chats show it as a formatted document.

[![A finished report in the MCP Apps report viewer: metrics, a table, a bar chart and a section](/img/screenshots/2026-11-08/report-viewer.png)](/img/screenshots/2026-11-08/report-viewer.png)

*The report viewer showing the sample sales report from the product's test fixtures, captured in a test MCP Apps host on 2026-11-08. Reports with charts show in the viewer from 0.9.13.*

### What a report can hold

| Component | Shows |
|---|---|
| `text` | A heading or a paragraph; literal text mixed with bound values. |
| `metric` | One large figure with a label and an optional comparison, such as *vs previous week: −4.2 %*. Consecutive metrics share one grid. |
| `table` | Rows of one dataset with a caption, chosen columns and a text for an empty table. |
| `chart` | A `line` or `bar` chart of one dataset, up to 10 series. **Show data** under it lists the same values as a table. |
| `section` | A titled group of other components, nested up to four levels. |

Every bound value has an explicit format: `text`, `boolean` (localized yes/no),
`number`, `currency` (an ISO 4217 code such as `EUR`; no conversion), `percent`
(`0.18` is 18 %), `date` or `datetime`. Numbers take optional
`minimum_fraction_digits` and `maximum_fraction_digits`. The report's `locale`
and `time_zone` fix how it looks for every viewer.

### Build one

1. **Prepare the data in earlier steps.** A report shows data as given: totals,
   sorting and filtering belong in Transform, dataset queries or other steps.
2. **Add a Template step and choose the report format.** Declare its inputs
   (local name, type, required, source) as for a text template. A metric or
   text value binds to one input and an optional path inside it; a table or
   chart reads a dataset, an array of row objects from one input.
3. **Return it.** Set the step's `result_target` to `state.outputs.<name>`. In
   the workflow's interface declare `<name>` as a required output of type
   `object` and name it as the report output (`report_output`). AI agents set
   both with the `update_interface` operation of `workflow_apply_changes`.
4. **Run the workflow.** The finished job shows the report in its Result.

A short definition:

```json
{
  "schema_version": 1,
  "title": "Weekly sales",
  "locale": "en-US",
  "time_zone": "Europe/Berlin",
  "datasets": [{"id": "regions", "source": {"input": "regions"}}],
  "components": [
    {"id": "revenue", "type": "metric", "label": "Revenue",
     "value": {"input": "kpis", "path": "revenue"},
     "format": {"type": "currency", "currency": "EUR"},
     "comparison": {"label": "vs previous week",
                    "value": {"input": "kpis", "path": "revenue_change"},
                    "format": {"type": "percent", "maximum_fraction_digits": 1}}},
    {"id": "by_region", "type": "table", "caption": "Revenue by region",
     "dataset": "regions", "empty_text": "No sales this week.",
     "columns": [
       {"id": "region", "field": "region", "label": "Region", "format": {"type": "text"}},
       {"id": "revenue", "field": "revenue", "label": "Revenue",
        "format": {"type": "currency", "currency": "EUR"}}]}
  ]
}
```

### Values and errors

- `0`, `false` and an empty table are values. A `null` shows as `—`. A missing
  value uses the binding's `default`, or fails the step.
- A value of the wrong type fails the step with the field that broke it; a
  number written as text is an error, not a number
  (`Format 'number' needs a number, got string`).
- Nothing is cut to fit. A report over a [limit](../reference/limits-and-file-formats#workflow-reports)
  fails the step.
- A report holds no HTML, scripts, styles, chart-library options or URLs.

### Where the report appears

- **Job page.** The run's Result shows the report first, with the other outputs
  below it.
- **AI chat over MCP.** The [`workflow_run_report`](../reference/mcp#job-diagnostics)
  tool shows the report in the chat client's report viewer when the client
  supports MCP Apps. The AI model itself receives only a short summary (title,
  summary text and row counts), never the rows. Clients without
  a viewer get the same summary.
- **API.** `GET /api/jobs/{job_id}/workflow-report` returns `model` (job state
  and the summary) and `snapshot` (the whole report, or `null` while the run is
  going or when it returned none).

Job events, step messages and the job diagnostics an AI agent reads carry only
the short summary of a report.

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
it changed. Results merge by step position and then lane order; later writes in
that merge order win when they change the same field. Avoid competing writes.
Lanes never read each other's results; the steps after the group read the merged
results. If, Switch, Approval, Wait and Stop steps are refused in a lane. Inspect
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
7. Choose an auth mode. For a signed webhook, configure the source's signature
   format and signed-payload recipe, and import its signing secret or use a
   generated secret as appropriate.
8. Choose allowed content types.
9. Set body, file, and file-count limits.
10. Choose whether the caller must send an `Idempotency-Key`.
11. Choose the response mode.
12. Add exact IPs or CIDR ranges when the caller has stable source addresses.
13. Map external payload fields to workflow inputs.
14. Choose `Create webhook`.
15. Copy the public URL and any one-time generated credential reveal. Imported
    signing secrets are write-only and are not revealed back.
16. Store any generated credential in the source system secret manager.
17. Use the generated cURL or the source system test delivery to send a low-risk
    payload.
18. Review the dry-run result or created job before enabling production traffic.

Webhook URLs use the public route
`/webhook/workflows/<entry_key>`. The entry key is generated by Flow Steward; do
not hand-author predictable keys.

Configuration fields:

| Setting | Purpose |
|---|---|
| `auth_mode` | Bearer token, HMAC SHA256, shared secret header, basic auth, or configurable signed-webhook verification (`webhook_signature`). |
| `auth_config` | Authentication details; signed webhooks configure signature parsing, encoding, signed-payload recipe, and optional timestamp tolerance. |
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

Mapping targets must be declared Expected Inputs. In strict form-field mode,
unknown JSON body fields can also be rejected; map the external envelope fields
that the workflow needs and dry-run a representative payload.

After a webhook exists, the selected trigger panel lets you copy the public URL,
rotate the credential, regenerate the URL, dry-run a payload, or delete the
webhook.

Rotate the credential when it may have been exposed. Regenerate the URL when the
entry key itself should no longer be trusted. Deleting a webhook stops future
deliveries but does not remove historical jobs or delivery evidence.

Provider triggers are related but separate. They come from extensions that
declare `workflow_triggers[]` and should be used when the provider integration
owns the trigger lifecycle instead of a generic public webhook. Verify the
provider's current signing and delivery requirements against its own documentation;
examples in the UI do not certify current provider compatibility.

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
workflow. Configure the child workflow ID and map declared inputs, outputs, and
returned files through the step's current contract.

For a serial invocation, the child is a separate durable job. The parent parks
without holding a worker until that child finishes, then validates and maps its
result. A stale completion for another wait or child does not advance the parent.

Invocations from parallel lanes, and their descendants, use the finite child
execution path. Such children cannot pause for human approval or waits.
Deployment-level controls for that finite path include
`FS_INVOKE_CHILD_TIMEOUT_SECONDS`, `FS_INVOKE_CHILD_TIMEOUT_CAP_SECONDS`,
`FS_INVOKE_CHILD_POLL_SECONDS`, `FS_INVOKE_CHILD_CANCEL_ON_TIMEOUT`, and
`FS_INVOKE_INLINE_EXECUTION`. The inline setting does not turn a normal serial
invocation into an inline call. `FS_INVOKE_WORKFLOW_MAX_DEPTH` bounds nested
invocation depth, and recursion checks reject cycles in the invocation chain.

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
