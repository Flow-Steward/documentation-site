---
sidebar_position: 2
title: Architecture
description: Architecture overview for Flow Steward.
---

# Architecture

Flow Steward is a full application runtime, not only an API backend. Its surfaces
include web routes, JSON endpoints, WebSocket handlers, webhook ingress, MCP,
CLI transports, and background execution and control loops. This overview
describes the current public source on main; it does not establish which changes
are available in a published release.

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
          +--> External MCP connectors: declared, authorized provider tools
```

Runtime ownership is separate from transport and repository layout. The `app`
runtime owns HTTP and WebSocket flows, `worker` owns background execution,
`control` runs singleton control loops independently of the API and workers,
and `mcp` adapts inbound MCP calls to the application API. Control responsibilities
include dispatch outbox processing, workflow timers, watchdog checks, and
scheduled jobs.

## Repository layout

The inbound built-in MCP server is a thin, API-backed transport adapter for
projects, workflows, jobs, reports, notifications, and workflow and registry
authoring. It is not a repository-code indexing or generation service. Outbound
MCP client sessions belong to worker execution attempts; that lifecycle detaches
owned clients and attempts to close them on exit.
Core exposes generic extension contracts; each extension owns its integration
logic and onboarding.

The canonical layout is:

- `core/entrypoints` for transport and controller surfaces
- `core/application` for first-party application logic
- `core/infrastructure` for shared technical infrastructure
- `extensions` for external or self-hosted extensions
- `db/schema` and `db/seeds` for the canonical database baseline and seed data
- `db/migrations` for ordered, checksum-tracked SQL migrations applied by the
  database upgrade command
- `assets/frontend` for the React product frontend workspace
- `docs`, `tests`, `infra`, `logs`, `backups`, and `locales` for supporting
  repository concerns

New standards and code placement decisions should align with the canonical
layout unless an ADR approves an exception.

## API contract direction

The React shell uses normalized `/api/v2/*` JSON envelopes where available.
These are internal frontend contracts; their presence does not make them part
of the public external API. Compatibility exists only for legacy `/api/*` routes
that are still explicitly registered; it is not a blanket migration guarantee.
Workflow runs start at `/api/workflow-runs`; the transport delegates authorization
and orchestration to the application service. Use the current
[Public API Reference](../reference/api) before integrating with an endpoint.

Example v2 success envelope:

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

Example v2 error envelope:

```json
{
  "ok": false,
  "kind": "detail",
  "data": null,
  "error": {
    "code": "forbidden",
    "message": "Human readable message",
    "status": 403,
    "details": null
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
