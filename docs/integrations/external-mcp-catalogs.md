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

1. Open `Registry`, then `MCP`. The `Connected` tab lists existing connectors;
   use the `Project` filter to narrow the list.
2. Choose `New MCP`. This action requires project mutation permission and at
   least one active project.
3. Select `Project` in the creation form. Connector credentials and projected
   tools belong to that project.
4. Enter the name and endpoint URL.
5. Keep transport as `streamable_http`; SSE and local stdio servers are not
   supported by this runtime.
6. Choose `none`, `bearer`, `api_key`, or `oauth2` authentication. Add custom
   headers as separate key/value rows.
7. For OAuth, configure requested scopes and authorization parameters. These
   parameters enter the browser authorization URL, so do not put secrets there.
   Enable the refresh-token requirement if the connection must receive one.
8. Add a namespace prefix if tool names may collide, then choose `Save MCP`.
9. For OAuth, start authorization from the saved connector and complete the
   callback. Supply provider client credentials if prompted. Authorization,
   catalog sync, and health are separate states; a successful grant proves
   neither of the latter.
10. Sync the complete paginated `tools/list` catalog. Malformed pages or cursors
    fail sync; tools with unsafe transport header annotations are excluded and
    logged. Discovery is limited to 100 pages.
11. Allowlist only discovered tools the project's workflows should call, save
    the allowlist, then run health and a read-only test workflow.

The `New MCP` form also accepts `Paste JSON configuration` to fill connection
fields from a remote server configuration, including `mcpServers` and VS Code
`servers` formats. Review the filled fields and supply any placeholder header
values before saving. Importing JSON does not run local commands.

Alternatively, browse the `Catalog` tab for a predefined server and create a
connector for a project. Catalog installation fills connection settings; OAuth,
when required, sync, and allowlisting still follow. Later catalog changes do not
automatically update existing connectors. A catalog listing does not establish
current provider availability or that your credentials have the required access;
check the provider's setup instructions and test the connection.

Credential-bearing endpoints must use HTTPS, except for private endpoints
permitted by the explicit `FS_ALLOW_PRIVATE_REMOTE_URLS` override. Local/private
destinations are blocked by default under the SSRF policy. Flow Steward rejects
credentials in endpoint URLs/query strings and HTTP responses over the
`FS_MCP_HTTP_RESPONSE_MAX_BYTES` limit (4 MiB by default). OAuth
token expiry without a usable refresh token, changed endpoint or credential
revision, and scope expansion can require reconnect. OAuth endpoints and issuer
are discovered automatically and cannot be overridden in OAuth configuration.

Health checks request `tools/list`; they do not replace a complete catalog sync
or a test tool call. Allowlisted tools are projected into the project's tool
registry. Runtime calls enforce project lineage, connector enablement, and the
allowlist. Sync removes tools from the allowlist when they are no longer
discovered or publishable; newly discovered tools are not automatically allowed.

## Operate safely

- Health-check the catalog before production use.
- Review tool descriptions and the allowlist after every sync.
- Use narrow credentials for the external service.
- Keep dangerous tools out of the allowlist.
- Run a test workflow before enabling broad use.
- Remove or rotate credentials when the provider changes.

## Related pages

- [Tools And MCP](../user/tools-and-mcp)
- [Connect An AI Client With MCP](built-in-mcp-quick-start)
- [Workflow Step Kinds](../reference/workflow-step-kinds)
