---
sidebar_position: 8
title: Environment Variables
description: Flow Steward environment files and variable groups.
---

# Environment Variables

Flow Steward configuration is environment-driven. The installer can generate
managed `.env` blocks, but operators and developers should still know which
groups exist and which variables are safe to change.

This page is the public, compact reference. The application repository also
ships a generated environment catalog with owners, defaults, example files, and
runtime read locations.

## Environment review boundary

The documentation review on 2026-10-04 recorded **430 names in 24 groups**
at application revision `62a95e3456d3a692092b5a04daecca504c3f97b1`. That
historical inventory had 78 additions, 28 removals, and 21 changed existing
entries since revision `953e9aaf992947a1dc24cab308aa0aad6a6c81e0`; it is not
a count of the current manifest. An
inventory entry is not proof that a variable reaches every service or that
`config set` accepts it.

This page gives selected operator contracts. Follow the deployment-specific
[installer walkthrough](../deploy/installer-walkthrough.md),
[platform guide](../deploy/platforms.md), and
[limits reference](limits-and-file-formats.md) for where a value is applied.
Variables belonging only to test, audit, build, or release tooling are not
production tuning controls. Read the manifest and current consumer when a
setting is not covered here; do not infer support or bounds from its name.

## Deployment, ingress, and local storage

These settings describe the current installation topology. Prefer installer
answers and generated configuration over manually changing an installer-owned
value. See the [prompt-by-prompt manual](../deploy/installer-walkthrough.md) for
how to discover proxy names, networks, entrypoints, and certificate resolvers.

| Setting | Meaning and application boundary |
|---|---|
| `FS_DEPLOYMENT_PROFILE` | `compact` supervises runtime roles together; `scalable` separates role containers. Use the installer's profile-switch operation for an installed Compose stack. |
| `FS_WORKER_PROCESSES` | Compact worker-process count, default 2. Decimal integer, minimum 1; bounded by worker metrics ports (maximum 56,336). Scalable rejects this setting. The complete listener map must also have no port collisions. Practical capacity depends on CPU/RAM and workload. |
| `FS_WORKER_REPLICAS` | Scalable worker container count, default 1, accepted range 1–64. On an installed Scalable stack use `config set --worker-replicas N`, then `config apply --confirm`. Compact requires this count to remain 1. |
| `FS_FILE_STORAGE` | Installer file-storage selection: `local_fs`, `bundled`, or `external_s3`, subject to the selected profile and install mode. See the walkthrough's default/selection caveats. |
| `ARTIFACT_STORAGE_BACKEND` | Runtime backend selected by installation: `local_fs`, `s3`, or in-memory test usage. Switching it does not migrate existing objects. |
| `ARTIFACT_LOCAL_ROOT_DIR` | Artifact directory inside the runtime; Compact Compose mounts it at `/data/artifacts`. It needs durable storage. |
| `FS_COMPACT_DATA_ROOT` | Compact persistent root, normally `/data`. The shipped image and Compose layout assume `/data`; Compose does not forward an arbitrary override for this name. On provider hosting, preserve the image layout and mount a durable volume there. |
| `FS_INGRESS_MODE`, `FS_PROXY_KIND`, `FS_PROXY_PLACEMENT` | Ingress: `bundled_traefik`, `external_traefik`, `external_proxy`, or Compact-only `platform`. Existing-proxy fragments support `nginx` or `apache`, with `host` or `docker` placement. These choices must agree with generated ports/routes. |
| `FS_PROXY_NETWORK`, `FS_TRAEFIK_NETWORK` | Existing Docker proxy network selection. Use the exact inspected network name, not an invented default. |
| `FS_TRAEFIK_HTTP_ENTRYPOINT`, `FS_TRAEFIK_HTTPS_ENTRYPOINT`, `FS_TRAEFIK_CERT_RESOLVER` | Names already configured in the existing Traefik static configuration. These variables do not create a resolver or entrypoint. |
| `FS_PROXY_TRUSTED_IPS` | Trusted proxy addresses/CIDRs for the selected topology; see proxy discovery and trust guidance in the walkthrough. |
| `FS_REVERSE_PROXY_BACKEND_PORT`, `FS_REVERSE_PROXY_MCP_PORT` | Host-facing backend ports for applicable existing-proxy topology; Docker proxy placement uses the internal service network instead. |
| `FS_PUBLIC_HOST`, `FS_PUBLIC_BASE_URL` | The public hostname/origin. Keep DNS, TLS, auth origins, callbacks, and proxy routes consistent. |

### Compact supervisor budgets

Read by `core/infrastructure/config/compact_runtime.py` before child creation.
Values must be decimal integers. Invalid strings, values outside bounds, or
invalid relationships fail startup; they do not silently fall back. All rows
below use seconds and accept **1–86,400**, except the restart limit, which is a
count in **1–1,000**.

| Variable | Default | Purpose |
|---|---:|---|
| `FS_COMPACT_STARTUP_TIMEOUT_SECONDS` | 300 | Initial aggregate readiness budget; also used by the optional pre-bootstrap dependency wait. |
| `FS_COMPACT_DEPENDENCY_TIMEOUT_SECONDS` | 300 | Allowed continuous readiness loss after the runtime has first become ready. |
| `FS_COMPACT_RESTART_LIMIT` | 3 | Allowed restart count in the window. |
| `FS_COMPACT_RESTART_WINDOW_SECONDS` | 300 | Restart accounting window. |
| `FS_COMPACT_RESTART_BACKOFF_SECONDS` | 2 | Initial restart delay. |
| `FS_COMPACT_RESTART_BACKOFF_MAX_SECONDS` | 30 | Maximum restart delay. |
| `FS_COMPACT_SHUTDOWN_GRACE_SECONDS` | 180 | Shutdown budget. |
| `FS_COMPACT_KILL_RESERVE_SECONDS` | 10 | Reserved forced-stop interval. |
| `FS_COMPACT_HEALTH_INTERVAL_SECONDS` | 2 | Internal health observation interval. |
| `FS_COMPACT_HEALTH_STALE_SECONDS` | 10 | Internal stale-health threshold. |

Kill reserve must be shorter than shutdown grace; health interval must be
shorter than stale threshold; initial backoff cannot exceed maximum backoff.
Scalable rejects Compact-only supervisor controls. A code-supported setting
must also be passed into the Compact process by your deployment. The current
Compact Compose file explicitly forwards every budget in this table and uses
the shutdown grace for its container stop timeout. On a managed provider, set
the container stop timeout there as well; changing the runtime value alone does
not change the provider timeout. In general, placing an
arbitrary name in a Compose interpolation file alone is insufficient. Recreate
the affected Compact container after changing its supported environment.

### Cross-role monitoring

These settings use `core/infrastructure/config/monitoring_runtime.py`, separately
from the supervisor budgets above. Numeric values are decimal integers; blank
or whitespace-only values use defaults. Leading/trailing whitespace is trimmed.
Out-of-range or non-integer values fail validation.

| Variable | Default | Accepted range / relationship |
|---|---:|---|
| `FS_MONITORING_INTERVAL_SECONDS` | 60 seconds | 1–86,400; below the stale threshold. |
| `FS_MONITORING_STALE_SECONDS` | 180 seconds | 1–86,400. |
| `FS_MONITORING_CURRENT_RETENTION_DAYS` | 7 days | 1–3,650. |
| `FS_MONITORING_HISTORY_RETENTION_DAYS` | 7 days | 1–3,650. |
| `FS_MONITORING_CLEANUP_BATCH_SIZE` | 500 rows | 1–5,000. |
| `FS_MONITORING_QUEUE_MAX_MESSAGES` | 10,000 messages | 1–1,000,000. |
| `FS_MONITORING_QUEUE_MAX_BYTES` | 16,777,216 bytes | 1–1,073,741,824. |
| `FS_MONITORING_OPERATION_TIMEOUT_SECONDS` | 2 seconds | 1–30. |

`FS_MONITORING_HISTORY_ENABLED` defaults to `0`, also on an empty value, and
accepts `0`, `1`, `false`, or `true` after trimming and lowercasing. Current
Compose environments forward these monitoring controls, and Compact's explicit
child-process allowlist forwards them to the reporting roles. Change them in
the relevant deployment environment and recreate affected services; this does
not make them arbitrary `config set` fields. `FS_INSTALLATION_ID`,
`FS_MONITORING_EXPECTATIONS`, and `FS_MONITORING_DEPENDENCIES` describe installation
identity and topology; preserve installer-generated values rather than inventing
new ones to clear a monitoring warning.

## Workflow-entrypoint request transport

These historically named controls are consumed by
`POST /webhook/workflows/{entry_key}`, but not by the JSON-only
`/api/workflow-runs` route:

| Variable | Default | Contract |
|---|---:|---|
| `FS_TASK_UPLOAD_MAX_CONCURRENT_PREPARATIONS` | 4 | Total concurrent request preparations; integer clamped to 1–64. |
| `FS_TASK_UPLOAD_MAX_CONCURRENT_PREPARATIONS_PER_ACCOUNT` | 2 | Per-account count, 1–64 and no greater than total. |
| `FS_TASK_UPLOAD_MAX_CONCURRENT_PREPARATIONS_PER_PRINCIPAL` | 2 | Per entrypoint ID plus auth mode, not per logged-in user; 1–64 and no greater than both account and total. |
| `FS_TASK_UPLOAD_BODY_READ_TIMEOUT_SECONDS` | 120 seconds | Multipart and non-multipart body receipt only; clamped to 5–3,600 seconds. |

Admission exhaustion returns HTTP 429; body-read timeout returns HTTP 408.
Entrypoint records separately declare `max_body_bytes`, `max_file_bytes`, and
`max_files` as the effective entrypoint size and count limits. None of the four
active controls above has a shipped production Compose app binding or Compact
child allowlist entry. Verify the rendered process environment instead of assuming
that an environment-file edit takes effect. See [Limits And File Formats](limits-and-file-formats.md#workflow-run-inputs-and-attachments).

## Public job SSE admission

| Variable | Default | Contract |
|---|---:|---|
| `FS_PUBLIC_SSE_MAX_CONNECTIONS_PER_PRINCIPAL` | 10 | Process-local concurrent job-stream connections per principal; clamped to 1–1,000. Invalid integers use the default. |
| `FS_PUBLIC_SSE_MAX_CONNECTIONS_PER_ACCOUNT` | 100 | Process-local concurrent job-stream connections per account; clamped to 1–10,000. Invalid integers use the default. |

Either limit returns HTTP 429 with `stream_connection_limit` and
`Retry-After: 1`. Counters are not shared between application processes. These
variables also lack explicit production Compose app bindings and Compact child
allowlist entries. Production runtime disables repository `.env` autoload by
default, so do not present `.env.prod` editing alone as a supported tuning path;
verify the actual service environment. See [API Reference](api.md#authentication-pagination-approvals-and-sse).

## Workflow data and nesting limits

| Variable | Default | Contract |
|---|---:|---|
| `FS_DATASET_QUERY_MAX_RUNTIME_ROWS` | 1,000 | Deployment maximum for rows materialized by one `dataset_query`. An explicit value must be a positive whole number; blank, invalid, zero, or negative fails. There is no code-level upper clamp. A missing step `row_limit` becomes `min(100, maximum)`; a request above the maximum fails before fetch. |
| `FS_INVOKE_WORKFLOW_MAX_DEPTH` | 5 | Maximum `invoke_workflow` chain depth. Invalid, blank, zero, or negative uses 5; any positive integer is accepted. Exceeding it fails with `invocation_depth_exceeded` before child execution. |

Both variables lack explicit production Compose app bindings and Compact child
allowlist entries at this revision. Verify the effective worker/application
environment before treating an environment-file change as active. Dataset rows
are held in workflow state; preview rows are a separate display boundary. See
[Limits And File Formats](limits-and-file-formats.md#datasets-and-tabular-feeds).

## Environment files

| File | Purpose |
|---|---|
| `.env.example` | Local development baseline. |
| `.env.example.prod` | Minimal production stack baseline. |
| `.env.example.memory` | Memory backend override examples. |
| `.env.example.ops` | Observability, auth, email, runtime, retention, DB tuning, and artifact storage knobs. |
| `.env.example.quality` | Sonar and quality-tool settings. |
| `.env.example.test` | E2E, Nightfire, and test-runner settings. |

Typical local start:

```bash
cp .env.example .env
```

Typical production start:

```bash
cp .env.example.prod .env.prod
```

Use `./install.sh` for a fresh or resumable installation. After installation,
on Scalable use `./flow-steward config show`, `config validate`, `config set`, and
`config apply` for the typed configuration fields those commands expose. They
do not accept arbitrary environment-variable names. Other settings require the
deployment's supported environment source and recreation of affected services.

## Variables most users touch

| Variable | Purpose |
|---|---|
| Account credential profiles | Provider credentials are created in the application and scoped to an account; core installation does not require one. |
| `FS_DEFAULT_PROVIDER` | Default model provider, such as `openai`. |
| `FS_DEFAULT_MODEL` | Default model used when a more specific setting is not chosen. |
| `FS_DEFAULT_TEMPERATURE` | Default model temperature. |
| `APP_PORT` | Application listener/Compose port input, depending on topology. Compact serves public traffic through `PORT` / `FS_RUNTIME_HTTP_PORT`; do not use `APP_PORT` to change that public router. |
| `FS_PUBLIC_BASE_URL` | Public origin used for links, redirects, and trusted deployment URLs. |
| `FS_SECRET_KEY` | Secret key for auth/session signing. Must be strong in production. |
| `ENCRYPTION_KEY` | Stable AES-GCM key for encrypted stored secrets. |
| `FS_AUTH_TRUSTED_ORIGINS` | Allowed public origins for browser-facing auth flows. |
| `FS_AUTH_BOOTSTRAP_ENABLED` | Enables the first-admin bootstrap flow. Disable after setup in production. |
| `MCP_BEARER_TOKEN` | Token used by local MCP clients such as Codex sessions. |

## Core runtime

| Variable | Purpose |
|---|---|
| `FS_STACK_ENVIRONMENT` | Installer-managed stack environment marker. |
| `ENVIRONMENT` | Runtime environment marker used to avoid leaking local defaults into production. |
| `APP_PORT` | Application HTTP port. |
| `FS_DB_DSN` | Primary Flow Steward database DSN. Secret. |
| `LANGGRAPH_POSTGRES_URI` | Postgres URI used by LangGraph checkpoint/runtime paths. Secret. |
| `RABBITMQ_URL` | RabbitMQ connection URL. Secret. |
| `MCP_URL` | Internal Flow Steward MCP URL. |
| `FS_PUBLIC_BASE_URL` | Public base URL for the deployed app. |
| `POSTGRES_DB` | Database name. |
| `POSTGRES_USER` | Database user. |
| `POSTGRES_PASSWORD` | Database password. Secret. |

## Memory and search backends

Canonical memory records live in Postgres. Optional vector and graph services are
indexes and must be selected explicitly.

| Variable | Purpose |
|---|---|
| `FS_MEMORY_PROFILE` | Overall memory profile, commonly `postgres_unified`. |
| `FS_MEMORY_REPOSITORY_BACKEND` | Repository-memory backend. |
| `FS_MEMORY_KNOWLEDGE_BACKEND` | Knowledge-memory backend. |
| `FS_MEMORY_TEXT_SEARCH_BACKEND` | Text search backend, commonly `postgres_fts`. |
| `FS_MEMORY_VECTOR_BACKEND` | Vector backend, commonly `postgres_pgvector`. |
| `FS_CONTEXT_GRAPH_BACKEND` | Context graph backend, commonly `postgres_age`. |
| `FS_PGVECTOR_DSN` | Optional DSN override for pgvector. |

## Authentication and access

| Variable | Purpose |
|---|---|
| `FS_LOCAL_AUTH_ENABLED` | Enables local username/password auth. |
| `FS_AUTH_COOKIE_SECURE` | Requires secure cookies. Use `1` for HTTPS production. |
| `FS_AUTH_BOOTSTRAP_ENABLED` | Enables first-admin bootstrap. |
| `FS_AUTH_BOOTSTRAP_LOCALHOST_ONLY` | Restricts bootstrap to localhost. |
| `FS_AUTH_BOOTSTRAP_TOKEN` | Optional bootstrap token. Secret. |
| `FS_AUTH_PASSWORD_MIN_LENGTH` | Minimum password length. |
| `FS_AUTH_LOGIN_MAX_ATTEMPTS` | Login attempts before lockout. |
| `FS_AUTH_LOGIN_LOCKOUT_SECONDS` | Lockout duration. |
| `FS_AUTH_PASSWORD_RESET_ENABLED` | Enables password reset. |
| `FS_AUTH_PASSWORD_RESET_TTL_MINUTES` | Password reset token lifetime. |
| `FS_AUTH_PASSWORD_RESET_MAX_ATTEMPTS` | Password reset attempts before lockout. |
| `FS_AUTH_PASSWORD_RESET_LOCKOUT_SECONDS` | Password reset lockout duration. |

### Authentication numeric contracts

These values are parsed once when `core.application.auth.config` is imported.
They require base-10 integer strings. An empty or non-integer value does not
fall back: it can prevent an importing process from starting. Values below the
listed minimum are raised to that minimum.

| Variable | Default | Minimum / relationship | Consumer effect |
|---|---:|---:|---|
| `FS_AUTH_SESSION_TTL_HOURS` | 24 hours | 1 hour | Ordinary authenticated-session lifetime. |
| `FS_AUTH_REMEMBER_SESSION_TTL_HOURS` | 720 hours | Effective ordinary-session TTL | Remembered sessions can never be shorter than ordinary sessions. |
| `FS_AUTH_PASSWORD_ITERATIONS` | 260,000 | 100,000 | Password hashing iteration count. |
| `FS_AUTH_PASSWORD_MIN_LENGTH` | 10 characters | 8 characters | Enforced when passwords are accepted by the auth API. |
| `FS_AUTH_LOGIN_RATE_WINDOW_SECONDS` | 300 seconds | 30 seconds | Login-attempt accounting window. |
| `FS_AUTH_LOGIN_MAX_ATTEMPTS` | 5 | 3 | Attempts allowed within the login window before lockout. |
| `FS_AUTH_LOGIN_LOCKOUT_SECONDS` | 900 seconds | 30 seconds | Login lockout duration. |
| `FS_AUTH_PASSWORD_RESET_TTL_MINUTES` | 30 minutes | 5 minutes | Password-reset token lifetime. |
| `FS_AUTH_PASSWORD_RESET_RATE_WINDOW_SECONDS` | 300 seconds | 30 seconds | Password-reset attempt window. |
| `FS_AUTH_PASSWORD_RESET_MAX_ATTEMPTS` | 5 | 3 | Password-reset attempts allowed within the window. |
| `FS_AUTH_PASSWORD_RESET_LOCKOUT_SECONDS` | 900 seconds | 30 seconds | Password-reset lockout duration. |

Change these only through the supported deployment environment, then recreate
every application/API process. They are not arbitrary keys accepted by
`flow-steward config set`.

## LLM providers and AI behavior

Provider secrets belong in account-scoped credential profiles. The default
provider/model variables select behavior; they are not proof that credentials
exist, and no cross-provider fallback is implied.

| Variable | Purpose |
|---|---|
| `FS_DEFAULT_PROVIDER` | Default provider. |
| `FS_DEFAULT_MODEL` | Default model. |
| `FS_DEFAULT_TEMPERATURE` | Default model temperature. |
| `FS_LLM_REQUEST_TIMEOUT_SECONDS` | Optional timeout for model requests. |

## MCP

| Variable | Purpose |
|---|---|
| `MCP_URL` | Internal Flow Steward MCP endpoint. |
| `MCP_BEARER_TOKEN` | Bearer token for external MCP clients. Secret. |
| `FS_MCP_AUTH_DISABLED` | Disables MCP auth in selected local-dev contexts. Do not use in production. |

## OpenAPI and built-in docs exposure

These variables control the application server's curated OpenAPI/docs routes,
not this standalone Docusaurus site. The default FastAPI `/openapi.json`,
`/docs`, and `/redoc` routes are disabled.

| Variable | Purpose |
|---|---|
| `FS_OPENAPI_PUBLIC_ENABLED` | Enables `/openapi-public.json` for the external integration API allowlist. |
| `FS_DOCS_PUBLIC_ENABLED` | Enables `/docs/api` when the public schema is enabled. |
| `FS_OPENAPI_INTERNAL_ENABLED` | Enables `/openapi-internal.json` for authenticated app/operator `/api/*` routes. |
| `FS_DOCS_INTERNAL_ENABLED` | Enables `/docs/internal` when the internal schema is enabled. |
| `FS_OPENAPI_PUBLIC_REQUIRE_AUTH` | Requires auth for the public schema and Swagger UI; defaults to `1`. |
| `FS_OPENAPI_INTERNAL_REQUIRE_AUTH` | Requires auth for the internal schema and Swagger UI; defaults to `1`. |

## Attachments and redaction

| Variable | Purpose |
|---|---|
| `FS_ATTACHMENT_MAX_SIZE_BYTES` | Stored-attachment size policy; see [workflow-run inputs and attachments](limits-and-file-formats.md#workflow-run-inputs-and-attachments). This does not make the JSON-only workflow-run API an upload endpoint. |
| `FS_ATTACHMENT_MAX_FILES` | Stored-attachment count policy; see [workflow-run inputs and attachments](limits-and-file-formats.md#workflow-run-inputs-and-attachments). This does not make the JSON-only workflow-run API an upload endpoint. |
| `FS_ALLOWED_ATTACHMENT_MIMES` | MIME policy, including the generic-binary exception described in [Default formats and type matching](limits-and-file-formats.md#default-formats-and-type-matching). |
| `FS_ALLOWED_ATTACHMENT_EXTENSIONS` | Filename-extension policy and empty-list behavior; see [Default formats and type matching](limits-and-file-formats.md#default-formats-and-type-matching). |
| `FS_EXTENSION_DEBUG_PAYLOADS` | Enables extension payload debug details. Keep off normally. |
| `FS_EXTENSION_PAYLOAD_REDACT_KEYS` | Sensitive keys redacted from extension payloads. |
| `FS_EXTENSION_PAYLOAD_REDACT_EXACT_KEYS` | Exact sensitive keys redacted from extension payloads. |
| `FS_EXTENSION_PAYLOAD_REDACT_KEY_FRAGMENTS` | Key fragments treated as sensitive. |
| `FS_EXTENSION_PAYLOAD_REDACT_MAX_DEPTH` | Max redaction traversal depth. |
| `FS_EXTENSION_PAYLOAD_STRING_TRUNCATE_LENGTH` | Max string length retained in payload traces. |
| `FS_TRACE_REDACT_MAX_LENGTH` | Max length retained in redacted traces. |

## Artifact storage

| Variable | Purpose |
|---|---|
| `ARTIFACT_STORAGE_BACKEND` | Artifact backend: `memory`, `s3`, or `local_fs`. |
| `ARTIFACT_S3_ENDPOINT_URL` | S3-compatible endpoint URL. |
| `ARTIFACT_S3_BUCKET` | Artifact bucket. |
| `ARTIFACT_S3_ACCESS_KEY` | S3 access key. Secret. |
| `ARTIFACT_S3_SECRET_KEY` | S3 secret key. Secret. |
| `ARTIFACT_S3_REGION` | S3 region. |
| `ARTIFACT_S3_KEY_PREFIX` | Optional object key prefix. |
| `ARTIFACT_S3_USE_SSL` | Whether S3 endpoint uses SSL. |
| `ARTIFACT_S3_PRESIGN_TTL_SECONDS` | Presigned URL lifetime; code/example and Compose defaults differ as documented in [Artifact download-link lifetime](limits-and-file-formats.md#artifact-download-link-lifetime). |
| `ARTIFACT_LOCAL_ROOT_DIR` | Local artifact root for local filesystem storage. |

## Observability, logs, and email

| Variable | Purpose |
|---|---|
| `SENTRY_DSN` | Sentry backend DSN. Secret. |
| `SENTRY_ENVIRONMENT` | Sentry environment label. |
| `SENTRY_RELEASE` | Release identifier for telemetry. |
| `SENTRY_TRACES_SAMPLE_RATE` | Backend Sentry trace sample rate. |
| `SENTRY_PROFILES_SAMPLE_RATE` | Backend Sentry profiling sample rate. |
| `SENTRY_SEND_DEFAULT_PII` | Allows default PII capture in Sentry. Keep disabled unless approved. |
| `SENTRY_AUTO_ENABLING_INTEGRATIONS` | Enables Sentry auto integrations. Defaults off. |
| `FS_OBSERVABILITY_DSN` | Observability database DSN. Secret. |
| `FS_LOG_LEVEL` | Platform log level. |
| `FS_LOG_FILE_LEVEL` | Runtime file sink log level. |
| `FS_LOG_STDERR_LEVEL` | Runtime stderr sink log level. |
| `FS_LOG_FORMAT` | Log format. |
| `FS_LOG_DIR` | Runtime log directory. |
| `FS_LOG_FILE_BASENAME` | Runtime daily log basename. |
| `FS_LOG_FILE_ENABLED` | Enables runtime file logging. |
| `FS_LOG_STDERR_ENABLED` | Enables runtime stderr logging. |
| `FS_LOG_RETENTION_DAYS` | Log retention window. |
| `FS_LOG_CAPTURE_WARNINGS` | Routes Python warnings into runtime logging. |
| `FS_LOG_UTC` | Uses UTC timestamps for runtime logs. |
| `FS_METRICS_TOKEN` | Optional token required by `/metrics` endpoints. Secret. |
| `FS_PROCESS_METRICS_HOST` | Metrics listener host. |
| `FS_WORKER_METRICS_PORT` | Worker metrics port. |
| `FS_CONTROL_METRICS_PORT` | Control metrics port. |
| `SYSTEM_EMAIL_ENABLED` | Enables system email. |
| `SYSTEM_EMAIL_PROVIDER` | Email provider, such as `smtp`. |
| `SYSTEM_EMAIL_FROM_ADDRESS` | Sender address. |
| `SYSTEM_EMAIL_SMTP_HOST` | SMTP host. |
| `SYSTEM_EMAIL_SMTP_PORT` | SMTP port. |
| `SYSTEM_EMAIL_SMTP_USERNAME` | SMTP username. |
| `SYSTEM_EMAIL_SMTP_PASSWORD` | SMTP password. Secret. |
| `SYSTEM_EMAIL_ANYMAIL_CONFIG_JSON` | Anymail provider config JSON. Secret if it contains credentials. |

## Runtime controls and retention

| Variable | Purpose |
|---|---|
| `CONTROL_LOOPS_ENABLED` | Enables control-plane loops in the control-plane service. |
| `FS_WATCHDOG_ENABLED` | Enables watchdog loop. |
| `FS_WATCHDOG_INTERVAL_SECONDS` | Watchdog interval. |
| `FS_WATCHDOG_AUTO_APPLY` | Allows watchdog to apply configured repairs. |
| `FS_SCHEDULED_JOBS_ENABLED` | Enables scheduled jobs. |
| `FS_SCHEDULED_JOBS_INTERVAL_SECONDS` | Scheduled-job scan interval. |
| `FS_DASHBOARD_ROLLUP_ENABLED` | Enables dashboard rollup generation. |
| `FS_DASHBOARD_ROLLUP_INTERVAL_SECONDS` | Dashboard rollup interval. |
| `FS_RETENTION_LOGS_DAYS` | Log retention days. |
| `FS_RETENTION_MESSAGES_DAYS` | Message retention days. |
| `FS_RETENTION_TRASH_DAYS` | Trash retention days. |
| `FS_RETENTION_JOBS_DAYS` | Job retention days. |
| `FS_RETENTION_EVENTS_DAYS` | Event retention days. |
| `FS_RETENTION_RETRY_QUEUE_DAYS` | Retry queue retention days. |
| `FS_RETENTION_TERMINAL_JOB_CHECKPOINTS_DAYS` | Terminal checkpoint retention days. |
| `FS_WORKSPACES_ROOT` | Workspace artifact root for local prune operations. |
| `FS_WORKSPACE_MAX_AGE_DAYS` | Max age before workspace artifacts are eligible for pruning. |

## Frontend and tests

| Variable | Purpose |
|---|---|
| `FS_AUTO_RELOAD` | Enables local backend/frontend autoreload services in supported dev stacks. |
| `VITE_PORT` | Vite dev server port. |
| `VITE_USE_POLLING` | Enables polling file watcher. |
| `VITE_POLL_INTERVAL` | Polling interval. |
| `APP_BASE_URL` | App URL for tests. |
| `TEST_RUNNER_BASE_URL` | Internal app URL for test runner. |
| `E2E_VERIFY_SSL` | Whether E2E tests verify HTTPS certificates. |
| `E2E_ADMIN_USERNAME` | E2E admin username. |
| `E2E_ADMIN_PASSWORD` | E2E admin password. Secret. |
| `E2E_OPERATOR_USERNAME` | E2E operator username. |
| `E2E_VIEWER_USERNAME` | E2E viewer username. |
| `NIGHTFIRE_LANE` | Nightfire test lane. |
| `NIGHTFIRE_FULL_UI` | Enables full UI Nightfire coverage. |

## Quality and security tools

| Variable | Purpose |
|---|---|
| `SONAR_ENABLED` | Enables Sonar usage. |
| `SONAR_TOKEN` | Sonar token. Secret. |
| `SONAR_HOST_URL` | Sonar URL from containers. |
| `SONAR_WAIT_URL` | Sonar URL from host waits. |
| `SONAR_PROJECT_KEY` | Sonar project key. |
| `SONAR_PROJECT_NAME` | Sonar project name. |
| `SONAR_EXPORT` | Enables issue export. |
| `SONAR_EXPORT_DIR` | Export output directory. |
| `SECURITY_SCAN_MODE` | Security scanner mode. |
| `SECURITY_FAIL_CLOSED_ON_POLICY_ERROR` | Fails closed when policy cannot load. |
| `SECURITY_PII_SALT` | Salt for PII handling. Secret. |

## Production images and host paths

| Variable | Purpose |
|---|---|
| `FS_COMPACT_IMAGE` | Immutable Compact runtime image pin, including the public router and supervised roles. |
| `FS_APP_IMAGE` | Scalable application role image pin. |
| `FS_WORKER_IMAGE` | Worker role image pin. |
| `FS_CONTROL_IMAGE` | Control-plane role image pin. |
| `FS_CLI_IMAGE` | Public CLI role image pin. |
| `FS_FRONTEND_IMAGE` | Development frontend image override. Production app images already contain the frontend; this is not a separate production role pin. |
| `MCP_IMAGE` | Flow Steward MCP image pin. |
| `TRAEFIK_IMAGE` | Traefik image pin. |
| `POSTGRES_IMAGE` | Postgres image pin. |
| `RABBITMQ_IMAGE` | RabbitMQ image pin. |
| `FS_EXTENSIONS_DIR` | Host-visible extensions directory. |
| `FS_LOGS_DIR` | Host-visible logs directory. |
| `FS_BACKUPS_DIR` | Host-visible backups directory. |
| `FS_DB_SCHEMA_DIR` | Host-visible DB schema directory. |

## Security scanning contract

`SECURITY_SCAN_MODE` accepts exactly `monitor`, `enforce_standard`,
`enforce_strict`, or `disabled`. An invalid value falls back to the
environment-dependent default: `enforce_standard` in production and `monitor`
elsewhere. `monitor` scans and logs without blocking, although persisted-data
redaction still applies. `disabled` turns off secret, injection, and PII
detection and should not be used as a production bypass.

`SECURITY_FAIL_CLOSED_ON_POLICY_ERROR` is independent of scan mode. Values
`1`, `true`, `yes`, or `on` make policy parse/resolution errors block payloads,
including in monitor mode; the default is off.

`SECURITY_PII_SALT` is a secret used for deterministic PII pseudonymization. A
production process refuses to start when the value is empty or a known
placeholder. Outside production, a missing value creates a process-local random
salt, so pseudonyms will not remain stable across restarts. Provision one
durable, unique secret and preserve it when stable pseudonyms are required.

All three settings are read at module import. Apply changes by recreating every
service that imports the security configuration; rotating the PII salt changes
future deterministic pseudonyms.

## Secrets

Never commit real values for variables containing passwords, tokens, API keys,
DSNs, private keys, or shared secrets. Rotate secrets if they appear in logs,
screenshots, docs, or shared review artifacts.

## Canonical manifest coverage

The canonical source is
`core/infrastructure/config/flow_steward_env_manifest.json` in the application
checkout. Its defaults, owners, groups, and secret flags are useful inventory
metadata; the effective consumer and selected deployment still determine
behavior. Use the target manifest and current readers to identify supported
settings and their effects.

For each upgrade, compare the target manifest **and** its readers, check that
the selected Compose/provider configuration forwards the setting, and recreate
the affected process. Preserve secrets in the deployment's supported secret
source. A variable accepted by the runtime is not automatically an arbitrary
key supported by `flow-steward config set`.
