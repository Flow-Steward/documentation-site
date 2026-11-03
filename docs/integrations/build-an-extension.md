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

This guide describes the public source contracts available on main. Availability
in a published release depends on the version installed; source package versions
alone do not establish that a release has been published.

Core does not bundle a reference extension. Start with the CLI scaffold, this
guide's small provider-free example, or the
[Example Showcase extension](#example-showcase-extension), which provides a
broader authoring reference. Extension IDs such as
`com.acme.crm-sync` map to folders such as `com_acme_crm_sync` (dots and hyphens
become underscores). For coding-agent assistance, install the
[Extension Authoring Skill](extension-authoring-skill).

An extension is also the place for custom code in workflows. Flow Steward has no
inline code step: write the logic in an extension, expose it as an action, and
call it from a workflow with the **Extension tools** step. See
[Custom code](../reference/workflow-step-kinds#custom-code-code-step).

## What An Extension Contains

A complete extension usually has these parts:

| Area | Purpose |
| --- | --- |
| `extension.yaml` | Runtime manifest. Declares identity, kind, features, entrypoints, scopes, host contract, network destinations, schemas, UI, actions, queries, callbacks, events, workflow triggers, and optional Contract v2 refs. |
| `icon.png` | Required logo next to `extension.yaml`: a square PNG, 32–512 px on a side (128×128 recommended), at most 100 KB. The manifest has no icon field; `validate`, `bundle` and install refuse a bundle without a valid one. `extensions create` writes a default. |
| `extension-descriptor.yaml` | Distribution descriptor. Used for marketplace or private import metadata, published artifacts, runtime compatibility, provenance, and commerce metadata. |
| `schemas/*.schema.yaml` | JSON Schema documents written in YAML. They define configuration, secrets, subscription settings, action inputs, and result payloads. |
| `ui/ui_manifest.yaml` | UI root manifest. Lists extension pages and imports page files. |
| `ui/pages/*.yaml` | Operator-facing pages. Pages compose components and bind them to queries and actions. |
| `ui/components/*.yaml` | Reusable component definitions such as forms, grids, health panels, callback setup panels, and markdown blocks. |
| `ui/actions/actions.yaml` | Action operation catalog. Defines command-style operations the UI or workflows can invoke. |
| `ui/queries/queries.yaml` | Query operation catalog. Defines read-style operations used by UI components and runtime callers. |
| `contracts/*.yaml` | Extension Contract v2 fragments for builder operations, connection types, resource queries, step UI, event bindings, and artifact policies. |
| `locales/<language>.yaml` | Optional translations of the extension's readable text: flat `key: text` maps. |
| `artifacts/` | Optional workflows, agents, skills, tools, datasets and saved queries published through `extension-descriptor.yaml`. |
| `main.py` | Runtime entrypoint. Reads one JSON request from stdin and writes one JSON response to stdout. |
| `health.py` | Healthcheck command. Verifies imports, files, and provider readiness. |
| `handlers/` | Extension-owned backend logic. Split provider operations into modules here when needed. |
| `requirements.in` | Optional direct Python dependency input used by `extensions lock-deps`. |
| `wheels/` | Bundled runtime dependency wheels (Linux x86_64 and aarch64) for offline install/update. Filled by `bundle --with-wheels`. |
| `requirements-dev.txt`, `dev-wheels/` | Test-only dependencies for `extensions test`. `dev-wheels/` is never packaged. |
| `scripts/smoke_check.py` | Fast executable smoke script for local and CI sanity checks. |
| `tests/` | Pytest regression suite for compilation, descriptor validation, contract validation, runtime behavior, and integration safety. |

Flow Steward extension authoring files are YAML-only. JSON is still used for
runtime stdin/stdout envelopes, REST payloads, database JSONB fields, CLI JSON
output, and fixtures.

## Choose a reference

The contract authority is the target application's
`docs/standards/extension-manifest-standard.yaml` together with its compiler and
validators. Two references follow it:

| Reference | Use it for |
| --- | --- |
| [Acme CRM Sync example](#runtime-manifest) | The smallest valid bundle: a deterministic task provider with one page, three actions, one query and a smoke check. No dependencies, no network. |
| [Example Showcase extension](#example-showcase-extension) | A broader reference for UI pages, forms, actions, queries, settings and secrets, OAuth, Contract v2 operations, workflow triggers, event bindings, callbacks, tools, workflows with a hook, health, translations and tests. Verify its current contents and compatibility before copying it. |

Core ships neither in its `extensions/` folder.

Extension development belongs in a Development source environment with Docker
available, not in a Compact runtime/admin container. See
[Local Development](../developer/local-development).

## Example Showcase Extension

The Example Showcase (`flowsteward.example-showcase`) is an external reference
bundle for extension authors. The Core authoring reference describes it as
synthetic and mock-by-default. If a compatible release is listed in your
**Extensions › Marketplace**, you can install it there, or read and copy its
source:

```bash
git clone https://github.com/Flow-Steward/ext-example-showcase.git
```

Browse it online at
[github.com/Flow-Steward/ext-example-showcase](https://github.com/Flow-Steward/ext-example-showcase).
The following file map is an authoring reference, not verification of the
external repository's current contents or Marketplace availability. Check its
README and the selected revision before relying on feature names, counts,
dependencies or mock behavior.

| Feature | Showcase files | What to look at |
| --- | --- | --- |
| Runtime manifest, host contract, network destinations | `extension.yaml` | `kind: tool_provider`, features `tool`, `action`, `query`, `workflow_trigger`, `artifact_bundle`; `runtime.contract_version: extension_host_v2`; `egress` hosts and connection fields; optional dependency on another extension. |
| Logo | `icon.png` | 128×128 PNG next to the manifest. |
| UI pages | `ui/ui_manifest.yaml`, `ui/pages/*.yaml` | Four reference pages: **Overview**, **Configuration**, **Operations**, **Demo Artifacts**. |
| UI components | `ui/components/*.yaml` | `markdown`, `health_panel`, `stats_row`, `callback_setup`, `form` (settings, secrets, test request, batch, notification) and `grid` (workflows, agents, tools, operations). |
| Settings and secrets | `schemas/config.schema.yaml`, `schemas/secrets.schema.yaml`, `schemas/subscriptions.schema.yaml` | Non-secret settings with a conditional rule (`allowed_hosts` is required when `mock_mode` is off); password, API token and webhook secret stored as secrets and never echoed. |
| Queries | `ui/queries/queries.yaml`, `handlers/queries.py` | `provider_health`, `load_connection_settings`, `connection_status`, `list_demo_workflows`, `list_demo_agents`, `list_demo_tools`, `list_example_resources`, `operation_contracts`. |
| Actions | `ui/actions/actions.yaml`, `handlers/actions.py` | UI-only `save_connection_settings`, `save_secrets`; workflow-visible `test_external_request`, `send_review_notification`, `batch_score_records`, `run_demo_tool`, `invoke_tool`, `oauth_profile`. |
| Workflow operations (Extension tools step) | `contracts/operation_manifest.yaml`, `contracts/step_ui_manifest.yaml`, `contracts/resource_query_manifest.yaml` | One Contract v2 operation per workflow-visible action: a `source`, a `human_channel`, a `bulk_action` with batching, and `action` operations; step form fields and resource pickers. |
| Connections and OAuth | `contracts/connection_types.yaml` | An API connection and an OAuth2 connection; `oauth_profile` receives only the access token. |
| Artifacts produced by operations | `contracts/artifact_policies.yaml` | Inputs/outputs an operation may read or write as files. |
| Workflow trigger and event bindings | `workflow_triggers` in `extension.yaml`, `contracts/event_bindings.yaml` | A provider trigger type with its config form; platform events (`approval.requested`, `job.completed`, `interaction.received`) bound to operations. |
| Callbacks | `ui/components/callback_setup.yaml` | Webhook registration panel and HMAC signing rules. |
| Tools | `artifacts/tools/*.yaml`, `demo_workflow_tools.py` | Deterministic tool artifacts (content, weather, product catalog) run through `invoke_tool`, including writing a file artifact. |
| Workflows, agents, skills, datasets | `artifacts/`, `extension-descriptor.yaml` | Reference inventory: 14 demo workflows (branching, HTTP, child workflow, For each, Groups and parallel lanes, error route, **hook**), 5 agents, 5 skills, a dataset and a saved query. |
| Hooks (extension points in a shipped workflow) | `artifacts/workflows/demo_order_with_client_hook.yaml` | A protected author workflow with a hook where each project adds its own steps. |
| Health | `health.py` | Loads each runtime module and reports per-file checks. |
| Translations | `locales/en.yaml`, `locales/lt.yaml` | Flat key maps derived from ids. |
| Tests and scripts | `tests/`, `.github/scripts/`, `release/checks.py` | Pytest suites for the bundle, descriptor, demo tools and test wheels; smoke check, packaging and catalog check scripts; release-candidate checks over the public API. |

For another external wheel-bundling reference, see the File Transfer extension
([github.com/Flow-Steward/ext-file-transfer-sftp](https://github.com/Flow-Steward/ext-file-transfer-sftp)).
Verify its selected revision and wheel platforms before using it as a template.

## Create A Scaffold

Create a new extension with the tooling CLI from the Flow Steward source tree:

```bash
./flow-steward extensions create com.acme.crm-sync \
  --display-name "Acme CRM Sync" \
  --description "Connects Acme CRM records to Flow Steward workflows." --confirm
```

The public scaffold starts as a `tool_provider` with `tool`/`action` features and a hidden `save_settings` action, not a task-ingress provider. It is intentionally small. It gives you the expected file layout,
minimal manifests, healthcheck, runtime entrypoint, smoke script, and pytest
test. After scaffolding, change the kind, features, schemas, UI, and handlers
to match the provider you are building.

Use these commands throughout development:

```bash
./flow-steward extensions validate com.acme.crm-sync
./flow-steward extensions test com.acme.crm-sync
./flow-steward extensions bundle com.acme.crm-sync --confirm
```

`--confirm` explicitly authorizes the shown local create/package change in a noninteractive session. In the reviewed native authoring CLI, an unconfirmed change can return review exit `10`; it is not success, and installed launchers can reject earlier with different codes. Successful commands return `0`. Stop on failed validation or testing before packaging.

When the extension needs third-party Python libraries, add direct pins to
`requirements.in`, lock the full wheel/hash set, and bundle wheels:

```bash
./flow-steward extensions lock-deps com.acme.crm-sync --confirm
./flow-steward extensions bundle com.acme.crm-sync --with-wheels --confirm
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

A complete minimal bundle, the Acme CRM Sync example, is published with this
documentation. Its ten files, all under `/examples/com_acme_crm_sync/`:

| File | Open or download |
| --- | --- |
| `extension.yaml` | [extension.yaml](/examples/com_acme_crm_sync/extension.yaml) |
| `icon.png` | [icon.png](/examples/com_acme_crm_sync/icon.png) |
| `main.py` | [main.py](/examples/com_acme_crm_sync/main.py) |
| `health.py` | [health.py](/examples/com_acme_crm_sync/health.py) |
| `requirements-dev.txt` | [requirements-dev.txt](/examples/com_acme_crm_sync/requirements-dev.txt) |
| `scripts/smoke_check.py` | [scripts/smoke_check.py](/examples/com_acme_crm_sync/scripts/smoke_check.py) |
| `ui/ui_manifest.yaml` | [ui_manifest.yaml](/examples/com_acme_crm_sync/ui/ui_manifest.yaml) |
| `ui/pages/overview.yaml` | [overview.yaml](/examples/com_acme_crm_sync/ui/pages/overview.yaml) |
| `ui/actions/actions.yaml` | [actions.yaml](/examples/com_acme_crm_sync/ui/actions/actions.yaml) |
| `ui/queries/queries.yaml` | [queries.yaml](/examples/com_acme_crm_sync/ui/queries/queries.yaml) |

### Get and verify the example

Save each file at the same relative path under
`extensions/com_acme_crm_sync/` in your Flow Steward source checkout. The folder
name must be exactly `com_acme_crm_sync`. Instead of copying files one by one,
you can start from the full [Example Showcase](#example-showcase-extension)
with `git clone`.

The `--root` value is the directory containing `com_acme_crm_sync/`, not the
extension folder itself. Validate, run the provider-free smoke check, and
bundle. Run each command separately and stop after any nonzero exit; a
successful bundle does not prove that validation or tests passed.

```bash
./flow-steward extensions validate com.acme.crm-sync --root extensions --health
./flow-steward extensions test com.acme.crm-sync --root extensions --allow-no-pytest
./flow-steward extensions bundle com.acme.crm-sync --root extensions --output-dir dist/extensions --confirm
```

The example has no `tests/` folder, so `extensions test` needs
`--allow-no-pytest`; add pytest tests before you build on it.

Then, on a disposable Flow Steward installation, install the archive
`dist/extensions/com.acme.crm-sync-0.1.0.zip` with **Extensions › Install
extension from file** (see [Bundle And Install](#bundle-and-install)), enable
it, run **Health**, and disable and uninstall it when you are done. Uninstall
shows its plan first; see the
[Extension Operator Guide](extension-operator-guide#plan-and-confirm-uninstall).

The exact published manifest is:

```yaml
manifest_version: 2
lifecycle: {data_schema_version: 1, data_migrations: []}
extension_id: com.acme.crm-sync
kind: task_provider
version: 0.1.0
display_name: Acme CRM Sync
description: Minimal deterministic task-provider example for the public extension tutorial.
vendor: {name: Acme Example}
features: [task_ingress]
required_scopes:
  - extension:invoke
  - event:subscribe
event_subscriptions:
  - event_type: job.completed
    severity: info
entrypoint:
  mode: subprocess
  command: [python3, main.py]
health:
  command: [python3, health.py]
  timeout_seconds: 5
ui_manifest: ui/ui_manifest.yaml
query_manifest: ui/queries/queries.yaml
action_manifest: ui/actions/actions.yaml
runtime:
  contract_version: extension_host_v2
egress: {}
python_requirements: []
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
| `vendor.name` | Yes | Canonical publisher identity. Compatibility aliases exist, but new manifests should use `vendor.name`; identity is not authorization. |
| `lifecycle` | Yes | Data-schema version and ordered migrations; version 1 may use an empty migration list. |
| `features` | Yes | Capability flags such as `notify`, `tool`, `task_ingress`, or `ingress_event`. |
| `required_scopes` | Recommended | Host permissions the extension requires. Scope names must include a colon. |
| `event_subscriptions` | Optional | Authoring selectors the extension wants delivered; compilation derives `supported_events`. Do not author `supported_events` directly. |
| `schemas` | Optional | Named string paths to YAML schemas or actual inline JSON Schema objects. `{ref: ...}` is an inline object, not a file-reference form. |
| `entrypoint` | Yes | Subprocess command used for query/action invocation. |
| `health` | Yes | Healthcheck command. |
| `ui_manifest` | Yes for manifest v2 | String path such as `ui/ui_manifest.yaml`. |
| `query_manifest` | Required when queries are referenced | String path to query definitions. |
| `action_manifest` | Required when actions are referenced | String path to action definitions. |
| `machine_auth` | Optional | Machine auth settings for service-account style execution. |
| `account_scope` | Optional | Account/project/workflow boundaries and subscription settings. |
| `callbacks` | Optional | Callback registrations for webhooks or provider callbacks. |
| `workflow_triggers` | Optional | Custom workflow trigger types contributed by the extension. |
| `dependencies.extensions` | Optional | Other extensions this extension depends on. |
| `python_requirements` | Optional | Full transitive Python wheel lock for the extension subprocess. |
| `runtime.contract_version` | Yes | Must be `extension_host_v2`. Validation and install refuse a missing or different value (`missing_host_contract`, `unsupported_host_contract`). |
| `runtime.extension_contract_v2` | Optional | Refs to Contract v2 files used by builders and registry projections. |
| `egress` | Recommended | Where the extension connects: `hosts` (bare host names or `*.example.com`) and `connection_fields` (`<connection_type_id>.<field>`). Shown to the administrator, not enforced. `egress: {}` says it connects nowhere; leaving it out installs with the `egress_undeclared` warning. |
| `runtime_grants` | Optional | Least-needed host authority restricted to the extension's namespace. |
| `external_effects` | Conditional | Active notification providers require the reserved delivery effect; not mandatory for every kind. |
| `project_state` | Optional | Extension-owned project state declaration. |
| `listing` | Optional in ordinary validation | Marketplace validation requires category and summary. |
| `release_stage` | Optional | Defaults to `active`; placeholder delivery exemption does not bypass other validation. |
| `entrypoint.timeout_seconds` | Optional | Invocation timeout, validated when supplied. |

All refs must stay inside the extension bundle and must point to YAML files.
Absolute paths, refs that escape the bundle, missing files, and JSON contract
files are validation errors. Relative `../` segments are allowed when the
resolved target remains inside the bundle.

### Kind-Specific Operation Contracts

Required capability flags are not the whole provider contract. A `task_provider` declares `task_ingress`; other kinds must not use that feature. The required operation declarations are:

| Operation | Required result fields | Required errors |
| --- | --- | --- |
| Action `normalize_task_action` | `result.normalized` | Common action errors plus `invalid_payload` |
| Action `fetch_attachments` | `result.attachments` | Common action errors plus `not_found` |
| Action `sync_completion_status` | `result.status` | Common action errors plus `conflict` |
| Query `provider_health` | `result.status`, `result.configured` | `not_configured`, `authentication_failed`, `provider_unavailable`, `timeout`, `internal_error` |

Common action errors are `not_configured`, `authentication_failed`, `rate_limited`, `provider_unavailable`, `timeout` and `internal_error`. Declare fields/errors directly or inside the operation's `contract`. All task-ingress operation errors must belong to the supported catalog: `not_configured`, `missing_credentials`, `authentication_failed`, `permission_denied`, `invalid_payload`, `unsupported_event`, `not_found`, `conflict`, `rate_limited`, `timeout`, `provider_unavailable`, `upstream_error`, `invalid_response`, `runtime_error`, `internal_error`.

An active `notification_provider` requires `notify` and exactly one reserved `deliver_notification` action, Contract V2 operation and external effect:

| Declaration | Required contract |
| --- | --- |
| Action | Extension handler; `workflow_visible: false`; exactly `event` and `route` parameters, both required objects. |
| V2 operation | `operation_kind: action`; `workflow_visible: false`; exactly `event` and `route` inputs, both required with `value_type: object`; outputs include `delivered` (boolean) and `provider_message_id` (text). |
| External effect | `operation_id: deliver_notification`; `effect_kind: message_delivery`; nonempty `channel`; `idempotency: required`; `test_mode_behavior: suppress`. |

`release_stage: placeholder` is exempt from that active delivery contract, not from kind/features or other validation. Notification kind does not require blanket `runtime_grants`.

Optional notification feature `ingress_event` requires an `ingress_event` action declaring `result.ingress_type` and an `event_subscriptions` selector for `external.comment.received`. `notification.interaction_received` is recommended, not mandatory. Author subscriptions, not compiled `supported_events`.

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

The compiler derives the compiled `supported_events` projection from these
authoring subscriptions. `supported_events` is not accepted as an authored
manifest key.

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

Callback ids use lowercase letters, numbers, underscores, and hyphens, starting
with a letter or number. Callback methods are `GET` and `POST`; auth supports
`none`, `shared_secret_header`, `hmac_sha256`, and `hub_signature`.

For HMAC, declare `signature_header`, `timestamp_header`, and
`delivery_id_header`; `max_age_seconds` defaults to 300 and accepts 30–3,600.
The host-generated registration secret signs UTF-8
`<integer timestamp>.<delivery ID>.` followed by the raw request body with
SHA-256 HMAC, encoded as lowercase hex (an optional `sha256=` prefix is accepted).
The delivery ID is claimed before dispatch; a replay returns HTTP 409.
Confirm that your provider supports this exact recipe and a configurable secret.
This is distinct from workflow webhook signature configuration and the generic
OAuth callback. See `core/application/extensions/callbacks.py` in the target
application source for the current ingress contract.

For Meta-style webhooks, `hub_signature` uses a different recipe:

```yaml
auth:
  type: hub_signature
  signature_header: X-Hub-Signature-256
  secret_name: app_secret
```

Use a connection-scoped registration and allow both `GET` and `POST`. The
registration's generated shared secret is the verification token for the GET
`hub.mode=subscribe` handshake; a matching `hub.verify_token` returns
`hub.challenge` as plain text. POST authentication checks HMAC-SHA256 of the raw
body against the connection secret named by `secret_name`. It does not use the
timestamp/delivery-ID recipe above; handle provider retries in your ingress
logic.

The operator UI can expose callback setup through a `callback_setup` component.
Flow Steward APIs create, rotate, and check registrations, while the extension
action handles the actual ingress payload.

### Workflow Triggers

Workflow triggers add custom trigger types to the workflow trigger catalog:

```yaml
workflow_triggers:
  - trigger_type_id: acme_comment_received
    provider_key: com.acme.crm-sync
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
| `python_requirements` | Optional Python dependency lock for descriptor/import validation. |
| `artifacts` | Workflows, agents, skills, tools, contracts, guardrails, and extension artifacts to publish. |
| `provenance` | Origin metadata: exactly `vendor_published`, `user_generated`, or `imported`. These values describe provenance; they are not permission or trust tiers. |
| `commerce` | Billing or plan metadata. |

The descriptor validator is strict. Most descriptor blocks reject unknown fields,
remote HTTPS endpoints must be HTTPS unless explicitly allowed as insecure, and
every artifact entry must have an id plus either a ref or snapshot.

Remote HTTPS descriptors must define these endpoint paths:

```yaml
runtime:
  contract_version: extension_host_v2
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

Use the platform's executable JSON Schema subset. It supports object/array and
scalar types, required fields, enums/constants, bounds, patterns, and composition
such as `oneOf`, `anyOf`, `allOf`, `if`/`then`/`else`, `dependentRequired` and
`not`. Unsupported assertion keywords are rejected rather than silently
ignored. `format` is an annotation, not format validation. Check
`core/application/extensions/json_schema_subset.py` for the target version's
exact supported keywords.

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
| `connection_form` | Connection configuration form, with optional pre-save actions. |
| `state_editor` | Extension state editing component declaration. |
| `external_resource_picker` | Browser resource picker with an explicit bootstrap action, scripts, origins and selection contract. |
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
    - path: base_url
      label: Base URL
      widget: url
      required: true
    - path: mock_mode
      label: Mock mode
      widget: boolean
data:
  load_query: load_connection_settings
  save_action: save_connection_settings
  test_action: test_external_request
```

Action bindings must live under `data`. Top-level `save_action`,
`validate_action`, `test_action`, or `load_query` fields are rejected.
Use `path` or `field_id` for form fields so the compiler can check them against
the save action's declared `parameters`. Every saved field must have a matching
parameter; an input schema alone does not replace that declaration.

Valid form widgets include:

```text
text, textarea, url, email, number, integer, boolean, select, radio_group,
checkbox_group, tag_picker, secret, json, key_value, repeater, event_selector,
project_selector, workflow_selector, provider_selector
```

The renderer currently has first-class handling for the common widgets used by
the renderer, including text, textarea, select, boolean, integer, secret, and
repeater-backed form sections. Other widgets are valid contract declarations
and may require frontend support in the target Flow Steward version.

### Repeaters

Use a repeater when the operator edits a list of objects:

```yaml
- path: records
  label: Records
  widget: repeater
  props:
    min_items: 1
    fields:
      - path: record_id
        label: Record id
        widget: text
        required: true
      - path: urgent
        label: Urgent
        widget: boolean
```

Repeater fields support props such as `unique_in_list` and
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

The renderer reads rows from `result.items`, falling back to `result.connectors`.
For server-paginated data, return `page` or `page_size` with the page's rows, plus
`total` and `has_more` as needed. Without `page` or `page_size`, the renderer
slices the returned rows locally.

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
    workflow_visible: false
    parameters:
      - {name: base_url, type: string, required: true}
      - {name: mock_mode, type: boolean, required: false}
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
| `parameters`, `input_schema` | Actions | Declared input fields and optional input schema. Form save fields must match declared parameters. |
| `mutates_platform` | Actions | Set true when an action requests host-side mutation. |
| `command_type` | Mutating actions | Required when `mutates_platform` is true. |
| `workflow_visible` | Required for actions | Explicit boolean. `true` requires a same-ID workflow-visible Contract V2 operation with compatible action/input/output semantics. |

Operation ids must be unique. UI components that reference an action or query id
must reference an id declared in the corresponding manifest.

### Registering A New Action

To add an action:

1. Add the action to `ui/actions/actions.yaml`.
2. If the action has input, declare its parameters and add or update a YAML schema.
3. Bind the action from a component, workflow operation, callback, or Contract
   v2 operation.
4. Implement a handler in the extension runtime.
5. Return the canonical response envelope.
6. Add a smoke check or pytest assertion.
7. Run `extensions validate` and `extensions test`.

For a UI form save action, the frontend sends component context, target
information, current values, and form data to:

```text
POST /api/extensions/{extension_id}/action/{action_id}
```

### Use An Action As A Workflow Step

This is how custom code reaches a workflow. An action appears in the workflow
builder under **Extension tools** when both of these declare the same id:

1. The action in `ui/actions/actions.yaml` with `workflow_visible: true`.
2. A Contract v2 operation in `contracts/operation_manifest.yaml` with the same
   `operation_id`, its inputs and outputs, referenced from
   `runtime.extension_contract_v2.operation_manifest` in `extension.yaml`.

```yaml
# ui/actions/actions.yaml
actions:
  - action_id: score_lead
    workflow_visible: true
    title: Score lead
    description: Scores a CRM lead with the team's own rules.
    required_scopes: [extension:invoke]
    handler: {mode: extension}
    parameters:
      - {name: lead, type: object, required: true}
    result_fields: [result.score]
    error_codes: [invalid_payload]
    mutates_platform: false
```

```yaml
# contracts/operation_manifest.yaml
operations:
  - operation_id: score_lead
    display_name: Score lead
    description: Scores a CRM lead with the team's own rules.
    operation_kind: action
    inputs:
      - {name: lead, value_type: object, required: true}
    outputs:
      - {name: score, value_type: integer}
    result_fields: [result.score]
    error_codes: [invalid_payload]
```

The handler receives the mapped inputs in `action.input` and returns
`{"ok": true, "result": {"score": 87}}`. In the workflow, add an
**Extension tools** step, pick the installed extension and the operation, and
map inputs from workflow state. A visible action without a matching operation
fails validation (`workflow_action_requires_contract_v2`,
`workflow_action_operation_mismatch`). The Example Showcase's `run_demo_tool`
and `invoke_tool` are reference examples to check in its selected revision.

## Runtime Backend Logic

Local extensions run out of process. Flow Steward starts the declared command,
writes one JSON request to stdin, reads one JSON response from stdout, and then
normalizes and validates the response.

A larger extension can separate its runtime like this:

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
  "contract_version": "extension_host_v2",
  "mode": "query",
  "runtime_context": {
    "account_id": "acct_123",
    "project_id": "project_123",
    "workflow_id": null,
    "job_id": null,
    "group_id": null,
    "for_each_id": null,
    "step_id": null,
    "step_execution_id": null
  },
  "host": {
    "contract_version": "extension_host_v2",
    "operation": "query",
    "scope": {
      "account_id": "acct_123",
      "project_id": "project_123",
      "workflow_id": null,
      "job_id": null,
      "group_id": null,
      "for_each_id": null,
      "step_id": null,
      "step_execution_id": null
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
  "contract_version": "extension_host_v2",
  "mode": "action",
  "runtime_context": {
    "account_id": "acct_123",
    "project_id": "project_123",
    "workflow_id": "workflow_123",
    "job_id": "job_123",
    "group_id": null,
    "for_each_id": "each_order",
    "step_id": "save_order",
    "step_execution_id": "3f0c9a52-6d1e-4c8e-9b7a-2e5d0f1a8c44"
  },
  "host": {
    "contract_version": "extension_host_v2",
    "operation": "command",
    "scope": {
      "account_id": "acct_123",
      "project_id": "project_123",
      "workflow_id": "workflow_123",
      "job_id": "job_123",
      "group_id": null,
      "for_each_id": "each_order",
      "step_id": "save_order",
      "step_execution_id": "3f0c9a52-6d1e-4c8e-9b7a-2e5d0f1a8c44"
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

The SDK reads execution context from the top-level `runtime_context`, not from
`host.scope`. Include the four execution-scope keys `group_id`, `for_each_id`,
`step_id` and `step_execution_id` there, even when their values are null.
`group_id` or `for_each_id` names the step's immediate container (at most one of
them; both are null for a root step), and all four are null outside a workflow
run. The SDK's `runtime_context_from_payload` refuses an envelope with another
contract, a missing scope key, both containers set, or only one of `step_id` and
`step_execution_id` set. There are no phases in this contract. Runtime context
can also include artifact grants and logger metadata when an action runs inside
a workflow.

## Extension SDK

New extension runtime code should import platform helpers from the public SDK
namespace:

```python
from flowsteward_extension_sdk import (
    assert_safe_remote_http_url,
    open_pinned_url,
    read_artifact_bytes,
    runtime_context_from_payload,
    write_artifact_bytes,
)
```

Do not import private `core.*` modules from extension runtime files, and do not
mutate `sys.path` to reach Flow Steward internals. The validator rejects those
patterns for new extensions. Platform primitives belong in
`flowsteward_extension_sdk`; third-party libraries belong in
`python_requirements`.

The SDK source package declares `flowsteward-extension-sdk` version 0.4.0;
this is not proof of a published package release. Its public surface exposes:

| SDK area | Use it for |
| --- | --- |
| `runtime_context_from_payload`, `RuntimeContext`, `RuntimeResources` | Reading account, project, workflow, job, execution scope (Group, For each, step), logger, artifact storage and host-authorized resources from the request. Refuses envelopes that are not `extension_host_v2`. |
| `assert_safe_remote_http_url`, `assert_safe_remote_https_url`, `resolve_pinned_ips`, `build_pinned_opener`, `open_pinned_url`, `parse_retry_after` | SSRF-resistant outbound HTTP(S) with DNS/IP pinning and private-address blocking; `Retry-After` parsing for rate limits. |
| `read_artifact_bytes`, `write_artifact_bytes`, `stream_artifact_bytes`, `write_artifact_stream`, `artifact_to_local_path` and the `dataset_*` equivalents | Reading input files and writing output files through host-granted URLs, whole or streamed. |
| `ArtifactDatasetPlane` and storage adapters | Local, in-memory or S3-backed artifact and dataset records in tests or controlled flows. |
| `report_progress` | Showing "doing X, 40 of 120" on the running step in Job Details. Never raises; does nothing outside a run. |
| `host_mutation` | Building a typed host mutation request that the host checks against `runtime_grants`. |
| `migration_result`, `MigrationEnvelope` | Returning the result of a data migration action declared in `lifecycle.data_migrations`. |
| `handshake_result` | The handshake answer of a remote (`remote_https`) runtime. |
| `ExtensionWorkflowHarness`, `resolve_integration_contract` | Testing workflows and operation contracts inside the extension's own test suite. |

Example runtime context and artifact access:

```python
from flowsteward_extension_sdk import (
    ArtifactAccessError,
    read_artifact_bytes,
    runtime_context_from_payload,
    write_artifact_bytes,
)


def process_artifact(request_payload: dict) -> dict:
    ctx = runtime_context_from_payload(request_payload)
    try:
        source = read_artifact_bytes(request_payload, binding_key="input_csv")
        result = source.upper()
        output = write_artifact_bytes(
            request_payload,
            result,
            binding_key="output_csv",
            content_type="text/csv",
        )
    except ArtifactAccessError as exc:
        return {
            "ok": False,
            "error_code": "artifact_access_failed",
            "error": str(exc) or "Artifact access failed.",
            "errors": [{"code": "artifact_access_failed", "message": str(exc) or "Artifact access failed."}],
        }
    return {
        "ok": True,
        "result": {
            "project_id": ctx.project_id,
            "artifact": output,
        },
    }
```

The entrypoint that serializes this helper result must exit 2 for `ok: false`
and 0 for `ok: true`.

The SDK is placed on the extension subprocess `PYTHONPATH` by the platform.
Do not list it in `python_requirements` or put it in `wheels/`. For your own
tests outside Flow Steward, keep the SDK wheel in `dev-wheels/` and name it in
`requirements-dev.txt`; `dev-wheels/` is never packaged.

## Response Envelope

The subprocess exit status is part of the protocol. Successful operations exit
**0** with `ok: true`. A domain failure exits **2** with `ok: false`, nonempty
`error_code` and `error`, and a nonempty `errors` list. Every entry has a code
and message; the first must match the top-level values exactly:

```json
{"ok": false, "error_code": "invalid_input", "error": "A record ID is required.", "errors": [{"code": "invalid_input", "message": "A record ID is required."}]}
```

A bare `ok: false` response is not a valid domain-error envelope. Malformed
responses and mismatched exit statuses can be treated as runtime failures and
count against the circuit breaker. Keep diagnostics on stderr.


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
| `events` | Events emitted by the extension. Event types must be allowed by the compiler-derived `supported_events` projection; author selectors in `event_subscriptions`, never in a manifest `supported_events` field. |
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

Declare delivered events in the authoring `event_subscriptions` list:

```yaml
event_subscriptions:
  - event_type: external.comment.received
    severity: info
  - event_type: notification.interaction_received
    severity: info
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
job.completed, job.failed, job.step_started, job.step_completed,
job.step_failed, job.step_blocked, job.group_started, job.group_completed,
job.group_failed, job.approval_waiting, job.timer_waiting
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
project/workflow/job/group/For each/step ids, source, aggregate id, actor, URLs, and
metadata.

## External APIs And OAuth

Keep live network behavior explicit and safe:

- Use mock mode by default for examples and tests.
- Require HTTPS for live provider requests.
- Keep credentials out of URLs.
- Restrict live hosts with an `allowed_hosts` config field.
- Cap response bodies and redact tokens in responses and logs.
- Store API tokens and OAuth access tokens as secrets, not config.

For example code, make live requests an explicit choice. Validate the target
host, keep credentials out of URLs, and redact token material from diagnostics.
The Acme CRM Sync example makes no live provider requests. In the Example
Showcase reference, inspect `test_external_request` for its mock and live-request
behavior before running it.

OAuth connections are described in Contract v2 `connection_types`; the contract
also supports `oauth_providers` for platform-owned provider configuration and
authorization. The runtime action receives connection-scoped secret values, for
example `action.target.connection.secrets.access_token`. Refresh tokens and
client credentials remain platform-managed for platform-owned OAuth flows.

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
| `oauth_providers` | Platform-owned OAuth provider declarations, including configuration, callbacks and optional post-connect actions. |
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

Supported artifact sections are `workflows`, `agents`, `skills`, `tools`,
`datasets`, `saved_queries`, `data_contracts`, `guardrails` and `extensions`. Each artifact entry needs an id and a
`ref` or `snapshot`. Set `publish: false` for internal artifacts that should be
packaged but not listed.

Validate every published artifact against the target registry schema. The
Acme CRM Sync example has no distribution descriptor; inspect the Example
Showcase's selected revision for a broader descriptor/artifact example.

## Package target and host grants

`runtime_target` is package metadata in `.fs-package.yaml`, not an allowed
`extension.yaml` field. Native bundles use `linux-amd64` or `linux-arm64` and
need the matching Linux executable; inspect the bundler's `--runtime-target`
option. Python wheel platform tags describe dependency compatibility separately.

All extensions share the same trust model. Vendor/publisher names and catalog
verification do not grant privileges. Declare only supported `runtime_grants`
for your extension's own namespace; use the current grant validator and SDK.
There is no privileged system-extension bootstrap step.

## Validation

The extension compiler and validator perform several checks before an extension
can be enabled:

1. Locate `extension.yaml`, and check `icon.png`. Manifest discovery does not use `extension.yml`.
2. Reject forbidden JSON contract files.
3. Normalize manifest identity, entrypoint, healthcheck, features, scopes, and
   refs.
4. Resolve schema refs inside the bundle.
5. Resolve UI manifest pages and components.
6. Resolve query and action manifests.
7. Detect duplicate page ids, component ids, action ids, and query ids.
8. Validate kind and feature combinations.
9. Validate callbacks, dependencies, workflow triggers, and event selectors.
10. Check `runtime.contract_version`, `egress`, bundled wheels against
    `python_requirements`, translations and the runtime code boundary.
11. Build the compiled manifest preview.

The static code scan also rejects patterns such as dynamic code execution,
direct `ctypes`/`cffi` use, shells and process replacement in extension-owned
runtime code. Other findings, such as raw sockets or subprocesses without a
shell, can produce warnings for review. The scan is not a security boundary;
third-party libraries and runtime isolation have separate responsibilities.

Compiler validation issues include severity, code, message, file path, field
path, and hint. These compiler codes are separate from public CLI envelope codes.
Use JSON output to inspect the public command result:

```bash
./flow-steward extensions validate com.acme.crm-sync --json
```

The public CLI maps failed extension validation or tests to exit `3` and envelope
code `validation_failed`; it does not preserve each compiler issue as the
envelope's `.error.code`. Internal tooling exit values are not public process
statuses. Successful commands exit `0`. An unattended create/bundle reaching
review without confirmation exits `10` with `cancelled`. Record actual launcher
results and prerequisite failures, not inferred successes.

Marketplace validation checks manifest vendor/listing/scopes/machine-auth/account-scope metadata, not the distribution descriptor schema. Ordinary validation also checks certain descriptor-referenced artifact modules when a descriptor is present. Use `--marketplace` for the additional manifest checks:

```bash
./flow-steward extensions validate com.acme.crm-sync --marketplace
```

`vendor.name` is required even in ordinary validation. Marketplace validation
additionally requires a listing category/summary, nonempty `required_scopes`,
`machine_auth.service_account_key`, nonempty `machine_auth.required_scopes`,
`account_scope.scope_type` and `account_scope.description`. Listing summary can
be normalized from the manifest description; an absent listing still lacks the
required category. Marketplace rejections are textual diagnostics, not invented
compiler issue codes.

Validate distribution descriptors separately through the descriptor API described
in [Developer Extensions](../developer/extensions); `--marketplace` is not a
descriptor-validation command.

## Tests And Scripts

Use both scripts and tests. They serve different purposes.

| File | Purpose |
| --- | --- |
| `scripts/smoke_check.py` | Fast executable proof that the bundle can run. It should check health plus representative queries/actions. It does not need pytest and can be run directly in local CI or packaging jobs. |
| `tests/test_*.py` | Regression tests. Use pytest assertions for compile output, descriptor validation, Contract v2 checks, runtime behavior, integration safety, OAuth secret injection, ingress payloads, and action response shapes. |

The `extensions test` command runs validation, then any smoke script and local pytest targets. Default testing requires `requirements-dev.txt` and fails if no pytest targets exist unless `--allow-no-pytest` explicitly allows their absence:

```bash
./flow-steward extensions test com.acme.crm-sync
```

Run it through the Development launcher, which supplies the dedicated test
runtime. Calling the native test service outside that runtime fails before
smoke or pytest execution; a command returning an error is not a completed test
run.

Use repeatable `--test-path` options to select bundle-local pytest files or node
ids. Selected tests stop at the first failure; without a selection, the command
runs the discovered `tests/test_*.py` targets without fail-fast:

```bash
./flow-steward extensions test com.acme.crm-sync \
  --test-path tests/test_actions.py::test_score_lead
```

Smoke and pytest receive a filtered environment. For an extension-owned sandbox
input already present in your environment, pass its name with repeatable
`--test-env NAME` options. Values are read for that invocation and are not stored.
Malformed names and platform configuration/credential variable names are refused;
tests do not inherit the full platform environment.

The isolated test environment inherits the tooling interpreter's site packages and uses offline pip with `dev-wheels/` and `wheels/`. The generated scaffold has a comment-only `requirements-dev.txt` and one pytest file; neither wheel directory is required when the tooling interpreter already has the test packages. Missing requirements or unavailable development dependencies fail the command. `--allow-no-pytest` and `--skip-pytest` do not prove regression coverage.

Use `scripts/smoke_check.py` to answer "does this bundle basically work right
now?" Use pytest to answer "will this behavior stay correct as the extension and
platform evolve?"

## Python Dependencies And Wheel Distribution

An extension never installs packages into the Flow Steward Python environment
and never runs `pip install` during an invocation. Every third-party library it
imports ships inside the archive as a wheel, and `extension.yaml` pins it with
its hashes under `python_requirements`:

```yaml
python_requirements:
  - name: cffi
    version: "2.1.1"
    hashes:
      - sha256:<hash of the x86_64 wheel>
      - sha256:<hash of the aarch64 wheel>
  - name: pycparser
    version: "3.11"
    hashes:
      - sha256:<hash of the py3-none-any wheel>
```

Each entry is:

- a PEP 503-normalized lowercase package name;
- an exact PEP 440 version, not a range;
- a non-empty list of `sha256:` hashes, one per wheel file of that version;
- part of the full transitive closure: every dependency of every wheel is
  listed too.

Wheels only: source distributions are not accepted, and nothing is built during
installation.

### Target platforms

The public Dockerfile pins a Python 3.12 slim container image. Extension runtime
targets are Linux **x86_64 (amd64)** and **aarch64 (arm64)**. Apple Silicon Macs
and ARM cloud servers use the arm64 target when running the arm64 image. A
single distributable archive intended for both targets must include compatible
wheels for **both** architectures:

| Server | Wheel platform tag | Example wheel |
| --- | --- | --- |
| `linux/amd64` | `manylinux…_x86_64` | `cffi-2.1.1-cp312-cp312-manylinux2014_x86_64.manylinux_2_17_x86_64.whl` |
| `linux/arm64` | `manylinux…_aarch64` | `cffi-2.1.1-cp312-cp312-manylinux2014_aarch64.manylinux_2_17_aarch64.whl` |
| both | `any` | `pycparser-3.11-py3-none-any.whl` |

A pure-Python `py3-none-any` wheel covers both. A compiled package needs one
wheel per architecture, built for CPython 3.12 (`cp312`) or the stable ABI
(`abi3`). macOS (`macosx_*`), Windows (`win_*`) and `musllinux` wheels do not
install in the Flow Steward container. Check the target image's actual glibc
version before choosing a newer manylinux baseline; the Dockerfile alone does
not establish a universal glibc version for installed releases.

### Step by step

Run these in the Development tool runtime (`./flow-steward …`). It runs Python
3.12, so the downloaded wheels match the server's Python.

1. Put the direct dependencies, pinned, in `requirements.in` next to
   `extension.yaml`:

   ```text
   paramiko==5.0.0
   cryptography==50.0.2
   ```

2. Lock them. `lock-deps` downloads binary wheels for `manylinux2014_x86_64`
   and `manylinux2014_aarch64`, resolves the full closure for each, and writes
   every name, version and hash into `python_requirements`:

   ```bash
   ./flow-steward extensions lock-deps com.acme.crm-sync --root extensions --confirm
   ```

   It fails, naming the platform, when a package has no binary wheel for one
   of them.

3. Download the wheels into `wheels/` and build the archive:

   ```bash
   ./flow-steward extensions bundle com.acme.crm-sync --root extensions --with-wheels --confirm
   ```

   For each platform, `--with-wheels` downloads every locked requirement with
   `--require-hashes`, so a platform without a wheel whose hash is in the lock
   stops the bundle. The wheels stay in `<extension>/wheels/`; commit them if
   you build archives elsewhere.

4. Validate the bundle with its wheels and check the archive size (below):

   ```bash
   ./flow-steward extensions validate com.acme.crm-sync --root extensions
   ```

If a package publishes only wheels for a newer manylinux baseline, the
`manylinux2014` default may not find them. After confirming that the target
runtime supports the newer baseline, name it for both steps, for example:

```bash
./flow-steward extensions lock-deps com.acme.crm-sync --root extensions \
  --platforms manylinux_2_28_x86_64,manylinux_2_28_aarch64 --confirm
./flow-steward extensions bundle com.acme.crm-sync --root extensions --with-wheels \
  --platforms manylinux_2_28_x86_64,manylinux_2_28_aarch64 --confirm
```

`--platforms active` resolves only for the tool runtime's own architecture. Use
it for local experiments, never for an archive you hand to someone else.

### Vendoring wheels without the Flow Steward CLI

In a standalone extension repository you can fetch the same wheels with pip.
Use Python 3.12 and run pip once per architecture:

```bash
pip download --only-binary=:all: --dest wheels \
  --platform manylinux2014_x86_64 --implementation cp --python-version 3.12 \
  --abi cp312 --abi abi3 --abi none -r requirements.in

pip download --only-binary=:all: --dest wheels \
  --platform manylinux2014_aarch64 --implementation cp --python-version 3.12 \
  --abi cp312 --abi abi3 --abi none -r requirements.in
```

These are the target options `lock-deps` passes to pip. Then add one
`python_requirements` entry per package and version, listing the SHA-256 of
every wheel of that version (`sha256sum wheels/*.whl`, or `shasum -a 256` on
macOS). Run `extensions validate` on the result: it reports any wheel that is
not declared, a hash that is not listed, and a dependency missing from the
closure.

### What the tooling checks, and what it does not

| Check | Where | Both architectures? |
| --- | --- | --- |
| Every file in `wheels/` is a `.whl`, declared in `python_requirements` with its hash; wheel metadata names no undeclared dependency | `extensions validate`, install | No: it checks the files that are there. |
| Every requirement has at least one bundled wheel with a listed hash | `extensions validate`, install, with the default fetch mode `off` | No: one wheel of any architecture satisfies it. |
| Each target platform resolves with binary wheels | `extensions lock-deps` | Yes, for the platforms it is given (both by default). |
| Each locked requirement downloads for each target platform with a listed hash | `extensions bundle --with-wheels` | Yes, for the platforms it is given (both by default). |
| A wheel compatible with this server's Python and architecture exists | Install and update | Only the server's own architecture. |

So the guarantee comes from building with `lock-deps` and `bundle --with-wheels`
using both platforms. `extensions validate` passes a bundle whose `wheels/`
holds only x86_64 wheels; that archive installs on amd64 and fails on an arm64
server with `No compatible wheel for python requirement '<name>==<version>'`.
Before publishing, check that `wheels/` holds an `_x86_64` and an `_aarch64`
wheel (or one `any` wheel) for every requirement.

### Archive size and per-architecture archives

The packager and the installer refuse an archive larger than **50 MiB** zipped
or **150 MiB** unpacked. The installed dependencies may take up to 500 MiB
(`FS_EXTENSION_DEPS_SITE_MAX_BYTES`). When wheels for both architectures do not
fit in one archive, build one archive per architecture:

```bash
./flow-steward extensions bundle com.acme.crm-sync --root extensions --runtime-target linux-amd64 --confirm
./flow-steward extensions bundle com.acme.crm-sync --root extensions --runtime-target linux-arm64 --confirm
```

Each archive, named `com.acme.crm-sync-<version>-linux-amd64.zip` or
`…-linux-arm64.zip`, holds only the wheels for its architecture and a
`.fs-package.yaml` naming the target. A server refuses an archive built for the
other architecture. Run `bundle --with-wheels` first so `wheels/` holds both
sets. Extensions with native executables (`bin/linux-amd64/`,
`bin/linux-arm64/`) always need these two archives.

### At install time

Install and update pick, for each requirement, the bundled wheel that best
matches the server, and install the verified wheels with offline pip into the
extension folder:

```text
.fs-python/<extension-version>/site/
```

The Flow Steward Python environment is not modified. Each invocation gets
`PYTHONPATH` with that site directory first and the public SDK second.

| Setting | Meaning |
| --- | --- |
| `FS_EXTENSION_DEPS_FETCH=off` | Default. Every requirement must have a bundled wheel with a listed hash. |
| `FS_EXTENSION_DEPS_FETCH=allowlist` | Install may download a missing wheel from PyPI when its hash is listed. For controlled environments only; a published archive should not rely on it. |
| `FS_EXTENSION_DEPS_SITE_MAX_BYTES` | Caps the unpacked dependency directory (default 500 MiB). |

## Bundle And Install

Run `extensions validate` and `extensions test` first and stop on any failure:
`bundle` only packages files and can produce an archive whose manifest is
invalid. Then build the archive:

```bash
./flow-steward extensions bundle com.acme.crm-sync --root extensions --with-wheels --confirm
```

Use bare `bundle` (without `--with-wheels`) only when the extension has no
`python_requirements` or you have already supplied and verified the required
wheels. The command prints the archive path and its SHA-256, for
example `dist/extensions/com.acme.crm-sync-0.1.0.zip`. The archive's top folder
is the canonical folder name (`com_acme_crm_sync/`). It never contains
`dev-wheels/`, `.fs-python/` or cache folders, and the bundle refuses to run
without a valid `icon.png`. `--extension-version 0.2.0` writes that version into
the packaged manifest and descriptor.

Install the archive on Flow Steward as an administrator:

- **In the UI:** open **Extensions**, choose **Install extension from file**
  and pick the `.zip`, or drop the `.zip` on the extensions list. Review the
  install result, configure the extension, then enable it.
- **Through the API:** `POST /api/extensions/install` with `multipart/form-data`
  and the archive in the `file` field.
- **From the CLI** on a Development or Scalable installation:
  `./flow-steward extensions install --archive dist/extensions/com.acme.crm-sync-0.1.0.zip`,
  then `extensions enable`, `extensions health`.

On **Compact**, install through the UI or the API. The application hands the
archive to its installer service, which owns the extensions folder; copying a
folder into the container is not an install.

After installation, check the extension's preview and **Health** before
enabling it. Catalog extensions install from **Extensions › Marketplace**
instead; see [Workflow and Extension Catalogs](../user/workflow-and-extension-catalogs).

## Updating An Extension

To update an installed extension, install an archive with a **higher**
version through the same paths: **Install extension from file**,
`POST /api/extensions/install` or `extensions install --archive`. Flow Steward
recognises the installed extension id and updates it in place: it stages the
new release, runs its data migrations, and only then switches over. Failures
before lifecycle commit roll back the candidate; failures during or after a
commit attempt require checking the reported outcome rather than assuming the
previous release is still active. A disabled extension stays disabled.
Installing the same version again, or a lower one, is refused.

Before you release an update:

1. Make the smallest compatible manifest and runtime changes.
2. Add or update schemas before wiring new UI fields to actions.
3. Increment `lifecycle.data_schema_version` when persisted extension data
   changes and declare the ordered migration from the prior version. Leave it
   unchanged for code/UI-only updates.
4. Keep operation ids stable. Renamed action, query, trigger and operation ids
   break workflows that use them.
5. Bump the extension version.
6. Update descriptor artifacts and compatibility metadata.
7. Re-run `lock-deps` and `bundle --with-wheels` if dependencies changed.
8. Run validation, smoke checks and pytest.
9. Bundle the extension and record the archive digest.
10. Install it over the previous version in a test environment and verify
    migrations, health, callbacks, queries, actions, workflow triggers and
    artifact projections.

## Authoring Checklist

- The folder name matches the canonical `extension_id`.
- `icon.png` sits next to `extension.yaml`, and `runtime.contract_version` is
  `extension_host_v2`.
- `egress` lists every host the extension connects to, or is `{}`.
- All authoring contracts are YAML, not JSON.
- `extension.yaml` declares the mandatory lifecycle and the correct kind,
  features, scopes, entrypoint, and healthcheck.
- Every UI page, component, query, and action id is unique.
- Every UI reference points to a declared action or query.
- Schemas describe data, while UI schemas describe controls.
- Form save fields match the action's declared parameters.
- Secret values are stored only in secrets and are never echoed back.
- Runtime code imports platform helpers from `flowsteward_extension_sdk`, not
  private `core.*` modules.
- Runtime code does not mutate `sys.path`.
- Runtime requests used in tests include top-level `runtime_context` with all
  four execution-scope keys.
- Third-party subprocess libraries are locked in `python_requirements` and
  bundled as wheels.
- Live external requests require HTTPS and an allowlist.
- Event delivery is authored through `event_subscriptions`; compiled
  `supported_events` is validator output, not an authoring field.
- Callback ids and workflow trigger ids are stable.
- Contract v2 operation ids, resource query ids, event bindings, and artifact
  policies validate together.
- Descriptor artifacts have ids plus refs or snapshots.
- Smoke scripts and pytest cover representative runtime behavior.
- `validate`, `test`, and `bundle` pass before publishing.
- `bundle --with-wheels` is used when `python_requirements` is present, and
  `wheels/` holds an `_x86_64` and an `_aarch64` wheel (or one `any` wheel) for
  every requirement. `extensions validate` does not check this for you.
- The archive is under 50 MiB zipped and 150 MiB unpacked, or split per
  architecture with `--runtime-target`.

## Related Pages

- [Developer Extensions](../developer/extensions)
- [Extension Operator Guide](extension-operator-guide)
- [CLI Reference](../reference/cli)
