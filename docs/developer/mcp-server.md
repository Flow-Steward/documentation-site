---
sidebar_position: 5
title: MCP Server
description: Developer notes for the built-in Flow Steward MCP server.
---

# MCP Server

The built-in MCP server exposes Flow Steward project, workflow,
job, report, and notification operations to external agent clients.

This is different from the UI MCP registry:

- UI MCP registry: operators add external MCP catalogs to Flow Steward.
- Built-in MCP server: external clients call Flow Steward tools.

## Local client setup

Configure the Flow Steward streamable-HTTP endpoint with the MCP client's own
supported settings. Codex uses its global MCP configuration rather than the
repository-local `.mcp.json`. The pinned Flow Steward public CLI does not ship a
`setup-codex-mcp` command, so do not copy the stale internal repository example.

Export a token before launching Codex:

```bash
export MCP_BEARER_TOKEN=<platform_pat_or_machine_token>
```

Verify client discovery with the client's normal `tools/list` view. The server
returns only tools permitted by the token's any-of scope mapping; downstream
API authorization still applies.

## Development concerns

When adding or changing MCP tools:

- keep handlers thin and forward the caller's bearer token to the application API;
- add the tool to the canonical token-scope mapping for request-local discovery;
- preserve the application's role and capability policy;
- preserve project and workflow scope checks;
- return structured JSON envelopes;
- include enough metadata for agent clients to understand pagination and errors;
- keep read tools separate from control tools;
- document safe tool order in [MCP Reference](../reference/mcp).

## Tool categories

The current server includes 40 tools: project discovery, workflow and authoring tools, job
diagnostics, job controls, reports, and notifications. The canonical scope map
and API route map contain the same 40 names.

Use `workflow_trigger` with an explicit project and workflow, inspect its
contract, and pass declared inputs in `payload`. Project-profile synchronization
and workflow knowledge remain internal application services. Repository
code-index, code-graph and database-schema indexing sit outside the built-in MCP
surface.

Internal project context remains separate from this public tool surface; see
[Project Context](project-knowledge-and-code-intelligence). Outbound MCP sessions
used by workflow agents are owned by the worker execution lifecycle and its
attempt-scoped cleanup.

## Shared authoring and operations

The six [workflow authoring tools](../reference/mcp#workflow-authoring) delegate to
`core/application/workflows/authoring/` through the authenticated API. Discovery
uses scoped deterministic contracts; validation is read-only; save creates a disabled
draft under existing creation policy. Job lists, pending approvals and workflow-filtered
reports reuse their application-owned queries, authorization and scope predicates.
The MCP server delegates persistence and orchestration to the application layer;
the external agent owns planning. The optional [Flow Steward Agent Plugin](../integrations/agent-plugin)
packages user workflow/operations and developer extension skills over this existing
server. Installing instructions does not change tool authority or availability.
