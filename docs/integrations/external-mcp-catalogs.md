---
sidebar_position: 2
title: External MCP Catalogs
description: Register external MCP servers as tool catalogs for Flow Steward workflows and agents.
---

# External MCP Catalogs

External MCP catalogs bring tools from another service into Flow Steward. This
is different from the built-in Flow Steward MCP server, which exposes Flow
Steward tools to external AI clients.

## Add a catalog

1. Open `Registry`.
2. Open `MCP`.
3. Select `Project scope`. Connector credentials and projected tools belong to
   that project; `+ New MCP` remains unavailable without it.
4. Choose `+ New MCP`, then enter the name and endpoint URL.
5. Keep transport as `streamable_http`.
6. Choose `none`, `bearer`, `api_key`, or `oauth2` authentication. Add custom
   headers as separate key/value rows, not as a pasted JSON object.
7. For OAuth, configure requested scopes and authorization parameters, start
   authorization, and complete the callback. Authorization, catalog sync, and
   health are separate states; a successful grant proves neither of the latter.
8. Add a namespace prefix if tool names may collide, then save.
9. Sync the complete paginated `tools/list` catalog and review excluded or
   malformed tools.
10. Allowlist only discovered tools the project's workflows should call, then
    run health and a read-only test.

Credential-bearing endpoints must use HTTPS. Flow Steward rejects credentials
in URLs/query strings, blocked local/private destinations under its SSRF policy,
unsafe transport header annotations, malformed pages/cursors, and responses
over 4 MiB. OAuth token expiry, missing refresh tokens, changed endpoint or
credential revision, and scope expansion can require reconnect.

## Operate safely

- Health-check the catalog before production use.
- Review tool descriptions after every sync.
- Use narrow credentials for the external service.
- Keep dangerous tools out of the allowlist.
- Run a test workflow before enabling broad use.
- Remove or rotate credentials when the provider changes.

## Related pages

- [Tools And MCP](../user/tools-and-mcp)
- [Connect An AI Client With MCP](built-in-mcp-quick-start)
- [Workflow Step Kinds](../reference/workflow-step-kinds)
