---
sidebar_position: 3
title: Connect An AI Client With MCP
description: Make an exact first read-only call to the built-in MCP server.
---

# Connect An AI Client With MCP

The production gateway exposes stateless streamable HTTP at
`<public-base-url>/mcp`. The exact protocol example below uses the candidate's
modern protocol version `2026-07-28`; live client execution was not performed
for this documentation pass.

## Before you start

Set `FLOW_STEWARD_URL` and `FLOW_STEWARD_TOKEN`. The first tool requires any
one project-read family scope: `projects.read`, `projects:*`, `read:*`, or
`admin:all`. Use `projects.read` for this check. The token's account/project
allowlists still apply after discovery.

Client UIs may express the same server as:

```json
{
  "mcpServers": {
    "flow-steward": {
      "transport": "streamable_http",
      "url": "https://flow-steward.example.com/mcp",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}
```

Adapt field names only when your client documents a different configuration
schema. There is no public `setup-codex-mcp` CLI command.

## Connect and discover protocol support

Add the server to your client and connect. The client sends `server/discover`
first. The result advertises `2026-07-28` under `supportedVersions` and includes
server capabilities. Modern requests are stateless and do not require an MCP
session ID.

If you write your own client, every request is an HTTP `POST` to `/mcp` with
these headers:

```http
POST /mcp
Authorization: Bearer <FLOW_STEWARD_TOKEN>
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: server/discover

{"jsonrpc": "2.0", "id": 1, "method": "server/discover",
 "params": {"_meta": {
   "io.modelcontextprotocol/protocolVersion": "2026-07-28",
   "io.modelcontextprotocol/clientInfo": {"name": "docs-smoke", "version": "1.0.0"},
   "io.modelcontextprotocol/clientCapabilities": {}}}}
```

For `tools/list` and `tools/call`, change `Mcp-Method` and `method` to match;
a `tools/call` request also sends the tool name in an `Mcp-Name` header.

## List allowed tools

Open the client's tool list for the `flow-steward` server (the client calls
`tools/list`). The list is request-local and scope filtered. It is normal for a
`projects.read` token to see fewer than the 51 tools the server registers.

## Call `project_list`

Ask the client to call `project_list`. It takes an empty argument object:

```json
{"name": "project_list", "arguments": {}}
```

A successful JSON-RPC result contains MCP `content` carrying only projects the
token may read. Use only a returned project name for subsequent project-scoped calls.

## Continue to workflow discovery

The read-only connection check is complete after `project_list`. To inspect a
workflow, use a token with `workflows.read` as well as the project access needed
to resolve its name, then call `workflow_list` with the returned `project_name`.
Inspect `workflow_contract` before a deliberate launch through
`workflow_trigger`; launching requires `workflows.write`.

Project-profile and Knowledge Base tools are no longer exposed. Do not call
`project_profile_get`, `project_profile_update`, `kb_search`, or `kb_write`.

## Optional agent plugin

The [Flow Steward Agent Plugin](agent-plugin) supplies two skills for a connected
client: workflows and operational reads for users, extension authoring for developers.
Basic MCP discovery and calls work without a skill. The workflow skill needs no
application checkout; extension implementation needs the target release’s contracts.
Install the reviewed plugin, verify both skills, and reuse this authenticated MCP
connection. The package does not configure credentials or start another server.

## Cleanup and troubleshooting

Remove the server from the client and revoke the temporary token after the
check. Keep configs containing tokens out of source control.

- Empty discovery: confirm `projects.read` and token allowlists before widening
  credentials.
- `403`: the tool or project needs a scope/allowlist the token does not hold.
- JSON-RPC invalid params: use `{}` for `project_list`; consult `tools/list`
  for the exact schema of every subsequent tool.
- Protocol error: rediscover versions; do not silently reuse a version from a
  different deployment.

See [MCP Reference](../reference/mcp) for representative tool-to-scope mappings.
