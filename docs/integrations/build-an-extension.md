---
sidebar_position: 6
title: Build An Extension
description: Author Flow Steward extensions with manifests, UI pages, components, actions, events, contracts, tests, and packaging.
---

# Build An Extension

Flow Steward extensions are YAML-defined provider bundles with an isolated
runtime entrypoint. An extension can add external system integrations, custom
workflow triggers, builder operations, tools, skills, and operator UI pages
without importing provider code into the Flow Steward server process.

Use the `flowsteward.example-showcase` extension as the reference
implementation. In source form its folder is named `flowsteward_example_showcase`
because extension folders use the canonical extension id with dots and hyphens
converted to underscores.

## What An Extension Contains

A complete extension usually has these parts:

| Area | Purpose |
| --- | --- |
| `extension.yaml` | Runtime manifest. Declares identity, kind, features, entrypoints, scopes, schemas, UI, actions, queries, callbacks, events, workflow triggers, and optional Contract v2 refs. |
| `extension-descriptor.yaml` | Distribution descriptor. Used for marketplace or private import metadata, published artifacts, runtime compatibility, provenance, and commerce metadata. |
| `schemas/*.schema.yaml` | JSON Schema documents written in YAML. They define configuration, secrets, subscription settings, action inputs, and result payloads. |
| `ui/ui_manifest.yaml` | UI root manifest. Lists extension pages and imports page files. |
| `ui/pages/*.yaml` | Operator-facing pages. Pages compose components and bind them to queries and actions. |
| `ui/components/*.yaml` | Reusable component definitions such as forms, grids, health panels, callback setup panels, and markdown blocks. |
| `ui/actions/actions.yaml` | Action operation catalog. Defines command-style operations the UI or workflows can invoke. |
| `ui/queries/queries.yaml` | Query operation catalog. Defines read-style operations used by UI components and runtime callers. |
| `contracts/*.yaml` | Extension Contract v2 fragments for builder operations, connection types, resource queries, step UI, event bindings, and artifact policies. |
| `main.py` | Runtime entrypoint. Reads one JSON request from stdin and writes one JSON response to stdout. |
| `health.py` | Healthcheck command. Verifies imports, files, and provider readiness. |
| `handlers/` | Extension-owned backend logic. The showcase routes queries, actions, ingress events, OAuth profile calls, and demo tool execution here. |
| `scripts/smoke_check.py` | Fast executable smoke script for local and CI sanity checks. |
| `tests/` | Pytest regression suite for compilation, descriptor validation, contract validation, runtime behavior, and integration safety. |

Flow Steward extension authoring files are YAML-only. JSON is still used for
runtime stdin/stdout envelopes, REST payloads, database JSONB fields, CLI JSON
output, and fixtures.

## Reference Example Showcase Extension

The fastest way to understand extension authoring is to open the bundled
reference extension:

```text
extensions/flowsteward_example_showcase/
```

Its public id is `flowsteward.example-showcase`. The extension is intentionally
synthetic, so it does not depend on a real third-party account, but it uses the
same manifests, UI, runtime envelopes, descriptor artifacts, callback contracts,
OAuth connection shape, and validation rules as a production extension.

Use it as a working catalog of examples:

| If you want to learn | Open these files |
| --- | --- |
| Overall file layout and purpose | `README.md`, `extension.yaml`, `extension-descriptor.yaml` |
| Runtime manifest fields | `extension.yaml` |
| Distribution, import, and published artifacts | `extension-descriptor.yaml` |
| Operator UI pages | `ui/ui_manifest.yaml`, `ui/pages/*.yaml` |
| UI components | `ui/components/*.yaml` |
| Query registration | `ui/queries/queries.yaml`, `handlers/queries.py` |
| Action registration | `ui/actions/actions.yaml`, `handlers/actions.py` |
| Runtime routing | `main.py`, `handlers/router.py`, `handlers/common.py` |
| Health checks | `health.py` |
| Config, secrets, and subscription schemas | `schemas/*.schema.yaml` |
| Callback ingress | `callbacks` in `extension.yaml`, `ui/components/callback_setup.yaml`, `ingress_event` action |
| Workflow trigger catalog entries | `workflow_triggers` in `extension.yaml` |
| Extension Contract v2 | `contracts/*.yaml` |
| External API safety pattern | `handlers/actions.py`, especially the external request action |
| OAuth2 connection-scoped credentials | `contracts/connection_types.yaml`, `handlers/actions.py`, `artifacts/workflows/demo_oauth_connection_binding.yaml` |
| Smoke scripts and regression tests | `scripts/smoke_check.py`, `tests/test_example_showcase.py` |

The showcase is also the best place to see how extension bundles can publish
real Flow Steward objects:

```text
artifacts/
  workflows/          # runnable workflow manifests
  agents/             # agents used by workflow agent steps
  skills/             # skill contracts used by those agents
  tools/              # deterministic tool contracts used by connector steps
  datasets/           # dataset example material
  data_connections/   # example data connection manifest
  saved_queries/      # saved query example material
  seed_manifest.yaml  # seed metadata for the demo bundle
```

`extension-descriptor.yaml` publishes the workflow, agent, skill, and tool
artifacts:

```yaml
artifacts:
  workflows:
    - workflow_id: demo_incoming_webhook_router
      ref: artifacts/workflows/demo_incoming_webhook_router.yaml
      publish: true
  agents:
    - agent_id: demo_support_ticket_classifier
      ref: artifacts/agents/demo_support_ticket_classifier.yaml
      publish: true
  skills:
    - skill_id: demo_classify_support_ticket
      ref: artifacts/skills/demo_classify_support_ticket.yaml
      publish: true
  tools:
    - tool_id: demo_weather_tools
      ref: artifacts/tools/demo_weather_tools.yaml
      publish: true
```

The dataset, saved query, and data connection files are kept beside the
descriptor as reference material. They show how a realistic demo project can
ship dataset support even when the current descriptor artifact schema publishes
only workflows, agents, skills, tools, contracts, guardrails, and extension
artifacts directly.

### Example Recipes

Use these concrete examples when adding similar capability to your own
extension:

| Task | Showcase example |
| --- | --- |
| Add a workflow artifact | Add a YAML file under `artifacts/workflows/`, then list it under `artifacts.workflows` in `extension-descriptor.yaml` with `workflow_id`, `ref`, and `publish`. |
| Register an agent | Add a YAML file under `artifacts/agents/`, then list it under `artifacts.agents` in the descriptor with `agent_id`, `ref`, and `publish`. |
| Register a skill | Add a YAML file under `artifacts/skills/`, then list it under `artifacts.skills` in the descriptor. |
| Register a tool | Add a YAML file under `artifacts/tools/`, then list it under `artifacts.tools` in the descriptor. |
| Add a data connection example | Follow `artifacts/data_connections/11111111-0000-4000-8000-000000000101.yaml` for connection id, display name, source kind, config JSON, tags, and schema snapshot metadata. |
| Add a query-backed UI grid | Compare `ui/components/workflows_grid.yaml`, `ui/queries/queries.yaml`, and the matching handler in `handlers/queries.py`. |
| Add a form-backed action | Compare `ui/components/connection_form.yaml`, `ui/actions/actions.yaml`, and the matching handler in `handlers/actions.py`. |
| Add callback/webhook setup | Compare `callbacks` in `extension.yaml`, `ui/components/callback_setup.yaml`, and the `ingress_event` action. |
| Add a workflow trigger type | Compare the `workflow_triggers` block in `extension.yaml`. |
| Add OAuth-backed operation | Compare `contracts/connection_types.yaml`, `artifacts/workflows/demo_oauth_connection_binding.yaml`, and the OAuth profile action handler. |
| Add Contract v2 builder operation | Compare `contracts/operation_manifest.yaml`, `contracts/step_ui_manifest.yaml`, and `contracts/resource_query_manifest.yaml`. |

Before copying a pattern, run the showcase checks once so you can see the
expected validation and test loop:

```bash
python -m core.entrypoints.cli tooling extensions validate flowsteward.example-showcase --root extensions --health --marketplace
python extensions/flowsteward_example_showcase/scripts/smoke_check.py
python -m pytest extensions/flowsteward_example_showcase/tests/test_example_showcase.py -q
```

## Create A Scaffold

Create a new extension with the tooling CLI from the Flow Steward source tree:

```bash
python -m core.entrypoints.cli tooling extensions create com.acme.crm-sync \
  --display-name "Acme CRM Sync" \
  --description "Connects Acme CRM records to Flow Steward workflows."
```

The scaffold is intentionally small. It gives you the expected file layout,
minimal manifests, healthcheck, runtime entrypoint, smoke script, and pytest
test. After scaffolding, change the kind, features, schemas, UI, and handlers
to match the provider you are building.

Use these commands throughout development:

```bash
python -m core.entrypoints.cli tooling extensions validate com.acme.crm-sync
python -m core.entrypoints.cli tooling extensions test com.acme.crm-sync
python -m core.entrypoints.cli tooling extensions bundle com.acme.crm-sync
```

## Naming Rules

The `extension_id` is the stable public id for the extension. Use a lowercase
dot-separated id:

```yaml
extension_id: com.acme.crm-sync
```

The extension folder name must be derived from the id by replacing `.` and `-`
with `_`:

```text
extensions/com_acme_crm_sync/
```

The validator rejects a bundle when the folder name does not match the
canonical id. This prevents ambiguous package roots and avoids collisions when
extensions are installed from zip archives.

## Runtime Manifest

`extension.yaml` is the contract Flow Steward compiles and validates before an
extension can be enabled.

A minimal manifest looks like this:

```yaml
manifest_version: 2
extension_id: com.acme.crm-sync
kind: notification_provider
version: 0.1.0
display_name: Acme CRM Sync
description: Sends and receives Acme CRM notifications.

features:
  - notify
  - ingress_event

supported_events:
  - external.comment.received
  - notification.interaction_received

required_scopes:
  - extension:invoke
  - event:subscribe
  - notify:dispatch

schemas:
  config:
    ref: schemas/config.schema.yaml
  secrets:
    ref: schemas/secrets.schema.yaml
  subscriptions:
    ref: schemas/subscriptions.schema.yaml

entrypoint:
  mode: subprocess
  command: [python3, main.py]
  timeout_seconds: 30

health:
  command: [python3, health.py]
  timeout_seconds: 10

ui_manifest:
  ref: ui/ui_manifest.yaml
query_manifest:
  ref: ui/queries/queries.yaml
action_manifest:
  ref: ui/actions/actions.yaml
```

### Kinds And Features

Flow Steward currently supports these extension kinds:

| Kind | Use it when | Required feature |
| --- | --- | --- |
| `task_provider` | The extension ingests or creates work items for workflows. | `task_ingress` |
| `notification_provider` | The extension sends notifications or receives external interaction events. | `notify` |
| `tool_provider` | The extension exposes tool-style actions or read operations. | `tool` |

The validator checks that the selected kind and feature set make sense together.
For example, `ingress_event` is valid only for `notification_provider`.

### Manifest Field Reference

| Field | Required | Description |
| --- | --- | --- |
| `manifest_version` | Yes | Use `2` for current extensions. |
| `extension_id` | Yes | Canonical lowercase id. The folder name must match its normalized form. |
| `kind` | Yes | One of `task_provider`, `notification_provider`, or `tool_provider`. |
| `version` | Yes | Extension release version. Use semantic versioning for public releases. |
| `display_name` | Yes | Human-readable name shown in the UI and marketplace. |
| `description` | Yes | Short description for operators and marketplace listings. |
| `features` | Yes | Capability flags such as `notify`, `tool`, `task_ingress`, or `ingress_event`. |
| `required_scopes` | Recommended | Host permissions the extension requires. Scope names must include a colon. |
| `supported_events` | Recommended | Event types the extension can emit or handle. |
| `event_subscriptions` | Optional | Event selectors the extension wants Flow Steward to deliver. |
| `schemas` | Optional | Named JSON Schema refs or inline schema objects. |
| `entrypoint` | Yes | Subprocess command used for query/action invocation. |
| `health` | Yes | Healthcheck command. |
| `ui_manifest` | Yes for UI | Ref to `ui/ui_manifest.yaml`. |
| `query_manifest` | Required when queries are referenced | Ref to query definitions. |
| `action_manifest` | Required when actions are referenced | Ref to action definitions. |
| `machine_auth` | Optional | Machine auth settings for service-account style execution. |
| `account_scope` | Optional | Account/project/workflow boundaries and subscription settings. |
| `callbacks` | Optional | Callback registrations for webhooks or provider callbacks. |
| `workflow_triggers` | Optional | Custom workflow trigger types contributed by the extension. |
| `dependencies.extensions` | Optional | Other extensions this extension depends on. |
| `runtime.extension_contract_v2` | Optional | Refs to Contract v2 files used by builders and registry projections. |

All refs must stay inside the extension bundle and must point to YAML files.
Absolute paths, path traversal, missing files, and JSON contract files are
validation errors.

### Event Subscriptions

Use `event_subscriptions` when the extension should receive platform events:

```yaml
event_subscriptions:
  - event_type: job.completed
    severity: info
  - event_type: external.comment.received
    project_id: 5b599d21-b522-4e78-80e2-41ffedb6b9b7
```

Subscription entries can be strings or objects. Object entries support event
type, severity, conditions, and optional project or workflow scope. The accepted
severity values are `debug`, `info`, `warning`, `error`, `critical`, and `any`.
`warn` is normalized to `warning`.

If an extension declares `supported_events` but no explicit subscriptions, the
compiler can materialize selectors from the supported events for preview and
enablement.

### Dependencies

Declare extension dependencies when your provider requires another extension to
be present:

```yaml
dependencies:
  extensions:
    - extension_id: flowsteward.openclaw
      min_version: 1.2.0
      max_version_exclusive: 2.0.0
      required: true
      reason: Uses OpenClaw task references in workflow triggers.
```

The validator rejects self-references, duplicate dependency ids, and invalid
semantic version ranges.

### Callbacks

Callbacks declare externally callable endpoints that Flow Steward can register
and route back into the extension:

```yaml
callbacks:
  - callback_id: provider_events
    purpose: Receives Acme provider interaction events.
    methods: [POST]
    action_id: ingress_event
    connection_scoped: true
    auth:
      type: shared_secret_header
      header: X-Acme-Signature
```

Callback ids use lowercase letters, numbers, underscores, and hyphens. Callback
auth currently supports `none` and `shared_secret_header`.

The operator UI can expose callback setup through a `callback_setup` component.
Flow Steward APIs create, rotate, and check registrations, while the extension
action handles the actual ingress payload.

### Workflow Triggers

Workflow triggers add custom trigger types to the workflow trigger catalog:

```yaml
workflow_triggers:
  - trigger_type_id: acme_comment_received
    provider_key: acme
    display_name: Acme comment received
    event_name: external.comment.received
    provider_ingress_url_required: true
    config_schema:
      type: object
      required: [project_key]
      properties:
        project_key:
          type: string
    ui_schema:
      fields:
        - name: project_key
          label: Project key
          widget: text
```

The catalog id is built from the provider key and trigger type id. Trigger
readiness is evaluated from the declared config schema.

## Distribution Descriptor

`extension-descriptor.yaml` is separate from `extension.yaml`. It is used when
an extension is imported, listed, published, or distributed through marketplace
or private channels.

Use it to declare:

| Descriptor section | Purpose |
| --- | --- |
| `schema_version` | Descriptor schema version. Current descriptors use `extension_descriptor_v1`. |
| `extension_id` | Must match the runtime manifest id. |
| `release_version` | Release version for the distributable artifact. |
| `extension_type` | High-level classification for listing and import. |
| `identity` | Display name, description, and tags. |
| `vendor` | Vendor name and support URL. |
| `listing` | Visibility, category, and marketplace listing metadata. |
| `distribution` | Channel, execution modes, self-hosting support, and import sources. |
| `runtime` | Contract version, compatibility, auth mode, local or remote runtime details. |
| `artifacts` | Workflows, agents, skills, tools, contracts, guardrails, and extension artifacts to publish. |
| `provenance` | Origin such as system built-in, vendor published, user generated, or imported. |
| `commerce` | Billing or plan metadata. |

The descriptor validator is strict. Most descriptor blocks reject unknown fields,
remote HTTPS endpoints must be HTTPS unless explicitly allowed as insecure, and
every artifact entry must have an id plus either a ref or snapshot.

Remote HTTPS descriptors must define these endpoint paths:

```yaml
runtime:
  contract_version: extension_host_v1
  remote:
    base_url: https://extensions.acme.example
    endpoints:
      handshake: /handshake
      health: /health
      query: /query
      action: /action
      emit_event: /events
```

Endpoint values are paths, not full URLs, and must not contain `..`.

## Schemas

Extension schemas are JSON Schema documents written in YAML. They define the
shape of data, not the visual layout.

Common schema files:

| File | Purpose |
| --- | --- |
| `schemas/config.schema.yaml` | Non-secret provider settings such as base URL, tenant, labels, allowed hosts, and mock mode. |
| `schemas/secrets.schema.yaml` | Secret fields such as API tokens, passwords, webhook secrets, and OAuth access tokens. Never echo secret values back to the UI. |
| `schemas/subscriptions.schema.yaml` | Operator-configurable event subscription settings. |
| Inline `input` or `output` schemas | Operation-specific request and response contracts. |

The validator resolves schema refs from the bundle root. Keep schema files in
YAML and avoid refs that escape the bundle.

## UI Manifest

The UI manifest is the root of the operator-facing extension UI:

```yaml
version: '1'
pages:
  - ref: pages/overview.yaml
  - ref: pages/settings.yaml
  - ref: pages/events.yaml
```

Each page has a `page_id`, title, description, and components:

```yaml
page_id: settings
title: Settings
description: Configure Acme connection settings.
components:
  - ref: ../components/connection_form.yaml
  - ref: ../components/secrets_form.yaml
```

Component ids must be unique inside the extension. Page ids must also be unique.
The compiler resolves component refs recursively and reports circular component
references.

## Component Kit

The validator recognizes the component kit below. Some component types are
fully rendered by the current frontend; others are structural or reserved for
newer UI surfaces.

| Component type | Purpose |
| --- | --- |
| `form` | Operator input form bound to load, save, validate, or test actions. |
| `grid` | Tabular data from a query, with optional row actions. |
| `stats_row` | Compact metric row from static values or query results. |
| `health_panel` | Provider/runtime health summary. |
| `callback_setup` | Webhook or callback registration and status panel. |
| `markdown` | Rendered documentation or guidance block. |
| `log_list` | List of log-style messages with severities. |
| `section`, `columns`, `stack`, `action_bar`, `fieldset` | Layout and grouping primitives. |
| `repeater` | Repeated object or row input, often used inside forms. |
| `key_value`, `key_value_card`, `json_editor`, `secret_field` | Data display or specialized input primitives. |
| `empty_state`, `alert`, `confirm_action`, `drawer_detail`, `status_badge`, `filter_bar` | Interaction and display primitives. |

### Forms

Forms use `ui_schema` for visual controls and `data` for runtime bindings:

```yaml
component_id: connection_settings
type: form
title: Connection settings
schema_ref: ../../schemas/config.schema.yaml
ui_schema:
  fields:
    - name: base_url
      label: Base URL
      widget: url
      required: true
    - name: mock_mode
      label: Mock mode
      widget: boolean
data:
  load_query: load_connection_settings
  save_action: save_connection_settings
  test_action: test_external_request
```

Action bindings must live under `data`. Top-level `save_action`,
`validate_action`, `test_action`, or `load_query` fields are rejected.

Valid form widgets include:

```text
text, textarea, url, email, number, integer, boolean, select, radio_group,
checkbox_group, tag_picker, secret, json, key_value, repeater, event_selector,
project_selector, workflow_selector, provider_selector
```

The renderer currently has first-class handling for the common widgets used by
the showcase, including text, textarea, select, boolean, integer, secret, and
repeater-backed form sections. Other widgets are valid contract declarations
and may require frontend support in the target Flow Steward version.

### Repeaters

Use a repeater when the operator edits a list of objects:

```yaml
- name: records
  label: Records
  widget: repeater
  props:
    min_items: 1
    fields:
      - name: record_id
        label: Record id
        widget: text
        required: true
      - name: urgent
        label: Urgent
        widget: boolean
```

The showcase also demonstrates repeater props such as `unique_in_list` and
`immutable_on_edit`.

### Grids

Grids load rows from a query response:

```yaml
component_id: resources
type: grid
title: Example resources
query_id: list_example_resources
columns:
  - key: id
    label: ID
    type: id
  - key: status
    label: Status
    type: badge
    badge_map:
      ready: green
      blocked: red
row_actions:
  - action_id: run_demo_tool
    label: Run
    scope: row
```

Supported column types are `text`, `datetime`, `date`, `number`, `badge`,
`boolean`, `json_summary`, `link`, and `id`.

The renderer accepts rows in `result.items` or provider-specific list fields.
For paginated data, return fields such as `page`, `page_size`, `total`, and
`has_more`.

### Health Panels

Health panels call a query and render provider status:

```yaml
component_id: provider_health
type: health_panel
query_id: provider_health
```

Return a result with `status`, `provider`, `runtime`, and optional `checks`.

### Callback Setup

Use `callback_setup` to expose webhook registration:

```yaml
component_id: callback_setup
type: callback_setup
callback_id: provider_events
title: Provider callback
```

The UI calls Flow Steward callback APIs to create, rotate, and check callback
registrations. The declared callback action handles inbound provider payloads.

## Queries And Actions

Queries are read operations. Actions are command operations. Both are declared
in YAML and implemented by the extension runtime.

`ui/queries/queries.yaml`:

```yaml
queries:
  - query_id: provider_health
    title: Provider health
    description: Returns runtime and provider health.
    required_scopes:
      - extension:invoke
    result_fields:
      - result.status
      - result.checks
    handler:
      mode: extension
```

`ui/actions/actions.yaml`:

```yaml
actions:
  - action_id: save_connection_settings
    title: Save connection settings
    description: Stores non-secret connection settings.
    required_scopes:
      - extension:invoke
    mutates_platform: true
    command_type: invoke_extension_action
    handler:
      mode: extension
```

Common operation fields:

| Field | Applies to | Description |
| --- | --- | --- |
| `query_id` or `action_id` | Required | Unique operation id. |
| `title` | Recommended | UI label and diagnostic name. |
| `description` | Recommended | Operator-facing description. |
| `required_scopes` | Recommended | Required host scopes. |
| `result_fields` | Optional | Result paths the operation returns. |
| `error_codes` | Optional | Known provider error codes. |
| `contract` | Optional | Operation-specific contract metadata. |
| `handler.mode` | Optional | `extension` for provider runtime, `platform` for host handling. |
| `mutates_platform` | Actions | Set true when an action requests host-side mutation. |
| `command_type` | Mutating actions | Required when `mutates_platform` is true. |

Operation ids must be unique. UI components that reference an action or query id
must reference an id declared in the corresponding manifest.

### Registering A New Action

To add an action:

1. Add the action to `ui/actions/actions.yaml`.
2. If the action has input, add or update a YAML schema.
3. Bind the action from a component, workflow operation, callback, or Contract
   v2 operation.
4. Implement a handler in the extension runtime.
5. Return the canonical response envelope.
6. Add a smoke check or pytest assertion.
7. Run `tooling extensions validate` and `tooling extensions test`.

For a UI form save action, the frontend sends component context, target
information, current values, and form data to:

```text
POST /api/extensions/{extension_id}/action/{action_id}
```

## Runtime Backend Logic

Local extensions run out of process. Flow Steward starts the declared command,
writes one JSON request to stdin, reads one JSON response from stdout, and then
normalizes and validates the response.

The showcase runtime follows this pattern:

```text
main.py
  reads stdin JSON
  passes the request to handlers/router.py
  writes the response envelope as JSON

handlers/router.py
  dispatches by mode and query_id/action_id

handlers/common.py
  provides ok(), fail(), action_input(), context helpers, and safe formatting
```

Query request shape:

```json
{
  "contract_version": "extension_host_v1",
  "mode": "query",
  "host": {
    "contract_version": "extension_host_v1",
    "operation": "query",
    "scope": {
      "account_id": "acct_123",
      "project_id": "project_123",
      "workflow_id": null
    },
    "principal": {
      "actor_id": "user_123",
      "principal_type": "user"
    }
  },
  "query": {
    "query_id": "provider_health",
    "page_id": "overview",
    "component_id": "provider_health",
    "context": {
      "project_id": "project_123"
    },
    "params": {}
  }
}
```

Action requests use the same host envelope and place operation data under
`action`:

```json
{
  "contract_version": "extension_host_v1",
  "mode": "action",
  "host": {
    "operation": "command",
    "scope": {
      "account_id": "acct_123",
      "project_id": "project_123"
    }
  },
  "action": {
    "action_id": "save_connection_settings",
    "page_id": "settings",
    "component_id": "connection_settings",
    "context": {},
    "target": {},
    "input": {
      "base_url": "https://api.acme.example",
      "mock_mode": true
    }
  }
}
```

Runtime context can also include job, workflow, phase, step, account, artifact,
and logger metadata when an action is invoked from workflow execution.

## Response Envelope

Every query and action should return this envelope:

```json
{
  "ok": true,
  "result": {},
  "commands": [],
  "events": [],
  "reload": [],
  "errors": []
}
```

Field meanings:

| Field | Description |
| --- | --- |
| `ok` | Boolean success flag. Missing `ok` is normalized as an error. |
| `result` | Operation result object. UI components read from this object. |
| `commands` | Host-side commands requested by the extension. |
| `events` | Events emitted by the extension. Event types must be allowed by `supported_events` when declared. |
| `reload` | Component ids the UI should refresh after the action succeeds. |
| `errors` | Structured provider errors. |

Known command types include:

```text
start_workflow, pause_job, resume_job, cancel_job, retry_step,
request_approval, resolve_approval, enqueue_followup_job,
invoke_extension_action, update_external_status
```

Actions with `mutates_platform: true` must declare the command type they intend
to request.

## Events

Events are how extensions connect provider activity to Flow Steward workflows
and notifications.

Declare events in `supported_events`:

```yaml
supported_events:
  - external.comment.received
  - notification.interaction_received
```

The extension may then return events from an action response:

```json
{
  "ok": true,
  "events": [
    {
      "event_type": "external.comment.received",
      "summary": "New Acme comment received",
      "payload": {
        "comment_id": "c_123",
        "record_id": "r_456"
      }
    }
  ]
}
```

Platform workflow reaction events include:

```text
job.completed, job.failed, job.phase_started, job.phase_completed,
job.phase_failed, job.gate_waiting, job.step_started, job.step_completed,
job.step_failed, job.step_blocked
```

Extension Contract v2 canonical events include:

```text
notification.requested, notification.delivered, notification.failed,
approval.requested, approval.received, approval.expired,
interaction.received, job.started, job.completed, job.failed
```

Provider-owned external events are named by the extension. Use a clear namespace
such as `external.task.created` or `external.comment.received`.

The event envelope supports fields such as `event_id`, `event_type`,
`correlation_id`, `occurred_at`, `account_id`, `severity`, `summary`, `payload`,
project/workflow/job/phase/step ids, source, aggregate id, actor, URLs, and
metadata.

## External APIs And OAuth

Keep live network behavior explicit and safe:

- Use mock mode by default for examples and tests.
- Require HTTPS for live provider requests.
- Keep credentials out of URLs.
- Restrict live hosts with an `allowed_hosts` config field.
- Cap response bodies and redact tokens in responses and logs.
- Store API tokens and OAuth access tokens as secrets, not config.

The showcase demonstrates an action that performs a live request only when the
operator explicitly disables mock mode and asks for a live request. It also
checks host allowlists, strips credentials from URLs, and redacts token material
from returned diagnostics.

OAuth connections are described in Contract v2 `connection_types`. The runtime
action receives only the connection-scoped secret values it needs, for example
`target.connection.secrets.access_token`. Refresh tokens and client credentials
remain platform-managed.

## Extension Contract V2

Extension Contract v2 is the builder-facing contract. It describes what the
extension contributes to workflow builders and registry projections. It is not
the same as the operator UI manifest.

Reference it from `extension.yaml`:

```yaml
runtime:
  extension_contract_v2:
    connection_types:
      ref: contracts/connection_types.yaml
    operation_manifest:
      ref: contracts/operation_manifest.yaml
    step_ui_manifest:
      ref: contracts/step_ui_manifest.yaml
    resource_query_manifest:
      ref: contracts/resource_query_manifest.yaml
    event_bindings:
      ref: contracts/event_bindings.yaml
    artifact_policies:
      ref: contracts/artifact_policies.yaml
```

Contract sections:

| Section | Purpose |
| --- | --- |
| `connection_types` | Connection definitions and auth model, including API key, OAuth2, static secret, or none. |
| `dataset_connectors` | Dataset connector declarations and runtime kind. |
| `operation_manifest` | Builder operations such as sources, actions, bulk actions, reports, and human channels. |
| `step_ui_manifest` | Workflow step form fields for operations. |
| `resource_query_manifest` | Resource pickers and lookup queries used by builders. |
| `event_bindings` | Trigger bindings and event-to-operation relationships. |
| `artifact_policies` | Artifact inputs and outputs for operations. |

Operation kinds currently include `source`, `action`, `bulk_action`, `report`,
and `human_channel`.

Value types include `text`, `number`, `integer`, `boolean`, `json`, `array`,
`object`, `artifact_handle`, `dataset_handle`, and `connection_ref`.

Step UI widgets include common form widgets plus builder-specific controls such
as `resource_picker`, `artifact_picker`, `dataset_picker`, `schema_mapper`,
`mapping_table`, and `batch_policy`.

The Contract v2 validator checks unique ids, valid operation kinds, connection
references, batch settings, OAuth2 requirements, resource query references, step
UI field references, event bindings, artifact policies, and optional locale
keys.

## Register Workflows, Agents, Skills, And Tools

Use `extension-descriptor.yaml` artifacts to publish bundled Flow Steward
objects together with the extension:

```yaml
artifacts:
  workflows:
    - workflow_id: acme_triage_workflow
      ref: artifacts/workflows/acme_triage_workflow.yaml
      publish: true
  agents:
    - agent_id: acme_triage_agent
      ref: artifacts/agents/acme_triage_agent.yaml
      publish: true
  skills:
    - skill_id: acme_triage_skill
      ref: artifacts/skills/acme_triage_skill.yaml
      publish: true
  tools:
    - tool_id: acme_lookup_tool
      ref: artifacts/tools/acme_lookup_tool.yaml
      publish: true
```

Supported artifact sections include workflows, agents, skills, tools, data
contracts, guardrails, and extensions. Each artifact entry needs an id and a
`ref` or `snapshot`. Set `publish: false` for internal artifacts that should be
packaged but not listed.

The showcase descriptor publishes example workflows, agents, skills, and tools
so developers can see the complete packaging pattern.

## Validation

The extension compiler and validator perform several checks before an extension
can be enabled:

1. Locate `extension.yaml` or `extension.yml`.
2. Reject forbidden JSON contract files.
3. Normalize manifest identity, entrypoint, healthcheck, features, scopes, and
   refs.
4. Resolve schema refs inside the bundle.
5. Resolve UI manifest pages and components.
6. Resolve query and action manifests.
7. Detect duplicate page ids, component ids, action ids, and query ids.
8. Validate kind and feature combinations.
9. Validate callbacks, dependencies, workflow triggers, and event selectors.
10. Build the compiled manifest preview.

Validation issues include severity, code, message, file path, field path, and
hint. Run validation with JSON output when you need machine-readable diagnostics:

```bash
python -m core.entrypoints.cli tooling extensions validate com.acme.crm-sync --json
```

Use marketplace validation when preparing a distributable extension:

```bash
python -m core.entrypoints.cli tooling extensions validate com.acme.crm-sync --marketplace
```

## Tests And Scripts

Use both scripts and tests. They serve different purposes.

| File | Purpose |
| --- | --- |
| `scripts/smoke_check.py` | Fast executable proof that the bundle can run. It should check health plus representative queries/actions. It does not need pytest and can be run directly in local CI or packaging jobs. |
| `tests/test_*.py` | Regression tests. Use pytest assertions for compile output, descriptor validation, Contract v2 checks, runtime behavior, integration safety, OAuth secret injection, ingress payloads, and action response shapes. |

The `tooling extensions test` command runs validation, then the smoke script,
then pytest tests when they are present:

```bash
python -m core.entrypoints.cli tooling extensions test com.acme.crm-sync
```

Use `scripts/smoke_check.py` to answer "does this bundle basically work right
now?" Use pytest to answer "will this behavior stay correct as the extension and
platform evolve?"

## Bundle And Install

Create an installable zip:

```bash
python -m core.entrypoints.cli tooling extensions bundle com.acme.crm-sync
```

The bundle command validates the extension and writes a zip named like:

```text
com.acme.crm-sync-0.1.0.zip
```

The zip root uses the canonical folder name, for example
`com_acme_crm_sync/`.

Operators can install through the UI or through the extension install API. After
installation, check the preview and health endpoints before enabling the
extension.

## Updating An Extension

For a safe update:

1. Make the smallest compatible manifest and runtime changes.
2. Add or update schemas before wiring new UI fields to actions.
3. Keep operation ids stable when possible. Treat renamed action, query, trigger,
   and operation ids as breaking changes.
4. Bump the extension version.
5. Update descriptor artifacts and compatibility metadata.
6. Run validation, smoke checks, and pytest.
7. Bundle the extension and record the bundle digest.
8. Install in a test environment and verify health, callbacks, queries, actions,
   workflow triggers, and artifact projections.

## Authoring Checklist

- The folder name matches the canonical `extension_id`.
- All authoring contracts are YAML, not JSON.
- `extension.yaml` declares the correct kind, features, scopes, entrypoint, and
  healthcheck.
- Every UI page, component, query, and action id is unique.
- Every UI reference points to a declared action or query.
- Schemas describe data, while UI schemas describe controls.
- Secret values are stored only in secrets and are never echoed back.
- Live external requests require HTTPS and an allowlist.
- Events emitted by the runtime are declared in `supported_events`.
- Callback ids and workflow trigger ids are stable.
- Contract v2 operation ids, resource query ids, event bindings, and artifact
  policies validate together.
- Descriptor artifacts have ids plus refs or snapshots.
- Smoke scripts and pytest cover representative runtime behavior.
- `validate`, `test`, and `bundle` pass before publishing.

## Related Pages

- [Developer Extensions](../developer/extensions)
- [CLI Reference](../reference/cli)
