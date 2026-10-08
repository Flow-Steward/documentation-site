---
sidebar_position: 7
title: Limits And File Formats
description: Surface-specific payload, file, row, timeout, concurrency, and retention limits.
---

# Limits And File Formats

Limits are enforced at different boundaries. A browser limit does not prove a
proxy, API, worker, provider, or extension runtime accepts the same payload.
The tables distinguish code fallbacks, example-file values, and Compose
interpolation defaults where those layers differ.

## Workflow-run inputs and attachments

`POST /api/workflow-runs` accepts JSON only: an explicit project UUID, workflow
ID, declared `inputs`, optional `client_context`, and `test_mode`. Each of
`inputs` and `client_context` is bounded to 32 nesting levels and 262,144 bytes
when serialized as compact JSON. Extra request fields are rejected.

`POST /api/workflow-runs` uses the JSON request contract above. File-bearing
requests enter through separately configured `POST /webhook/workflows/{entry_key}`
entrypoints. The `FS_TASK_UPLOAD_*` controls below govern workflow-webhook
admission and body receipt; each entrypoint also enforces its own content-type,
size, count, and input-mapping contract.

| Workflow-entrypoint boundary | Default | Accepted range and meaning |
|---|---:|---|
| `FS_TASK_UPLOAD_MAX_CONCURRENT_PREPARATIONS` | 4 | Total concurrent preparations; integer count clamped to 1–64. |
| `FS_TASK_UPLOAD_MAX_CONCURRENT_PREPARATIONS_PER_ACCOUNT` | 2 | Per-account preparations; 1–64 and no greater than the total. |
| `FS_TASK_UPLOAD_MAX_CONCURRENT_PREPARATIONS_PER_PRINCIPAL` | 2 | Per entrypoint ID plus authentication mode; 1–64 and no greater than both the account and total limits. This is not a logged-in-user limit. |
| `FS_TASK_UPLOAD_BODY_READ_TIMEOUT_SECONDS` | 120 seconds | Body-receipt timeout for multipart and non-multipart requests; clamped to 5–3,600 seconds. It does not cover the rest of processing. |

Admission exhaustion returns HTTP 429. A body-read timeout returns HTTP 408.
The entrypoint definition's own `max_body_bytes`, `max_file_bytes`, and
`max_files` values enforce its record-specific size and count limits.

| Entrypoint record field | Create default | Create/update validation |
|---|---:|---|
| `max_body_bytes` | 46,137,344 bytes (44 MiB) | 1–104,857,600 bytes (100 MiB) |
| `max_file_bytes` | 10,485,760 bytes (10 MiB) | 1–104,857,600 bytes (100 MiB) |
| `max_files` | 4 | 0–32; `0` rejects all files, rather than disabling the limit |
| `allowed_content_types` | `application/json` | Multipart must be added explicitly before a multipart request is accepted. |

The runtime uses the same defaults, but only applies the 100 MiB upper clamp to
`max_body_bytes`. The create/update validation bounds above therefore do not
normalize a record changed directly in the database. Multipart parsing also
limits non-file fields to 32 and each non-file form part to 262,144 bytes;
uploaded files remain subject to the entrypoint's `max_file_bytes`. See
[Incoming Workflow Webhooks](../integrations/incoming-workflow-webhooks).

The four active controls above also lack shipped production Compose app
forwarding and Compact child-process allowlist entries. Merely editing a
production environment file does not prove that a running service received the
value; inspect the rendered service environment and owning process. Incoming
workflow webhooks and extension artifact operations have their own payload and
file boundaries. See [Environment Variables](environment-variables#workflow-entrypoint-request-transport).

The shared stored-attachment policy remains:

| Boundary | Control | Shipped value | Accepted range and meaning |
|---|---|---:|---|
| One stored attachment | `FS_ATTACHMENT_MAX_SIZE_BYTES` | 20 MiB | Integer bytes, minimum `0`; `0` disables this stored-attachment size check. |
| Attachments per payload | `FS_ATTACHMENT_MAX_FILES` | 10 | Integer, minimum `0`; `0` disables this count check. |

### Default formats and type matching

The shipped examples allow `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.pdf`,
`.xlsx`, `.xls`, `.docx`, `.txt`, `.md`, and `.csv`. Their MIME allowlist is
`image/png`, `image/jpeg`, `image/webp`, `image/gif`, `application/pdf`, the
Microsoft Excel/OpenXML spreadsheet and Word MIME types, `text/plain`,
`text/markdown`, `text/csv`, and `application/octet-stream`. Control these with
`FS_ALLOWED_ATTACHMENT_EXTENSIONS` and `FS_ALLOWED_ATTACHMENT_MIMES`.

The matching rules matter:

- With a nonempty extension list, the filename extension must be allowed. A
  supplied specific MIME must also be allowed when the effective MIME allowlist
  is nonempty.
- A missing MIME becomes `application/octet-stream`. Once the extension is
  allowed, this generic-binary value is accepted even if it is absent from the
  MIME list.
- With an empty extension list and nonempty MIME list, only MIME is checked.
- With both lists empty, type filtering accepts the attachment; filename
  safety, size, count, authorization, and project policy still apply.

Those last two bullets describe the pure policy helper. At the environment
layer, an unset value or an empty environment string for either CSV control
falls back to the shipped example defaults; `FS_ALLOWED_ATTACHMENT_MIMES=` and
`FS_ALLOWED_ATTACHMENT_EXTENSIONS=` do not produce empty effective sets. An
empty helper set can therefore arise only from a different reviewed caller or
configuration layer, not from blanking these environment values.

## Verify effective deployment values

The shared attachment-policy defaults do not prove a particular transport or
service accepts an upload. Confirm the owning endpoint, rendered service
environment, and reverse-proxy body limit before changing a limit. For JSON
workflow-run requests, verify the declared inputs and JSON limits. For workflow
webhooks, verify the entrypoint's record limits and whether the deployment
forwards the active request-transport controls above.

Verify live capacity, proxy behavior, and the effective owning-process environment
in the target deployment. The fallback/Compose comparisons below describe
configuration boundaries and do not establish deployed capacity.

## API, webhooks, MCP, and callbacks

Job-scoped public SSE streams also apply process-local connection admission:

| Boundary | Control | Default / accepted range | Rejection contract |
|---|---|---:|---|
| SSE connections per principal | `FS_PUBLIC_SSE_MAX_CONNECTIONS_PER_PRINCIPAL` | 10; integer clamped to 1–1,000; invalid integers use 10 | HTTP 429, `stream_connection_limit`, `Retry-After: 1` |
| SSE connections per account | `FS_PUBLIC_SSE_MAX_CONNECTIONS_PER_ACCOUNT` | 100; integer clamped to 1–10,000; invalid integers use 100 | HTTP 429, `stream_connection_limit`, `Retry-After: 1` |

Each application process owns its counters; multiple app processes do not share
one global limit. Neither variable has an explicit production Compose binding
or Compact child allowlist at this revision. Do not assume an `.env.prod` edit
changes the running stream limit without verifying the rendered service
environment. See [Environment Variables](environment-variables#public-job-sse-admission).

| Boundary | Control | Default / accepted range | Rejection contract |
|---|---|---:|---|
| Provider webhook body | `FS_PROVIDER_WEBHOOK_BODY_MAX_BYTES` | 1 MiB; clamped to 4 KiB–64 MiB | HTTP 413, `{"error":"Request body exceeds size limit"}` |
| Extension callback body | `FS_EXTENSION_CALLBACK_BODY_MAX_BYTES` | 1 MiB; clamped to 4 KiB–64 MiB | HTTP 413, `Request body exceeds size limit` |
| Extension OAuth request body | fixed at this revision | 64 KiB | HTTP 413, `{"error":"request_too_large"}` |
| OAuth callback query string | fixed at this revision | 8 KiB | Rejected before callback processing when the encoded query exceeds the cap. |
| External MCP HTTP response | fixed at this revision | 4 MiB | Connector request fails; reduce or paginate the server response. |
| Remote runtime response | `FS_REMOTE_RUNTIME_RESPONSE_MAX_BYTES` | 5 MiB; clamped to 64 KiB–256 MiB | Remote-runtime request fails before JSON decoding. |
| Approval decision body | fixed at this revision | 64 KiB | HTTP 413 with code `approval_payload_too_large`. |

Provider webhook authentication and signature rules are provider-specific.
External MCP paginates `tools/list`, validates endpoint/header safety, and
requires HTTPS for credential-bearing requests.

## Extensions

| Boundary | Control | Default |
|---|---|---:|
| Install archive | Fixed at this revision | 50 MiB compressed; 150 MiB uncompressed lifecycle cap |
| Descriptor | `FS_EXTENSION_DESCRIPTOR_MAX_BYTES` | 5 MiB; invalid, empty, or nonpositive values fall back to 5 MiB |
| Runtime output | `FS_EXTENSION_OUTPUT_MAX_BYTES` | 5 MiB; clamped to 64 KiB–256 MiB |
| Artifact body | `FS_EXTENSION_ARTIFACT_MAX_BYTES` | 200 MiB; clamped to 1 MiB–10 GiB on the connector policy path |
| Materialized dependency site | `FS_EXTENSION_DEPS_SITE_MAX_BYTES` | See below |
| Operation timeout | `FS_EXTENSION_OPERATION_TIMEOUT_SECONDS` | 300 seconds |
| Installer proxy response | Fixed at this revision | 16 MiB |

For dependency sites, the code fallback and shipped `.env` examples are
524,288,000 bytes (500 MiB). Base and production Compose instead interpolate
536,870,912 bytes (512 MiB) when the variable is unset or empty. Inspect the
rendered service environment to determine the effective value.

`FS_EXTENSION_DEPS_SITE_MAX_BYTES` is clamped to 1 MiB–10 GiB.
`FS_EXTENSION_OPERATION_TIMEOUT_SECONDS` is clamped to 30–3,600 seconds for
entrypoints using the canonical timeout policy; the runtime adds 30 seconds of
process headroom. Other entrypoints can declare their own bounded timeout, so
the environment value is not a universal timeout for every extension process.

The install-archive and installer-proxy caps above are constants, not
environment controls. Changing a similarly named environment value cannot
alter them in this candidate.

Bundles are ZIP archives; manifests, descriptors, references, and Contract v2
definitions are YAML. Python dependency artifacts must be exact-version,
SHA-256-pinned wheels; offline installation needs the complete compatible wheel
closure in the bundle.

An oversized descriptor reports `descriptor_file_too_large`. Runtime output is
bounded while stdout/stderr is captured; overflow terminates the child rather
than buffering without limit. Artifact-size failures use the extension
contract's typed size-limit error. Treat these as payload/design failures first;
raise a cap only after checking storage, proxy, worker-memory, and trust-boundary
impact.

## Datasets and tabular feeds

| Boundary | Control | Compose default |
|---|---|---:|
| Feed input | `FS_FEED_MAX_BYTES` | 1 GiB |
| Feed rows | `FS_FEED_MAX_ROWS` | 2,000,000 |
| Materialized feed | `FS_TABULAR_FEED_MAX_MATERIALIZE_BYTES` | 128 MiB |
| `read_rows` scan bytes | `FS_TABULAR_FEED_READ_ROWS_SCAN_MAX_BYTES` | 64 MiB |
| `read_rows` scan rows | `FS_TABULAR_FEED_READ_ROWS_SCAN_MAX_ROWS` | 100,000 |
| Dataset query runtime rows | `FS_DATASET_QUERY_MAX_RUNTIME_ROWS` | 1,000 |
| `read_rows` returned rows | surface contract | maximum 1,000 |
| Preview | surface contract | 10 rows |

Reader and declared media type determine supported formats. Keep CSV/TSV
delimiter and encoding explicit; preserve Parquet types; validate spreadsheet
sheet/range selection before relying on inferred columns.

Feed environment values must be positive integers. Unset, invalid, zero, or
negative values fall back to the listed defaults; reader-requested row/byte
limits can only narrow the operator maximum. Oversized input/materialization
returns `feed_too_large`; row overflow returns `too_many_rows`. The `read_rows`
action caps each returned page at 1,000 rows and also applies the 100,000-row,
64 MiB scan ceilings, so callers should filter and paginate instead of raising
the return limit.

`FS_DATASET_QUERY_MAX_RUNTIME_ROWS` is stricter: an explicit blank, invalid,
zero, or negative value fails configuration instead of falling back, and a
positive whole number has no code-level upper clamp. When a `dataset_query`
step omits `row_limit`, its effective request is the smaller of 100 and the
deployment maximum. A request above the maximum fails before the source fetch.
The complete returned rows are held in workflow state; the separate preview is
only a display subset. This variable has no shipped production Compose app
binding or Compact child allowlist entry at this revision.

## Nested workflow depth

`FS_INVOKE_WORKFLOW_MAX_DEPTH` limits an `invoke_workflow` chain. It defaults to
5; an invalid, blank, zero, or negative value falls back to 5, while any
positive integer is accepted. A chain beyond the resolved limit fails with
`invocation_depth_exceeded` before the next child workflow executes. The
variable has no shipped production Compose app binding or Compact child
allowlist entry, so verify the running worker environment rather than assuming
an environment-file edit took effect.

## Model timeouts

`FS_LLM_REQUEST_TIMEOUT_SECONDS` is a global model-request cap. Unset, invalid,
or nonpositive means no global cap. A positive per-agent/process timeout still
applies; when both are positive, the smaller value wins. Other connector, HTTP,
extension, CLI, queue, and worker timeouts are independent budgets.

## Artifact download-link lifetime

`ARTIFACT_S3_PRESIGN_TTL_SECONDS` controls S3-compatible presigned links. The
storage factory fallback and operations example are 600 seconds; base and
production Compose interpolate 900 seconds. The adapter constrains a requested
TTL to at least 60 seconds and no more than its configured ceiling, itself
capped at seven days. Inspect the effective service environment before
promising a lifetime.

## Retention precedence and dry run

Retention uses precedence; it does not take the narrowest value:

1. An explicit cleanup argument overrides the corresponding stored value.
2. For action logs, job logs, trash, and terminal job checkpoints, the stored
   account value overrides the environment fallback.
3. The environment fallback applies when no higher-precedence value exists.

For example, an account-stored job-log value of 90 days overrides an
`FS_RETENTION_MESSAGES_DAYS=30` fallback. The account-scoped Retention page
edits only positive whole-day values for action logs, job logs, trash, and
terminal job checkpoints. Jobs, events, retry queues, and registry changelog
have separate cleanup arguments/environment controls.

Inspect resolved policy and deletion counts without deleting data:

```bash
python -m core.application.tooling.ops.retention_cleanup --dry-run
```

Arguments include `--jobs-days`, `--events-days`, `--retry-queue-days`,
`--job-logs-days`, `--action-logs-days`, `--trash-days`,
`--terminal-job-checkpoints-days`, and `--registry-changelog-days`. Do not put
an extra `--` before them.

## Applying environment changes

These controls come from process environments; several are snapshotted at
module import. Change the deployment's supported environment source, render the
Compose configuration, and recreate affected application/worker services. The
typed `flow-steward config set/apply` surface does not accept arbitrary names.
Verify that the selected endpoint actually consumes a control; the presence of
a name in an example environment file is not proof of an active feature.

The earlier workflow-run and upload review was conducted at
`62a95e3456d3a692092b5a04daecca504c3f97b1`. The remaining detailed capacity
values originated in the earlier documentation pass and require verification
against the effective deployment before use; no live capacity or proxy test was
performed.
