---
sidebar_position: 3
title: Extensions
description: Extension runtime, validator, descriptor, UI manifest, invocation, and platform contract reference.
---

# Extensions

This page describes how Flow Steward loads, validates, renders, and invokes
extensions. For an authoring walkthrough, start with
[Build An Extension](../integrations/build-an-extension).

Core does not bundle a showcase extension. Use the current manifest standard,
compiler, and runtime consumers for the target release. The authoring guide
includes a small downloadable provider-free example; its scope is deliberately
narrower than a production provider. The
[Extension Authoring Skill](../integrations/extension-authoring-skill) helps coding
agents follow these contracts and report actual validation evidence.

## Runtime Boundary

Publisher identity and catalog verification carry no privilege tier. Host access
comes from supported scopes and extension-owned `runtime_grants`, validated
against the owning namespace. `runtime_target` belongs in `.fs-package.yaml`,
not `extension.yaml`; the archive validator checks it before publishing files.

Successful subprocesses exit 0 with `ok: true`. Domain failures exit 2 with
`ok: false`, nonempty `error_code` and `error`, and a nonempty `errors` list
whose first code/message exactly match those top-level fields. Other failures
can trip the runtime circuit breaker. See the authoring guide's
[response envelope](../integrations/build-an-extension#response-envelope).

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

core/infrastructure/extension_runtime/
  extension_runtime_manifest.py
  extension_runtime_ui_manifest.py
  extension_runtime_validation.py
  extension_runtime_feature_validation.py
  extension_runtime_compile.py
  extension_runtime_invocation.py
  extension_runtime_entrypoints.py
  extension_runtime_platform.py

  boundary.py
  python_dependencies.py
  extension_runtime_helpers.py

core/infrastructure/extension_sdk/public/
  flowsteward_extension_sdk/

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
9. Normalize and validate `python_requirements`.
10. Validate bundled wheels when Python requirements are declared.
11. Validate component references to action and query ids.
12. Validate callbacks, dependencies, event subscriptions, workflow triggers,
    and kind-specific feature rules.
13. Validate the runtime boundary for private `core.*` imports and `sys.path`
    mutation.
14. Return a lifecycle-aware result with compile errors, validation errors,
    warnings, preview details, and enablement readiness.

Compiled manifest fields are intentionally restricted. The compiler only keeps
known fields such as identity, kind, version, features, scopes, schemas, UI,
actions, queries, callbacks, event subscriptions, supported events,
dependencies, `python_requirements`, workflow triggers, entrypoint,
healthcheck, and validation metadata.

## Validation Issues

Validation issues are structured objects:

```json
{
  "severity": "error",
  "code": "unknown_query_reference",
  "message": "Component references an unknown query.",
  "file_path": "ui/components/provider_health.yaml",
  "field_path": "query_id",
  "hint": "Declare the query in ui/queries/queries.yaml."
}
```

Use issue codes in tests and CI rather than string-matching full messages.

Common validation failures:

| Emitted code or prefix | Meaning |
| --- | --- |
| `extension.yaml_only_violation` | A forbidden JSON authoring contract exists. |
| `extension_folder_mismatch` | Folder name does not match normalized `extension_id`. |
| `ref_resolution_error` | A referenced file cannot be resolved. |
| `unknown_query_reference` | A UI binding references an undeclared query. |
| `workflow_visibility_required` | An action lacks an explicit boolean visibility flag. |
| `workflow_action_requires_contract_v2` | A visible action lacks its required Contract V2 declaration. |
| `workflow_action_operation_mismatch` | A visible action does not match its visible V2 operation. |
| `task_ingress_feature_required` | A task provider lacks its required feature. |
| `invalid_notification_provider_delivery_contract` | An active notification provider lacks its reserved delivery contract. |
| `invalid_section_type` | A Contract V2 section has an invalid type; no automatic `extension.contract_v2_` prefix is added. |
| `invalid_python_requirement*` | Malformed `python_requirements` entries. |
| `python_requirement_*` | Missing hashes, undeclared wheels, hash mismatch, or incomplete dependency closure. |
| `extension_private_core_import` | Runtime code imports private `core.*` modules. |
| `extension_sys_path_manipulation` | Runtime code mutates `sys.path` instead of using SDK/dependencies. |

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

Capability flags do not replace operation contracts. See the [kind-specific operation tables](../integrations/build-an-extension#kind-specific-operation-contracts) for each task-ingress action/query, required result fields and error catalog, and the active notification provider's reserved `deliver_notification` action/V2 operation/effect. The `placeholder` delivery exemption does not bypass kind/feature validation.

The `ingress_event` feature is valid only on notification providers. It requires an `ingress_event` action declaring `result.ingress_type` and an authored `event_subscriptions` selector for `external.comment.received`. `notification.interaction_received` is recommended, not mandatory. Compilation derives `supported_events`; authors must not write that projection directly.

## Python Dependencies

Extension subprocess dependencies are declared in the runtime manifest and can
also appear in the distribution descriptor:

```yaml
python_requirements:
  - name: attrs
    version: "25.3.0"
    hashes:
      - sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

The validator normalizes and enforces:

| Rule | Enforcement |
| --- | --- |
| List shape | `python_requirements` must be a list of objects. |
| Package name | PEP 503-normalized lowercase name. |
| Version | Exact PEP 440 version, not a range or wildcard. |
| Hashes | Non-empty list of lowercase `sha256:` hashes. |
| Closure | Wheel metadata must not reference undeclared or incompatible transitive dependencies. |
| Wheels only | Bundled artifacts under `wheels/` must be `.whl` files. |
| Offline default | With `FS_EXTENSION_DEPS_FETCH=off`, every declared requirement must have a matching bundled wheel and hash. |

`extensions lock-deps` reads direct requirements, downloads wheels for
the target platforms, computes hashes, and writes the full lock into
`extension.yaml`. `extensions bundle --with-wheels` downloads the
matching wheels into `wheels/` before writing the zip archive.

Distributable Python extensions must support **both Linux AMD64 and ARM64**,
including the complete transitive dependency closure and hashes. The default
lock/download targets are `manylinux2014_x86_64,manylinux2014_aarch64`.
`bundle --with-wheels` prepares both automatically when no platform override is
given; bare `bundle` does not download missing dependencies. A universal
`py3-none-any.whl` can satisfy both targets, but compiled dependencies need
compatible wheels for each target and the runtime Python version/ABI.

Docker on Apple Silicon and ARM Linux servers uses Linux ARM64 wheels, not
macOS wheels; Windows Docker deployments likewise use Linux containers.
`--platforms active` means the current **tool runtime**, not necessarily the host
OS, and is only for local development output. Do not publish it as portable.
If either target cannot be resolved, fix the dependency pins or provide compatible
prebuilt wheels; do not silently omit that target or build dependencies during
installation. Native executables require separate `linux-amd64` and `linux-arm64`
archives via `--runtime-target`; wheel targeting does not cross-compile binaries.

During install or update, Flow Steward materializes selected compatible wheels
into:

```text
.fs-python/<extension-version>/site/
```

The host Python environment is not modified. Obsolete dependency directories are
removed after versioned updates.

Runtime dependency settings:

| Setting | Default | Description |
| --- | --- | --- |
| `FS_EXTENSION_DEPS_FETCH` | `off` | `off` requires bundled wheels. `allowlist` permits install-time wheel fetches from the default index when hashes match. |
| `FS_EXTENSION_DEPS_SITE_MAX_BYTES` | `500 MiB` | Maximum size for the materialized site directory, clamped between 1 MiB and 10 GiB. |

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
| `python_requirements` | Optional dependency lock validated with the same rules as the runtime manifest. |
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

The frontend implements the common extension components directly, including
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

## Public Extension SDK

The public SDK is exported on the subprocess `PYTHONPATH` as
`flowsteward_extension_sdk`. Extension runtime code may import this namespace,
but must not import private `core.*` modules.

Public SDK surface:

| Module area | Exports |
| --- | --- |
| Runtime context | `RuntimeContext`, `runtime_context_from_payload` |
| Safe HTTP | `assert_safe_remote_http_url`, `resolve_pinned_ips`, `build_pinned_opener`, `open_pinned_url`, `Request`, `PinnedPeerError` |
| Artifact access | `read_artifact_bytes`, `write_artifact_bytes`, `find_artifact_descriptor`, `artifact_descriptors_from_payload`, `ArtifactAccessError` |
| Artifact/dataset plane | `ArtifactDatasetPlane`, `ArtifactHandle`, `DatasetHandle`, `create_storage_adapter`, storage adapters |

Example:

```python
from flowsteward_extension_sdk import open_pinned_url, runtime_context_from_payload


def provider_health(request_payload: dict) -> dict:
    ctx = runtime_context_from_payload(request_payload)
    return {
        "ok": True,
        "result": {
            "project_id": ctx.project_id,
            "safe_http_available": callable(open_pinned_url),
        },
    }
```

The runtime boundary validator scans extension Python files, entrypoint inline
commands, and health inline commands. It rejects private `core.*` imports,
dynamic private core imports, and `sys.path` manipulation. The current
grandfathered exception set is empty. Use the SDK and `python_requirements`
for every extension.

## Subprocess Isolation

Local extension subprocesses receive a limited environment. Host database DSNs,
encryption keys, and unrelated process environment values are not passed to the
extension.

Allowed inherited environment names include common runtime variables such as:

```text
PATH, HOME, USER, LANG, LC_ALL, LC_CTYPE, TMPDIR, TMP, TEMP,
PYTHONDONTWRITEBYTECODE, PYTHONUNBUFFERED, NODE_PATH, NODE_ENV,
FS_ALLOW_PRIVATE_REMOTE_URLS
```

`PYTHONPATH` is not inherited. The platform constructs it for each invocation:

```text
<extension bundle>/.fs-python/<version>/site:<public extension SDK path>
```

The dependency site directory is present only when `python_requirements` were
materialized for that extension version. The SDK path is always appended.

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

Emitted events must match the compiler-derived `supported_events` projection.
Authors declare delivery selectors through `event_subscriptions`, not by adding
`supported_events` to `extension.yaml`.

## Callback Runtime

Supported auth modes are `none`, `shared_secret_header`, and `hmac_sha256`.
The HMAC option has a fixed timestamp/delivery-ID/raw-body contract, bounded
freshness, and replay detection; see the
[authoring callback contract](../integrations/build-an-extension#callbacks).
OAuth authorization callbacks follow their separate host-owned flow.

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
GET  /api/extensions/{extension_id}/uninstall-plan
POST /api/extensions/{extension_id}/uninstall  {"revision":"<plan-revision>"}
```

Descriptor and import endpoints:

```text
POST /api/extensions/descriptors/validate
POST /api/extensions/descriptors/import/file
POST /api/extensions/descriptors/import/url
```

These descriptor routes accept JSON, not an extension manifest or archive upload. Validation accepts `source_type` (`file`, `url`, `builtin`, or `payload`). File/URL/payload modes use the corresponding `descriptor_path`, `descriptor_url`, or `descriptor_payload`; builtin mode uses a descriptor payload or path with optional `source_root`, not a promise of a bundled showcase. File import takes a server-visible `descriptor_path`; URL import takes `descriptor_url`. Import requests may include `install_after_import`, `runtime_mode` and `remote_base_url` under the supported request schema. All remain subject to caller authorization and source policy.

Archive installation is `POST /api/extensions/install` with `multipart/form-data`, required `file`, and optional `approved_browser_authority_impact_hash` for a reviewed authority impact. Manifest compilation and ZIP bundling are authoring tooling operations, not bare `/api/extensions/validate`, `/build`, or `/import` endpoints. Descriptor validation does not replace compiler validation.

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
POST /api/extensions/generated-jobs
```

## CLI Reference

Authoring commands:

```bash
./flow-steward extensions create <extension_id>
./flow-steward extensions validate <extension_id>
./flow-steward extensions test <extension_id>
./flow-steward extensions lock-deps <extension_id>
./flow-steward extensions bundle <extension_id> --with-wheels
```

For noninteractive authoring, explicitly confirm local changes with `--confirm` on `create`, `lock-deps` and `bundle`. The reviewed native CLI returns review exit `10` for unconfirmed changes and `0` for success; installed launcher dispatch can have different confirmation/error boundaries. Record the actual context and status rather than treating any nonzero code as success.

Use the explicit `validate → test → bundle` sequence. Bundling is packaging, not full compiler validation: an invalid manifest can still be packaged. Validate the unpacked final archive as well when verifying a published deliverable. `validate --marketplace` checks manifest vendor/listing/scopes/machine-auth/account-scope metadata, not descriptor-schema validity; ordinary validation also checks some descriptor-referenced artifact modules.

Default testing requires `requirements-dev.txt`, validates the manifest and runs smoke/local pytest targets in an environment inheriting the tooling interpreter's packages. Development dependency installation is offline (`--no-index`, `dev-wheels`/`wheels`); missing requirements or unavailable dependencies fail. The generated zero-dependency scaffold uses a comment-only requirements file and runs three tests without either wheel directory. Missing pytest targets fail by default (tooling exit `1`); `--allow-no-pytest` permits their absence explicitly, and `--skip-pytest` skips them. Neither proves regression coverage. A missing bundle exits `2`; controller rendering may wrap tooling failures.

Useful options:

```bash
./flow-steward extensions validate <extension_id> --json
./flow-steward extensions validate <extension_id> --health
./flow-steward extensions validate <extension_id> --marketplace
./flow-steward extensions test <extension_id> --skip-pytest
./flow-steward extensions lock-deps <extension_id> --input requirements.in
./flow-steward extensions lock-deps <extension_id> --platforms active
./flow-steward extensions bundle <extension_id> --extension-version 0.2.0
./flow-steward extensions bundle <extension_id> --with-wheels
./flow-steward extensions bundle <extension_id> --with-wheels --platforms manylinux2014_x86_64,manylinux2014_aarch64
```

For a bundle that actually includes a distribution descriptor, descriptor
validation can also be called directly from Python in the Development toolchain:

```bash
python - <<'PY'
from core.application.extensions.lifecycle import validate_extension_descriptor_file

result = validate_extension_descriptor_file(
    "extensions/com_acme_crm_sync/extension-descriptor.yaml"
)
print(result["valid"])
print(result.get("extension_contract_v2", {}))
PY
```

## Scripts Versus Tests

Smoke scripts and pytest tests are both first-class extension checks.

| Check | Runs how | Best for |
| --- | --- | --- |
| `scripts/smoke_check.py` | Direct Python execution, also called by `extensions test`. | Fast proof that health, representative queries, and representative actions work. |
| `tests/test_*.py` | Pytest, also called by `extensions test`. | Regression coverage for compiler output, descriptor validation, Contract v2, ingress events, OAuth secrets, external request safety, and response shapes. |

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
8. Confirm runtime files import `flowsteward_extension_sdk`, not private
   `core.*` modules.
9. Confirm runtime files do not mutate `sys.path`.
10. If `python_requirements` is present, confirm `wheels/` contains matching
    hashes for every requirement.
11. Confirm response envelopes include `ok`.
12. Confirm authoring uses `event_subscriptions` and emitted events match the
    compiled `supported_events` projection.
13. Run the smoke script directly, then run pytest for the extension.

## Platform Design Rules

- Keep provider-specific integrations in the extension runtime.
- Use declared commands for host-side mutations.
- Keep platform mutations auditable through action manifests and response
  commands.
- Keep credentials in secrets, not config, manifests, logs, or UI responses.
- Keep platform primitives in `flowsteward_extension_sdk`, not private core
  imports.
- Keep third-party runtime libraries in `python_requirements`, not manual
  `sys.path` manipulation or runtime `pip install`.
- Treat action, query, trigger, connection type, operation, resource query, and
  artifact ids as stable public contracts.
- Add validation or pytest coverage before broadening the extension contract.

## Related Pages

- [Build An Extension](../integrations/build-an-extension)
- [Extension Operator Guide](../integrations/extension-operator-guide)
- [CLI Reference](../reference/cli)
