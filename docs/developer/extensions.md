---
sidebar_position: 3
title: Extensions
description: Extension runtime, validator, descriptor, UI manifest, invocation, and platform contract reference.
---

# Extensions

This page describes how Flow Steward loads, validates, renders, and invokes
extensions. For an authoring walkthrough, start with
[Build An Extension](../integrations/build-an-extension).

The source reference implementation is `flowsteward.example-showcase`. It is
designed as a living example for manifests, schemas, UI components, actions,
queries, events, callbacks, Contract v2, descriptor artifacts, smoke scripts,
and pytest coverage.

## Example Showcase Map

Open `extensions/flowsteward_example_showcase/` in the Flow Steward source tree
when you need a concrete implementation to copy from.

| Need a real example of | Look at |
| --- | --- |
| Runtime manifest validation inputs | `extension.yaml` |
| Marketplace/import descriptor and published artifacts | `extension-descriptor.yaml` |
| UI page and component composition | `ui/ui_manifest.yaml`, `ui/pages/*.yaml`, `ui/components/*.yaml` |
| Query and action catalogs | `ui/queries/queries.yaml`, `ui/actions/actions.yaml` |
| Runtime dispatch and handlers | `main.py`, `handlers/router.py`, `handlers/queries.py`, `handlers/actions.py` |
| Workflow trigger registration | `workflow_triggers` in `extension.yaml` |
| Callback registration | `callbacks` in `extension.yaml` and `ui/components/callback_setup.yaml` |
| Contract v2 builder operations | `contracts/*.yaml` |
| Workflow artifacts | `artifacts/workflows/*.yaml` plus `artifacts.workflows` in `extension-descriptor.yaml` |
| Agent, skill, and tool artifacts | `artifacts/agents/*.yaml`, `artifacts/skills/*.yaml`, `artifacts/tools/*.yaml`, plus the matching descriptor sections |
| Dataset and data connection examples | `artifacts/datasets/`, `artifacts/data_connections/`, `artifacts/saved_queries/` |
| Smoke and regression coverage | `scripts/smoke_check.py`, `tests/test_example_showcase.py` |

The showcase descriptor publishes workflows, agents, skills, and tools. Dataset
and data connection files are included as reference material next to the
descriptor so extension authors can see realistic project seed data even where
the descriptor schema does not publish that artifact type directly.

## Runtime Boundary

Flow Steward treats local extensions as out-of-process provider bundles:

- Core code discovers and validates extension contracts.
- Core code renders operator UI from the compiled UI manifest.
- Core code invokes extension commands as subprocesses.
- Core code never imports provider runtime modules into the server process.
- Provider code receives a JSON request on stdin and returns a JSON response on
  stdout.

This boundary keeps provider dependencies, network calls, and provider-specific
behavior outside the main server process.

## Main Runtime Modules

The extension platform is split across these core responsibilities:

| Area | Responsibility |
| --- | --- |
| Runtime manifest compile | Finds `extension.yaml`, rejects forbidden files, resolves refs, compiles UI, actions, queries, schemas, callbacks, and workflow triggers. |
| Runtime manifest validation | Validates kind, features, scopes, ids, refs, UI component shape, action/query bindings, callbacks, dependencies, and lifecycle readiness. |
| Descriptor validation | Validates marketplace/private import descriptors, distribution settings, runtime compatibility, artifacts, remote HTTPS endpoints, and optional Contract v2 projections. |
| Contract v2 validation | Validates builder-facing operations, connection types, step UI, resource queries, event bindings, and artifact policies. |
| Invocation | Builds query/action envelopes, starts the subprocess, limits environment and output, applies timeouts, and normalizes responses. |
| UI rendering | Renders extension pages and components from the compiled manifest and calls query/action APIs. |
| API layer | Exposes install, scan, preview, health, query, action, callback, descriptor, and lifecycle endpoints. |

Key implementation areas in the Flow Steward source tree:

```text
core/application/extensions/
  extension_descriptor.py
  extension_contract_v2.py
  extension_projection_v2.py
  lifecycle.py
  schema.py

core/infrastructure/db/
  extension_runtime_manifest.py
  extension_runtime_ui_manifest.py
  extension_runtime_validation.py
  extension_runtime_feature_validation.py
  extension_runtime_compile.py
  extension_runtime_invocation.py
  extension_runtime_entrypoints.py
  extension_runtime_platform.py

assets/frontend/src/pages/extensions/
  extension-manifest-renderer.tsx
  extension-manifest-utils.ts
  extension-manifest-repeater-field.tsx
  extension-detail-panel.tsx
  api.ts
```

## Compile Pipeline

The compiler produces the compiled runtime manifest that the UI, preview, and
runtime invocation paths consume.

Compile flow:

1. Resolve the bundle root and locate `extension.yaml` or `extension.yml`.
2. Reject YAML-only violations such as `extension.json`, `manifest.json`,
   `schemas/*.schema.json`, or JSON files under `ui/actions`, `ui/queries`,
   `ui/pages`, and `ui/components`.
3. Parse the manifest and normalize identity, kind, version, display fields,
   features, scopes, entrypoint, and healthcheck.
4. Resolve schema refs. Refs must be relative to the bundle and cannot escape
   the bundle root.
5. Resolve `ui/ui_manifest.yaml`, all page refs, and all component refs.
6. Detect duplicate page ids and component ids.
7. Resolve `ui/actions/actions.yaml` and `ui/queries/queries.yaml`.
8. Detect duplicate action and query ids.
9. Validate component references to action and query ids.
10. Validate callbacks, dependencies, event subscriptions, workflow triggers,
    and kind-specific feature rules.
11. Return a lifecycle-aware result with compile errors, validation errors,
    warnings, preview details, and enablement readiness.

Compiled manifest fields are intentionally restricted. The compiler only keeps
known fields such as identity, kind, version, features, scopes, schemas, UI,
actions, queries, callbacks, event subscriptions, supported events,
dependencies, workflow triggers, entrypoint, healthcheck, and validation
metadata.

## Validation Issues

Validation issues are structured objects:

```json
{
  "severity": "error",
  "code": "extension.ui_unknown_query",
  "message": "Component references an unknown query.",
  "file_path": "ui/components/provider_health.yaml",
  "field_path": "query_id",
  "hint": "Declare the query in ui/queries/queries.yaml."
}
```

Use issue codes in tests and CI rather than string-matching full messages.

Common validation failures:

| Code family | Meaning |
| --- | --- |
| `extension.yaml_only_violation` | A forbidden JSON authoring contract exists. |
| `extension.folder_mismatch` | Folder name does not match normalized `extension_id`. |
| `extension.ref_*` | A ref is absolute, escapes the bundle, points to JSON, or is missing. |
| `extension.ui_*` | Page, component, form, grid, action, query, or binding problem. |
| `extension.action_*` | Action id, mutating command, handler, or result contract problem. |
| `extension.query_*` | Query id, handler, or result contract problem. |
| `extension.callback_*` | Callback id, method, auth, or action binding problem. |
| `extension.dependency_*` | Invalid extension dependency declaration. |
| `extension.feature_*` | Kind and feature mismatch. |
| `extension.contract_v2_*` | Builder contract validation failure. |

## Runtime Manifest V2

Runtime manifests use `manifest_version: 2`. Supported kinds are:

```text
task_provider
notification_provider
tool_provider
```

Kind-specific rules:

| Kind | Required capability |
| --- | --- |
| `task_provider` | `task_ingress` |
| `notification_provider` | `notify` |
| `tool_provider` | `tool` |

The `ingress_event` feature is valid only on notification providers. When used,
the extension must include an `ingress_event` action, expose expected result
fields such as `result.ingress_type`, and declare provider events such as
`external.comment.received` in `supported_events`.

## Descriptor Model

`extension-descriptor.yaml` is the distribution and import descriptor. It is
validated separately from the runtime manifest.

Root descriptor fields:

| Field | Description |
| --- | --- |
| `schema_version` | Descriptor schema version, for example `extension_descriptor_v1`. |
| `extension_id` | Stable id. Must match the runtime manifest. |
| `release_version` | Release version of the distributable artifact. |
| `extension_type` | Listing/import classification. |
| `identity` | Display name, description, tags. |
| `vendor` | Vendor name and support URL. |
| `listing` | Marketplace visibility, category, and extra listing metadata. |
| `distribution` | Channel, execution modes, self-hosting support, and import sources. |
| `runtime` | Runtime contract version, compatibility, auth, local or remote settings, and optional Contract v2. |
| `dependencies` | External dependency metadata. |
| `artifacts` | Workflows, agents, skills, tools, contracts, guardrails, and nested extension artifacts. |
| `provenance` | Origin and supply-chain metadata. |
| `commerce` | Billing and plan metadata. |

Descriptor models are strict. Root and most nested blocks reject extra fields
unless the block is intentionally metadata-like, such as listing or commerce.

Distribution channels:

```text
marketplace_managed
private_byo
```

Execution modes:

```text
local
remote_https
```

When `remote_https` is declared, `runtime.remote` must include an HTTPS
`base_url` and endpoint paths for handshake, health, query, action, and event
emission. Endpoint values must be absolute paths and must not contain path
traversal.

## Contract V2

Extension Contract v2 is the builder-facing contract layer. It is used to build
registry projections and workflow builder surfaces.

Sections:

| Section | Validates |
| --- | --- |
| `connection_types` | Connection ids, auth types, OAuth2 details, token placement, and secret names. |
| `dataset_connectors` | Dataset connector ids, runtime kind, and data contract refs. |
| `operation_manifest` | Operation ids, kinds, inputs, outputs, connection refs, batching, async support, and failure behavior. |
| `step_ui_manifest` | Builder UI fields and their operation/query references. |
| `resource_query_manifest` | Resource picker query ids, cursor modes, filters, and result shapes. |
| `event_bindings` | Trigger ids, operation refs, and canonical event names. |
| `artifact_policies` | Operation artifact inputs, outputs, retention, and naming policy. |

Allowed operation kinds:

```text
source, action, bulk_action, report, human_channel
```

Allowed connection auth types:

```text
none, api_key, oauth2, static_secret
```

OAuth2 connections require an authorization-code grant, PKCE marked as required,
HTTP(S) authorization and token endpoints, at least one required scope, platform
secret client credentials, token placement in secrets, and access token secret
names.

Contract refs can be inline objects, local refs, URL refs that stay on the same
origin and path scope, or snapshot refs. Local refs cannot escape the bundle.

## UI Manifest Runtime

The frontend renders extension UI from the compiled manifest. The primary
renderer lives in the extension manifest renderer and utility files under
`assets/frontend/src/pages/extensions`.

Rendered page flow:

1. The extension detail page loads the compiled manifest or preview.
2. The manifest renderer lists pages from `ui_manifest.pages`.
3. Each page renders its components.
4. Query-bound components call extension query endpoints.
5. Action-bound components call extension action endpoints.
6. Successful actions can request component refresh through the `reload` field.

Component ids are important because they are used for query context, action
context, and targeted reload.

## Component Validation

The validator recognizes these component types:

```text
section, columns, stack, action_bar, form, fieldset, repeater, key_value,
json_editor, secret_field, grid, stats_row, key_value_card, markdown,
health_panel, log_list, empty_state, alert, confirm_action, drawer_detail,
status_badge, filter_bar, callback_setup
```

Form widgets:

```text
text, textarea, url, email, number, integer, boolean, select, radio_group,
checkbox_group, tag_picker, secret, json, key_value, repeater, event_selector,
project_selector, workflow_selector, provider_selector
```

Grid column types:

```text
text, datetime, date, number, badge, boolean, json_summary, link, id
```

The frontend implements the common showcase components directly, including
forms, grids, stats rows, health panels, callback setup, markdown, log lists,
and repeater form fields. Other validated component types are available as
contract vocabulary and may need frontend implementation in the target version.

## Query And Action Invocation

The platform has separate invocation paths for queries and actions.

Query endpoint:

```text
POST /api/extensions/{extension_id}/query/{query_id}
```

Action endpoint:

```text
POST /api/extensions/{extension_id}/action/{action_id}
```

The frontend action payload includes:

| Field | Description |
| --- | --- |
| `component_id` | Component that initiated the action. |
| `page_id` | Current extension page id. |
| `context` | Page, project, workflow, or component context. |
| `target` | Row, connection, callback, or selected resource target. |
| `values` | Current UI values. |
| `data` | Additional component data. |

The backend normalizes this into the runtime `action.input` envelope before
launching the extension subprocess.

## Subprocess Isolation

Local extension subprocesses receive a limited environment. Host database DSNs,
encryption keys, and unrelated process environment values are not passed to the
extension.

Allowed environment names include common runtime variables such as:

```text
PATH, HOME, USER, LANG, LC_ALL, LC_CTYPE, TMPDIR, TMP, TEMP,
PYTHONPATH, PYTHONDONTWRITEBYTECODE, PYTHONUNBUFFERED, NODE_PATH, NODE_ENV
```

Subprocess controls:

| Control | Default or behavior |
| --- | --- |
| Timeout | Uses operation timeout or defaults to 30 seconds. |
| Output cap | Controlled by `FS_EXTENSION_OUTPUT_MAX_BYTES`; default is 5 MiB, with safety min and max bounds. |
| Circuit breaker | Tracks failures per extension and quarantines repeatedly failing providers. |
| Concurrency | Per-extension concurrency is capped. |
| I/O | One JSON request on stdin and one JSON response on stdout. |

If the subprocess exceeds output limits, times out, exits with invalid JSON, or
omits the response envelope, the platform returns a normalized extension error.

## Response Normalization

The canonical response envelope is:

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

Normalization rules:

- Missing `ok` is treated as an invalid response.
- `result` is normalized to an object when possible.
- `commands`, `events`, `reload`, and `errors` are normalized to lists.
- Response events are checked against `supported_events` when the extension
  declares supported event types.
- Mutating action responses are checked against the declared command type.

Known command types:

```text
start_workflow, pause_job, resume_job, cancel_job, retry_step,
request_approval, resolve_approval, enqueue_followup_job,
invoke_extension_action, update_external_status
```

## Event Model

There are three event layers developers should keep separate:

| Layer | Examples | Purpose |
| --- | --- | --- |
| Workflow reaction events | `job.completed`, `job.step_failed`, `job.gate_waiting` | Built-in workflow lifecycle signals. |
| Contract v2 canonical events | `notification.requested`, `approval.received`, `interaction.received` | Builder-facing event vocabulary. |
| Provider external events | `external.comment.received`, `external.task.created` | Extension-owned provider events. |

Runtime event envelopes can carry event id, type, correlation id, occurrence
time, account id, severity, summary, payload, project/workflow/job/phase/step
scope, source, aggregate id, actor, URLs, and metadata.

When an extension declares `supported_events`, emitted events must match the
declared types. Supported event declarations may be exact event names or
patterns supported by the runtime matcher.

## Callback Runtime

Callbacks bridge provider webhooks into extension actions.

Manifest callback declaration:

```yaml
callbacks:
  - callback_id: provider_events
    purpose: Receives provider interaction events.
    methods: [POST]
    action_id: ingress_event
    connection_scoped: true
    auth:
      type: shared_secret_header
      header: X-Provider-Signature
```

Callback management endpoints:

```text
GET  /api/extensions/{extension_id}/callbacks
POST /api/extensions/{extension_id}/callbacks/{callback_id}
POST /api/extensions/{extension_id}/callbacks/{registration_id}/rotate
POST /api/extensions/{extension_id}/callbacks/{registration_id}/status
```

Inbound callback delivery is ultimately routed to the declared `action_id`.
Use a `callback_setup` component to expose setup and status in the extension UI.

## API Surface

Main extension endpoints:

```text
POST /api/extensions/install
POST /api/extensions/scan
GET  /api/extensions/{extension_id}/preview
GET  /api/extensions/{extension_id}/compiled-manifest
GET  /api/extensions/{extension_id}/health
POST /api/extensions/{extension_id}/query/{query_id}
POST /api/extensions/{extension_id}/action/{action_id}
POST /api/extensions/{extension_id}/invoke
POST /api/extensions/{extension_id}/enable
POST /api/extensions/{extension_id}/disable
DELETE /api/extensions/{extension_id}
```

Descriptor and import endpoints:

```text
POST /api/extensions/descriptors/validate
POST /api/extensions/descriptors/import/file
POST /api/extensions/descriptors/import/url
POST /api/extensions/validate
POST /api/extensions/build
POST /api/extensions/import
```

Marketplace and installation endpoints:

```text
GET  /api/extensions
GET  /api/extensions/marketplace
GET  /api/extensions/{extension_id}
GET  /api/extensions/installs/{install_id}
POST /api/extensions/releases/{release_id}/install
POST /api/extensions/installs/{install_id}/handshake
POST /api/extensions/{extension_id}/install
POST /api/extensions/runtime/token
POST /api/extensions/bootstrap/system
POST /api/extensions/generated-jobs
```

## CLI Reference

Authoring commands:

```bash
python -m core.entrypoints.cli tooling extensions create <extension_id>
python -m core.entrypoints.cli tooling extensions validate <extension_id>
python -m core.entrypoints.cli tooling extensions test <extension_id>
python -m core.entrypoints.cli tooling extensions bundle <extension_id>
```

Useful options:

```bash
python -m core.entrypoints.cli tooling extensions validate <extension_id> --json
python -m core.entrypoints.cli tooling extensions validate <extension_id> --health
python -m core.entrypoints.cli tooling extensions validate <extension_id> --marketplace
python -m core.entrypoints.cli tooling extensions test <extension_id> --skip-pytest
python -m core.entrypoints.cli tooling extensions bundle <extension_id> --version 0.2.0
```

Descriptor validation can also be called directly from Python when working on
descriptor-only changes:

```bash
python - <<'PY'
from core.application.extensions.lifecycle import validate_extension_descriptor_file

result = validate_extension_descriptor_file(
    "extensions/flowsteward_example_showcase/extension-descriptor.yaml"
)
print(result["valid"])
print(result.get("extension_contract_v2", {}))
PY
```

## Scripts Versus Tests

Smoke scripts and pytest tests are both first-class extension checks.

| Check | Runs how | Best for |
| --- | --- | --- |
| `scripts/smoke_check.py` | Direct Python execution, also called by `tooling extensions test`. | Fast proof that health, representative queries, and representative actions work. |
| `tests/test_*.py` | Pytest, also called by `tooling extensions test`. | Regression coverage for compiler output, descriptor validation, Contract v2, ingress events, OAuth secrets, external request safety, and response shapes. |

Smoke scripts should be short and close to the package. Tests should be
specific, assert on stable contract fields, and cover behavior that could
regress during platform or extension changes.

## Debugging Checklist

When an extension does not compile or render correctly:

1. Confirm the folder name matches the normalized `extension_id`.
2. Run validation with `--json` and inspect issue codes.
3. Check for forbidden JSON authoring files.
4. Confirm every ref is relative, YAML, inside the bundle, and present.
5. Confirm every UI query or action binding points to a declared operation id.
6. Confirm form action bindings are under `data`.
7. Confirm mutating actions declare `command_type`.
8. Confirm response envelopes include `ok`.
9. Confirm emitted event types are declared in `supported_events`.
10. Run the smoke script directly, then run pytest for the extension.

## Platform Design Rules

- Keep provider-specific integrations in the extension runtime.
- Use declared commands for host-side mutations.
- Keep platform mutations auditable through action manifests and response
  commands.
- Keep credentials in secrets, not config, manifests, logs, or UI responses.
- Treat action, query, trigger, connection type, operation, resource query, and
  artifact ids as stable public contracts.
- Add validation or pytest coverage before broadening the extension contract.

## Related Pages

- [Build An Extension](../integrations/build-an-extension)
- [Extension Operator Guide](../integrations/extension-operator-guide)
- [CLI Reference](../reference/cli)
