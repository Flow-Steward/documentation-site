---
sidebar_position: 5
title: Feature Configuration
description: How user-facing Flow Steward features are configured through environment, project, workflow, container, and step settings.
---

# Feature Configuration

Flow Steward configuration is split across several scopes. The right scope
depends on whether the setting is infrastructure-wide, project-specific, or part
of a reusable workflow contract.

This page describes behavior supported by current source on main; availability
in a published release depends on the version you deploy. Provider settings do
not establish that an external provider is currently available.

## Configuration scopes

| Scope | Use it for | Examples |
|---|---|---|
| Deployment environment | Runtime defaults, infrastructure, safety limits, storage, logging. | `.env`, `.env.example`, `.env.example.ops`, `.env.example.prod`. |
| Account or project policy | Per-project security, provider, connection, notification, and data access behavior. | Project settings, security policy, project connections. |
| Workflow settings | Public interface, trigger channels, callable contract, workflow-level behavior. | Workflow detail page, import/export, shared authoring services. |
| Group or For each settings | Sequence or parallel bodies, iteration, boundary contracts, and error handling. | Workflow builder containers. |
| Step settings | Step type, mappings, connector binding, HTTP config, and error handling. | Step drawer/editor. |
| Runtime evidence | Logs, events, runtime journal, security findings, notification deliveries. | Job detail, monitoring, MCP, CLI. |

## Uploads and file types

General attachment policy is deployment-level:

| Variable | Purpose |
|---|---|
| `FS_ATTACHMENT_MAX_SIZE_BYTES` | Maximum size per general attachment. |
| `FS_ATTACHMENT_MAX_FILES` | Maximum files per request. |
| `FS_ALLOWED_ATTACHMENT_MIMES` | Comma-separated MIME allowlist. |
| `FS_ALLOWED_ATTACHMENT_EXTENSIONS` | Comma-separated extension allowlist. |

Incoming workflow webhooks can also define per-entrypoint limits:

| Webhook setting | Purpose |
|---|---|
| `allowed_content_types` | Request content types allowed for this webhook. |
| `max_body_bytes` | Maximum request body. |
| `max_file_bytes` | Maximum uploaded file size. |
| `max_files` | Maximum uploaded file count. |
| `source_restrictions.exact_ips` | Exact IP allowlist. |
| `source_restrictions.cidrs` | CIDR allowlist. |

Upload admission also has deployment limits:
`FS_TASK_UPLOAD_MAX_CONCURRENT_PREPARATIONS`,
`FS_TASK_UPLOAD_MAX_CONCURRENT_PREPARATIONS_PER_ACCOUNT`,
`FS_TASK_UPLOAD_MAX_CONCURRENT_PREPARATIONS_PER_PRINCIPAL`, and
`FS_TASK_UPLOAD_BODY_READ_TIMEOUT_SECONDS`.

The workflow-run file input validates ZIP safety before accepting decoded
bytes. Do not assume every upload transport performs the same archive inspection.

## PII and security policy

Security policy can be global or overridden per project.

| Setting | Values | Meaning |
|---|---|---|
| `enabled` | `true` / `false` | Turns policy enforcement on or off. |
| `level` | `minimal`, `standard`, `strict` | Applies preset severity and scanner behavior. |
| `surfaces.*.action` | `scan`, `skip` | Controls scanning on `inbound`, `outbound`, and `tool` surfaces. |

PII modes are configured under `scanners.pii.mode`:

| Mode | Behavior |
|---|---|
| `pseudonymize` | Replaces detected PII with pseudonym tokens stable for the same value within the same project and salt. |
| `hard_redact` | Replaces detected PII with redacted placeholders. |
| `allow` | Detects but leaves values visible. |

PII detector toggles include `person_name`, `email`, `phone`, `ssn`,
`credit_card`, `ipv4`, and `ipv6`. Projects can add custom regex rules with a
stable `rule_id`, scanner type, pattern, severity, and description.

Use custom regex rules for identifiers that matter to your organization, such as
employee IDs, customer account numbers, internal ticket IDs, tenant IDs, or
provider-specific secrets. Keep the rule name stable so findings remain
auditable across jobs.

Choose the mode by outcome:

| Goal | Mode |
|---|---|
| Preserve correlation without exposing the raw value | `pseudonymize` |
| Replace detected values in scanned text with placeholders | `hard_redact` |
| Observe findings without changing payloads | `allow` |

Security scanning can apply to inbound data, outbound data, and tool calls.
Treat externally supplied task text, webhook payloads, extension payloads, and
dataset rows as untrusted. These settings do not guarantee that every persisted
message, log, or trace passes through a scanner.

Deployment-level security variables include:

- `SECURITY_SCAN_MODE`;
- `SECURITY_FAIL_CLOSED_ON_POLICY_ERROR`;
- `SECURITY_PII_SALT`;
- `FS_TRACE_REDACT_MAX_LENGTH`;
- `FS_EXTENSION_DEBUG_PAYLOADS`;
- `FS_EXTENSION_PAYLOAD_REDACT_KEYS`;
- `FS_EXTENSION_PAYLOAD_REDACT_EXACT_KEYS`;
- `FS_EXTENSION_PAYLOAD_REDACT_KEY_FRAGMENTS`;
- `FS_EXTENSION_PAYLOAD_REDACT_MAX_DEPTH`;
- `FS_EXTENSION_PAYLOAD_STRING_TRUNCATE_LENGTH`.

`SECURITY_SCAN_MODE` accepts `monitor`, `enforce_standard`, `enforce_strict`,
and `disabled`. Monitor mode disables blocking; disabled mode turns scanning
off. The default is `enforce_standard` in production, including when no
environment marker is supplied, and `monitor` otherwise. Set the mode explicitly
when deploying.

## Artifacts and storage

Artifact storage is configured at deployment level.

| Variable | Purpose |
|---|---|
| `ARTIFACT_STORAGE_BACKEND` | `memory`, `s3`, or `local_fs`; defaults to `local_fs`. Unsupported names raise a configuration error. |
| `ARTIFACT_KEY_PREFIX` / `ARTIFACT_S3_KEY_PREFIX` | Optional object key prefix. |
| `ARTIFACT_S3_ENDPOINT_URL` | S3-compatible endpoint. |
| `ARTIFACT_S3_PUBLIC_ENDPOINT_URL` | Optional public S3-compatible endpoint passed to the storage adapter. |
| `ARTIFACT_S3_BUCKET` | Object bucket. |
| `ARTIFACT_S3_ACCESS_KEY` | Access key. |
| `ARTIFACT_S3_SECRET_KEY` | Secret key. |
| `ARTIFACT_S3_REGION` | Region. |
| `ARTIFACT_S3_USE_SSL` | SSL toggle. |
| `ARTIFACT_S3_PRESIGN_TTL_SECONDS` | Presigned URL TTL. |
| `ARTIFACT_LOCAL_ROOT_DIR` | Root path for local filesystem backend. |

The `memory` backend is process-local and is unsuitable for durable storage or
sharing artifact bytes between processes.

Artifact retention classes include `ephemeral`, `run_window`, `audit`, and
`persistent`.

## Workflows

Workflow definitions contain `steps`, `groups`, `for_each`, and an
`execution_graph`. Definition saves carry all three collections together;
metadata-only saves can omit them. Phase-based payloads and legacy phase retry,
timeout, SLA, and gate fields are rejected.

| Area | Settings |
|---|---|
| Public interface | `settings.callable.enabled`, `trigger_channels`, `input_mode`, `strict_inputs`, `expected_inputs`, `input_schema`, `expected_outputs`. |
| Group | `body`, `error_policy`, `boundary_contract`; a Group runs its body once. |
| For each | `over`, `item_name`, `index_name`, `body`, `error_policy`, `boundary_contract`. |
| Step | `step_kind`, `input_mapping_jsonb`, `output_mapping_jsonb`, `connection_binding_jsonb`, `error_policy`, `boundary_contract`, `optional`, `disabled`, `override`. |
| Agent step | `agent_id`, `skill_id`, agent and skill contracts. |
| Connector step | `connector_id`, `connector_install_id`, operation schema, project connection. |
| HTTP step | Method, URL, headers, query params, body template, auth mode/ref, timeout, expected statuses. |
| Dataset query step | Query template, params, row limit, timeout, result target. |
| Nested workflow | Child workflow id or hook, input mapping, output mapping, artifact mapping. |
| Batch step | `override.batch` settings such as `source_path`, `batch_size`, `emit_partial_batch`, `steps`, and `result_target`. |

Return files by selecting **Return from workflow** on the step result that saves
the file. This stores a stable output key in `override.returned_files`. The
workflow's `returned_files` and `output_mode` are derived from its step results
and declared variable outputs. Older `settings.callable.expected_artifacts`
declarations must resolve to exactly one step result; unresolved or ambiguous
declarations are setup issues.

Nested workflow deployment knobs:

- `FS_INVOKE_CHILD_TIMEOUT_SECONDS`;
- `FS_INVOKE_CHILD_TIMEOUT_CAP_SECONDS`;
- `FS_INVOKE_CHILD_POLL_SECONDS`;
- `FS_INVOKE_CHILD_CANCEL_ON_TIMEOUT`;
- `FS_INVOKE_INLINE_EXECUTION`;
- `FS_INVOKE_WORKFLOW_MAX_DEPTH`.

The child timeout and polling settings govern the finite wait path. Durable
child waits use a separate recorded wait mechanism.

## Knowledge retrieval and memory

| Variable | Purpose |
|---|---|
| `FS_MEMORY_PROFILE` | Canonical memory profile: `postgres_unified`. |
| `FS_MEMORY_REPOSITORY_BACKEND` | Canonical memory repository backend: `postgres`. |
| `FS_MEMORY_KNOWLEDGE_BACKEND` | Knowledge backend: `postgres`. |
| `FS_MEMORY_TEXT_SEARCH_BACKEND` | Knowledge text-search backend: `postgres_fts` or `postgres_trgm`. |
| `FS_MEMORY_VECTOR_BACKEND` | Knowledge vector backend: `postgres_pgvector` or `null`; runtime default is `postgres_pgvector`. |
| `FS_CONTEXT_GRAPH_BACKEND` | Workflow/entity context graph backend: `postgres_age` or `null`, not repository code indexing. |
| `FS_PGVECTOR_DSN` | Optional pgvector DSN. |

Canonical internal memory is stored in Postgres and supports runtime context
and workflow knowledge. These settings do not enable a public KB editor or MCP
memory tools. Core does not provide code-index refresh settings or project
reindex commands. See [Project Context](project-knowledge-and-code-intelligence).

## Model execution

Select verified providers and models at the project or agent boundary.
`FS_DEFAULT_PROVIDER`, `FS_DEFAULT_MODEL` and `FS_DEFAULT_TEMPERATURE` govern
intentional runtime defaults; `FS_LLM_REQUEST_TIMEOUT_SECONDS` sets an optional
request timeout. Account-scoped credentials belong in secret-backed provider
profiles and are not replaced by ambient keys for an explicit account route.

## Notifications

Project notification route settings:

| Setting | Purpose |
|---|---|
| `route_key` | Stable route or channel key used by automation. |
| `provider_key` | Notification provider. |
| `event_type` | Event subscription; supports exact and wildcard matching. |
| `severity` | Minimum severity, or `any`. |
| `workflow_id` | Optional workflow scope. |
| `route_config` | Provider-specific options, such as `channel_id` or an outgoing email connection and recipient list. |
| `enabled` | Route toggle. |

Notification evidence is visible through project notification deliveries, job
logs, and event dispatch records when dispatch tracking is available.

## Logs, retention, trash, and watchdog

Logging variables include `FS_LOG_LEVEL`, `FS_LOG_FILE_LEVEL`,
`FS_LOG_STDERR_LEVEL`, `FS_LOG_FORMAT`, `FS_LOG_DIR`,
`FS_LOG_FILE_BASENAME`, `FS_LOG_FILE_ENABLED`, `FS_LOG_STDERR_ENABLED`,
`FS_LOG_CAPTURE_WARNINGS`, `FS_LOG_RETENTION_DAYS`, and `FS_LOG_UTC`.

Retention variables include `FS_RETENTION_LOGS_DAYS`,
`FS_RETENTION_MESSAGES_DAYS`, `FS_RETENTION_TRASH_DAYS`,
`FS_RETENTION_JOBS_DAYS`, `FS_RETENTION_EVENTS_DAYS`, and
`FS_RETENTION_RETRY_QUEUE_DAYS`. Advanced cleanup knobs include
`FS_RETENTION_TERMINAL_JOB_CHECKPOINTS_DAYS`, `FS_RETENTION_REVISIONS_KEEP`,
`FS_WORKSPACES_ROOT`, and `FS_WORKSPACE_MAX_AGE_DAYS`.
`FS_RETENTION_REVISIONS_KEEP` is a revision count, not a duration.
The control process schedules cleanup through `FS_RETENTION_ENABLED` and
`FS_RETENTION_INTERVAL_SECONDS`.

Production observability variables include `SENTRY_DSN`,
`SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`, `SENTRY_TRACES_SAMPLE_RATE`,
`SENTRY_PROFILES_SAMPLE_RATE`, `SENTRY_SEND_DEFAULT_PII`,
`FS_METRICS_TOKEN`, `FS_PROCESS_METRICS_HOST`, `FS_WORKER_METRICS_PORT`,
and `FS_CONTROL_METRICS_PORT`.

Watchdog variables include:

- `FS_WATCHDOG_ENABLED`;
- `FS_WATCHDOG_INTERVAL_SECONDS`;
- `FS_WATCHDOG_AUTO_APPLY`;
- `FS_WATCHDOG_STUCK_SECONDS`;
- `FS_WATCHDOG_ORPHAN_GRACE_SECONDS`;
- `FS_WATCHDOG_PICKUP_GRACE_SECONDS`;
- `FS_WATCHDOG_MAX_JOURNAL_ENTRIES`.

Use watchdog scan/recover APIs and the runtime journal when diagnosing stuck or
interrupted jobs.

Admins can manage account-scoped action-log, job-log, trash, terminal-job
checkpoint retention, and retained revision counts from `Settings > Retention`.
Saved account policy overrides the corresponding deployment defaults; job,
event, and retry-queue cleanup windows remain separate deployment settings.

Trash is the operator recovery layer for accidental deletion. Lifecycle plans
show dependency trees and direct conflicts before restore or hard-delete
operations for supported entities, including workspaces, projects, registry
workflows, and MCP connectors.
