---
sidebar_position: 5
title: Developer Integrations
description: API, webhook, MCP, workflow portability, and extension integration paths.
---

# Developer Integrations

This page is for developers who integrate Flow Steward with other systems. The
User Guide and Integrations & Extensions pages explain how operators configure
features in the UI; this page names the integration surfaces and the contracts
developers should build against.

## Choose the right integration surface

| Goal | Use |
|---|---|
| Start a workflow from another system | Incoming workflow webhook or public workflow-run API. |
| Move a workflow between environments | Workflow YAML export/import with preflight. |
| Let an AI client inspect projects, jobs, and workflows | Built-in Flow Steward MCP server. |
| Let Flow Steward call external tools | External MCP catalog, extension action, or HTTP request step. |
| Add provider-native tasks, notifications, callbacks, tools, or datasets | Extension bundle. |
| Generate a typed API client | Curated OpenAPI schema. |
| Follow live job progress | WebSocket or server-sent event stream. |

## OpenAPI surfaces

FastAPI's default `/openapi.json`, `/docs`, and `/redoc` routes are disabled.
Use the curated schemas instead:

| Surface | Schema | Swagger UI |
|---|---|---|
| Public integration API | `/openapi-public.json` | `/docs/api` |
| Internal app API | `/openapi-internal.json` | `/docs/internal` |

Both schemas require authentication by default. See
[API Reference](../reference/api) and
[Environment Variables](../reference/environment-variables) for the flags that
enable the docs surfaces.

## Start work from an API client

Use the public workflow-run API when the caller is a trusted integration that should
start a Flow Steward job directly.

Key public routes:

| Route | Purpose |
|---|---|
| `POST /api/workflow-runs` | Start an explicit project/workflow with declared inputs. |
| `GET /api/jobs` | List jobs visible to the caller. |
| `GET /api/jobs/{job_id}` | Read job status and result metadata. |
| `POST /api/jobs/{job_id}/cancel` | Cancel a running job. |
| `POST /api/approvals/{thread_id}` | Decide an approval gate. |
| `GET /api/projects/{project_id}/workflow-catalog` | Discover callable workflows for a project. |
| `GET /api/projects/{project_id}/workflow-entrypoints` | Discover workflow entrypoints. |
| `GET /api/projects/{project_id}/workflows/{workflow_id}/contract` | Read a workflow input/output contract. |

Prefer schema-backed request generation from `/openapi-public.json` over copying
examples by hand.

## Start work from an incoming webhook

Use incoming workflow webhooks when the external system is event-driven and
should not need to know the public workflow-run API contract.

Operator setup happens in the workflow UI:

1. Define workflow expected inputs.
2. Open `Workflow settings > Triggers`.
3. Create an incoming webhook.
4. Map `body.`, `headers.`, `query.`, `form.`, or `files` selectors to expected
   workflow inputs.
5. Copy the generated public URL and one-time credential reveal.

Developer-facing routes:

| Route | Purpose |
|---|---|
| `GET /api/workflows/{workflow_id}/triggers` | List incoming webhooks and provider triggers for a workflow. |
| `POST /api/workflows/{workflow_id}/triggers/webhooks` | Create an incoming webhook. |
| `PATCH /api/workflows/{workflow_id}/triggers/webhooks/{entry_key}` | Update an incoming webhook. |
| `POST /api/workflows/{workflow_id}/triggers/webhooks/{entry_key}/dry-run` | Test mapping and input validation without delivering a real external request. |
| `POST /api/workflows/{workflow_id}/triggers/webhooks/{entry_key}/rotate-secret` | Rotate the webhook credential. |
| `POST /api/workflows/{workflow_id}/triggers/webhooks/{entry_key}/regenerate-entry-key` | Regenerate the public URL key. |
| `DELETE /api/workflows/{workflow_id}/triggers/webhooks/{entry_key}` | Delete the webhook. |
| `GET /api/workflows/{workflow_id}/triggers/webhooks/{entry_key}/deliveries` | Inspect webhook delivery history. |
| `POST /webhook/workflows/{entry_key}` | Public ingress route called by the external system. |

Supported auth modes are bearer token, HMAC SHA256, shared secret header, and
basic auth. Store generated secrets in the source system's secret manager. Do
not hard-code them in workflow text or documentation.

## Move workflows between environments

Use workflow portability when local, dev, staging, and production environments
must share workflow definitions without sharing environment-specific credentials
or projects.

Routes:

| Route | Purpose |
|---|---|
| `GET /api/workflows/{workflow_id}/export-policy` | Check whether full export, reference export, and clone are allowed. |
| `GET /api/workflows/{workflow_id}/export.yaml` | Export a full or reference YAML bundle. |
| `GET /api/workflows/import/options` | List available target dependency options. |
| `POST /api/workflows/import/preflight` | Validate the YAML bundle and dependency resolutions. |
| `POST /api/workflows/import/apply` | Import the workflow as disabled draft after preflight. |

Preflight is required before importing a workflow into the target environment. It tells the target environment
whether dependencies are resolved, missing, conflicting, protected, or require
mapping.

## Integrate AI clients through MCP

The built-in Flow Steward MCP server exposes project discovery, workflow,
job diagnostic/control, report, and notification tools to MCP clients.
It forwards the caller's bearer to the application API, which owns authorization
and operation contracts. Repository code-search, code-graph and database-schema
indexing sit outside this built-in MCP surface.

Use MCP when the caller is an agent or IDE that needs high-context tool access.
Use the HTTP API when the caller is a normal application integration.

Important rules:

- external MCP clients must send `Authorization: Bearer <token>`;
- use PATs or machine tokens for unattended clients;
- call `tools/list` to get exact tool names and JSON schemas;
- use scoped service-account tokens when a client should only see selected
  projects or workflows.

See [MCP Reference](../reference/mcp) for the tool groups and recommended call
order.

## Let Flow Steward call external tools

Flow Steward can call external systems in several ways:

| Need | Recommended mechanism |
|---|---|
| Generic HTTP call in one workflow | `http_request` workflow step. |
| Reusable external tool catalog | External MCP connector in `Registry > MCP`. |
| Provider-specific action, query, dataset connector, callback, or notification | Extension bundle. |
| Small environment-specific secret or credential | Project connection or provider binding. |

Avoid putting secrets in workflow descriptions, prompt text, or docs. Use
project connections, provider secrets, extension install configuration, or
service-account tokens.

## Build an extension

Extensions are out-of-process provider bundles. Use them when the provider
integration should have its own manifest, schemas, UI actions, UI queries,
callbacks, health checks, and packaging lifecycle.

Authoring loop:

```bash
./flow-steward extensions create <extension_id>
./flow-steward extensions validate <extension_id>
./flow-steward extensions test <extension_id>
./flow-steward extensions bundle <extension_id>
```

Runtime surfaces include:

- install, scan, validate, build, marketplace, release install, handshake, enable,
  disable, and uninstall APIs;
- extension callback registration and callback webhook routes;
- action and query execution routes;
- dataset connector projections;
- workflow trigger declarations through `workflow_triggers[]`.

See [Developer Extensions](extensions) for manifest shape and response envelope.

## Follow realtime progress

Use realtime surfaces for operator displays and long-running integrations:

| Route | Purpose |
|---|---|
| `/ws/jobs/{job_id}` | Job updates. |
| `/api/events` | Event list and filtering. |
| `/api/events/{event_ref}/redrive` | Redrive a supported event after review. |

Realtime clients should reconnect with backoff and reload the latest HTTP state
after reconnecting.

## Developer checklist

Before shipping an integration:

- confirm whether the caller is a user, service account, external system, or MCP
  agent;
- choose the narrowest integration surface;
- use generated OpenAPI or `tools/list` schemas where available;
- define workflow input/output contracts before exposing webhooks or API
  launchers;
- preflight imported workflows in every target environment;
- keep secrets in Flow Steward secrets, provider secrets, or the caller's secret
  manager;
- test with a low-risk project and inspect the created job, events, logs, and
  artifacts.
