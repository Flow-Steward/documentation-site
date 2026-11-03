---
sidebar_position: 5
title: MCP Server
description: Developer notes for the built-in Flow Steward MCP server.
---

# MCP Server

The built-in MCP server exposes Flow Steward project, workflow,
job, report, and notification operations to external agent clients.
This page describes the implementation on main; it does not establish availability
in a published release or verified compatibility with every external client.

This is different from the UI MCP registry:

- UI MCP registry: operators add external MCP catalogs to Flow Steward.
- Built-in MCP server: external clients call Flow Steward tools.

## Local client setup

Configure the Flow Steward streamable-HTTP endpoint with the MCP client's own
supported settings. Use the installation's generated client connection settings
for its endpoint and authentication configuration. The public Flow Steward CLI
does not ship a `setup-codex-mcp` command.

For token-based clients, configure the client to send a platform personal access
token or machine token as a bearer token. If the client reads the token from an
environment variable, export the exact variable named in its configuration before
launching it. Exporting a variable alone does not configure client authentication.

Verify client discovery with the client's normal `tools/list` view. With server
authentication enabled, the server returns only tools permitted by the token's
any-of scope mapping; downstream API authorization still applies.

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

The current server includes 72 tools: project discovery, workflow discovery and
launch, workflow authoring, workflow editing (definition, change sets, group
conversion), workflow hooks and where-used, workflow export/import and run
statistics, agents, skills and model options, job diagnostics, job controls,
reports, and notifications. The canonical scope map
(`core/entrypoints/mcp/server_tool_scopes.py`) and the API route map
(`core/entrypoints/mcp/server_api_client.py`) contain the same 72 names.

API-backed tools preserve supported route domain error codes (for example
`job_restart_active` or `registry_name_conflict`). Most tools retain the route's
error details; workflow authoring tools expose selected safe repair fields, and
workflow import filters details to blocking dependency fields and resolution
actions. See [MCP errors](../reference/mcp#errors). Cloud clients can reach the
same server with OAuth access tokens bound by default to `<origin>/mcp`; explicit
resource URL configuration can override that address. The application is the
authorization server and `fs-mcp` validates the resource binding.

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
draft under existing creation policy. Validation does not verify runtime execution,
external effects, or business intent. Job lists, pending approvals and workflow-filtered
reports reuse their application-owned queries, authorization and scope predicates.
The MCP server delegates persistence and orchestration to the application layer;
the external agent owns planning. The optional [Operator and Developer skill packages](../integrations/agent-plugin)
provide instructions for workflow operations and development respectively. The
Operator package uses this MCP server; the Developer package needs no MCP
connection. Installing instructions does not change tool authority or availability.
