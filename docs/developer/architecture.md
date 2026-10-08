---
sidebar_position: 2
title: Architecture
description: First-release architecture overview for Flow Steward.
---

# Architecture

Flow Steward is a full application runtime, not only an API backend. The backend
surface includes web routes, JSON endpoints, WebSocket handlers, webhook ingress,
MCP, CLI transports, and worker control loops.

## Runtime shape

```text
Operator UI / CLI / Webhooks
          |
          v
FastAPI application surface
          |
          +--> Postgres: canonical job, user, project, log, and memory records
          +--> RabbitMQ: ready queues and dead-letter queues
          +--> Worker runtime: workflow execution and delivery loops
          +--> React shell: app workspace under /app/*
          +--> Extension runtime: out-of-process providers
          +--> External MCP / CLI providers: declared, authorized provider tools
```

## Repository layout

The inbound built-in MCP server is a thin, API-backed transport adapter for
projects, workflows, jobs, reports, and notifications. It is not a
repository-code indexing or generation service. Outbound MCP client sessions
belong to worker execution attempts and are cleaned up by that lifecycle.
Core exposes generic extension contracts; each extension owns its integration
logic and onboarding.

The target first-release layout is:

- `core/entrypoints` for transport and controller surfaces
- `core/application` for first-party application logic
- `core/infrastructure` for shared technical infrastructure
- `extensions` for external or self-hosted extensions
- `db/schema` and `db/seeds` for canonical database artifacts
- `assets/frontend` for the React product frontend workspace
- `docs`, `tests`, `infra`, `logs`, `backups`, and `locales` for supporting
  repository concerns

Legacy folders may still exist during migration. New standards and code
placement decisions should align with the canonical layout unless an ADR
approves an exception.

## API contract direction

The React shell uses normalized `/api/v2/*` JSON envelopes where available.
Compatibility exists only for legacy `/api/*` routes that are still explicitly
registered; it is not a blanket migration guarantee. Workflow runs start at
`/api/workflow-runs`; the transport delegates authorization and orchestration to
the application service. Use the current [Public API Reference](../reference/api)
before integrating with an endpoint.

Success envelope:

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

Error envelope:

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

## Control principle

Flow Steward can automate delivery work, but human operators remain responsible
for approvals, security-sensitive transitions, release readiness, and production
changes.
