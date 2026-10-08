---
sidebar_position: 7
title: API Reference
description: Public, internal, webhook, websocket, and OpenAPI surfaces.
---

# API Reference

Flow Steward exposes web UI routes, JSON APIs, webhooks, WebSockets, MCP, and
CLI surfaces. The built-in FastAPI `/openapi.json`, `/docs`, and `/redoc`
routes are disabled; use the curated public or internal schema surfaces instead.

| Surface | Schema | Swagger UI | Main flags |
|---|---|---|---|
| Public integration API | `/openapi-public.json` | `/docs/api` | `FS_OPENAPI_PUBLIC_ENABLED=1`, `FS_DOCS_PUBLIC_ENABLED=1` |
| Internal app API | `/openapi-internal.json` | `/docs/internal` | `FS_OPENAPI_INTERNAL_ENABLED=1`, `FS_DOCS_INTERNAL_ENABLED=1` |

Both surfaces require authentication by default through
`FS_OPENAPI_PUBLIC_REQUIRE_AUTH=1` and `FS_OPENAPI_INTERNAL_REQUIRE_AUTH=1`.
Disable either requirement only for trusted local documentation review.

## API groups

| Group | Examples |
|---|---|
| Public UI and shell | `/`, `/login`, `/bootstrap`, `/app/*` |
| Public or normalized API v2 | `/api/v2/dashboard/summary`, `/api/v2/jobs`, `/api/v2/projects` |
| Auth and admin API | users, accounts, PATs, service accounts, password reset |
| Projects API | CRUD, rules, schedules, connections, jobs |
| Jobs API | status, logs, messages, errors, approvals, cancel, restart, cost, trace |
| Workflow API | triggers, entrypoints, reactions, workflow operations |
| Registry/admin API | agents, skills, tools, workflows, guardrails, datasets, workspaces |
| Extensions API | install, scan, enable, preview, invoke, callbacks |
| Workflow authoring API | scoped component discovery, contracts, bundle validation, disabled draft creation |
| Settings/model API | providers, model catalog, retention, verified model selection |
| Webhooks | `/webhook/providers/{provider_key}` |
| WebSockets | `/ws/jobs/{job_id}` |

## Workspace and project scope routes

Workspace/project organization is exposed through the internal app API used by
the UI. Use the curated internal schema for exact request and response shapes.

| Route | Purpose |
|---|---|
| `GET /api/workspaces/{workspace_id}` | Read workspace metadata. |
| `PUT /api/workspaces/{workspace_id}` | Update workspace name, key, and description. |
| `GET /api/workspaces/{workspace_id}/projects` | List active projects in a workspace. |
| `POST /api/projects/{project_id}/move-workspace` | Move a project to another workspace. Body requires `workspace_id`. |
| `POST /api/trash/workspace/{workspace_id}/delete-plan` | Preview workspace deletion and project reassignment/trash actions. |
| `POST /api/trash/workspace/{workspace_id}/delete-execute` | Execute the reviewed workspace deletion plan. |

Moving a project changes its operating boundary. After a move, review datasets,
workspace data connections, workflow bindings, notification routes, and knowledge scope.

## Workflow and extension catalogs

These authenticated internal application routes consume configured static
catalogs. They are not part of the narrow public integration OpenAPI allowlist.
They do not publish, edit, moderate, or administer catalog entries.

| Route | Purpose |
|---|---|
| `GET /api/workflows/catalog` | List cached workflow templates. |
| `GET /api/workflows/catalog/availability` | Report whether the configured catalog is usable. |
| `POST /api/workflows/catalog/{item_id}/preflight` | Verify a template and review dependency resolutions. |
| `POST /api/workflows/catalog/{item_id}/create` | Create an ordinary disabled workflow draft through portability apply. |
| `GET /api/extensions/catalog` | List extension releases joined with the account's install state. |
| `GET /api/extensions/catalog/availability` | Report extension catalog availability. |
| `POST /api/extensions/catalog/install` | Verify and install the selected release through the existing installer. |

Configure `FS_WORKFLOW_TEMPLATE_CATALOG_URL` and `FS_EXTENSION_CATALOG_URL`
with their HTTPS index URLs; an empty value disables that catalog. Workflow
preflight/create accepts `target_workflow_id`, `project_id`, and `resolutions`.
Extension install pins `extension_id`, `version`, and `release_sha256`;
browser-authority changes require their separately reviewed impact hash.

The extension entry offers **Update to X** for a newer compatible release; it
uses the same `POST /api/extensions/catalog/install` route and existing archive
update path. There is no separate catalog-upgrade endpoint and no automatic
upgrade. Same-version reinstall and downgrade return HTTP 409. Workflow catalog
creation produces independent disabled drafts; later index changes do not update
local workflows. See [Workflow and Extension Catalogs](../user/workflow-and-extension-catalogs). Repository code-index, automatic/manual reindex, and reindex-progress
routes have been removed; do not build integrations against their old examples.

## Public schema allowlist

The public schema is intentionally narrow. It includes:

- `POST /api/workflow-runs`
- `GET /api/jobs`
- `GET /api/jobs/{job_id}`
- `GET /api/jobs/{job_id}/approval`
- `POST /api/jobs/{job_id}/cancel`
- `GET /api/events/stream`
- `POST /api/approvals/{thread_id}`
- `GET /api/projects/{project_id}/workflow-catalog`
- `GET /api/projects/{project_id}/workflow-entrypoints`
- `GET /api/projects/{project_id}/workflows/{workflow_id}/contract`

The internal schema covers authenticated `/api/*` JSON routes for the app UI and
operator tooling. It excludes health, metrics, public auth routes, and raw
webhook/callback ingress.

### Launch a workflow

`POST /api/workflow-runs` accepts `project_id` (a UUID), `workflow_id`,
`inputs`, optional `client_context`, and `test_mode`. The request rejects extra
fields; the retired task ID, summary, execution mode, and upload request are not
part of this contract. The workflow must admit the `mcp` trigger channel and the
caller needs `workflows.write` (or an accepted broader scope).

Send an optional stable `Idempotency-Key` to deduplicate identical retries.
The response supplies `project_id`, `job_id`, `status`, `queue`, and
`deduplicated`. `client_context` is bounded execution context, not a way to
replace project policy or runtime authority.

### Authentication, pagination, approvals, and SSE

Every public operation uses bearer authentication. Tokens remain constrained by
role, account/tenant lineage, project allowlists, workflow allowlists, and the
operation's required scope. `project_id` is provisioned out of band; the public
schema deliberately has no project-discovery endpoint.

`GET /api/jobs` accepts only `project_id`, `limit`, `page`, and `status` from the
public schema. Treat response pagination metadata as authoritative rather than
constructing undocumented cursors.

Before deciding a gate, call `GET /api/jobs/{job_id}/approval`. Submit the
returned `approval_id` and an explicit approval action to
`POST /api/approvals/{thread_id}`, with a stable `Idempotency-Key` header. A
retry with the same key is safe; do not create a new key merely because the
client lost the first response.

`GET /api/events/stream` requires `job_id`. Reconnect with the last opaque
marker using `Last-Event-ID` (which takes precedence) or `cursor`. Handle
`400`, `403`, `404`, `409`, `410`, `429`, and `503`; on `429`, honor the
integer `Retry-After` seconds header. SSE is a durable public workflow-state
stream, not a complete internal event or log feed.

## Health and metrics

Health and metrics routes are runtime/operations surfaces, not curated OpenAPI
business APIs.

| Route | Purpose |
|---|---|
| `GET /health/live` | Liveness probe. |
| `GET /health/ready` | Readiness probe with component checks. |
| `GET /health/deep` | Readiness plus deeper runtime metadata. |
| `GET /health` | Compatibility liveness route. |
| `GET /api/health` | Compatibility liveness route. |
| `GET /metrics` | Prometheus-compatible app metrics. |

`/metrics` returns `text/plain; version=0.0.4`. If `FS_METRICS_TOKEN` is set,
the caller must send either `x-metrics-token: <token>` or
`Authorization: Bearer <token>`.

Worker and control-plane process exporters expose their own `/metrics`
and `/health/live` endpoints on their configured metrics ports. The MCP process
does not start a metrics exporter in this release. See
[Operations Internals](../developer/operations-internals).

## Contract direction

Normalized JSON APIs should use the standard success/error envelope where
available.

Success:

```json
{
  "ok": true,
  "kind": "list",
  "data": {},
  "error": null,
  "meta": {
    "resource": "jobs"
  }
}
```

Error:

```json
{
  "ok": false,
  "kind": "detail",
  "data": null,
  "error": {
    "code": "forbidden",
    "message": "Human readable message",
    "status": 403
  },
  "meta": {
    "resource": "jobs"
  }
}
```

## Documentation status

For precise request and response shapes, enable the curated schema that matches
your use case and read it directly. This page is a navigation layer for humans;
the OpenAPI JSON is the contract for API clients and generated tooling.
