---
sidebar_position: 6
title: Project Context
description: Current project context and the boundary between internal memory and public tools.
---

# Project Context

Project rules and assigned data connections provide scoped context for workflow
agents. Update them through the project configuration screens. Inspect Jobs for
execution evidence: logs, messages, events, approvals, outputs, and artifacts.

## Current public surfaces

The project Knowledge Base page and the built-in MCP tools `kb_search`,
`kb_write`, `project_profile_get`, and `project_profile_update` have been removed.
Use `project_list` for project discovery and workflow/job tools for contracts and
execution evidence. There is no replacement public KB editor or MCP memory CRUD
contract in this release.

Core also has no repository code indexing, code search, code graphs,
schema-index snapshots, automatic/manual reindex, or application-code generation.
An external tool's declared abilities do not establish those core capabilities.
This page keeps its historical URL so existing links explain the current scope.

## Internal memory

The application still maintains canonical memory and workflow knowledge used by
runtime context assembly and deterministic workflow discovery. Project-profile synchronization uses
stable account/project IDs and includes project rules plus assigned connection
metadata. Exact project-profile retrieval does not fall back to another account
or project.

Internal storage and retrieval services are not a public knowledge-management
feature. Dataset introspection and scoped queries remain separate supported
features; see [Datasets And Data Connections](../user/datasets-and-data-connections).

See [MCP Reference](../reference/mcp),
[Workspaces And Projects](../user/workspaces-and-projects), and
[Jobs And Approvals](../user/jobs-and-approvals).
