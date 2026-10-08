---
sidebar_position: 12
title: Deployment Architecture
description: Operator-oriented map of Flow Steward runtime components and trust boundaries.
---

# Deployment Architecture

This page gives operators a production map. Developers who need implementation
details should use [Architecture](../developer/architecture) and
[Operations Internals](../developer/operations-internals).

## Deployment profiles

Compact runs the app, workers, control plane, MCP and related runtime processes
inside one runtime container behind one internal HTTP router. PostgreSQL and
RabbitMQ remain separate services, and bundled artifact storage adds SeaweedFS.
Compact requires Production and runs one runtime replica; its worker-process
count is separate from runtime replication. Its durable `/data` volume holds
local product files and runtime state.

Scalable runs separate service containers and retains `fs-cli` for host
configuration/stack operations. Its worker scaling uses configured replicas.
Development is a contributor preset on Scalable; Production is the minimal
runtime preset and also works for local Compact trials.

The chosen ingress is another independent decision: bundled Traefik, existing
Docker Traefik, existing Apache/Nginx, or Compact platform ingress. A host proxy
forwards to private loopback ports; a Docker proxy uses a shared network and
service aliases. See [Answer the Installer Questions](installer-walkthrough)
for routes, TLS ownership and current Docker-proxy readiness limitations.

On a provider such as Railway, Compact runs from an image with provider-managed
deployment/volumes and no Docker daemon inside the container. Its management
console is not the checkout's host installer or retained `fs-cli` environment.

## Runtime components

| Component | Responsibility |
|---|---|
| App/API | Serves the web UI, API routes, auth, settings, registry, monitoring, and admin surfaces. |
| Worker/runtime | Executes jobs, workflow phases, steps, agents, connectors, retries, and gates. |
| Queue | Buffers accepted work and dispatches units to workers. |
| Database | Stores users, projects, workflow definitions, jobs, events, approvals, settings, and audit evidence. |
| Knowledge retrieval | Uses canonical Postgres memory and workflow/entity graph/vector context; not a repository-code or schema index. |
| File/artifact storage | Holds artifacts on persistent local storage, bundled SeaweedFS, or external S3. Logs, backups, project trees, extensions and installer state have separate persistence/recovery boundaries. |
| MCP server | Exposes Flow Steward tools to approved AI clients. |
| Extension runtime | Runs provider bundles out of process and returns validated responses to the host. |
| Observability | Emits health, metrics, logs, traces, events, and incident evidence. |

## Operator boundaries

- Keep public user traffic, metrics scraping, and MCP access on intentionally
  exposed network paths.
- Treat extension bundles and MCP catalogs as trusted automation inputs only
  after review.
- Keep database backup scope separate from file, object storage, and provider
  side effects.
- Protect model provider keys, extension credentials, PATs, service-account
  tokens, machine tokens, and callback secrets.
- Verify project knowledge and external-tool scope before exposing context to agents.

## Related pages

- [Deployment Checklist](deployment-checklist)
- [Observability](observability)
- [Storage And Artifacts](storage-and-artifacts)
- [Security, Policy, And Redaction](../admin/security-policy-and-redaction)
